<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'
import { useWorkflow } from '@/composables/useWorkflow'
import { useWorkflowMutations } from '@/composables/useWorkflowMutations'
import { useWorkflowStore } from '@/stores/workflow'
import { canAddAfter, findLastLeaf } from '@/utils/workflow'
import FlowCanvas from '@/components/flow/FlowCanvas.vue'
import CreateNodeModal from '@/components/flow/CreateNodeModal.vue'
import NodeDrawer from '@/components/flow/drawer/NodeDrawer.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const store = useWorkflowStore()
const { data, isPending, isError } = useWorkflow()
const { createNode, updateNode, deleteNode } = useWorkflowMutations()

const isCreateOpen = shallowRef(false)
const createParentId = shallowRef<WorkflowId>(-1)

const routeId = computed(() => typeof route.params.id === 'string' ? route.params.id : undefined)
const selectedNode = computed(() => {
    const routeNode = store.nodes.find((node) => String(node.id) === routeId.value)
    return routeNode?.type === 'dateTimeConnector' ? undefined : routeNode
})

watch([data, routeId, selectedNode], () => {
    if (data.value && routeId.value && !selectedNode.value) router.replace('/')
}, { immediate: true })

function openNode(id: string) {
    router.push(`/nodes/${id}`)
}

function openCreate(parentId?: WorkflowId) {
    const selected = selectedNode.value && canAddAfter(selectedNode.value) ? selectedNode.value : undefined
    createParentId.value = parentId ?? selected?.id ?? findLastLeaf(store.nodes)?.id ?? -1
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

function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    if (isTyping || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return

    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
    <main class="relative h-full ">
        <p v-if="isPending" class="flex h-full items-center justify-center text-gray-500">Loading workflow...</p>
        <p v-else-if="isError" class="flex h-full items-center justify-center text-gray-500">Could not load the workflow.</p>
        <template v-else>
            <UFieldGroup class="absolute top-4 left-4 z-10 flex gap-2">
                 <UButton icon="i-lucide-plus" label="Create New Node" @click="openCreate()" />
                <UButton icon="i-lucide-undo-2" aria-label="Undo" color="neutral" variant="outline" size="sm" :disabled="!store.canUndo" @click="store.undo()" />
                <UButton icon="i-lucide-redo-2" aria-label="Redo" color="neutral" variant="outline" size="sm" :disabled="!store.canRedo" @click="store.redo()" />
            </UFieldGroup>
            <UButton v-if="store.nodes.length === 0" icon="i-lucide-plus" label="Create New Node" class="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2" @click="openCreate()" />
            <FlowCanvas
                :selected-id="selectedNode?.id"
                @add="openCreate"
                @select="openNode"
                @close="router.push('/')"
            />
        </template>

        <CreateNodeModal v-model:open="isCreateOpen" @create="onCreate" />
        <NodeDrawer :node="selectedNode" @save="onSave" @delete="onDelete" @close="router.push('/')" />
    </main>
</template>
