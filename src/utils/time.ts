import { Time } from '@internationalized/date'

export function toTime(value: string) {
    const [hour = 0, minute = 0] = value.split(':').map(Number)
    return new Time(hour, minute)
}

export function fromTime({ hour, minute }: { hour: number, minute: number }) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatTimezone(timeZone: string) {
    const offset = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
        .formatToParts()
        .find((part) => part.type === 'timeZoneName')?.value

    return `(${!offset || offset === 'GMT' ? 'GMT+00:00' : offset}) ${timeZone}`
}
