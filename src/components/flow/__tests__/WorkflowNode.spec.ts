import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkflowNode from '@/components/flow/WorkflowNode.vue'
import ConnectorNode from '@/components/flow/ConnectorNode.vue'
import { awayMessage, businessHours, comment, successBranch } from '@/test/fixtures'

const stubs = { Handle: true }

describe('WorkflowNode', () => {
    it('shows the icon, title and description', () => {
        const card = mount(WorkflowNode, { props: { node: awayMessage, leaf: false }, global: { stubs } })

        expect(card.find('svg').exists()).toBe(true)
        expect(card.find('[data-test="title"]').text()).toBe('Away Message')
        expect(card.find('[data-test="description"]').text()).toBe('Sorry, we are currently away.')
    })

    it('shows a dashed line and add button on the last node', async () => {
        const card = mount(WorkflowNode, { props: { node: comment, leaf: true }, global: { stubs } })

        await card.find('button[aria-label="Add node"]').trigger('click')

        expect(card.find('.border-dashed').exists()).toBe(true)
        expect(card.emitted('add')).toHaveLength(1)
    })

    it('never shows an add button on business hours', () => {
        const card = mount(WorkflowNode, { props: { node: businessHours, leaf: true }, global: { stubs } })

        expect(card.find('button[aria-label="Add node"]').exists()).toBe(false)
    })
})

describe('ConnectorNode', () => {
    it('shows the branch name', () => {
        const branch = mount(ConnectorNode, { props: { node: successBranch, leaf: false }, global: { stubs } })

        expect(branch.text()).toBe('Success')
    })
})
