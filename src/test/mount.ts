import { flushPromises, mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import type { Component } from 'vue'

export async function mountWithUi(component: Component, props: Record<string, unknown> = {}) {
    const wrapper = mount(component, { props, global: { plugins: [ui] }, attachTo: document.body })
    await flushPromises()
    return wrapper
}

export function find(selector: string) {
    const element = document.body.querySelector(selector)
    if (!element) throw new Error(`Could not find ${selector}`)
    return element as HTMLElement
}

export function typeInto(selector: string, text: string) {
    const field = find(selector) as HTMLInputElement
    field.value = text
    field.dispatchEvent(new Event('input'))
}

export function clickButton(label: string) {
    const matchingButtons = [...document.body.querySelectorAll('button')].filter((button) =>
        button.textContent?.trim() === label || button.getAttribute('aria-label') === label,
    )
    const topmostButton = matchingButtons.at(-1)
    if (!topmostButton) throw new Error(`Could not find the "${label}" button`)
    topmostButton.click()
}
