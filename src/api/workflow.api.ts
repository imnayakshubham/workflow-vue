import type { WorkflowId, WorkflowNodeTypes, WorkflowPayloadTypes } from '@/types/workflow'

const WorkflowApiUrl = '/api/payload.json'

export async function getWorkflow(): Promise<WorkflowPayloadTypes> {
    const response = await fetch(WorkflowApiUrl)

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
