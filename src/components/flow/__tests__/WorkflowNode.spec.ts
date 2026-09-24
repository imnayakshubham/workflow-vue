import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkflowNode from '@/components/flow/WorkflowNode.vue'
import ConnectorNode from '@/components/flow/ConnectorNode.vue'
import { findNode } from '@/utils/__tests__/fixtures'

const stubs = { Handle: true }

describe('WorkflowNode', () => {
    it('renders the icon, title and description', () => {
        const wrapper = mount(WorkflowNode, { props: { node: findNode('b6a0c1'), leaf: false }, global: { stubs } })

        expect(wrapper.find('svg').exists()).toBe(true)
        expect(wrapper.find('[data-test="title"]').text()).toBe('Away Message')
        expect(wrapper.find('[data-test="description"]').text()).toBe('Sorry, we are currently away.')
    })

    it('keeps the full description in the title attribute for truncated text', () => {
        const node = { ...findNode('e879e4'), description: 'A very long description '.repeat(10) }
        const wrapper = mount(WorkflowNode, { props: { node, leaf: false }, global: { stubs } })

        expect(wrapper.find('[data-test="description"]').attributes('title')).toBe(node.description)
    })

    it('has no incoming handle on the trigger', () => {
        const trigger = mount(WorkflowNode, { props: { node: findNode(1), leaf: false }, global: { stubs } })
        const message = mount(WorkflowNode, { props: { node: findNode('b6a0c1'), leaf: false }, global: { stubs } })

        expect(trigger.findAll('handle-stub')).toHaveLength(1)
        expect(message.findAll('handle-stub')).toHaveLength(2)
    })
})

describe('WorkflowNode add button', () => {
    it('shows the add button on leaf nodes and emits add', async () => {
        const wrapper = mount(WorkflowNode, { props: { node: findNode('e879e4'), leaf: true }, global: { stubs } })

        expect(wrapper.find('.border-dashed').exists()).toBe(true)
        await wrapper.find('button[aria-label="Add node"]').trigger('click')

        expect(wrapper.emitted('add')).toHaveLength(1)
    })

    it('leaves the add button to the edge when the node has children', () => {
        const wrapper = mount(WorkflowNode, { props: { node: findNode('b6a0c1'), leaf: false }, global: { stubs } })

        expect(wrapper.find('button[aria-label="Add node"]').exists()).toBe(false)
    })

    it('has no add button on business hours', () => {
        const wrapper = mount(WorkflowNode, { props: { node: findNode('d09c08'), leaf: true }, global: { stubs } })

        expect(wrapper.find('button[aria-label="Add node"]').exists()).toBe(false)
    })
})

describe('ConnectorNode', () => {
    it('renders the connector name', () => {
        const node = findNode('161f52')
        if (node.type !== 'dateTimeConnector') throw new Error('Expected a connector')

        const wrapper = mount(ConnectorNode, { props: { node, leaf: false }, global: { stubs } })

        expect(wrapper.text()).toBe('Success')
    })
})
