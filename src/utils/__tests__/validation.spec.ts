import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_SIZE, validateDescription, validateImageFile, validateNodeDraft, validateNodeForm, validateTitle } from '@/utils/validation'
import { findNode } from './fixtures'

describe('validateTitle', () => {
    it('requires a title', () => {
        expect(validateTitle('   ')).toBe('Title is required')
    })

    it('limits the length', () => {
        expect(validateTitle('a'.repeat(51))).toBe('Title must be at most 50 characters')
        expect(validateTitle('a'.repeat(50))).toBeUndefined()
    })
})

describe('validateDescription', () => {
    it('allows an empty description', () => {
        expect(validateDescription('')).toBeUndefined()
    })

    it('limits the length', () => {
        expect(validateDescription('a'.repeat(201))).toBe('Description must be at most 200 characters')
    })
})

describe('validateNodeForm', () => {
    it('returns an error for every invalid field', () => {
        expect(validateNodeForm({ title: '', description: 'a'.repeat(201) })).toEqual([
            { name: 'title', message: 'Title is required' },
            { name: 'description', message: 'Description must be at most 200 characters' },
            { name: 'type', message: 'Type of node is required' },
        ])
    })

    it('passes a valid form', () => {
        expect(validateNodeForm({ title: 'Hello', description: '', type: 'addComment' })).toEqual([])
    })
})

describe('validateImageFile', () => {
    it('accepts small images', () => {
        expect(validateImageFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBeUndefined()
    })

    it('rejects other file types', () => {
        expect(validateImageFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe('Only image files can be attached')
    })

    it('rejects large images', () => {
        const file = new File([new Uint8Array(MAX_IMAGE_SIZE + 1)], 'big.png', { type: 'image/png' })

        expect(validateImageFile(file)).toBe('Images must be 2 MB or smaller')
    })
})

describe('validateNodeDraft', () => {
    it('requires a title', () => {
        expect(validateNodeDraft({ ...findNode('e879e4'), name: ' ' })).toEqual([{ name: 'title', message: 'Title is required' }])
    })

    it('rejects empty message texts', () => {
        const node = findNode('b6a0c1')
        if (node.type !== 'sendMessage') throw new Error('Expected a message')

        const draft = { ...node, data: { payload: [{ type: 'text' as const, text: ' ' }] } }

        expect(validateNodeDraft(draft)).toEqual([{ name: 'payload.0', message: 'Message cannot be empty' }])
    })

    it('rejects business hours that end before they start', () => {
        const node = findNode('d09c08')
        if (node.type !== 'dateTime') throw new Error('Expected business hours')

        const draft = { ...node, data: { ...node.data, times: [{ day: 'mon', startTime: '18:00', endTime: '09:00' }] } }

        expect(validateNodeDraft(draft)).toEqual([{ name: 'times.0', message: 'Start time must be before end time' }])
    })

    it('passes a valid node', () => {
        expect(validateNodeDraft(findNode('d09c08'))).toEqual([])
    })
})
