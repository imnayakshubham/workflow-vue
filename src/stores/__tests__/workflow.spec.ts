import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { comment, failureBranch, payload } from '@/test/fixtures'

function setup() {
    setActivePinia(createPinia())
    const store = useWorkflowStore()
    store.nodes = payload
    return store
}

describe('undo and redo in the workflow store', () => {
    let store: ReturnType<typeof setup>

    beforeEach(() => {
        store = setup()
    })

    it('has nothing to undo or redo right after loading, and undo and redo do nothing', () => {
        expect(store.canUndo).toBe(false)
        expect(store.canRedo).toBe(false)
        store.undo()
        store.redo()
        expect(store.nodes).toEqual(payload)
    })

    it('undoes a delete and a move one step at a time, then redoes them in the same order', () => {
        store.removeNode(failureBranch.id)
        const nodesAfterRemove = store.nodes
        store.moveNodes([{ id: String(comment.id), position: { x: 10, y: 20 } }])

        store.undo()
        expect(store.nodes).toEqual(nodesAfterRemove)
        expect(store.positions).toEqual({})

        store.undo()
        expect(store.nodes).toEqual(payload)
        expect(store.canUndo).toBe(false)
        expect(store.canRedo).toBe(true)

        store.redo()
        store.redo()
        expect(store.nodes).toEqual(nodesAfterRemove)
        expect(store.positions).toEqual({ [comment.id]: { x: 10, y: 20 } })
        expect(store.canRedo).toBe(false)
    })

    it('forgets the redo history as soon as a new change is made after an undo', () => {
        store.removeNode(failureBranch.id)
        store.undo()

        store.updateNode({ ...comment, name: 'Renamed' })

        expect(store.canRedo).toBe(false)
    })

    it('rolls back the last change and leaves nothing to undo or redo', () => {
        store.removeNode(failureBranch.id)

        store.rollback()

        expect(store.nodes).toEqual(payload)
        expect(store.canUndo).toBe(false)
        expect(store.canRedo).toBe(false)
    })
})
