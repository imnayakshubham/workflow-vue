import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { findNode } from '@/utils/__tests__/fixtures'
import { mountWithUi, query, queryAll, type } from './helpers'

function clickButton(label: string) {
    const button = queryAll<HTMLButtonElement>('button').find((item) => item.textContent?.trim() === label)
    if (!button) throw new Error(`Missing button ${label}`)
    button.click()
}

describe('NodeDrawer', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('is closed without a node', async () => {
        await mountWithUi(NodeDrawer, { node: undefined })

        expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    })

    it('shows the editable title and description of the node', async () => {
        await mountWithUi(NodeDrawer, { node: findNode(1) })

        expect(query<HTMLInputElement>('input[name="title"]').value).toBe('Trigger')
        expect(query<HTMLTextAreaElement>('textarea[name="description"]').placeholder).toBe('Conversation Opened')
    })

    it('saves the trimmed title and description', async () => {
        const wrapper = await mountWithUi(NodeDrawer, { node: findNode('e879e4') })

        type(query<HTMLInputElement>('input[name="title"]'), '  Renamed  ')
        type(query<HTMLTextAreaElement>('textarea[name="description"]'), ' Notes ')
        query<HTMLFormElement>('form').dispatchEvent(new Event('submit'))
        await flushPromises()

        expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ id: 'e879e4', name: 'Renamed', description: 'Notes' })
    })

    it('does not save an empty title', async () => {
        const wrapper = await mountWithUi(NodeDrawer, { node: findNode('e879e4') })

        type(query<HTMLInputElement>('input[name="title"]'), '')
        query<HTMLFormElement>('form').dispatchEvent(new Event('submit'))
        await flushPromises()

        expect(document.body.textContent).toContain('Title is required')
        expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('deletes the node after confirmation', async () => {
        const wrapper = await mountWithUi(NodeDrawer, { node: findNode('b6a0c1') })

        clickButton('Delete')
        await flushPromises()
        expect(document.body.textContent).toContain('Away Message and every node below it will be removed.')

        const buttons = queryAll<HTMLButtonElement>('button').filter((item) => item.textContent?.trim() === 'Delete')
        buttons.at(-1)?.click()
        await flushPromises()

        expect(wrapper.emitted('delete')).toEqual([['b6a0c1']])
    })

    it('keeps save and delete in the footer', async () => {
        await mountWithUi(NodeDrawer, { node: findNode('b6a0c1') })

        const footer = query('[data-slot="footer"]')
        expect(footer.textContent).toContain('Delete')
        expect(footer.querySelector('button[type="submit"]')?.getAttribute('form')).toBe('node-form')
    })

    it('emits close from the close button', async () => {
        const wrapper = await mountWithUi(NodeDrawer, { node: findNode('b6a0c1') })

        query<HTMLButtonElement>('button[aria-label="Close"]').click()
        await flushPromises()

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})
