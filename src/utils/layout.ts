import type { XYPosition } from '@vue-flow/core'
import type { WorkflowNodeTypes } from '@/types/workflow'

const COLUMN_WIDTH = 260
const ROW_GAP = 72

export function getNodeSize(node: WorkflowNodeTypes) {
    return node.type === 'dateTimeConnector'
        ? { width: 64, height: 20 }
        : { width: 220, height: 80 }
}

export function layoutTree(nodes: WorkflowNodeTypes[], heights: Record<string, number> = {}) {
    const ids = new Set(nodes.map((node) => String(node.id)))
    const children = new Map<string, WorkflowNodeTypes[]>()

    for (const node of nodes) {
        const key = String(node.parentId)
        children.set(key, [...(children.get(key) ?? []), node])
    }

    const positions: Record<string, XYPosition> = {}
    let nextColumn = 0

    function place(node: WorkflowNodeTypes, y: number): number {
        const { width, height: defaultHeight } = getNodeSize(node)
        const height = heights[String(node.id)] ?? defaultHeight
        const centers = (children.get(String(node.id)) ?? []).map((child) => place(child, y + height + ROW_GAP))
        const first = centers[0]
        const last = centers.at(-1)
        const center = first !== undefined && last !== undefined
            ? (first + last) / 2
            : nextColumn++ * COLUMN_WIDTH

        positions[String(node.id)] = { x: center - width / 2, y }
        return center
    }

    nodes
        .filter((node) => !ids.has(String(node.parentId)))
        .forEach((root) => place(root, 0))

    return positions
}
