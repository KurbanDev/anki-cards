<template>
  <div class="container mx-auto p-6 max-[1000px]:p-4">
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4 max-[1000px]:flex-col max-[1000px]:items-start">
        <div class="w-full">
          <Button variant="ghost" @click="goBack" class="mb-4 max-[1000px]:w-full max-[1000px]:justify-start">
            <ArrowLeft class="size-4 mr-2" />
            Назад
          </Button>
          <h1 class="text-3xl font-bold max-[1000px]:text-2xl">Вопросы проекта: {{ project?.name }}</h1>
          <p v-if="project?.description" class="text-muted-foreground mt-2">
            {{ project.description }}
          </p>
        </div>
      </div>

      <div v-if="project && project.cards && project.cards.length > 0" class="space-y-4">
        <div class="flex items-center justify-between gap-4 border p-4 rounded-lg max-[1000px]:flex-col max-[1000px]:items-start">
          <div class="text-sm text-muted-foreground">
            <span v-if="hasSelectedCards">Выбрано {{ selectedCount }} вопрос(а)</span>
            <span v-else>Отметьте вопросы, которые хотите удалить</span>
          </div>
          <div class="flex gap-2 max-[1000px]:w-full max-[1000px]:flex-col">
            <Button
              variant="outline"
              size="sm"
              class="max-[1000px]:w-full"
              @click="toggleSelectAll"
            >
              {{ isAllSelected ? 'Снять выделение' : 'Выбрать все' }}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              class="max-[1000px]:w-full"
              :disabled="!hasSelectedCards"
              @click="deleteSelectedCards"
            >
              Удалить выбранные
            </Button>
          </div>
        </div>
        <div class="border rounded-lg overflow-hidden max-[1000px]:hidden">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-center p-4 w-12">
                  <input
                    type="checkbox"
                    class="size-4"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="text-left p-4 font-semibold">Вопрос</th>
                <th class="text-left p-4 font-semibold">Ответ</th>
                <th class="text-center p-4 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(card, index) in project.cards"
                :key="index"
                class="border-t hover:bg-muted/30 transition-colors"
              >
                <td class="p-4 text-center">
                  <input
                    type="checkbox"
                    class="size-4"
                    :checked="selectedCards.has(index)"
                    @change="toggleCardSelection(index)"
                  />
                </td>
                <td class="p-4 font-medium">{{ card.question }}</td>
                <td class="p-4 text-sm text-muted-foreground">
                  {{ getShortAnswer(card.answer) }}
                </td>
                <td class="p-4 text-center">
                  <Badge :variant="getStatusVariant(cardStatus[index])" :className="getStatusClass(cardStatus[index])">
                    {{ getStatusLabel(cardStatus[index]) }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="hidden max-[1000px]:flex max-[1000px]:flex-col gap-3">
          <div
            v-for="(card, index) in project.cards"
            :key="`mobile-card-${index}`"
            class="border rounded-lg p-4 space-y-2 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="font-semibold">{{ card.question }}</div>
              <input
                type="checkbox"
                class="size-4 mt-1"
                :checked="selectedCards.has(index)"
                @change="toggleCardSelection(index)"
              />
            </div>
            <div class="text-sm text-muted-foreground">
              {{ getShortAnswer(card.answer) }}
            </div>
            <div>
              <Badge :variant="getStatusVariant(cardStatus[index])" :className="getStatusClass(cardStatus[index])">
                {{ getStatusLabel(cardStatus[index]) }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-muted-foreground">
        В проекте нет карточек
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProjects, getProjectProgress, saveProjects, saveProjectProgress } from '@/lib/storage'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const selectedCards = ref(new Set())

const progress = computed(() => {
  if (!project.value) return {}
  return getProjectProgress(project.value.id)
})

const cardStatus = computed(() => {
  if (!project.value || !project.value.cards) return []
  return project.value.cards.map((_, index) => {
    const cardProgress = progress.value[index]
    if (!cardProgress) {
      return 'not_answered' // не отвечал
    }
    if (cardProgress.remembered) {
      return 'remembered' // запомнил
    }
    if (cardProgress.forgotten) {
      return 'forgotten' // не запомнил
    }
    return 'not_answered'
  })
})

const hasSelectedCards = computed(() => selectedCards.value.size > 0)

const selectedCount = computed(() => selectedCards.value.size)

const isAllSelected = computed(() => {
  if (!project.value?.cards?.length) return false
  return selectedCards.value.size === project.value.cards.length
})

const getShortAnswer = (answer) => {
  if (!answer) return ''
  // Remove HTML tags and get first line
  const text = answer.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
  // Limit to reasonable length
  return text.length > 100 ? text.substring(0, 100) + '...' : text
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'remembered':
      return 'Запомнил'
    case 'forgotten':
      return 'Не запомнил'
    case 'not_answered':
      return 'Не отвечал'
    default:
      return 'Не отвечал'
  }
}

const getStatusVariant = (status) => {
  return 'outline'
}

const getStatusClass = (status) => {
  switch (status) {
    case 'remembered':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    case 'forgotten':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    case 'not_answered':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    default:
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
  }
}

const goBack = () => {
  router.push('/')
}

const toggleCardSelection = (index) => {
  const updated = new Set(selectedCards.value)
  if (updated.has(index)) {
    updated.delete(index)
  } else {
    updated.add(index)
  }
  selectedCards.value = updated
}

const toggleSelectAll = () => {
  if (!project.value?.cards) return
  if (isAllSelected.value) {
    selectedCards.value = new Set()
  } else {
    selectedCards.value = new Set(project.value.cards.map((_, index) => index))
  }
}

const deleteSelectedCards = () => {
  if (!project.value || selectedCards.value.size === 0) return

  if (!confirm(`Удалить выбранные вопросы (${selectedCards.value.size})?`)) {
    return
  }

  const projects = getProjects()
  const projectIndex = projects.findIndex(p => p.id === project.value.id)
  if (projectIndex === -1) return

  const originalCards = projects[projectIndex].cards || []
  const remainingCards = originalCards.filter((_, index) => !selectedCards.value.has(index))

  projects[projectIndex] = {
    ...projects[projectIndex],
    cards: remainingCards
  }

  saveProjects(projects)

  const existingProgress = getProjectProgress(project.value.id)
  const newProgress = {}
  let nextIndex = 0

  originalCards.forEach((_, index) => {
    if (!selectedCards.value.has(index)) {
      if (existingProgress[index]) {
        newProgress[nextIndex] = existingProgress[index]
      }
      nextIndex++
    }
  })

  saveProjectProgress(project.value.id, newProgress)

  project.value = projects[projectIndex]
  selectedCards.value = new Set()
}

watch(project, () => {
  selectedCards.value = new Set()
})

onMounted(() => {
  const projectId = route.params.id
  if (projectId) {
    const projects = getProjects()
    const foundProject = projects.find(p => p.id === projectId)
    if (foundProject) {
      project.value = foundProject
    } else {
      // Project not found, redirect to home
      router.push('/')
    }
  } else {
    router.push('/')
  }
})
</script>


