<template>
  <div class="perspective-1000 w-full max-w-2xl mx-auto max-[1000px]:px-2">
    <div
      :class="[
        'relative w-full min-h-96 transition-transform duration-700 transform-style-preserve-3d',
        isFlipped ? 'rotate-y-180' : ''
      ]"
      @click="handleFlip"
    >
      <!-- Front (Question) -->
      <div
        class="absolute inset-0 w-full h-full backface-hidden rounded-lg border bg-card p-6 max-[1000px]:p-4 flex flex-col items-center justify-start overflow-y-auto cursor-pointer shadow-lg"
      >
        <div class="text-sm text-muted-foreground mb-4">Вопрос</div>
        <div class="text-xl font-semibold text-center">{{ card.question }}</div>
      </div>

      <!-- Back (Answer) -->
      <div
        class="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-lg border bg-card p-6 max-[1000px]:p-4 flex flex-col items-center justify-start overflow-y-auto shadow-lg"
      >
        <div class="text-sm text-muted-foreground mb-4">Ответ</div>
        <div
          class="text-lg text-center prose prose-sm max-w-none dark:prose-invert"
          v-html="card.answer"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['flip'])

const isFlipped = ref(false)

const handleFlip = () => {
  if (!isFlipped.value) {
    isFlipped.value = true
    emit('flip')
  }
}

// Reset when card changes
watch(() => props.card, () => {
  isFlipped.value = false
})

defineExpose({
  flip: () => {
    isFlipped.value = true
  },
  reset: () => {
    isFlipped.value = false
  }
})
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>

