<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { WorkflowNodeTypes } from '@/types/workflow'
import { NODE_COLORS, NODE_ICONS, canAddAfter, getDescription, getTitle } from '@/utils/workflow'
import LeafAddButton from './LeafAddButton.vue'

const props = defineProps<{ node: WorkflowNodeTypes, leaf: boolean, selected?: boolean }>()
const emit = defineEmits<{ add: [] }>()

const icon = computed(() => NODE_ICONS[props.node.type])
const color = computed(() => NODE_COLORS[props.node.type])
const title = computed(() => getTitle(props.node))
const description = computed(() => getDescription(props.node))
</script>

<template>
    <div
        class="relative w-55 cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        :style="selected ? { borderColor: color } : undefined"
    >
        <Handle v-if="node.type !== 'trigger'" type="target" :position="Position.Top" class="opacity-0" />

        <div class="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <UIcon :name="icon" class="size-4 shrink-0" :style="{ color }" />
            <span data-test="title" class="truncate text-[13px] font-semibold text-gray-800">{{ title }}</span>
        </div>

        <div class="px-3 py-2.5 text-xs leading-4 text-gray-500">
            <p
                data-test="description"
                class="line-clamp-3 wrap-break-words"
                :class="{ italic: node.type === 'sendMessage' }"
                :title="description"
            >
                {{ description }}
            </p>
        </div>

        <Handle type="source" :position="Position.Bottom" class="opacity-0" />
        <LeafAddButton v-if="leaf && canAddAfter(node)" @click.stop="emit('add')" />
    </div>
</template>
