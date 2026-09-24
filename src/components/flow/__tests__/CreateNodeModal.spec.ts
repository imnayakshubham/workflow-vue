import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import CreateNodeModal from '@/components/flow/CreateNodeModal.vue'
import { find, mountWithUi, typeInto } from '@/test/mount'

async function chooseType(label: string) {
    find('button[role="combobox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    const options = [...document.body.querySelectorAll('[role="option"]')]
    const option = options.find((element) => element.textContent?.includes(label))
    option?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushPromises()
}

async function submitForm() {
    find('form').dispatchEvent(new Event('submit'))
    await flushPromises()
}

describe('CreateNodeModal', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('shows errors and does not create a node when the form is empty', async () => {
        const modal = await mountWithUi(CreateNodeModal, { open: true })

        await submitForm()

        expect(document.body.textContent).toContain('Title is required')
        expect(document.body.textContent).toContain('Type of node is required')
        expect(modal.emitted('create')).toBeUndefined()
    })

    it('sends the form and closes when it is valid', async () => {
        const modal = await mountWithUi(CreateNodeModal, { open: true })

        typeInto('input[name="title"]', 'Welcome')
        await chooseType('Add Comments')
        await submitForm()

        expect(modal.emitted('create')).toEqual([[{ title: 'Welcome', description: '', type: 'addComment' }]])
        expect(modal.emitted('update:open')).toEqual([[false]])
    })
})
