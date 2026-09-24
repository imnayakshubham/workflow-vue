import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/flow/drawer/NodeDrawer.vue'
import { awayMessage, comment } from '@/test/fixtures'
import { clickButton, find, mountWithUi, typeInto } from '@/test/mount'

async function submitForm() {
    find('form').dispatchEvent(new Event('submit'))
    await flushPromises()
}

describe('NodeDrawer', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('saves the trimmed title and description', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: comment })

        typeInto('input[name="title"]', '  Renamed  ')
        typeInto('textarea[name="description"]', ' Notes ')
        await submitForm()

        expect(drawer.emitted('save')?.[0]?.[0]).toMatchObject({ id: 'e879e4', name: 'Renamed', description: 'Notes' })
    })

    it('does not save without a title', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: comment })

        typeInto('input[name="title"]', '')
        await submitForm()

        expect(document.body.textContent).toContain('Title is required')
        expect(drawer.emitted('save')).toBeUndefined()
    })

    it('deletes the node after the user confirms', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: awayMessage })

        clickButton('Delete')
        await flushPromises()
        expect(document.body.textContent).toContain('Away Message and every node below it will be removed.')

        clickButton('Delete')
        await flushPromises()

        expect(drawer.emitted('delete')).toEqual([['b6a0c1']])
    })

    it('closes from the close button', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: awayMessage })

        clickButton('Close')
        await flushPromises()

        expect(drawer.emitted('close')).toHaveLength(1)
    })
})
