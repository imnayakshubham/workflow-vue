import type { WorkflowNodeFormTypes, WorkflowNodeTypes } from '@/types/workflow'

export const TITLE_MAX_LENGTH = 50
export const DESCRIPTION_MAX_LENGTH = 200

export interface ValidationErrorTypes {
    name: string
    message: string
}

export function validateTitle(title: string) {
    if (!title.trim()) return 'Title is required'
    if (title.trim().length > TITLE_MAX_LENGTH) return `Title must be at most ${TITLE_MAX_LENGTH} characters`
}

export function validateDescription(description: string) {
    if (description.trim().length > DESCRIPTION_MAX_LENGTH) return `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`
}

export function validateNodeForm(form: Partial<WorkflowNodeFormTypes>) {
    const errors: ValidationErrorTypes[] = []

    const title = validateTitle(form.title ?? '')
    if (title) errors.push({ name: 'title', message: title })

    const description = validateDescription(form.description ?? '')
    if (description) errors.push({ name: 'description', message: description })

    if (!form.type) errors.push({ name: 'type', message: 'Type of node is required' })

    return errors
}

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024

export function validateImageFile(file: File) {
    if (!file.type.startsWith('image/')) return 'Only image files can be attached'
    if (file.size > MAX_IMAGE_SIZE) return 'Images must be 2 MB or smaller'
}

export function validateNodeDraft(node: WorkflowNodeTypes) {
    const errors: ValidationErrorTypes[] = []

    const title = validateTitle(node.name ?? '')
    if (title) errors.push({ name: 'title', message: title })

    const description = validateDescription(node.description ?? '')
    if (description) errors.push({ name: 'description', message: description })

    if (node.type === 'sendMessage') {
        node.data.payload.forEach((item, index) => {
            if (item.type === 'text' && !item.text.trim()) errors.push({ name: `payload.${index}`, message: 'Message cannot be empty' })
        })
    }

    if (node.type === 'dateTime') {
        node.data.times.forEach((time, index) => {
            if (time.startTime >= time.endTime) errors.push({ name: `times.${index}`, message: 'Start time must be before end time' })
        })
    }

    if (node.type === 'addComment' && !node.data.comment.trim()) {
        errors.push({ name: 'comment', message: 'Comment cannot be empty' })
    }

    return errors
}
