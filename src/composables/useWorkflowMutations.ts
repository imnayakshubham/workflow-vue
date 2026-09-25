import { toRaw } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import * as workflowApi from '@/api/services/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'

interface CreateNodeInput {
    form: Required<WorkflowNodeFormTypes>
    parentId: WorkflowId
}

export function useWorkflowMutations() {
    const store = useWorkflowStore()

    const createNode = useMutation({
        mutationFn: (_input: CreateNodeInput) => workflowApi.saveWorkflow(toRaw(store.nodes)),
        onMutate: ({ form, parentId }: CreateNodeInput) => store.addNode(form, parentId),
        onError: () => store.rollback(),
    })

    const updateNode = useMutation({
        mutationFn: (updatedNode: WorkflowNodeTypes) => workflowApi.saveNode(updatedNode),
        onMutate: (updatedNode: WorkflowNodeTypes) => store.updateNode(updatedNode),
        onError: () => store.rollback(),
    })

    const deleteNode = useMutation({
        mutationFn: (nodeId: WorkflowId) => workflowApi.deleteNode(nodeId),
        onMutate: (nodeId: WorkflowId) => store.removeNode(nodeId),
        onError: () => store.rollback(),
    })

    return { createNode, updateNode, deleteNode }
}
