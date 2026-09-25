<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { WorkflowDateTimeConnectorNodeTypes } from '@/types/workflow'
import { getTitle } from '@/utils/workflow'
import LeafAddButton from './LeafAddButton.vue'

const props = defineProps<{ node: WorkflowDateTimeConnectorNodeTypes, leaf: boolean }>()
const emit = defineEmits<{ add: [] }>()

const title = computed(() => getTitle(props.node))
</script>

<template>
    <div class="relative h-5 w-16 rounded-xl bg-blue-200 text-center text-[0.7rem] leading-5 font-bold text-blue-500">
        <Handle type="target" :position="Position.Top" class="opacity-0" />
        {{ title }}
        <Handle type="source" :position="Position.Bottom" class="opacity-0" />
        <LeafAddButton v-if="leaf" @click.stop="emit('add')" />
    </div>
</template>
