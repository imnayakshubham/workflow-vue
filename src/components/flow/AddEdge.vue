<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import AddNodeButton from './AddNodeButton.vue'

const props = defineProps<EdgeProps<{ color: string }>>()
const emit = defineEmits<{ add: [] }>()

const path = computed(() => getSmoothStepPath(props))
const buttonStyle = computed(() => ({
    transform: `translate(-50%, -50%) translate(${path.value[1]}px, ${path.value[2]}px)`,
}))
</script>

<template>
    <BaseEdge :path="path[0]" :style="{ stroke: data.color, strokeWidth: 1.5 }" />
    <EdgeLabelRenderer>
        <AddNodeButton :color="data.color" class="pointer-events-auto absolute" :style="buttonStyle" @click.stop="emit('add')" />
    </EdgeLabelRenderer>
</template>
