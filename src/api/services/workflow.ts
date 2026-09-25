import type { WorkflowId, WorkflowNodeTypes, WorkflowPayloadTypes } from '@/types/workflow'
import { WORKFLOW_URL } from '@/api/endpoints/workflow'

export async function getWorkflow(): Promise<WorkflowPayloadTypes> {
    const response = await fetch(WORKFLOW_URL)

    if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`)
    }

    return response.json()
}

export async function saveWorkflow(nodes: WorkflowPayloadTypes): Promise<WorkflowPayloadTypes> {
    return nodes
}

export async function saveNode(node: WorkflowNodeTypes): Promise<WorkflowNodeTypes> {
    return node
}

export async function deleteNode(nodeId: WorkflowId): Promise<WorkflowId> {
    return nodeId
}
