import { watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getWorkflow } from '@/api/services/workflow'
import { useWorkflowStore } from '@/stores/workflow'

export const WORKFLOW_QUERY_KEY = ['workflow']

export function useWorkflow() {
    const store = useWorkflowStore()
    const workflowQuery = useQuery({ queryKey: WORKFLOW_QUERY_KEY, queryFn: getWorkflow })

    watch(workflowQuery.data, (fetchedNodes) => {
        if (fetchedNodes) store.nodes = fetchedNodes
    }, { immediate: true })

    return workflowQuery
}
