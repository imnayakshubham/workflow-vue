import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/flow/drawer/NodeDrawer.vue'
import { awayMessage, comment } from '@/test/fixtures'
import { clickButton, find, mountWithUi, titleField, typeInto } from '@/test/mount'

async function submitForm() {
    find('form').dispatchEvent(new Event('submit'))
    await flushPromises()
}

describe('NodeDrawer', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('emits save with the title and description trimmed', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: comment })

        typeInto(titleField, '  Renamed  ')
        typeInto('textarea[name="description"]', ' Notes ')
        await submitForm()

        expect(drawer.emitted('save')?.[0]?.[0]).toMatchObject({ id: comment.id, name: 'Renamed', description: 'Notes' })
    })

    it('shows the title error and does not emit save when the title is empty', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: comment })

        typeInto(titleField, '')
        await submitForm()

        expect(document.body.textContent).toContain('Title is required')
        expect(drawer.emitted('save')).toBeUndefined()
    })

    it('asks for confirmation and only emits delete after the user confirms', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: awayMessage })

        clickButton('Delete')
        await flushPromises()
        expect(document.body.textContent).toContain(`${awayMessage.name} and every node below it will be removed.`)

        clickButton('Delete')
        await flushPromises()

        expect(drawer.emitted('delete')).toEqual([[awayMessage.id]])
    })

    it('emits close when the close button is clicked', async () => {
        const drawer = await mountWithUi(NodeDrawer, { node: awayMessage })

        clickButton('Close')
        await flushPromises()

        expect(drawer.emitted('close')).toHaveLength(1)
    })
})
