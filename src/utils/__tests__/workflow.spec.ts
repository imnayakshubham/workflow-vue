import { describe, expect, it } from 'vitest'
import { buildCanvasNodes, buildParentChildEdges, findLastLeaf, getDescription } from '@/utils/workflow'
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
        const edges = buildParentChildEdges(payload)

        expect(edges).toHaveLength(payload.length - 1)
        expect(edges.find((edge) => edge.id === '1-d09c08')?.type).toBe('add')
        expect(edges.find((edge) => edge.id === 'd09c08-161f52')?.type).toBe('smoothstep')
    })

    it('finds the last node without children', () => {
        expect(findLastLeaf(payload)?.id).toBe('e879e4')
    })

    it('orders canvas nodes top-down and left-to-right and keeps connectors out of the tab order', () => {
        const positions = {
            1: { x: 100, y: 0 },
            d09c08: { x: 100, y: 100 },
            '161f52': { x: 0, y: 200 },
            '28c4b9': { x: 200, y: 200 },
            b0653a: { x: 0, y: 300 },
            b6a0c1: { x: 200, y: 300 },
            e879e4: { x: 200, y: 400 },
        }

        const canvasNodes = buildCanvasNodes(payload, positions)

        expect(canvasNodes.map((node) => node.id)).toEqual(['1', 'd09c08', '161f52', '28c4b9', 'b0653a', 'b6a0c1', 'e879e4'])
        expect(canvasNodes.find((node) => node.id === '161f52')?.focusable).toBe(false)
    })
})
