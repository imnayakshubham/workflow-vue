import type { WorkflowPayloadTypes } from '@/types/workflow'

export const payload: WorkflowPayloadTypes = [
    { id: 1, parentId: -1, type: 'trigger', data: { type: 'conversationOpened' } },
    {
        id: 'd09c08',
        parentId: 1,
        name: 'Business Hours',
        type: 'dateTime',
        data: { times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }], timezone: 'UTC' },
    },
    { id: '161f52', parentId: 'd09c08', name: 'Success', type: 'dateTimeConnector', data: { connectorType: 'success' } },
    { id: '28c4b9', parentId: 'd09c08', name: 'Failure', type: 'dateTimeConnector', data: { connectorType: 'failure' } },
    {
        id: 'b0653a',
        parentId: '161f52',
        name: 'Welcome Message',
        type: 'sendMessage',
        data: { payload: [{ type: 'attachment', attachment: 'https://example.com/images/396.jpg?hmac=abc' }] },
    },
    {
        id: 'b6a0c1',
        parentId: '28c4b9',
        name: 'Away Message',
        type: 'sendMessage',
        data: { payload: [{ type: 'text', text: 'Sorry, we are currently away.' }] },
    },
    { id: 'e879e4', parentId: 'b6a0c1', name: 'Add Comment #1', type: 'addComment', data: { comment: 'User message during off hours' } },
]

export function findNode(id: string | number) {
    const node = payload.find((item) => item.id === id)
    if (!node) throw new Error(`Missing fixture node ${id}`)
    return node
}
