import type { XYPosition } from '@vue-flow/core'
import type { WorkflowNodeTypes } from '@/types/workflow'

const COLUMN_WIDTH = 260
const ROW_GAP = 72

export function getNodeSize(node: WorkflowNodeTypes) {
    return node.type === 'dateTimeConnector'
        ? { width: 64, height: 20 }
        : { width: 220, height: 80 }
}

export function calculateNodePositions(nodes: WorkflowNodeTypes[], measuredHeights: Record<string, number> = {}) {
    const allIds = new Set(nodes.map((node) => String(node.id)))
    const childrenOf = new Map<string, WorkflowNodeTypes[]>()
    nodes.forEach((node) => {
        const siblings = childrenOf.get(String(node.parentId)) ?? []
        siblings.push(node)
        childrenOf.set(String(node.parentId), siblings)
    })

    const positions: Record<string, XYPosition> = {}
    let nextFreeColumn = 0

    function placeNodeAndChildren(node: WorkflowNodeTypes, y: number): number {
        const { width, height: defaultHeight } = getNodeSize(node)
        const height = measuredHeights[String(node.id)] ?? defaultHeight
        const children = childrenOf.get(String(node.id)) ?? []
        const childRowY = y + height + ROW_GAP
        const childCenters = children.map((child) => placeNodeAndChildren(child, childRowY))

        const firstChildCenter = childCenters[0]
        const lastChildCenter = childCenters.at(-1)
        const centerX = firstChildCenter !== undefined && lastChildCenter !== undefined
            ? (firstChildCenter + lastChildCenter) / 2
            : nextFreeColumn++ * COLUMN_WIDTH

        positions[String(node.id)] = { x: centerX - width / 2, y }
        return centerX
    }

    const rootNodes = nodes.filter((node) => !allIds.has(String(node.parentId)))
    rootNodes.forEach((root) => placeNodeAndChildren(root, 0))

    return positions
}
