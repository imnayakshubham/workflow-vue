import { describe, expect, it } from 'vitest'
import { findLastLeaf, getDescription, toFlowEdges } from '@/utils/workflow'
import { awayMessage, businessHours, comment, payload, trigger, welcomeMessage } from '@/test/fixtures'

describe('workflow utils', () => {
    it('describes each node from its data unless the user wrote a description', () => {
        expect(getDescription(trigger)).toBe('Conversation Opened')
        expect(getDescription(businessHours)).toBe('Business Hours - UTC')
        expect(getDescription(awayMessage)).toBe('Sorry, we are currently away.')
        expect(getDescription(welcomeMessage)).toBe('396.jpg')
        expect(getDescription({ ...comment, description: 'My note' })).toBe('My note')
    })

    it('connects each node to its parent, without an add button below business hours', () => {
        const edges = toFlowEdges(payload)

        expect(edges).toHaveLength(payload.length - 1)
        expect(edges.find((edge) => edge.id === '1-d09c08')?.type).toBe('add')
        expect(edges.find((edge) => edge.id === 'd09c08-161f52')?.type).toBe('smoothstep')
    })

    it('finds the last node without children', () => {
        expect(findLastLeaf(payload)?.id).toBe('e879e4')
    })
})
