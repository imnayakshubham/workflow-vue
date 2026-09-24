import type { Edge, Node, XYPosition } from '@vue-flow/core'
import type { WorkflowId, WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'

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
            const first = node.data.payload[0]
            if (!first) return ''
            return first.type === 'text' ? first.text : getFileName(first.attachment)
        }
        default:
            return ''
    }
}

export function toFlowNodes(nodes: WorkflowNodeTypes[], positions: Record<string, XYPosition>): Node<WorkflowNodeTypes>[] {
    return nodes.map((node) => ({
        id: String(node.id),
        type: node.type === 'dateTimeConnector' ? 'connector' : 'workflow',
        position: positions[String(node.id)] ?? { x: 0, y: 0 },
        data: node,
    }))
}

export function toFlowEdges(nodes: WorkflowNodeTypes[]): Edge[] {
    const byId = new Map(nodes.map((node) => [String(node.id), node]))

    return nodes.flatMap((node) => {
        const parent = byId.get(String(node.parentId))
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

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function createId() {
    return crypto.randomUUID().slice(0, 6)
}

export function createNodes(form: Required<WorkflowNodeFormTypes>, parentId: WorkflowId): WorkflowNodeTypes[] {
    const node = {
        id: createId(),
        parentId,
        name: form.title.trim(),
        description: form.description.trim() || undefined,
    }

    if (form.type === 'sendMessage') return [{ ...node, type: 'sendMessage', data: { payload: [] } }]
    if (form.type === 'addComment') return [{ ...node, type: 'addComment', data: { comment: '' } }]

    return [
        {
            ...node,
            type: 'dateTime',
            data: {
                times: WEEK_DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00' })),
                timezone: 'UTC',
            },
        },
        { id: createId(), parentId: node.id, name: 'Success', type: 'dateTimeConnector', data: { connectorType: 'success' } },
        { id: createId(), parentId: node.id, name: 'Failure', type: 'dateTimeConnector', data: { connectorType: 'failure' } },
    ]
}

export function insertNodes(nodes: WorkflowNodeTypes[], newNodes: WorkflowNodeTypes[], parentId: WorkflowId) {
    const [first, success] = newNodes
    const tail = first?.type === 'dateTime' ? success : first
    if (!tail) return nodes

    const moved = nodes.map((node) => node.parentId === parentId ? { ...node, parentId: tail.id } : node)
    return [...moved, ...newNodes]
}

export function canAddAfter(node: WorkflowNodeTypes) {
    return node.type !== 'dateTime'
}

export function findLastLeaf(nodes: WorkflowNodeTypes[]) {
    const parentIds = new Set(nodes.map((node) => node.parentId))
    return nodes.filter((node) => !parentIds.has(node.id) && canAddAfter(node)).at(-1)
}

export function findNodeById(nodes: WorkflowNodeTypes[], id: string) {
    return nodes.find((node) => String(node.id) === id)
}

export function replaceNode(nodes: WorkflowNodeTypes[], updated: WorkflowNodeTypes) {
    return nodes.map((node) => node.id === updated.id ? updated : node)
}

export function removeSubtree(nodes: WorkflowNodeTypes[], id: WorkflowId) {
    const removed = new Set<WorkflowId>([id])

    function collect(parentId: WorkflowId) {
        for (const node of nodes) {
            if (node.parentId !== parentId) continue
            removed.add(node.id)
            collect(node.id)
        }
    }

    collect(id)
    return nodes.filter((node) => !removed.has(node.id))
}
