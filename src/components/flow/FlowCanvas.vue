<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { VueFlow, useVueFlow, type NodeDragEvent, type NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { WorkflowId, WorkflowNodeTypes } from '@/types/workflow'
import { useEditorStore } from '@/stores/editor'
import { getNodeSize, layoutTree } from '@/utils/layout'
import { findNodeById, toFlowEdges, toFlowNodes } from '@/utils/workflow'
import WorkflowNode from './WorkflowNode.vue'
import ConnectorNode from './ConnectorNode.vue'
import AddEdge from './AddEdge.vue'

const DRAWER_WIDTH = 448

const props = defineProps<{ nodes: WorkflowNodeTypes[], selectedId?: WorkflowId }>()
const emit = defineEmits<{
    add: [parentId: WorkflowId]
    select: [id: string]
}>()

const editor = useEditorStore()
const { positions } = storeToRefs(editor)

const { setCenter, viewport, onPaneReady, onNodesChange } = useVueFlow()

const heights = ref<Record<string, number>>({})

onNodesChange((changes) => {
    for (const change of changes) {
        if (change.type === 'dimensions' && change.dimensions) heights.value[change.id] = change.dimensions.height
    }
})

const layout = computed(() => layoutTree(props.nodes, heights.value))
const nodePositions = computed(() => ({ ...layout.value, ...positions.value }))
const flowNodes = computed(() => toFlowNodes(props.nodes, nodePositions.value))
const flowEdges = computed(() => toFlowEdges(props.nodes))
const parentIds = computed(() => new Set(props.nodes.map((node) => node.parentId)))

function focusNode(id?: WorkflowId) {
    const node = id === undefined ? undefined : findNodeById(props.nodes, String(id))
    const position = node && nodePositions.value[String(node.id)]
    if (!node || !position) return

    const { width, height } = getNodeSize(node)
    const { zoom } = viewport.value
    const nodeHeight = heights.value[String(node.id)] ?? height
    setCenter(position.x + width / 2 + DRAWER_WIDTH / 2 / zoom, position.y + nodeHeight / 2, { zoom, duration: 400 })
}

onPaneReady(() => focusNode(props.selectedId))
watch(() => props.selectedId, focusNode)

function onEdgeAdd(sourceId: string) {
    const source = findNodeById(props.nodes, sourceId)
    if (source) emit('add', source.id)
}

function onNodeClick({ node }: NodeMouseEvent) {
    if (node.type === 'workflow') emit('select', node.id)
}

function onDragStop({ nodes }: NodeDragEvent) {
    nodes.forEach((node) => editor.setPosition(node.id, node.position))
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
