import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { XYPosition } from '@vue-flow/core'
import type { WorkflowNodeTypes } from '@/types/workflow'

export const useWorkflowStore = defineStore('workflow', () => {
    const nodes = ref<WorkflowNodeTypes[]>([])
    const positions = ref<Record<string, XYPosition>>({})

    function setPosition(nodeId: string, position: XYPosition) {
        positions.value[nodeId] = { ...position }
    }

    return { nodes, positions, setPosition }
})
