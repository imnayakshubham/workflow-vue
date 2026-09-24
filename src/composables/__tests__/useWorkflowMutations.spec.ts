import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { saveWorkflow } from '@/api/workflow.api'
import { useWorkflowMutations } from '@/composables/useWorkflowMutations'
import { useWorkflowStore } from '@/stores/workflow'
import { comment, payload } from '@/test/fixtures'

vi.mock('@/api/workflow.api', () => ({
    getWorkflow: vi.fn(),
    saveWorkflow: vi.fn(async (nodes) => nodes),
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

    it('adds a comment after the last node', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: ' Note ', description: '', type: 'addComment' }, parentId: 'e879e4' })
        await flushPromises()

        const newNode = store.nodes.at(-1)
        expect(store.nodes).toHaveLength(payload.length + 1)
        expect(newNode).toMatchObject({ parentId: 'e879e4', name: 'Note', type: 'addComment', data: { comment: '' } })
        expect(newNode?.description).toBeUndefined()
    })

    it('adds a message between a node and its children', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: 'Follow up', description: 'Ask again', type: 'sendMessage' }, parentId: 'b6a0c1' })
        await flushPromises()

        const newNode = store.nodes.at(-1)
        const movedComment = store.nodes.find((node) => node.id === 'e879e4')
        expect(newNode).toMatchObject({ parentId: 'b6a0c1', description: 'Ask again', type: 'sendMessage', data: { payload: [] } })
        expect(movedComment?.parentId).toBe(newNode?.id)
    })

    it('adds business hours with success and failure branches and moves old children under success', async () => {
        const { store, mutations } = setup()

        mutations.createNode.mutate({ form: { title: 'Hours', description: '', type: 'businessHours' }, parentId: 1 })
        await flushPromises()

        const [newBusinessHours, newSuccess, newFailure] = store.nodes.slice(-3)
        const oldBusinessHours = store.nodes.find((node) => node.id === 'd09c08')
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
    it('replaces the node with the edited one', async () => {
        const { store, mutations } = setup()
        const renamedComment = { ...comment, name: 'Renamed' }

        mutations.updateNode.mutate(renamedComment)
        await flushPromises()

        expect(store.nodes.find((node) => node.id === 'e879e4')).toEqual(renamedComment)
        expect(store.nodes).toHaveLength(payload.length)
    })
})

describe('deleteNode', () => {
    it('deletes the node and everything below it', async () => {
        const { store, mutations } = setup()

        mutations.deleteNode.mutate('28c4b9')
        await flushPromises()

        expect(idsOf(store.nodes)).toEqual([1, 'd09c08', '161f52', 'b0653a'])
    })

})

describe('when saving fails', () => {
    it('puts the old nodes back when the save fails', async () => {
        const { store, mutations } = setup()
        vi.mocked(saveWorkflow).mockRejectedValueOnce(new Error('Network error'))

        mutations.deleteNode.mutate('d09c08')
        await flushPromises()

        expect(store.nodes).toEqual(payload)
    })
})
