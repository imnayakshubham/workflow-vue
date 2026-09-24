export type WorkflowId = string | number

interface WorkflowBaseNodeTypes {
    id: WorkflowId
    parentId: WorkflowId
    name?: string
    description?: string
}

export type WorkflowMessagePayloadTypes =
    | { type: 'text', text: string }
    | { type: 'attachment', attachment: string }

export interface WorkflowBusinessHourTypes {
    day: string
    startTime: string
    endTime: string
}

export interface WorkflowTriggerNodeTypes extends WorkflowBaseNodeTypes {
    type: 'trigger'
    data: { type: string }
}

export interface WorkflowSendMessageNodeTypes extends WorkflowBaseNodeTypes {
    type: 'sendMessage'
    data: { payload: WorkflowMessagePayloadTypes[] }
}

export interface WorkflowDateTimeNodeTypes extends WorkflowBaseNodeTypes {
    type: 'dateTime'
    data: { times: WorkflowBusinessHourTypes[], timezone: string }
}

export interface WorkflowDateTimeConnectorNodeTypes extends WorkflowBaseNodeTypes {
    type: 'dateTimeConnector'
    data: { connectorType: 'success' | 'failure' }
}

export interface WorkflowCommentNodeTypes extends WorkflowBaseNodeTypes {
    type: 'addComment'
    data: { comment: string }
}

export type WorkflowNodeTypes =
    | WorkflowTriggerNodeTypes
    | WorkflowSendMessageNodeTypes
    | WorkflowDateTimeNodeTypes
    | WorkflowDateTimeConnectorNodeTypes
    | WorkflowCommentNodeTypes

export type WorkflowPayloadTypes = WorkflowNodeTypes[]

export type WorkflowNewNodeTypes = 'sendMessage' | 'addComment' | 'businessHours'

export interface WorkflowNodeFormTypes {
    title: string
    description: string
    type?: WorkflowNewNodeTypes
}
