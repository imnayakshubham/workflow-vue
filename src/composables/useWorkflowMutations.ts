import { useMutation } from '@tanstack/vue-query'
import { saveWorkflow } from '@/api/workflow.api'
import { useWorkflowStore } from '@/stores/workflow'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'

interface CreateNodeInput {
    form: Required<WorkflowNodeFormTypes>
    parentId: WorkflowId
}

export function useWorkflowMutations() {
    const store = useWorkflowStore()

    const createNode = useMutation({
        mutationFn: (_input: CreateNodeInput) => saveWorkflow(store.nodes),
        onMutate: ({ form, parentId }: CreateNodeInput) => store.addNode(form, parentId),
        onError: () => store.rollback(),
    })

    const updateNode = useMutation({
        mutationFn: (_updatedNode: WorkflowNodeTypes) => saveWorkflow(store.nodes),
        onMutate: (updatedNode: WorkflowNodeTypes) => store.updateNode(updatedNode),
        onError: () => store.rollback(),
    })

    const deleteNode = useMutation({
        mutationFn: (_nodeId: WorkflowId) => saveWorkflow(store.nodes),
        onMutate: (nodeId: WorkflowId) => store.removeNode(nodeId),
        onError: () => store.rollback(),
    })

    return { createNode, updateNode, deleteNode }
}
