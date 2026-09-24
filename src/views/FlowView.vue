<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'
import { useWorkflow } from '@/composables/useWorkflow'
import { useWorkflowMutations } from '@/composables/useWorkflowMutations'
import { canAddAfter, findLastLeaf, findNodeById } from '@/utils/workflow'
import FlowCanvas from '@/components/flow/FlowCanvas.vue'
import CreateNodeModal from '@/components/CreateNodeModal.vue'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { data, isPending, isError } = useWorkflow()
const { createNode, updateNode, deleteNode } = useWorkflowMutations()

const isCreateOpen = shallowRef(false)
const createParentId = shallowRef<WorkflowId>(-1)

const routeId = computed(() => typeof route.params.id === 'string' ? route.params.id : undefined)
const selectedNode = computed(() => {
    const node = routeId.value && data.value ? findNodeById(data.value, routeId.value) : undefined
    return node?.type === 'dateTimeConnector' ? undefined : node
})

watch([data, routeId], () => {
    if (data.value && routeId.value && !selectedNode.value) router.replace('/')
}, { immediate: true })

function toggleNode(id: string) {
    router.push(id === routeId.value ? '/' : `/nodes/${id}`)
}

function openCreate(parentId?: WorkflowId) {
    const selected = selectedNode.value && canAddAfter(selectedNode.value) ? selectedNode.value : undefined
    createParentId.value = parentId ?? selected?.id ?? findLastLeaf(data.value ?? [])?.id ?? -1
    isCreateOpen.value = true
}

function onCreate(form: Required<WorkflowNodeFormTypes>) {
    createNode.mutate({ form, parentId: createParentId.value })
}

function onSave(node: WorkflowNodeTypes) {
    updateNode.mutate(node, {
        onSuccess: () => {
            toast.add({ title: 'Node saved', color: 'success' })
            router.push('/')
        },
    })
}

function onDelete(id: WorkflowId) {
    deleteNode.mutate(id, { onSuccess: () => router.push('/') })
}
</script>

<template>
    <main class="relative h-full bg-gray-50">
        <p v-if="isPending" class="p-6 text-gray-500">Loading workflow...</p>
        <p v-else-if="isError" class="p-6 text-gray-500">Could not load the workflow.</p>
        <template v-else-if="data">
            <FlowCanvas
                :nodes="data"
                :selected-id="selectedNode?.id"
                @add="openCreate"
                @select="toggleNode"
            />
            <UButton icon="i-lucide-plus" label="Create New Node" class="absolute top-4 left-4 z-10" @click="openCreate()" />
        </template>

        <CreateNodeModal v-model:open="isCreateOpen" @create="onCreate" />
        <NodeDrawer :node="selectedNode" @save="onSave" @delete="onDelete" @close="router.push('/')" />
    </main>
</template>
