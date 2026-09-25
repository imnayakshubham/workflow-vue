import { describe, expect, it } from 'vitest'
import { buildCanvasNodes, buildParentChildEdges, findLastLeaf, getDescription } from '@/utils/workflow'
import { awayMessage, businessHours, comment, failureBranch, payload, successBranch, trigger, welcomeMessage } from '@/test/fixtures'

describe('workflow utils', () => {
    it('builds a description from the node data unless the user wrote one', () => {
        expect(getDescription(trigger)).toBe('Conversation Opened')
        expect(getDescription(businessHours)).toBe('Business Hours - UTC')
        expect(getDescription(awayMessage)).toBe('Sorry, we are currently away.')
        expect(getDescription(welcomeMessage)).toBe('396.jpg')
        expect(getDescription({ ...comment, description: 'My note' })).toBe('My note')
    })

    it('draws a line from every node to its parent, with an add button on every line except below business hours', () => {
        const edges = buildParentChildEdges(payload)

        expect(edges).toHaveLength(payload.length - 1)
        expect(edges.find((edge) => edge.id === `${trigger.id}-${businessHours.id}`)?.type).toBe('add')
        expect(edges.find((edge) => edge.id === `${businessHours.id}-${successBranch.id}`)?.type).toBe('smoothstep')
    })

    it('finds the last node without children as the place to add a new node', () => {
        expect(findLastLeaf(payload)?.id).toBe(comment.id)
    })

    it('orders the canvas nodes top-down then left-to-right and keeps connectors out of the Tab order', () => {
        const topDown = [trigger, businessHours, successBranch, failureBranch, welcomeMessage, awayMessage, comment]
        const positions = {
            [trigger.id]: { x: 100, y: 0 },
            [businessHours.id]: { x: 100, y: 100 },
            [successBranch.id]: { x: 0, y: 200 },
            [failureBranch.id]: { x: 200, y: 200 },
            [welcomeMessage.id]: { x: 0, y: 300 },
            [awayMessage.id]: { x: 200, y: 300 },
            [comment.id]: { x: 200, y: 400 },
        }

        const canvasNodes = buildCanvasNodes(payload, positions)

        expect(canvasNodes.map((node) => node.id)).toEqual(topDown.map((node) => String(node.id)))
        expect(canvasNodes.find((node) => node.id === successBranch.id)?.focusable).toBe(false)
    })
})
