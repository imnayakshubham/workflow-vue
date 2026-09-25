<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { WorkflowMessagePayloadTypes, WorkflowSendMessageNodeTypes } from '@/types/workflow'
import { readFileAsDataUrl } from '@/utils/file'
import { validateImageFile } from '@/utils/validation'
import { getFileName } from '@/utils/workflow'

const data = defineModel<WorkflowSendMessageNodeTypes['data']>({ required: true })

const uploadError = shallowRef('')

const texts = computed(() => data.value.payload.flatMap((item, index) => item.type === 'text' ? [{ index, text: item.text }] : []))
const attachments = computed(() => data.value.payload.flatMap((item, index) => item.type === 'attachment' ? [{ index, url: item.attachment }] : []))

function setPayload(payload: WorkflowMessagePayloadTypes[]) {
    data.value = { ...data.value, payload }
}

function updateText(index: number, text: string) {
    setPayload(data.value.payload.map((item, i) => i === index ? { type: 'text', text } : item))
}

function remove(index: number) {
    setPayload(data.value.payload.filter((_, i) => i !== index))
}

function addText() {
    setPayload([...data.value.payload, { type: 'text', text: '' }])
}

async function upload(event: Event) {
    const input = event.target as HTMLInputElement
    const files = [...(input.files ?? [])]
    input.value = ''

    uploadError.value = files.map(validateImageFile).find(Boolean) ?? ''
    if (uploadError.value) return

    const urls = await Promise.all(files.map(readFileAsDataUrl))
    setPayload([...data.value.payload, ...urls.map((attachment) => ({ type: 'attachment' as const, attachment }))])
}
</script>

<template>
    <section class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700">Attachments</h3>
        <div class="grid grid-cols-3 gap-2">
            <div
                v-for="file in attachments"
                :key="file.index"
                class="relative aspect-square overflow-hidden rounded-md border border-gray-200"
            >
                <img :src="file.url" :alt="getFileName(file.url)" class="size-full object-cover" />
                <UButton
                    icon="i-lucide-x"
                    size="xs"
                    color="neutral"
                    aria-label="Remove attachment"
                    class="absolute top-1 right-1 rounded-full"
                    @click="remove(file.index)"
                />
            </div>
            <label class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 text-xs text-gray-500 hover:border-primary hover:text-primary">
                <UIcon name="i-lucide-image-plus" class="size-5" />
                Upload
                <input type="file" accept="image/*" multiple class="sr-only" @change="upload" />
            </label>
        </div>
        <p v-if="uploadError" class="text-xs text-error">{{ uploadError }}</p>
    </section>

    <section class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700">Messages</h3>
        <UFormField v-for="item in texts" :key="item.index" :name="`payload.${item.index}`">
            <div class="flex items-start gap-2">
                <UTextarea
                    :model-value="item.text"
                    :rows="2"
                    autoresize
                    class="flex-1"
                    @update:model-value="updateText(item.index, String($event))"
                />
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" aria-label="Remove message" @click="remove(item.index)" />
            </div>
        </UFormField>
        <UButton icon="i-lucide-plus" label="Add message" size="sm" variant="soft" @click="addText" />
    </section>
</template>
