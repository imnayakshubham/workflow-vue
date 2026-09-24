import type { Edge, Node, XYPosition } from '@vue-flow/core'
import type { WorkflowId, WorkflowNodeTypes } from '@/types/workflow'

const DEFAULT_TITLES: Record<WorkflowNodeTypes['type'], string> = {
    trigger: 'Trigger',
    sendMessage: 'Send Message',
    dateTime: 'Business Hours',
    dateTimeConnector: 'Connector',
    addComment: 'Add Comment',
}

export const NODE_ICONS: Record<WorkflowNodeTypes['type'], string> = {
    trigger: 'i-lucide-zap',
    sendMessage: 'i-lucide-send',
    dateTime: 'i-lucide-calendar-clock',
    dateTimeConnector: 'i-lucide-git-branch',
    addComment: 'i-lucide-message-square-text',
}

export const NODE_SUMMARIES: Record<WorkflowNodeTypes['type'], string> = {
    trigger: 'Starts the workflow when the selected event happens.',
    sendMessage: 'Sends texts and attachments to the contact.',
    dateTime: 'Allows a branch to be created based on date & time conditions. Use it to set business hours or date range conditions.',
    dateTimeConnector: '',
    addComment: 'Adds an internal comment to the conversation.',
}

export const LEAF_COLOR = '#9ca3af'

export const NODE_COLORS: Record<WorkflowNodeTypes['type'], string> = {
    trigger: '#e5487a',
    sendMessage: '#14a38b',
    dateTime: '#f07c3a',
    dateTimeConnector: '#f07c3a',
    addComment: '#4f7cf0',
}

export function toTitleCase(value: string) {
    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (letter) => letter.toUpperCase())
}

export function getFileName(url: string) {
    return url.split('?')[0]?.split('/').pop() ?? url
}

export function findNode(nodes: WorkflowNodeTypes[], id: WorkflowId) {
    return nodes.find((node) => String(node.id) === String(id))
}

export function collectParentIds(nodes: WorkflowNodeTypes[]) {
    return new Set(nodes.map((node) => node.parentId))
}

export function canAddAfter(node: WorkflowNodeTypes) {
    return node.type !== 'dateTime'
}

export function getTitle(node: WorkflowNodeTypes) {
    return node.name || DEFAULT_TITLES[node.type]
}

export function getDescription(node: WorkflowNodeTypes) {
    if (node.description) return node.description

    switch (node.type) {
        case 'trigger':
            return toTitleCase(node.data.type)
        case 'dateTime':
            return `Business Hours - ${node.data.timezone}`
        case 'addComment':
            return node.data.comment
        case 'sendMessage': {
            const firstItem = node.data.payload[0]
            if (!firstItem) return ''
            return firstItem.type === 'text' ? firstItem.text : getFileName(firstItem.attachment)
        }
        default:
            return ''
    }
}

export function buildCanvasNodes(nodes: WorkflowNodeTypes[], positions: Record<string, XYPosition>, selectedId?: WorkflowId): Node<WorkflowNodeTypes>[] {
    const canvasNodes = nodes.map((node) => {
        const isConnector = node.type === 'dateTimeConnector'

        return {
            id: String(node.id),
            type: isConnector ? 'connector' : 'workflow',
            position: positions[String(node.id)] ?? { x: 0, y: 0 },
            data: node,
            selectable: !isConnector,
            draggable: !isConnector,
            focusable: !isConnector,
            selected: selectedId !== undefined && String(node.id) === String(selectedId),
        }
    })

    return canvasNodes.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
}

export function buildParentChildEdges(nodes: WorkflowNodeTypes[]): Edge[] {
    const nodesById = new Map(nodes.map((node) => [String(node.id), node]))

    return nodes.flatMap((node) => {
        const parent = nodesById.get(String(node.parentId))
        if (!parent) return []

        const color = NODE_COLORS[parent.type]
        return [{
            id: `${parent.id}-${node.id}`,
            source: String(parent.id),
            target: String(node.id),
            type: canAddAfter(parent) ? 'add' : 'smoothstep',
            data: { color },
            style: { stroke: color, strokeWidth: 1.5 },
        }]
    })
}

export function findLastLeaf(nodes: WorkflowNodeTypes[]) {
    const parentIds = collectParentIds(nodes)
    return nodes.filter((node) => !parentIds.has(node.id) && canAddAfter(node)).at(-1)
}

export function cloneNode(node: WorkflowNodeTypes): WorkflowNodeTypes {
    return JSON.parse(JSON.stringify(node))
}
