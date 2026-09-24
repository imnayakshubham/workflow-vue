import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { XYPosition } from '@vue-flow/core'

export const useEditorStore = defineStore('editor', () => {
    const positions = ref<Record<string, XYPosition>>({})

    function setPosition(id: string, position: XYPosition) {
        positions.value[id] = { ...position }
    }

    return { positions, setPosition }
})
