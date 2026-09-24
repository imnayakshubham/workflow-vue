import { describe, expect, it } from 'vitest'
import { canAddAfter, createNodes, findLastLeaf, findNodeById, removeSubtree, replaceNode, getDescription, getFileName, getTitle, insertNodes, toFlowEdges, toFlowNodes, toTitleCase } from '@/utils/workflow'
import { findNode, payload } from './fixtures'

describe('toTitleCase', () => {
    it('splits camel case into words', () => {
        expect(toTitleCase('conversationOpened')).toBe('Conversation Opened')
    })
})

describe('getFileName', () => {
    it('returns the last path segment without the query', () => {
        expect(getFileName('https://example.com/images/396.jpg?hmac=abc')).toBe('396.jpg')
    })
})

describe('getTitle', () => {
    it('uses the node name', () => {
        expect(getTitle(findNode('b6a0c1'))).toBe('Away Message')
    })

    it('falls back to the type label', () => {
        expect(getTitle(findNode(1))).toBe('Trigger')
    })
})

describe('getDescription', () => {
    it('prefers a custom description', () => {
        expect(getDescription({ ...findNode('e879e4'), description: 'Custom' })).toBe('Custom')
    })

    it('derives a description from each node type', () => {
        expect(getDescription(findNode(1))).toBe('Conversation Opened')
        expect(getDescription(findNode('d09c08'))).toBe('Business Hours - UTC')
        expect(getDescription(findNode('b6a0c1'))).toBe('Sorry, we are currently away.')
        expect(getDescription(findNode('b0653a'))).toBe('396.jpg')
        expect(getDescription(findNode('e879e4'))).toBe('User message during off hours')
        expect(getDescription(findNode('161f52'))).toBe('')
    })
})

describe('toFlowNodes', () => {
    it('maps nodes to vue flow nodes with positions', () => {
        const nodes = toFlowNodes(payload, { 1: { x: 10, y: 20 } })

        expect(nodes).toHaveLength(payload.length)
        expect(nodes[0]).toMatchObject({ id: '1', type: 'workflow', position: { x: 10, y: 20 } })
        expect(nodes.find((node) => node.id === '161f52')?.type).toBe('connector')
        expect(nodes.find((node) => node.id === 'b6a0c1')?.position).toEqual({ x: 0, y: 0 })
    })
})

describe('toFlowEdges', () => {
    it('creates an edge from every parent to its child', () => {
        const edges = toFlowEdges(payload)

        expect(edges).toHaveLength(payload.length - 1)
        expect(edges[0]).toMatchObject({ id: '1-d09c08', source: '1', target: 'd09c08' })
    })

    it('uses the add edge except below business hours', () => {
        const edges = toFlowEdges(payload)

        expect(edges.find((edge) => edge.id === '1-d09c08')?.type).toBe('add')
        expect(edges.find((edge) => edge.id === 'd09c08-161f52')?.type).toBe('smoothstep')
    })

    it('skips nodes whose parent is missing', () => {
        expect(toFlowEdges([findNode('e879e4')])).toEqual([])
    })
})

describe('createNodes', () => {
    it('creates a send message node', () => {
        const [node, ...rest] = createNodes({ title: ' Hi ', description: ' Greets ', type: 'sendMessage' }, 1)

        expect(rest).toEqual([])
        expect(node).toMatchObject({ parentId: 1, name: 'Hi', description: 'Greets', type: 'sendMessage', data: { payload: [] } })
    })

    it('creates a comment node without an empty description', () => {
        const [node] = createNodes({ title: 'Note', description: '  ', type: 'addComment' }, 1)

        expect(node).toMatchObject({ type: 'addComment', data: { comment: '' } })
        expect(node?.description).toBeUndefined()
    })

    it('creates business hours with success and failure connectors', () => {
        const [hours, success, failure] = createNodes({ title: 'Hours', description: '', type: 'businessHours' }, 1)

        expect(hours?.type).toBe('dateTime')
        if (hours?.type !== 'dateTime') return
        expect(hours.data.times).toHaveLength(7)
        expect(hours.data.timezone).toBe('UTC')
        expect(success).toMatchObject({ parentId: hours.id, type: 'dateTimeConnector', data: { connectorType: 'success' } })
        expect(failure).toMatchObject({ parentId: hours.id, type: 'dateTimeConnector', data: { connectorType: 'failure' } })
    })
})

describe('insertNodes', () => {
    it('appends after a leaf', () => {
        const newNodes = createNodes({ title: 'New', description: '', type: 'addComment' }, 'e879e4')
        const result = insertNodes(payload, newNodes, 'e879e4')

        expect(result).toHaveLength(payload.length + 1)
        expect(result.at(-1)?.parentId).toBe('e879e4')
    })

    it('moves the existing children under the new node', () => {
        const newNodes = createNodes({ title: 'New', description: '', type: 'addComment' }, 'b6a0c1')
        const result = insertNodes(payload, newNodes, 'b6a0c1')

        expect(result.find((node) => node.id === 'e879e4')?.parentId).toBe(newNodes[0]?.id)
    })

    it('moves the existing children under the success branch of new business hours', () => {
        const newNodes = createNodes({ title: 'Hours', description: '', type: 'businessHours' }, 1)
        const result = insertNodes(payload, newNodes, 1)

        expect(result.find((node) => node.id === 'd09c08')?.parentId).toBe(newNodes[1]?.id)
        expect(result.filter((node) => node.parentId === 1)).toEqual([newNodes[0]])
    })
})

describe('findLastLeaf', () => {
    it('returns the last node without children', () => {
        expect(findLastLeaf(payload)?.id).toBe('e879e4')
    })

    it('returns undefined for an empty workflow', () => {
        expect(findLastLeaf([])).toBeUndefined()
    })
})

describe('canAddAfter', () => {
    it('does not allow adding directly after business hours', () => {
        expect(canAddAfter(findNode('d09c08'))).toBe(false)
        expect(canAddAfter(findNode('161f52'))).toBe(true)
    })
})

describe('findNodeById', () => {
    it('matches string and number ids from the route', () => {
        expect(findNodeById(payload, '1')?.type).toBe('trigger')
        expect(findNodeById(payload, 'b6a0c1')?.name).toBe('Away Message')
        expect(findNodeById(payload, 'missing')).toBeUndefined()
    })
})

describe('replaceNode', () => {
    it('replaces the node with the same id', () => {
        const result = replaceNode(payload, { ...findNode('e879e4'), name: 'Renamed' })

        expect(result.find((node) => node.id === 'e879e4')?.name).toBe('Renamed')
        expect(result).toHaveLength(payload.length)
    })
})

describe('removeSubtree', () => {
    it('removes the node and everything below it', () => {
        const result = removeSubtree(payload, 'd09c08')

        expect(result.map((node) => node.id)).toEqual([1])
    })

    it('removes a single leaf', () => {
        expect(removeSubtree(payload, 'e879e4')).toHaveLength(payload.length - 1)
    })
})
