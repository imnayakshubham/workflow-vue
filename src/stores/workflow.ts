import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { XYPosition } from '@vue-flow/core'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'
import { buildNodes } from '@/utils/workflow'

interface WorkflowSnapshotTypes {
    nodes: WorkflowNodeTypes[]
    positions: Record<string, XYPosition>
}

export const useWorkflowStore = defineStore('workflow', () => {
    const nodes = ref<WorkflowNodeTypes[]>([])
    const positions = ref<Record<string, XYPosition>>({})
    const past = ref<WorkflowSnapshotTypes[]>([])
    const future = ref<WorkflowSnapshotTypes[]>([])

    const canUndo = computed(() => past.value.length > 0)
    const canRedo = computed(() => future.value.length > 0)

    function currentSnapshot(): WorkflowSnapshotTypes {
        return { nodes: nodes.value, positions: positions.value }
    }

    function restoreSnapshot(snapshot?: WorkflowSnapshotTypes) {
        if (!snapshot) return
        nodes.value = snapshot.nodes
        positions.value = snapshot.positions
    }

    function takeSnapshot() {
        past.value.push(currentSnapshot())
        future.value = []
    }

    function rollback() {
        restoreSnapshot(past.value.pop())
    }

    function undo() {
        if (!canUndo.value) return
        future.value.push(currentSnapshot())
        rollback()
    }

    function redo() {
        const snapshot = future.value.pop()
        if (!snapshot) return
        past.value.push(currentSnapshot())
        restoreSnapshot(snapshot)
    }

    function addNode(form: Required<WorkflowNodeFormTypes>, parentId: WorkflowId) {
        takeSnapshot()
        const { newNodes, attachChildrenTo } = buildNodes(form, parentId)
        const nodesWithMovedChildren = nodes.value.map((node) =>
            node.parentId === parentId ? { ...node, parentId: attachChildrenTo } : node,
        )
        nodes.value = [...nodesWithMovedChildren, ...newNodes]
    }

    function updateNode(updatedNode: WorkflowNodeTypes) {
        takeSnapshot()
        nodes.value = nodes.value.map((node) => node.id === updatedNode.id ? updatedNode : node)
    }

    function removeNode(nodeId: WorkflowId) {
        takeSnapshot()
        const idsToRemove = new Set<WorkflowId>()

        function collectWithChildren(id: WorkflowId) {
            idsToRemove.add(id)
            nodes.value
                .filter((node) => node.parentId === id)
                .forEach((child) => collectWithChildren(child.id))
        }

        collectWithChildren(nodeId)
        nodes.value = nodes.value.filter((node) => !idsToRemove.has(node.id))
    }

    function moveNodes(movedNodes: { id: string; position: XYPosition }[]) {
        takeSnapshot()
        positions.value = { ...positions.value, ...Object.fromEntries(movedNodes.map((node) => [node.id, node.position])) }
    }

    return { nodes, positions, canUndo, canRedo, addNode, updateNode, removeNode, moveNodes, rollback, undo, redo }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useWorkflowStore, import.meta.hot))
}
