import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import CreateNodeModal from '@/components/CreateNodeModal.vue'

function mountModal() {
    return mount(CreateNodeModal, {
        props: { open: true },
        global: { plugins: [ui] },
        attachTo: document.body,
    })
}

function query<T extends Element>(selector: string) {
    const element = document.body.querySelector<T>(selector)
    if (!element) throw new Error(`Missing ${selector}`)
    return element
}

describe('CreateNodeModal', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('shows errors and does not create when the form is invalid', async () => {
        const wrapper = mountModal()
        await flushPromises()

        query<HTMLFormElement>('form').dispatchEvent(new Event('submit'))
        await flushPromises()

        expect(document.body.textContent).toContain('Title is required')
        expect(document.body.textContent).toContain('Type of node is required')
        expect(wrapper.emitted('create')).toBeUndefined()
    })

    it('emits the form when it is valid', async () => {
        const wrapper = mountModal()
        await flushPromises()

        const title = query<HTMLInputElement>('input[name="title"]')
        title.value = 'Welcome'
        title.dispatchEvent(new Event('input'))

        query<HTMLButtonElement>('button[role="combobox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await flushPromises()
        const option = [...document.body.querySelectorAll('[role="option"]')].find((item) => item.textContent?.includes('Add Comments'))
        option?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
        await flushPromises()

        query<HTMLFormElement>('form').dispatchEvent(new Event('submit'))
        await flushPromises()

        expect(wrapper.emitted('create')).toEqual([[{ title: 'Welcome', description: '', type: 'addComment' }]])
        expect(wrapper.emitted('update:open')).toEqual([[false]])
    })
})
