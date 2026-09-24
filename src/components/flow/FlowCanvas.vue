<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { VueFlow, useVueFlow, type NodeDragEvent, type NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { WorkflowId } from '@/types/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import { getNodeSize, layoutTree } from '@/utils/layout'
import { toFlowEdges, toFlowNodes } from '@/utils/workflow'
import WorkflowNode from './WorkflowNode.vue'
import ConnectorNode from './ConnectorNode.vue'
import AddEdge from './AddEdge.vue'

const DRAWER_WIDTH = 448

const props = defineProps<{ selectedId?: WorkflowId }>()
const emit = defineEmits<{
    add: [parentId: WorkflowId]
    select: [id: string]
}>()

const store = useWorkflowStore()
const { nodes, positions } = storeToRefs(store)

const { setCenter, viewport, onPaneReady, onNodesChange } = useVueFlow()

const heights = ref<Record<string, number>>({})

onNodesChange((changes) => {
    for (const change of changes) {
        if (change.type === 'dimensions' && change.dimensions) heights.value[change.id] = change.dimensions.height
    }
})

const layout = computed(() => layoutTree(nodes.value, heights.value))
const nodePositions = computed(() => ({ ...layout.value, ...positions.value }))
const flowNodes = computed(() => toFlowNodes(nodes.value, nodePositions.value))
const flowEdges = computed(() => toFlowEdges(nodes.value))
const parentIds = computed(() => new Set(nodes.value.map((node) => node.parentId)))

function focusNode(nodeId?: WorkflowId) {
    const targetNode = nodes.value.find((node) => node.id === nodeId)
    const position = targetNode && nodePositions.value[String(targetNode.id)]
    if (!targetNode || !position) return

    const { width, height } = getNodeSize(targetNode)
    const renderedHeight = heights.value[String(targetNode.id)] ?? height
    const { zoom } = viewport.value

    setCenter(position.x + width / 2 + DRAWER_WIDTH / 2 / zoom, position.y + renderedHeight / 2, { zoom, duration: 400 })
}

onPaneReady(() => focusNode(props.selectedId))
watch(() => props.selectedId, focusNode)

function onEdgeAdd(sourceId: string) {
    const sourceNode = nodes.value.find((node) => String(node.id) === sourceId)
    if (sourceNode) emit('add', sourceNode.id)
}

function onNodeClick({ node }: NodeMouseEvent) {
    if (node.type === 'workflow') emit('select', node.id)
}

function onDragStop({ nodes }: NodeDragEvent) {
    nodes.forEach((node) => store.setPosition(node.id, node.position))
}
</script>

<template>
    <VueFlow
        :nodes="flowNodes"
        :edges="flowEdges"
        :nodes-connectable="false"
        :fit-view-on-init="selectedId === undefined"
        @node-click="onNodeClick"
        @node-drag-stop="onDragStop"
    >
        <Background :gap="16" pattern-color="#d4d4d8" />

        <template #node-workflow="{ data }">
            <WorkflowNode
                :node="data"
                :leaf="!parentIds.has(data.id)"
                :selected="data.id === selectedId"
                @add="emit('add', data.id)"
            />
        </template>

        <template #edge-add="edgeProps">
            <AddEdge v-bind="edgeProps" @add="onEdgeAdd(edgeProps.source)" />
        </template>

        <template #node-connector="{ data }">
            <ConnectorNode :node="data" :leaf="!parentIds.has(data.id)" @add="emit('add', data.id)" />
        </template>
    </VueFlow>
</template>
