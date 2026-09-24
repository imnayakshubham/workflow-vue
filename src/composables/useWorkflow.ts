import { useQuery } from '@tanstack/vue-query'
import { getWorkflow } from '@/api/workflow.api'

export const WORKFLOW_QUERY_KEY = ['workflow']

export function useWorkflow() {
    return useQuery({
        queryKey: WORKFLOW_QUERY_KEY,
        queryFn: getWorkflow,
        staleTime: 5 * 60 * 1000,
    })
}