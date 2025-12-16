<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4 max-[1000px]:flex-col max-[1000px]:items-start">
      <h1 class="text-3xl font-bold max-[1000px]:text-2xl">Мои проекты</h1>
      <div class="flex flex-wrap gap-2 max-[1000px]:w-full">
        <div class="flex gap-1 border rounded-md p-1 max-[1000px]:w-full max-[1000px]:justify-between">
          <Button
            variant="ghost"
            size="sm"
            :class="[
              viewMode === 'grid' ? 'bg-accent' : '',
              'max-[1000px]:flex-1'
            ]"
            @click="viewMode = 'grid'"
          >
            <Grid3x3 class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="[
              viewMode === 'table' ? 'bg-accent' : '',
              'max-[1000px]:flex-1'
            ]"
            @click="viewMode = 'table'"
          >
            <Table class="size-4" />
          </Button>
        </div>
        <Button variant="outline" class="max-[1000px]:flex-1" @click="resetAllProgress">
          <RotateCcw class="size-4 mr-2" />
          Сбросить весь прогресс
        </Button>
        <Button class="max-[1000px]:flex-1" @click="openCreateDialog">
          <Plus class="size-4 mr-2" />
          Новый проект
        </Button>
      </div>
    </div>

    <div v-if="projects.length === 0" class="text-center py-12 text-muted-foreground">
      Нет проектов. Создайте первый проект!
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        @play="startGame(project)"
        @edit="editProject(project)"
        @delete="deleteProject(project)"
        @viewQuestions="viewQuestions(project)"
      />
    </div>

    <!-- Table View -->
    <div v-else class="space-y-4">
      <div class="border rounded-lg overflow-hidden max-[1000px]:hidden">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left p-4 font-semibold">Название</th>
              <th class="text-left p-4 font-semibold">Описание</th>
              <th class="text-center p-4 font-semibold">Карточек</th>
              <th class="text-right p-4 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in projects"
              :key="project.id"
              class="border-t hover:bg-muted/30 transition-colors"
            >
              <td class="p-4 font-medium">{{ project.name }}</td>
              <td class="p-4 text-muted-foreground text-sm">
                {{ project.description || 'Нет описания' }}
              </td>
              <td class="p-4 text-center">
                <Badge>{{ project.cards.length }}</Badge>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-end gap-2">
                  <Button size="sm" @click="startGame(project)">
                    <Play class="size-4 mr-2" />
                    Играть
                  </Button>
                  <Button variant="outline" size="sm" @click="viewQuestions(project)">
                    <List class="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" @click="editProject(project)">
                    <Edit class="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" @click="deleteProject(project)">
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hidden max-[1000px]:flex max-[1000px]:flex-col gap-3">
        <div
          v-for="project in projects"
          :key="`mobile-${project.id}`"
          class="border rounded-lg p-4 space-y-3 shadow-sm"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold text-lg">{{ project.name }}</div>
              <p class="text-sm text-muted-foreground mt-1">
                {{ project.description || 'Нет описания' }}
              </p>
            </div>
            <Badge>{{ project.cards.length }}</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" class="flex-1" @click="startGame(project)">
              <Play class="size-4 mr-2" />
              Играть
            </Button>
            <Button variant="outline" size="sm" class="flex-1" @click="viewQuestions(project)">
              <List class="size-4" />
              Вопросы
            </Button>
            <Button variant="outline" size="sm" class="flex-1" @click="editProject(project)">
              <Edit class="size-4" />
              Редактировать
            </Button>
            <Button variant="outline" size="sm" class="flex-1" @click="deleteProject(project)">
              <Trash2 class="size-4" />
              Удалить
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Project Dialog -->
    <Dialog :modelValue="showCreateDialog || !!editingProject" @update:modelValue="handleDialogClose">
      <template #header>
        <DialogTitle>{{ editingProject ? 'Редактировать проект' : 'Новый проект' }}</DialogTitle>
        <DialogDescription>
          {{ editingProject ? 'Измените название и описание проекта' : 'Создайте новый проект для карточек' }}
        </DialogDescription>
      </template>

      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">Название</label>
          <Input v-model="projectForm.name" placeholder="Название проекта" />
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">Описание</label>
          <Textarea v-model="projectForm.description" placeholder="Описание (необязательно)" rows="3" />
        </div>
        <div v-if="editingProject" class="pt-4 border-t">
          <div class="flex items-center justify-between mb-2 gap-2 max-[1000px]:flex-col max-[1000px]:items-start">
            <label class="text-sm font-medium">Карточки ({{ editingProject?.cards?.length || 0 }})</label>
            <div class="flex gap-2 max-[1000px]:w-full max-[1000px]:flex-wrap">
              <Button variant="outline" size="sm" class="max-[1000px]:flex-1" @click="viewQuestions(editingProject)">
                <List class="size-4 mr-2" />
                Просмотр вопросов
              </Button>
              <Button variant="outline" size="sm" class="max-[1000px]:flex-1" @click="showAddCardsDialog = true">
                <Plus class="size-4 mr-2" />
                Добавить карточки
              </Button>
            </div>
          </div>
          <div v-if="editingProject?.cards?.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-for="(card, index) in editingProject.cards"
              :key="index"
              class="p-3 border rounded-md text-sm"
            >
              <div class="font-medium mb-1">{{ card.question }}</div>
              <div class="text-muted-foreground text-xs line-clamp-2" v-html="card.answer"></div>
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            Нет карточек. Добавьте карточки для начала игры.
          </div>
        </div>
      </div>

      <template #footer>
        <Button variant="outline" @click="closeDialog">Отмена</Button>
        <Button @click="saveProject" :disabled="!projectForm.name || !projectForm.name.trim()">
          {{ editingProject ? 'Сохранить' : 'Создать' }}
        </Button>
      </template>
    </Dialog>

    <!-- Add Cards Dialog -->
    <AddCardDialog
      :modelValue="showAddCardsDialog"
      @update:modelValue="showAddCardsDialog = $event"
      @add-cards="handleAddCards"
    />

    <!-- Game Mode -->
    <div v-if="currentGameProject" class="fixed inset-0 bg-background z-50 p-6 max-[1000px]:p-4 overflow-auto">
      <div class="max-w-4xl mx-auto max-[1000px]:w-full">
        <div class="mb-4">
          <Button variant="ghost" class="max-[1000px]:w-full max-[1000px]:justify-start" @click="currentGameProject = null">
            <ArrowLeft class="size-4 mr-2" />
            Назад
          </Button>
        </div>
        <GameMode :project="currentGameProject" @close="currentGameProject = null" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProjects, saveProjects, resetAllProgress as resetAllProgressStorage } from '@/lib/storage'
import ProjectCard from './ProjectCard.vue'
import AddCardDialog from './AddCardDialog.vue'
import GameMode from './GameMode.vue'
import Dialog from './ui/Dialog.vue'
import DialogTitle from './ui/DialogTitle.vue'
import DialogDescription from './ui/DialogDescription.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import Textarea from './ui/Textarea.vue'
import Badge from './ui/Badge.vue'
import { Plus, RotateCcw, ArrowLeft, Grid3x3, Table, Play, Edit, Trash2, List } from 'lucide-vue-next'

const router = useRouter()
const projects = ref([])
const showCreateDialog = ref(false)
const editingProject = ref(null)
const showAddCardsDialog = ref(false)
const currentGameProject = ref(null)
const projectForm = ref({ name: '', description: '' })
const viewMode = ref('grid')

const loadProjects = () => {
  projects.value = getProjects()
}

const saveProject = () => {
  if (!projectForm.value.name) return

  if (editingProject.value) {
    const index = projects.value.findIndex(p => p.id === editingProject.value.id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        name: projectForm.value.name,
        description: projectForm.value.description
      }
    }
  } else {
    const newProject = {
      id: Date.now().toString(),
      name: projectForm.value.name,
      description: projectForm.value.description,
      cards: []
    }
    projects.value.push(newProject)
  }

  saveProjects(projects.value)
  closeDialog()
  loadProjects()
}

const handleDialogClose = (value) => {
  if (!value) {
    closeDialog()
  }
}

const openCreateDialog = () => {
  editingProject.value = null
  projectForm.value = { name: '', description: '' }
  showCreateDialog.value = true
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingProject.value = null
  projectForm.value = { name: '', description: '' }
}

const editProject = (project) => {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    description: project.description || ''
  }
  showCreateDialog.value = false
}

const deleteProject = (project) => {
  if (confirm(`Удалить проект "${project.name}"?`)) {
    projects.value = projects.value.filter(p => p.id !== project.id)
    saveProjects(projects.value)
    loadProjects()
  }
}

const startGame = (project) => {
  if (project.cards.length === 0) {
    alert('Добавьте карточки в проект перед началом игры')
    return
  }
  currentGameProject.value = project
}

const handleAddCards = (cards) => {
  if (editingProject.value) {
    const index = projects.value.findIndex(p => p.id === editingProject.value.id)
    if (index !== -1) {
      projects.value[index].cards.push(...cards)
      saveProjects(projects.value)
      loadProjects()
      editingProject.value = projects.value[index]
    }
  }
}

const resetAllProgress = () => {
  if (confirm('Сбросить весь прогресс для всех проектов?')) {
    resetAllProgressStorage()
    alert('Прогресс сброшен')
  }
}

const viewQuestions = (project) => {
  router.push(`/project/${project.id}/questions`)
}

onMounted(() => {
  loadProjects()
})
</script>

