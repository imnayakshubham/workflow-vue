import { describe, expect, it } from 'vitest'
import { calculateNodePositions } from '@/utils/layout'
import { payload } from '@/test/fixtures'

describe('calculateNodePositions', () => {
    it('places each child below its parent', () => {
        const positions = calculateNodePositions(payload)

        expect(positions['d09c08']?.y).toBeGreaterThan(positions['1']?.y ?? 0)
        expect(positions['b6a0c1']?.y).toBeGreaterThan(positions['28c4b9']?.y ?? 0)
    })

    it('uses the measured card height to place the next row', () => {
        const positions = calculateNodePositions(payload, { 1: 150 })

        expect(positions['d09c08']?.y).toBe(150 + 72)
    })
})
