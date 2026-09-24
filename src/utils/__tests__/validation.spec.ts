import { describe, expect, it } from 'vitest'
import { validateImageFile, validateNodeDraft, validateNodeForm } from '@/utils/validation'
import { businessHours } from '@/test/fixtures'

describe('validation', () => {
    it('lists an error for every invalid field in the create form', () => {
        const errors = validateNodeForm({ title: '', description: 'a'.repeat(201) })

        expect(errors).toEqual([
            { name: 'title', message: 'Title is required' },
            { name: 'description', message: 'Description must be at most 200 characters' },
            { name: 'type', message: 'Type of node is required' },
        ])
    })

    it('only accepts image files for attachments', () => {
        const image = new File(['x'], 'photo.png', { type: 'image/png' })
        const pdf = new File(['x'], 'document.pdf', { type: 'application/pdf' })

        expect(validateImageFile(image)).toBeUndefined()
        expect(validateImageFile(pdf)).toBe('Only image files can be attached')
    })

    it('does not allow business hours that end before they start', () => {
        const backwardsHours = {
            ...businessHours,
            data: { ...businessHours.data, times: [{ day: 'mon', startTime: '18:00', endTime: '09:00' }] },
        }

        expect(validateNodeDraft(backwardsHours)).toEqual([{ name: 'times.0', message: 'Start time must be before end time' }])
    })
})
