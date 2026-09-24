<script setup lang="ts">
import { Time } from '@internationalized/date'
import type { WorkflowBusinessHourTypes, WorkflowDateTimeNodeTypes } from '@/types/workflow'
import { formatTimezone, fromTime, toTime } from '@/utils/time'
import { toTitleCase } from '@/utils/workflow'

const TIMEZONES = ['UTC', ...Intl.supportedValuesOf('timeZone').filter((zone) => zone !== 'UTC')]
    .map((zone) => ({ label: formatTimezone(zone), value: zone }))

const data = defineModel<WorkflowDateTimeNodeTypes['data']>({ required: true })

function updateTime(index: number, key: keyof Omit<WorkflowBusinessHourTypes, 'day'>, value: unknown) {
    if (!(value instanceof Time)) return
    data.value = {
        ...data.value,
        times: data.value.times.map((time, i) => i === index ? { ...time, [key]: fromTime(value) } : time),
    }
}
</script>

<template>
    <section class="space-y-3">
        <div class="flex gap-12 text-xs text-gray-500">
            <span class="flex items-center gap-1"><UIcon name="i-lucide-calendar-days" class="size-4" /> Day</span>
            <span class="flex items-center gap-1"><UIcon name="i-lucide-clock" class="size-4" /> Time</span>
        </div>

        <UFormField v-for="(time, index) in data.times" :key="time.day" :name="`times.${index}`">
            <div class="flex items-center gap-2">
                <span class="w-12 pl-2 text-xs font-semibold text-gray-800">{{ toTitleCase(time.day) }}</span>
                <UInputTime
                    :model-value="toTime(time.startTime)"
                    :hour-cycle="24"
                    size="xs"
                    :aria-label="`${time.day} start time`"
                    @update:model-value="updateTime(index, 'startTime', $event)"
                />
                <UIcon name="i-lucide-clock" class="size-4 text-gray-600" />
                <span class="px-1 text-xs text-gray-500">to</span>
                <UInputTime
                    :model-value="toTime(time.endTime)"
                    :hour-cycle="24"
                    size="xs"
                    :aria-label="`${time.day} end time`"
                    @update:model-value="updateTime(index, 'endTime', $event)"
                />
                <UIcon name="i-lucide-clock" class="size-4 text-gray-600" />
            </div>
        </UFormField>
    </section>

    <UFormField label="Time Zone" name="timezone" size="xs">
        <USelectMenu
            :model-value="data.timezone"
            :items="TIMEZONES"
            value-key="value"
            class="w-full"
            @update:model-value="data = { ...data, timezone: String($event) }"
        />
    </UFormField>
</template>
