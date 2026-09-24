import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import ui from '@nuxt/ui/vue-plugin'
import FlowView from '@/views/FlowView.vue'
import { WORKFLOW_QUERY_KEY } from '@/composables/useWorkflow'
import { payload } from '@/test/fixtures'
import { clickButton } from '@/test/mount'

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
    const app = mount({ template: '<UApp><RouterView /></UApp>' }, {
        global: {
            plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }], ui],
            stubs: { FlowCanvas },
        },
        attachTo: document.body,
    })
    await flushPromises()

    const canvas = app.findComponent(FlowCanvas)
    return { router, canvas }
}

describe('FlowView', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('opens the drawer for the node in the url', async () => {
        const { canvas } = await renderAt('/nodes/b6a0c1')

        expect(canvas.props('selectedId')).toBe('b6a0c1')
        expect(document.body.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe('Away Message')
    })

    it('opens the drawer when a node is selected and closes it when it is deselected', async () => {
        const { router, canvas } = await renderAt('/')

        canvas.vm.$emit('select', 'b6a0c1')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/nodes/b6a0c1')

        canvas.vm.$emit('close')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/')
    })

    it('goes back to the canvas for an unknown node', async () => {
        const { router } = await renderAt('/nodes/missing')

        expect(router.currentRoute.value.path).toBe('/')
    })

    it('closes the drawer after saving', async () => {
        const { router } = await renderAt('/nodes/b6a0c1')

        clickButton('Save')
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/')
    })

})
