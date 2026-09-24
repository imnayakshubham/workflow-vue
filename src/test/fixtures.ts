import type {
    WorkflowCommentNodeTypes,
    WorkflowDateTimeConnectorNodeTypes,
    WorkflowDateTimeNodeTypes,
    WorkflowPayloadTypes,
    WorkflowSendMessageNodeTypes,
    WorkflowTriggerNodeTypes,
} from '@/types/workflow'

export const trigger: WorkflowTriggerNodeTypes = {
    id: 1,
    parentId: -1,
    type: 'trigger',
    data: { type: 'conversationOpened' },
}

export const businessHours: WorkflowDateTimeNodeTypes = {
    id: 'd09c08',
    parentId: 1,
    name: 'Business Hours',
    type: 'dateTime',
    data: {
        times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
        connectors: ['161f52', '28c4b9'],
        timezone: 'UTC',
        action: 'businessHours',
    },
}

export const successBranch: WorkflowDateTimeConnectorNodeTypes = {
    id: '161f52',
    parentId: 'd09c08',
    name: 'Success',
    type: 'dateTimeConnector',
    data: { connectorType: 'success' },
}

export const failureBranch: WorkflowDateTimeConnectorNodeTypes = {
    id: '28c4b9',
    parentId: 'd09c08',
    name: 'Failure',
    type: 'dateTimeConnector',
    data: { connectorType: 'failure' },
}

export const welcomeMessage: WorkflowSendMessageNodeTypes = {
    id: 'b0653a',
    parentId: '161f52',
    name: 'Welcome Message',
    type: 'sendMessage',
    data: { payload: [{ type: 'attachment', attachment: 'https://example.com/images/396.jpg?hmac=abc' }] },
}

export const awayMessage: WorkflowSendMessageNodeTypes = {
    id: 'b6a0c1',
    parentId: '28c4b9',
    name: 'Away Message',
    type: 'sendMessage',
    data: { payload: [{ type: 'text', text: 'Sorry, we are currently away.' }] },
}

export const comment: WorkflowCommentNodeTypes = {
    id: 'e879e4',
    parentId: 'b6a0c1',
    name: 'Add Comment #1',
    type: 'addComment',
    data: { comment: 'User message during off hours' },
}

export const payload: WorkflowPayloadTypes = [
    trigger,
    awayMessage,
    businessHours,
    successBranch,
    failureBranch,
    welcomeMessage,
    comment,
]
