import { afterEach, describe, expect, it, vi } from 'vitest'
import { getWorkflow } from '@/api/workflow.api'

describe('getWorkflow', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('returns the payload', async () => {
        const payload = [{ id: 1, parentId: -1, type: 'trigger', data: { type: 'conversationOpened', oncePerContact: false } }]
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }))

        await expect(getWorkflow()).resolves.toEqual(payload)
    })

    it('throws when the request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

        await expect(getWorkflow()).rejects.toThrow('Failed to fetch workflow: 500')
    })
})
