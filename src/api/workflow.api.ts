import type { WorkflowPayloadTypes } from '@/types/workflow'

const WorkflowApiUrl = '/api/payload.json'

export async function getWorkflow(): Promise<WorkflowPayloadTypes> {
    const response = await fetch(WorkflowApiUrl)

    if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`)
    }

    return response.json()
}