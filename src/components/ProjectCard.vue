<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between gap-3 max-[1000px]:flex-col max-[1000px]:items-start">
        <CardTitle>{{ project.name }}</CardTitle>
        <Badge>{{ project.cards.length }} карточек</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <div class="text-sm text-muted-foreground">
          {{ project.description || 'Нет описания' }}
        </div>
        
        <!-- Progress Section -->
        <div v-if="project.cards.length > 0" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Прогресс</span>
            <span class="font-medium">{{ rememberedCount }} / {{ project.cards.length }}</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>
        
        <div class="flex gap-2 flex-wrap">
          <Button @click="$emit('play')" class="flex-1">
            <Play class="size-4 mr-2" />
            Играть
          </Button>
          <Button variant="outline" class="max-[1000px]:flex-1" @click="$emit('viewQuestions')">
            <List class="size-4" />
          </Button>
          <Button variant="outline" class="max-[1000px]:flex-1" @click="$emit('edit')">
            <Edit class="size-4" />
          </Button>
          <Button variant="outline" class="max-[1000px]:flex-1" @click="$emit('delete')">
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getProjectProgress } from '@/lib/storage'
import Card from './ui/Card.vue'
import CardHeader from './ui/CardHeader.vue'
import CardTitle from './ui/CardTitle.vue'
import CardContent from './ui/CardContent.vue'
import Button from './ui/Button.vue'
import Badge from './ui/Badge.vue'
import { Play, Edit, Trash2, List } from 'lucide-vue-next'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

defineEmits(['play', 'edit', 'delete', 'viewQuestions'])

const progress = ref({})

const updateProgress = () => {
  progress.value = getProjectProgress(props.project.id)
}

const rememberedCount = computed(() => {
  if (!props.project.cards || props.project.cards.length === 0) return 0
  return props.project.cards.reduce((count, card, index) => {
    const cardProgress = progress.value[index]
    return count + (cardProgress?.remembered ? 1 : 0)
  }, 0)
})

const progressPercentage = computed(() => {
  if (props.project.cards.length === 0) return 0
  return Math.round((rememberedCount.value / props.project.cards.length) * 100)
})

// Watch for localStorage changes
const handleStorageChange = (e) => {
  // Handle native storage event (from other tabs)
  if (e.key === 'flashcards_progress') {
    updateProgress()
  }
  // Handle custom event (from same tab)
  if (e.type === 'flashcards_progress_updated') {
    updateProgress()
  }
}

// Watch project.id to update progress when project changes
watch(() => props.project.id, () => {
  updateProgress()
}, { immediate: true })

onMounted(() => {
  updateProgress()
  // Listen to storage events (works across tabs and when localStorage is updated)
  window.addEventListener('storage', handleStorageChange)
  
  // Also listen to custom event for same-tab updates
  window.addEventListener('flashcards_progress_updated', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('flashcards_progress_updated', handleStorageChange)
})
</script>

