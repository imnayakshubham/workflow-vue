import { useMutation } from '@tanstack/vue-query'
import { saveWorkflow } from '@/api/workflow.api'
import { useWorkflowStore } from '@/stores/workflow'
import type {
    WorkflowDateTimeConnectorNodeTypes,
    WorkflowDateTimeNodeTypes,
    WorkflowId,
    WorkflowNodeFormTypes,
    WorkflowNodeTypes,
} from '@/types/workflow'

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

interface CreateNodeInput {
    form: Required<WorkflowNodeFormTypes>
    parentId: WorkflowId
}

function newId() {
    return crypto.randomUUID().slice(0, 6)
}

export function useWorkflowMutations() {
    const store = useWorkflowStore()

    const createNode = useMutation({
        mutationFn: (_input: CreateNodeInput) => saveWorkflow(store.nodes),
        onMutate: ({ form, parentId }: CreateNodeInput) => {
            const previousNodes = store.nodes
            const newNode = {
                id: newId(),
                parentId,
                name: form.title.trim(),
                description: form.description.trim() || undefined,
            }

            let addedNodes: WorkflowNodeTypes[] = []
            let parentForExistingChildren: WorkflowId = newNode.id

            if (form.type === 'sendMessage') {
                addedNodes = [{ ...newNode, type: 'sendMessage', data: { payload: [] } }]
            }

            if (form.type === 'addComment') {
                addedNodes = [{ ...newNode, type: 'addComment', data: { comment: '' } }]
            }

            if (form.type === 'businessHours') {
                const successBranch: WorkflowDateTimeConnectorNodeTypes = {
                    id: newId(),
                    parentId: newNode.id,
                    name: 'Success',
                    type: 'dateTimeConnector',
                    data: { connectorType: 'success' },
                }
                const failureBranch: WorkflowDateTimeConnectorNodeTypes = {
                    id: newId(),
                    parentId: newNode.id,
                    name: 'Failure',
                    type: 'dateTimeConnector',
                    data: { connectorType: 'failure' },
                }
                const businessHours: WorkflowDateTimeNodeTypes = {
                    ...newNode,
                    type: 'dateTime',
                    data: {
                        times: WEEK_DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00' })),
                        connectors: [successBranch.id, failureBranch.id],
                        timezone: 'UTC',
                        action: 'businessHours',
                    },
                }

                addedNodes = [businessHours, successBranch, failureBranch]
                parentForExistingChildren = successBranch.id
            }

            const nodesWithMovedChildren = store.nodes.map((node) =>
                node.parentId === parentId ? { ...node, parentId: parentForExistingChildren } : node,
            )

            store.nodes = [...nodesWithMovedChildren, ...addedNodes]
            return { previousNodes }
        },
        onError: (_error, _input, context) => {
            if (context) store.nodes = context.previousNodes
        },
    })

    const updateNode = useMutation({
        mutationFn: (_updatedNode: WorkflowNodeTypes) => saveWorkflow(store.nodes),
        onMutate: (updatedNode: WorkflowNodeTypes) => {
            const previousNodes = store.nodes

            store.nodes = store.nodes.map((node) => node.id === updatedNode.id ? updatedNode : node)
            return { previousNodes }
        },
        onError: (_error, _updatedNode, context) => {
            if (context) store.nodes = context.previousNodes
        },
    })

    const deleteNode = useMutation({
        mutationFn: (_nodeId: WorkflowId) => saveWorkflow(store.nodes),
        onMutate: (nodeId: WorkflowId) => {
            const previousNodes = store.nodes
            const idsToRemove = new Set<WorkflowId>()

            function collectWithChildren(id: WorkflowId) {
                idsToRemove.add(id)
                store.nodes
                    .filter((node) => node.parentId === id)
                    .forEach((child) => collectWithChildren(child.id))
            }

            collectWithChildren(nodeId)
            store.nodes = store.nodes.filter((node) => !idsToRemove.has(node.id))
            return { previousNodes }
        },
        onError: (_error, _nodeId, context) => {
            if (context) store.nodes = context.previousNodes
        },
    })

    return { createNode, updateNode, deleteNode }
}
