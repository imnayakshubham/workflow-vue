import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkflowNode from '@/components/flow/WorkflowNode.vue'
import ConnectorNode from '@/components/flow/ConnectorNode.vue'
import type { WorkflowNodeTypes } from '@/types/workflow'
import { awayMessage, businessHours, comment, successBranch } from '@/test/fixtures'

const stubs = { Handle: true }
const addButton = 'button[aria-label="Add node"]'

function mountCard(node: WorkflowNodeTypes, leaf: boolean) {
    return mount(WorkflowNode, { props: { node, leaf }, global: { stubs } })
}

describe('WorkflowNode', () => {
    it('shows the node icon, title and description on the card', () => {
        const card = mountCard(awayMessage, false)

        expect(card.find('svg').exists()).toBe(true)
        expect(card.find('[data-test="title"]').text()).toBe(awayMessage.name)
        expect(card.find('[data-test="description"]').text()).toBe('Sorry, we are currently away.')
    })

    it('shows a dashed line and an add button under the last node, and emits add when it is clicked', async () => {
        const card = mountCard(comment, true)

        await card.find(addButton).trigger('click')

        expect(card.find('.border-dashed').exists()).toBe(true)
        expect(card.emitted('add')).toHaveLength(1)
    })

    it('never shows an add button under business hours, even when it is the last node', () => {
        const card = mountCard(businessHours, true)

        expect(card.find(addButton).exists()).toBe(false)
    })
})

describe('ConnectorNode', () => {
    it('shows only the branch name', () => {
        const branch = mount(ConnectorNode, { props: { node: successBranch, leaf: false }, global: { stubs } })

        expect(branch.text()).toBe(successBranch.name)
    })
})
