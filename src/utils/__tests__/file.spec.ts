import { describe, expect, it } from 'vitest'
import { readFileAsDataUrl } from '@/utils/file'

describe('readFileAsDataUrl', () => {
    it('reads a file as a data url', async () => {
        const file = new File(['hi'], 'hi.txt', { type: 'text/plain' })

        await expect(readFileAsDataUrl(file)).resolves.toBe('data:text/plain;base64,aGk=')
    })
})
