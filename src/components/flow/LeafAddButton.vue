<script setup lang="ts">
import { LEAF_COLOR } from '@/utils/workflow'
import AddNodeButton from './AddNodeButton.vue'
</script>

<template>
    <div class="absolute top-full left-1/2 flex -translate-x-1/2 flex-col items-center">
        <span class="h-5 border-l border-dashed border-gray-300" />
        <AddNodeButton :color="LEAF_COLOR" />
    </div>
</template>
