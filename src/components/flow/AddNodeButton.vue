<script setup lang="ts">
defineProps<{ color: string }>()
</script>

<template>
    <button
        type="button"
        aria-label="Add node"
        class="nodrag nopan flex size-4 cursor-pointer items-center justify-center rounded-full border bg-white"
        :style="{ color, borderColor: color }"
    >
        <UIcon name="i-lucide-plus" class="size-3" />
    </button>
</template>
