import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import ui from '@nuxt/ui/vue-plugin'
import App from '@/App.vue'
import { useWorkflowStore } from '@/stores/workflow'
import FlowView from '@/views/FlowView.vue'
import { WORKFLOW_QUERY_KEY } from '@/composables/useWorkflow'
import { awayMessage, comment, payload, trigger } from '@/test/fixtures'
import { clickButton, find, titleField } from '@/test/mount'

const FlowCanvas = { name: 'FlowCanvas', props: ['selectedId'], emits: ['select', 'add', 'close'], template: '<div />' }

async function renderAt(path: string) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: FlowView },
            { path: '/nodes/:id', component: FlowView },
        ],
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(WORKFLOW_QUERY_KEY, payload)

    await router.push(path)
    const app = mount(App, {
        global: {
            plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }], ui],
            stubs: { FlowCanvas },
        },
        attachTo: document.body,
    })
    await flushPromises()

    const canvas = app.findComponent(FlowCanvas)
    const store = useWorkflowStore()
    return { router, canvas, store }
}

function pressUndo(target: EventTarget, modifiers: Partial<KeyboardEventInit> = { metaKey: true }) {
    const event = new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true, ...modifiers })
    target.dispatchEvent(event)
    return event
}

describe('FlowView', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('opens the drawer for the node in the URL when the page loads on a node link', async () => {
        const { canvas } = await renderAt(`/nodes/${awayMessage.id}`)

        expect(canvas.props('selectedId')).toBe(awayMessage.id)
        expect(document.body.querySelector<HTMLInputElement>(titleField)?.value).toBe('Away Message')
    })

    it('puts the node in the URL when it is selected and goes back to the canvas when it is deselected', async () => {
        const { router, canvas } = await renderAt('/')

        canvas.vm.$emit('select', awayMessage.id)
        await flushPromises()
        expect(router.currentRoute.value.path).toBe(`/nodes/${awayMessage.id}`)

        canvas.vm.$emit('close')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/')
    })

    it('redirects to the canvas when the URL points to a node that does not exist', async () => {
        const { router } = await renderAt('/nodes/missing')

        expect(router.currentRoute.value.path).toBe('/')
    })

    it('undoes with Cmd or Ctrl+Z and redoes when Shift is held as well', async () => {
        const { store } = await renderAt('/')
        store.removeNode(trigger.id)

        expect(pressUndo(document).defaultPrevented).toBe(true)
        expect(store.nodes).toEqual(payload)

        pressUndo(document, { metaKey: true, shiftKey: true })
        expect(store.nodes).toEqual([])

        pressUndo(document, { ctrlKey: true })
        expect(store.nodes).toEqual(payload)
    })

    it('closes the drawer and goes back to the canvas when undo removes the node that is open', async () => {
        const { router, store } = await renderAt('/')
        store.addNode({ title: 'Note', description: '', type: 'addComment' }, comment.id)
        await router.push(`/nodes/${store.nodes.at(-1)?.id}`)
        await flushPromises()

        pressUndo(document)
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/')
    })

    it('does not undo while the user is typing in a text field, so the browser can undo the typing instead', async () => {
        const { store } = await renderAt(`/nodes/${awayMessage.id}`)
        store.removeNode(trigger.id)

        const event = pressUndo(find(titleField))

        expect(event.defaultPrevented).toBe(false)
        expect(store.nodes).toEqual([])
    })

    it('keeps the undo button disabled until there is a change, then undoes that change on click', async () => {
        const { store } = await renderAt('/')
        expect(find('button[aria-label="Undo"]')).toHaveProperty('disabled', true)

        store.removeNode(trigger.id)
        await flushPromises()
        clickButton('Undo')

        expect(store.nodes).toEqual(payload)
    })

    it('shows the Create New Node button on a loaded workflow and opens the form when it is clicked', async () => {
        await renderAt('/')

        clickButton('Create New Node')
        await flushPromises()

        expect(find(titleField)).toBeTruthy()
    })

    it('goes back to the canvas and closes the drawer after the node is saved', async () => {
        const { router } = await renderAt(`/nodes/${awayMessage.id}`)

        clickButton('Save')
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/')
    })

})
