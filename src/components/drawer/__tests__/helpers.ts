import { flushPromises, mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import type { Component } from 'vue'

export async function mountWithUi(component: Component, props: Record<string, unknown>) {
    const wrapper = mount(component, { props, global: { plugins: [ui] }, attachTo: document.body })
    await flushPromises()
    return wrapper
}

export function queryAll<T extends Element>(selector: string) {
    return [...document.body.querySelectorAll<T>(selector)]
}

export function query<T extends Element>(selector: string) {
    const element = document.body.querySelector<T>(selector)
    if (!element) throw new Error(`Missing ${selector}`)
    return element
}

export function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    element.value = value
    element.dispatchEvent(new Event('input'))
}
