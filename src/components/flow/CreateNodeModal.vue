<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { WorkflowNodeFormTypes } from '@/types/workflow'
import { validateNodeForm } from '@/utils/validation'

const NODE_TYPE_ITEMS = [
    { label: 'Send Message', value: 'sendMessage' },
    { label: 'Add Comments', value: 'addComment' },
    { label: 'Business Hours', value: 'businessHours' },
]

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ create: [form: Required<WorkflowNodeFormTypes>] }>()

const form = reactive<WorkflowNodeFormTypes>({ title: '', description: '', type: undefined })

watch(open, (isOpen) => {
    if (isOpen) Object.assign(form, { title: '', description: '', type: undefined })
})

function onSubmit() {
    if (!form.type) return
    emit('create', { title: form.title, description: form.description, type: form.type })
    open.value = false
}
</script>

<template>
    <UModal v-model:open="open" title="Create New Node">
        <template #body>
            <UForm :state="form" :validate="validateNodeForm" class="space-y-4" @submit="onSubmit">
                <UFormField label="Title" name="title" required>
                    <UInput v-model="form.title" placeholder="e.g. Welcome Message" class="w-full" autofocus />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="form.description" :rows="3" class="w-full" />
                </UFormField>

                <UFormField label="Type of Node" name="type" required>
                    <USelect v-model="form.type" :items="NODE_TYPE_ITEMS" placeholder="Select a type" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="ghost" @click="open = false" />
                    <UButton type="submit" label="Create" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
