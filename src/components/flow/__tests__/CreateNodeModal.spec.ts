import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import CreateNodeModal from '@/components/flow/CreateNodeModal.vue'
import { find, mountWithUi, titleField, typeInto } from '@/test/mount'

Element.prototype.scrollIntoView = () => {}

async function chooseType(label: string) {
    find('button[aria-haspopup="listbox"]').click()
    await flushPromises()

    const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
    options.find((element) => element.textContent?.includes(label))?.click()
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

    it('shows the field errors and does not emit create when the form is submitted empty', async () => {
        const modal = await mountWithUi(CreateNodeModal, { open: true })

        await submitForm()

        expect(document.body.textContent).toContain('Title is required')
        expect(document.body.textContent).toContain('Type of node is required')
        expect(modal.emitted('create')).toBeUndefined()
    })

    it('emits the filled-in form and closes itself when the form is valid', async () => {
        const modal = await mountWithUi(CreateNodeModal, { open: true })

        typeInto(titleField, 'Welcome')
        await chooseType('Add Comments')
        await submitForm()

        expect(modal.emitted('create')).toEqual([[{ title: 'Welcome', description: '', type: 'addComment' }]])
        expect(modal.emitted('update:open')).toEqual([[false]])
    })
})
