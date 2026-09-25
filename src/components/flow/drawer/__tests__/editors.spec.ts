import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import SendMessageEditor from '@/components/flow/drawer/SendMessageEditor.vue'
import CommentEditor from '@/components/flow/drawer/CommentEditor.vue'
import BusinessHoursEditor from '@/components/flow/drawer/BusinessHoursEditor.vue'
import { clickButton, find, mountWithUi, typeInto } from '@/test/mount'

const greeting = { type: 'text' as const, text: 'Hello' }
const photo = { type: 'attachment' as const, attachment: 'https://example.com/photo.png' }
const message = { payload: [greeting, photo] }

function lastUpdate(editor: VueWrapper) {
    return editor.emitted('update:modelValue')?.at(-1)
}

function chooseFiles(files: File[]) {
    const input = find('input[type="file"]')
    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change'))
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('SendMessageEditor', () => {
    it('emits the payload with the new text when a text is edited', async () => {
        const editor = await mountWithUi(SendMessageEditor, { modelValue: message })

        typeInto('textarea', 'Hi')

        expect(lastUpdate(editor)).toEqual([{ payload: [{ type: 'text', text: 'Hi' }, photo] }])
    })

    it('emits the payload without the attachment when it is removed', async () => {
        const editor = await mountWithUi(SendMessageEditor, { modelValue: message })

        clickButton('Remove attachment')

        expect(lastUpdate(editor)).toEqual([{ payload: [greeting] }])
    })

    it('shows an error and emits nothing when the chosen file is not an image', async () => {
        const editor = await mountWithUi(SendMessageEditor, { modelValue: message })

        chooseFiles([new File(['x'], 'document.pdf', { type: 'application/pdf' })])
        await flushPromises()

        expect(document.body.textContent).toContain('Only image files can be attached')
        expect(editor.emitted('update:modelValue')).toBeUndefined()
    })

    it('reads a chosen image as a data URL and adds it as a new attachment', async () => {
        const editor = await mountWithUi(SendMessageEditor, { modelValue: message })

        chooseFiles([new File(['x'], 'new.png', { type: 'image/png' })])

        const uploaded = { type: 'attachment', attachment: 'data:image/png;base64,eA==' }
        await vi.waitFor(() => {
            expect(lastUpdate(editor)).toEqual([{ payload: [greeting, photo, uploaded] }])
        })
    })
})

describe('CommentEditor', () => {
    it('emits an empty comment when the remove button is clicked', async () => {
        const editor = await mountWithUi(CommentEditor, { modelValue: { comment: 'Note' } })

        clickButton('Remove comment')

        expect(lastUpdate(editor)).toEqual([{ comment: '' }])
    })
})

describe('BusinessHoursEditor', () => {
    it('shows a start and end time for every day and the current time zone', async () => {
        const times = [
            { day: 'mon', startTime: '09:00', endTime: '17:00' },
            { day: 'tue', startTime: '09:00', endTime: '17:00' },
        ]

        await mountWithUi(BusinessHoursEditor, {
            modelValue: { times, connectors: [], timezone: 'UTC', action: 'businessHours' },
        })

        expect(document.body.textContent).toContain('Mon')
        expect(document.body.textContent).toContain('Tue')
        expect(document.body.textContent).toContain('(GMT+00:00) UTC')
        expect(document.body.querySelectorAll('[aria-label$="start time"]')).toHaveLength(2)
    })
})
