import { describe, expect, it } from 'vitest'
import { formatTimezone, fromTime, toTime } from '@/utils/time'

describe('time helpers', () => {
    it('converts HH:mm to a time and back', () => {
        const time = toTime('09:05')

        expect(time.hour).toBe(9)
        expect(time.minute).toBe(5)
        expect(fromTime(time)).toBe('09:05')
    })
})

describe('formatTimezone', () => {
    it('shows the GMT offset before the zone', () => {
        expect(formatTimezone('UTC')).toBe('(GMT+00:00) UTC')
        expect(formatTimezone('Asia/Kolkata')).toBe('(GMT+05:30) Asia/Kolkata')
    })
})
