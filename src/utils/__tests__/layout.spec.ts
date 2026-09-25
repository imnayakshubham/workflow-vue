import { describe, expect, it } from 'vitest'
import { calculateNodePositions } from '@/utils/layout'
import { awayMessage, businessHours, failureBranch, payload, trigger } from '@/test/fixtures'

describe('calculateNodePositions', () => {
    it('puts every child in a row below its parent', () => {
        const positions = calculateNodePositions(payload)

        expect(positions[businessHours.id]?.y).toBeGreaterThan(positions[String(trigger.id)]?.y ?? 0)
        expect(positions[awayMessage.id]?.y).toBeGreaterThan(positions[failureBranch.id]?.y ?? 0)
    })

    it('starts the next row below the measured height of the card above it', () => {
        const positions = calculateNodePositions(payload, { [trigger.id]: 150 })

        expect(positions[businessHours.id]?.y).toBe(150 + 72)
    })
})
