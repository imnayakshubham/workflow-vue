import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes, WorkflowPayloadTypes } from '@/types/workflow'
import { createNodes, insertNodes, removeSubtree, replaceNode } from '@/utils/workflow'
import { WORKFLOW_QUERY_KEY } from './useWorkflow'

export function useWorkflowMutations() {
    const queryClient = useQueryClient()

    function currentNodes() {
        return queryClient.getQueryData<WorkflowPayloadTypes>(WORKFLOW_QUERY_KEY) ?? []
    }

    function saveNodes(nodes: WorkflowPayloadTypes) {
        queryClient.setQueryData(WORKFLOW_QUERY_KEY, nodes)
    }

    const createNode = useMutation({
        mutationFn: async ({ form, parentId }: { form: Required<WorkflowNodeFormTypes>, parentId: WorkflowId }) =>
            insertNodes(currentNodes(), createNodes(form, parentId), parentId),
        onSuccess: saveNodes,
    })

    const updateNode = useMutation({
        mutationFn: async (node: WorkflowNodeTypes) => replaceNode(currentNodes(), node),
        onSuccess: saveNodes,
    })

    const deleteNode = useMutation({
        mutationFn: async (id: WorkflowId) => removeSubtree(currentNodes(), id),
        onSuccess: saveNodes,
    })

    return { createNode, updateNode, deleteNode }
}
