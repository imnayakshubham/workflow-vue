import { describe, expect, it } from 'vitest'
import { getNodeSize, layoutTree } from '@/utils/layout'
import { findNode, payload } from './fixtures'

function centerOf(positions: ReturnType<typeof layoutTree>, id: string | number) {
    const position = positions[String(id)]
    if (!position) throw new Error(`Missing position ${id}`)
    return { x: position.x + getNodeSize(findNode(id)).width / 2, y: position.y }
}

describe('layoutTree', () => {
    const positions = layoutTree(payload)

    it('positions every node', () => {
        expect(Object.keys(positions)).toHaveLength(payload.length)
    })

    it('places children below their parent', () => {
        for (const node of payload) {
            if (node.parentId === -1) continue
            expect(centerOf(positions, node.id).y).toBeGreaterThan(centerOf(positions, node.parentId).y)
        }
    })

    it('centers a parent above its children', () => {
        const success = centerOf(positions, '161f52')
        const failure = centerOf(positions, '28c4b9')

        expect(centerOf(positions, 'd09c08').x).toBe((success.x + failure.x) / 2)
    })

    it('keeps sibling branches apart', () => {
        expect(centerOf(positions, 'b6a0c1').x).toBeGreaterThan(centerOf(positions, 'b0653a').x)
    })
})

describe('layoutTree with measured heights', () => {
    it('places children below the measured height of their parent', () => {
        const positions = layoutTree(payload, { 1: 150 })

        expect(positions['d09c08']?.y).toBe(150 + 72)
    })
})
