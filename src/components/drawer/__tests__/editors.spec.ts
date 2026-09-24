import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SendMessageEditor from '@/components/drawer/SendMessageEditor.vue'
import CommentEditor from '@/components/drawer/CommentEditor.vue'
import BusinessHoursEditor from '@/components/drawer/BusinessHoursEditor.vue'
import { mountWithUi, query, queryAll, type } from './helpers'

const message = {
    payload: [
        { type: 'text' as const, text: 'Hello' },
        { type: 'attachment' as const, attachment: 'https://example.com/a.png' },
    ],
}

function lastUpdate(wrapper: Awaited<ReturnType<typeof mountWithUi>>) {
    return wrapper.emitted('update:modelValue')?.at(-1)?.[0]
}

describe('SendMessageEditor', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('shows attachments as tiles and texts as fields', async () => {
        await mountWithUi(SendMessageEditor, { modelValue: message })

        expect(query<HTMLImageElement>('img').src).toBe('https://example.com/a.png')
        expect(query<HTMLTextAreaElement>('textarea').value).toBe('Hello')
    })

    it('updates a text', async () => {
        const wrapper = await mountWithUi(SendMessageEditor, { modelValue: message })

        type(query<HTMLTextAreaElement>('textarea'), 'Hi')

        expect(lastUpdate(wrapper)).toEqual({ payload: [{ type: 'text', text: 'Hi' }, message.payload[1]] })
    })

    it('removes a text', async () => {
        const wrapper = await mountWithUi(SendMessageEditor, { modelValue: message })

        query<HTMLButtonElement>('button[aria-label="Remove message"]').click()

        expect(lastUpdate(wrapper)).toEqual({ payload: [message.payload[1]] })
    })

    it('removes an attachment', async () => {
        const wrapper = await mountWithUi(SendMessageEditor, { modelValue: message })

        query<HTMLButtonElement>('button[aria-label="Remove attachment"]').click()

        expect(lastUpdate(wrapper)).toEqual({ payload: [message.payload[0]] })
    })

    it('adds an empty text', async () => {
        const wrapper = await mountWithUi(SendMessageEditor, { modelValue: message })

        queryAll<HTMLButtonElement>('button').find((item) => item.textContent?.includes('Add message'))?.click()

        expect(lastUpdate(wrapper)).toEqual({ payload: [...message.payload, { type: 'text', text: '' }] })
    })

    it('uploads images and rejects other files', async () => {
        const wrapper = await mountWithUi(SendMessageEditor, { modelValue: message })
        const input = query<HTMLInputElement>('input[type="file"]')

        Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.pdf', { type: 'application/pdf' })], configurable: true })
        input.dispatchEvent(new Event('change'))
        await flushPromises()
        expect(document.body.textContent).toContain('Only image files can be attached')

        Object.defineProperty(input, 'files', { value: [new File(['x'], 'b.png', { type: 'image/png' })], configurable: true })
        input.dispatchEvent(new Event('change'))

        await vi.waitFor(() => expect(lastUpdate(wrapper)).toEqual({
            payload: [...message.payload, { type: 'attachment', attachment: 'data:image/png;base64,eA==' }],
        }))
    })
})

describe('CommentEditor', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('updates and removes the comment', async () => {
        const wrapper = await mountWithUi(CommentEditor, { modelValue: { comment: 'Note' } })

        type(query<HTMLTextAreaElement>('textarea'), 'Updated')
        expect(lastUpdate(wrapper)).toEqual({ comment: 'Updated' })

        query<HTMLButtonElement>('button[aria-label="Remove comment"]').click()
        expect(lastUpdate(wrapper)).toEqual({ comment: '' })
    })
})

describe('BusinessHoursEditor', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('shows a row for every day and the timezone', async () => {
        const times = ['mon', 'tue'].map((day) => ({ day, startTime: '09:00', endTime: '17:00' }))
        await mountWithUi(BusinessHoursEditor, { modelValue: { times, timezone: 'UTC' } })

        expect(document.body.textContent).toContain('Mon')
        expect(document.body.textContent).toContain('Tue')
        expect(document.body.textContent).toContain('UTC')
        expect(queryAll('[aria-label$="start time"]')).toHaveLength(2)
    })
})
