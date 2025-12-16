<template>
  <h2 :class="cn('text-lg font-semibold leading-none tracking-tight mb-5', className)">
    <slot />
  </h2>
</template>

<script setup>
import { cn } from '@/lib/utils'

defineProps({
  className: {
    type: String,
    default: ''
  }
})
</script>

