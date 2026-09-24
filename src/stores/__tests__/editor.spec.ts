import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from '@/stores/editor'

describe('editor store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('stores a copy of the dragged position', () => {
        const editor = useEditorStore()
        const position = { x: 5, y: 10 }

        editor.setPosition('1', position)
        position.x = 99

        expect(editor.positions['1']).toEqual({ x: 5, y: 10 })
    })
})
