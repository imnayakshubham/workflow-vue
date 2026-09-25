<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { WorkflowId } from '@/types/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import { calculateNodePositions, getNodeSize } from '@/utils/layout'
import { buildCanvasNodes, buildParentChildEdges, collectParentIds, findNode } from '@/utils/workflow'
import WorkflowNode from './WorkflowNode.vue'
import ConnectorNode from './ConnectorNode.vue'
import AddEdge from './AddEdge.vue'

const DRAWER_WIDTH = 448

const props = defineProps<{ selectedId?: WorkflowId }>()

const fitViewOnInit = props.selectedId === undefined

const emit = defineEmits<{
    add: [parentId: WorkflowId]
    select: [id: string]
    close: []
}>()

const store = useWorkflowStore()
const { nodes: workflowNodes, positions: draggedPositions } = storeToRefs(store)
const { setCenter, setViewport, viewport, dimensions, onPaneReady, onNodesChange, onNodeDragStop } = useVueFlow()
const measuredHeights = ref<Record<string, number>>({})

onNodesChange((changes) => {
    changes.forEach((change) => {
        if (change.type === 'dimensions' && change.dimensions) {
            measuredHeights.value[change.id] = change.dimensions.height
        }
    })

    const selectionChanges = changes.filter((change) => change.type === 'select')
    const selected = selectionChanges.find((change) => change.selected)
    const deselected = selectionChanges.find((change) => !change.selected)
    if (selected) emit('select', selected.id)
    else if (deselected) emit('close')
})

const nodePositions = computed(() => {
    const autoPositions = calculateNodePositions(workflowNodes.value, measuredHeights.value)
    return { ...autoPositions, ...draggedPositions.value }
})

const nodes = computed(() => buildCanvasNodes(workflowNodes.value, nodePositions.value, props.selectedId))
const edges = computed(() => buildParentChildEdges(workflowNodes.value))
const parentIds = computed(() => collectParentIds(workflowNodes.value))

function nodeBox(nodeId?: WorkflowId) {
    if (nodeId === undefined) return

    const node = findNode(workflowNodes.value, nodeId)
    const position = node && nodePositions.value[String(node.id)]
    if (!node || !position) return

    const { width, height } = getNodeSize(node)
    return { ...position, width, height: measuredHeights.value[String(node.id)] ?? height }
}

function centerOnNode(nodeId?: WorkflowId) {
    const box = nodeBox(nodeId)
    if (!box) return

    const { zoom } = viewport.value
    const visibleCenterX = box.x + box.width / 2 + DRAWER_WIDTH / 2 / zoom
    const centerY = box.y + box.height / 2

    setCenter(visibleCenterX, centerY, { zoom, duration: 400 })
}

function keepNodeClearOfDrawer(nodeId?: WorkflowId) {
    const box = nodeBox(nodeId)
    if (!box) return

    const { x, y, zoom } = viewport.value
    const nodeRight = (box.x + box.width) * zoom + x
    const visibleRight = dimensions.value.width - DRAWER_WIDTH - 16
    const overflow = nodeRight - visibleRight

    if (overflow > 0) setViewport({ x: x - overflow, y, zoom }, { duration: 400 })
}

onPaneReady(() => centerOnNode(props.selectedId))
watch(() => props.selectedId, (id) => keepNodeClearOfDrawer(id))

onNodeDragStop(({ nodes: draggedNodes }) => store.moveNodes(draggedNodes))

function onEdgeAdd(parentId: string) {
    const parent = findNode(workflowNodes.value, parentId)
    if (parent) emit('add', parent.id)
}
</script>

<template>
    <VueFlow
        :nodes="nodes"
        :edges="edges"
        :nodes-connectable="false"
        :select-nodes-on-drag="false"
        :edges-focusable="false"
        :delete-key-code="null"
        :fit-view-on-init="fitViewOnInit"
    >
        <Background pattern-color="#aaa" :gap="16" />

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
