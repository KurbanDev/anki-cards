<template>
  <div class="space-y-6">
    <!-- Header with counter and reset button -->
    <div class="flex items-center justify-between gap-3 max-[1000px]:flex-col max-[1000px]:items-start">
      <div class="text-lg font-semibold max-[1000px]:text-base">
        Вопрос {{ currentIndex + 1 }} / {{ activeCards.length }}
      </div>
      <Button variant="outline" size="sm" class="max-[1000px]:w-full" @click="resetProgress">
        <RotateCcw class="size-4 mr-2" />
        Сбросить прогресс
      </Button>
    </div>

    <!-- Completion message -->
    <div v-if="activeCards.length === 0" class="text-center py-12">
      <div class="text-4xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold mb-2">Поздравляем!</h2>
      <p class="text-muted-foreground mb-6">Вы ответили на все вопросы!</p>
      <Button @click="$emit('close')">Вернуться к проектам</Button>
    </div>

    <!-- Card display -->
    <div v-else class="flex flex-col items-center space-y-6">
      <FlashCard
        ref="flashCardRef"
        :card="currentCard"
        @flip="onCardFlipped"
      />

      <div class="flex gap-4 w-full max-w-md max-[1000px]:flex-col max-[1000px]:max-w-none max-[1000px]:gap-3">
        <Button
          v-if="!isAnswerShown"
          @click="showAnswer"
          class="flex-1 max-[1000px]:w-full"
          variant="outline"
        >
          Показать ответ
        </Button>
        <Button
          v-else
          @click="markRemembered"
          class="flex-1 max-[1000px]:w-full"
          variant="default"
        >
          <Check class="size-4 mr-2" />
          Помню
        </Button>
        <Button
          v-if="isAnswerShown"
          @click="markForgotten"
          class="flex-1 max-[1000px]:w-full"
          variant="destructive"
        >
          <X class="size-4 mr-2" />
          Не помню
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { getProjectProgress, saveProjectProgress, resetProjectProgress } from '@/lib/storage'
import FlashCard from './FlashCard.vue'
import Button from './ui/Button.vue'
import { Check, X, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const flashCardRef = ref(null)
const isAnswerShown = ref(false)
const currentIndex = ref(0)
const progress = ref({})

const activeCards = computed(() => {
  // Get all cards with their indices
  const cardsWithIndices = props.project.cards.map((card, index) => ({
    card,
    originalIndex: index,
    progress: progress.value[index]
  }))
  
  // Filter out remembered cards
  const notRemembered = cardsWithIndices.filter(item => {
    return !item.progress || !item.progress.remembered
  })
  
  // Sort: forgotten cards go to the end
  const rememberedFirst = notRemembered.filter(item => {
    return !item.progress || !item.progress.forgotten
  })
  const forgottenLast = notRemembered.filter(item => {
    return item.progress && item.progress.forgotten
  })
  
  return [...rememberedFirst, ...forgottenLast]
})

const currentCard = computed(() => {
  if (activeCards.value.length === 0) return null
  const item = activeCards.value[currentIndex.value]
  return { ...item.card, originalIndex: item.originalIndex }
})

const loadProgress = () => {
  progress.value = getProjectProgress(props.project.id)
}

const saveCardProgress = (cardIndex, remembered) => {
  if (!progress.value[cardIndex]) {
    progress.value[cardIndex] = {}
  }
  progress.value[cardIndex].remembered = remembered
  progress.value[cardIndex].forgotten = !remembered
  saveProjectProgress(props.project.id, progress.value)
}

const showAnswer = () => {
  if (flashCardRef.value) {
    flashCardRef.value.flip()
  }
  isAnswerShown.value = true
}

const onCardFlipped = () => {
  isAnswerShown.value = true
}

const markRemembered = async () => {
  if (currentCard.value) {
    saveCardProgress(currentCard.value.originalIndex, true)
    loadProgress()
    isAnswerShown.value = false
    
    // Reset card flip
    if (flashCardRef.value && flashCardRef.value.reset) {
      flashCardRef.value.reset()
    }
    
    // Wait for activeCards to update after progress reload
    await nextTick()
    
    // Card is now removed from activeCards, move to next
    // If we're at or past the end, move to beginning
    if (currentIndex.value >= activeCards.value.length) {
      currentIndex.value = 0
    }
    // Otherwise stay at same index which will now show the next card
  }
}

const markForgotten = async () => {
  if (currentCard.value) {
    saveCardProgress(currentCard.value.originalIndex, false)
    loadProgress()
    isAnswerShown.value = false
    
    // Reset card flip
    if (flashCardRef.value && flashCardRef.value.reset) {
      flashCardRef.value.reset()
    }
    
    // Wait for activeCards to update after progress reload
    await nextTick()
    
    // Card moves to end of queue, move to next card
    // If we're not at the end, increment index to show next card
    if (currentIndex.value < activeCards.value.length - 1) {
      currentIndex.value++
    } else {
      // If we're at the end (or past it), go to beginning
      currentIndex.value = 0
    }
  }
}

const resetProgress = () => {
  if (confirm('Сбросить прогресс для этого проекта?')) {
    resetProjectProgress(props.project.id)
    loadProgress()
    isAnswerShown.value = false
    currentIndex.value = 0
  }
}

// Shuffle cards on mount
onMounted(() => {
  loadProgress()
  // Shuffle active cards
  if (activeCards.value.length > 0) {
    currentIndex.value = Math.floor(Math.random() * activeCards.value.length)
  }
})

watch(activeCards, () => {
  if (activeCards.value.length > 0 && currentIndex.value >= activeCards.value.length) {
    currentIndex.value = 0
  }
})
</script>

