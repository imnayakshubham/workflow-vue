import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { WorkflowPayloadTypes } from '@/types/workflow'
import { WORKFLOW_QUERY_KEY } from '@/composables/useWorkflow'
import { useWorkflowMutations } from '@/composables/useWorkflowMutations'
import { findNode, payload } from '@/utils/__tests__/fixtures'

function setup() {
    const queryClient = new QueryClient()
    queryClient.setQueryData(WORKFLOW_QUERY_KEY, payload)

    let mutations!: ReturnType<typeof useWorkflowMutations>
    mount(defineComponent({
        setup() {
            mutations = useWorkflowMutations()
            return () => null
        },
    }), { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    return { queryClient, mutations }
}

describe('useWorkflowMutations', () => {
    it('adds the created node to the workflow cache', async () => {
        const { queryClient, mutations } = setup()

        mutations.createNode.mutate({ form: { title: 'Note', description: '', type: 'addComment' }, parentId: 'e879e4' })
        await flushPromises()

        const nodes = queryClient.getQueryData<WorkflowPayloadTypes>(WORKFLOW_QUERY_KEY)
        expect(nodes).toHaveLength(payload.length + 1)
        expect(nodes?.at(-1)).toMatchObject({ name: 'Note', parentId: 'e879e4', type: 'addComment' })
    })

    it('updates a node in the workflow cache', async () => {
        const { queryClient, mutations } = setup()

        mutations.updateNode.mutate({ ...findNode('e879e4'), name: 'Renamed' })
        await flushPromises()

        expect(queryClient.getQueryData<WorkflowPayloadTypes>(WORKFLOW_QUERY_KEY)?.at(-1)?.name).toBe('Renamed')
    })

    it('deletes a node and its subtree from the workflow cache', async () => {
        const { queryClient, mutations } = setup()

        mutations.deleteNode.mutate('28c4b9')
        await flushPromises()

        const ids = queryClient.getQueryData<WorkflowPayloadTypes>(WORKFLOW_QUERY_KEY)?.map((node) => node.id)
        expect(ids).toEqual([1, 'd09c08', '161f52', 'b0653a'])
    })
})
