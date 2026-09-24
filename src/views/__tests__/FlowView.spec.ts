import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import ui from '@nuxt/ui/vue-plugin'
import FlowView from '@/views/FlowView.vue'
import { WORKFLOW_QUERY_KEY } from '@/composables/useWorkflow'
import { payload } from '@/utils/__tests__/fixtures'

const FlowCanvasStub = defineComponent({
    name: 'FlowCanvas',
    props: ['nodes', 'selectedId'],
    emits: ['select', 'add'],
    template: '<div data-test="canvas" />',
})

async function setup(path: string) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', name: 'flow', component: FlowView },
            { path: '/nodes/:id', name: 'node', component: FlowView },
        ],
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(WORKFLOW_QUERY_KEY, payload)

    await router.push(path)
    const wrapper = mount({ template: '<UApp><RouterView /></UApp>' }, {
        global: {
            plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }], ui],
            stubs: { FlowCanvas: FlowCanvasStub },
        },
        attachTo: document.body,
    })
    await flushPromises()

    return { router, wrapper, canvas: () => wrapper.findComponent(FlowCanvasStub) }
}

describe('FlowView', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('opens the drawer for the node in the url', async () => {
        const { canvas } = await setup('/nodes/b6a0c1')

        expect(canvas().props('selectedId')).toBe('b6a0c1')
        expect(document.body.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe('Away Message')
    })

    it('toggles the drawer when a node is clicked', async () => {
        const { router, canvas } = await setup('/')

        canvas().vm.$emit('select', 'b6a0c1')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/nodes/b6a0c1')

        canvas().vm.$emit('select', 'b6a0c1')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/')
    })

    it('redirects unknown and connector ids to the canvas', async () => {
        const unknown = await setup('/nodes/missing')
        expect(unknown.router.currentRoute.value.path).toBe('/')
        document.body.innerHTML = ''

        const connector = await setup('/nodes/161f52')
        expect(connector.router.currentRoute.value.path).toBe('/')
    })

    it('closes the drawer after saving', async () => {
        const { router } = await setup('/nodes/b6a0c1')

        document.body.querySelector<HTMLButtonElement>('button[form="node-form"]')?.click()
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/')
    })

    it('closes the drawer after deleting', async () => {
        const { router } = await setup('/nodes/b6a0c1')

        const buttons = () => [...document.body.querySelectorAll<HTMLButtonElement>('button')].filter((item) => item.textContent?.trim() === 'Delete')
        buttons()[0]?.click()
        await flushPromises()
        buttons().at(-1)?.click()
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/')
    })
})
