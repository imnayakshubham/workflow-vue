<script setup lang="ts">
import type { WorkflowCommentNodeTypes } from '@/types/workflow'

const data = defineModel<WorkflowCommentNodeTypes['data']>({ required: true })
</script>

<template>
    <UFormField label="Comment" name="comment">
        <div class="flex items-start gap-2">
            <UTextarea
                :model-value="data.comment"
                :rows="3"
                autoresize
                class="flex-1"
                @update:model-value="data = { comment: String($event) }"
            />
            <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="soft"
                aria-label="Remove comment"
                :disabled="!data.comment"
                @click="data = { comment: '' }"
            />
        </div>
    </UFormField>
</template>
