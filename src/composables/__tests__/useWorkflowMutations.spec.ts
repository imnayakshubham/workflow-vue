import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { deleteNode, saveNode, saveWorkflow } from '@/api/workflow.api'
import { useWorkflowMutations } from '@/composables/useWorkflowMutations'
import { useWorkflowStore } from '@/stores/workflow'
import { awayMessage, businessHours, comment, failureBranch, payload, successBranch, trigger, welcomeMessage } from '@/test/fixtures'

vi.mock('@/api/workflow.api', () => ({
    getWorkflow: vi.fn(),
    saveWorkflow: vi.fn(async (nodes) => nodes),
    saveNode: vi.fn(async (node) => node),
    deleteNode: vi.fn(async (nodeId) => nodeId),
}))

function setup() {
    const pinia = createPinia()
    setActivePinia(pinia)

    const store = useWorkflowStore()
    store.nodes = payload

    let mutations = {} as ReturnType<typeof useWorkflowMutations>
    const TestComponent = defineComponent({
        setup() {
            mutations = useWorkflowMutations()
            return () => null
        },
    })
    mount(TestComponent, { global: { plugins: [pinia, VueQueryPlugin] } })

    return { store, mutations }
}

function idsOf(nodes: { id: string | number }[]) {
    return nodes.map((node) => node.id)
}

describe('createNode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('adds a comment under the last node with a trimmed title and no description', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: ' Note ', description: '', type: 'addComment' }, parentId: comment.id })
        await flushPromises()

        const newNode = store.nodes.at(-1)
        expect(saveWorkflow).toHaveBeenCalledWith(store.nodes)
        expect(store.nodes).toHaveLength(payload.length + 1)
        expect(newNode).toMatchObject({ parentId: comment.id, name: 'Note', type: 'addComment', data: { comment: '' } })
        expect(newNode?.description).toBeUndefined()
    })

    it('puts a new message between a node and its existing children', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: 'Follow up', description: 'Ask again', type: 'sendMessage' }, parentId: awayMessage.id })
        await flushPromises()

        const newNode = store.nodes.at(-1)
        const movedComment = store.nodes.find((node) => node.id === comment.id)
        expect(newNode).toMatchObject({ parentId: awayMessage.id, description: 'Ask again', type: 'sendMessage', data: { payload: [] } })
        expect(movedComment?.parentId).toBe(newNode?.id)
    })

    it('adds business hours with success and failure branches and moves the old children under success', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: 'Hours', description: '', type: 'businessHours' }, parentId: 1 })
        await flushPromises()

        const [newBusinessHours, newSuccess, newFailure] = store.nodes.slice(-3)
        const oldBusinessHours = store.nodes.find((node) => node.id === businessHours.id)
        expect(oldBusinessHours?.parentId).toBe(newSuccess?.id)
        expect(newBusinessHours).toMatchObject({
            parentId: 1,
            type: 'dateTime',
            data: { connectors: [newSuccess?.id, newFailure?.id], timezone: 'UTC', action: 'businessHours' },
        })
        expect(newSuccess).toMatchObject({ parentId: newBusinessHours?.id, name: 'Success', data: { connectorType: 'success' } })
        expect(newFailure).toMatchObject({ parentId: newBusinessHours?.id, name: 'Failure', data: { connectorType: 'failure' } })
    })

})

describe('updateNode', () => {
    it('replaces the node with the edited version and leaves the other nodes alone', async () => {
        const { store, mutations } = setup()
        const renamedComment = { ...comment, name: 'Renamed' }

        mutations.updateNode.mutate(renamedComment)
        await flushPromises()

        expect(saveNode).toHaveBeenCalledWith(renamedComment)
        expect(store.nodes.find((node) => node.id === comment.id)).toEqual(renamedComment)
        expect(store.nodes).toHaveLength(payload.length)
    })
})

describe('deleteNode', () => {
    it('removes the node together with every node below it', async () => {
        const { store, mutations } = setup()

        mutations.deleteNode.mutate(failureBranch.id)
        await flushPromises()

        expect(deleteNode).toHaveBeenCalledWith(failureBranch.id)
        expect(idsOf(store.nodes)).toEqual([trigger.id, businessHours.id, successBranch.id, welcomeMessage.id])
    })

    it('puts the removed nodes back when the delete is undone', async () => {
        const { store, mutations } = setup()

        mutations.deleteNode.mutate(failureBranch.id)
        await flushPromises()
        store.undo()

        expect(store.nodes).toEqual(payload)
    })

})

describe('when saving fails', () => {
    it('restores the old nodes and leaves nothing to undo when the save fails', async () => {
        const { store, mutations } = setup()
        vi.mocked(deleteNode).mockRejectedValueOnce(new Error('Network error'))

        mutations.deleteNode.mutate(businessHours.id)
        await flushPromises()

        expect(store.nodes).toEqual(payload)
        expect(store.canUndo).toBe(false)
    })
})
