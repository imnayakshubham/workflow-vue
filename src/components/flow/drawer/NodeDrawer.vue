<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { WorkflowId, WorkflowNodeTypes } from '@/types/workflow'
import { validateNodeDraft } from '@/utils/validation'
import { NODE_COLORS, NODE_ICONS, NODE_SUMMARIES, cloneNode, getDescription, getTitle } from '@/utils/workflow'
import SendMessageEditor from './SendMessageEditor.vue'
import CommentEditor from './CommentEditor.vue'
import BusinessHoursEditor from './BusinessHoursEditor.vue'

const props = defineProps<{ node?: WorkflowNodeTypes }>()
const emit = defineEmits<{
    save: [node: WorkflowNodeTypes]
    delete: [id: WorkflowId]
    close: []
}>()

const draft = ref<WorkflowNodeTypes>()
const isConfirmOpen = shallowRef(false)

const title = computed(() => props.node && getTitle(props.node))

watch(() => props.node, (node) => {
    draft.value = node && { ...cloneNode(node), name: getTitle(node) }
}, { immediate: true })

function save() {
    if (!draft.value) return
    emit('save', cloneNode({
        ...draft.value,
        name: draft.value.name?.trim(),
        description: draft.value.description?.trim() || undefined,
    }))
}

function confirmDelete() {
    if (props.node) emit('delete', props.node.id)
    isConfirmOpen.value = false
}
</script>

<template>
    <USlideover
        :open="Boolean(node)"
        :modal="false"
        :overlay="false"
        :dismissible="false"
        :description="node && NODE_SUMMARIES[node.type]"
        @update:open="emit('close')"
    >
        <template #title>
            <span v-if="node" class="flex items-center gap-2 font-semibold">
                <UIcon :name="NODE_ICONS[node.type]" class="size-5" :style="{ color: NODE_COLORS[node.type] }" />
                {{ title }}
            </span>
        </template>

        <template #body>
            <UForm
                v-if="draft && node"
                id="node-form"
                :state="draft"
                :validate="validateNodeDraft"
                class="space-y-5"
                @submit="save"
            >
                <UFormField label="Title" name="title" required>
                    <UInput v-model="draft.name" class="w-full" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="draft.description" :placeholder="getDescription(node)" :rows="2" autoresize class="w-full" />
                </UFormField>

                <SendMessageEditor v-if="draft.type === 'sendMessage'" v-model="draft.data" />
                <CommentEditor v-else-if="draft.type === 'addComment'" v-model="draft.data" />
                <BusinessHoursEditor v-else-if="draft.type === 'dateTime'" v-model="draft.data" />
            </UForm>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton icon="i-lucide-trash-2" label="Delete" color="error" variant="soft" @click="isConfirmOpen = true" />
                <UButton type="submit" form="node-form" label="Save" />
            </div>
        </template>
    </USlideover>

    <UModal v-model:open="isConfirmOpen" title="Delete node?" :description="`${title} and every node below it will be removed.`">
        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="isConfirmOpen = false" />
                <UButton label="Delete" color="error" @click="confirmDelete" />
            </div>
        </template>
    </UModal>
</template>
