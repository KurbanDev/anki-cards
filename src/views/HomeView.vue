<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import Badge from "@/components/ui/Badge.vue";
import Textarea from "@/components/ui/Textarea.vue";
import {useCardsState} from "@/composables/useCardsState";

const {
  // state
  isLearningMode,
  showImportModal,
  isShowAnswer,
  importJsonForm,
  isLoadingAi,
  isSyncing,
  syncError,
  syncSuccess,
  cards,
  version,
  dueCards,
  currentCard,
  currentCardDetail,

  // actions
  startLearning,
  clearCards,
  answer,
  importJson,
  saveStateToSupabase,
  loadStateFromSupabase,
  removeCard,
  aiDescription,
  getPrompt,
} = useCardsState();
</script>

<template>
  <div class="container mx-auto m:px-2 mt-5">
    <div class="flex justify-between items-center gap-2 m:flex-col">
      <div class="text-xl">Список вопросов ver.{{ version }}</div>
      <div class="flex items-center gap-x-2 justify-end m:justify-center m:grid m:grid-cols-2 m:gap-1">


        <Button class="m:flex-1" size="sm" @click="startLearning">
          Начать изучение
          <Badge variant="secondary">+{{ dueCards.length }}</Badge>
        </Button>

        <Button class="m:flex-1" size="sm" @click="showImportModal = true">
          Импортировать вопросы
        </Button>

        <Button class="m:flex-1" size="sm" @click="clearCards">Очистить</Button>

        <!-- новые кнопки работы с Supabase -->
        <Button
            class="m:flex-1"
            size="sm"
            :disabled="isSyncing"
            @click="saveStateToSupabase"
        >
          {{ isSyncing ? "Сохранение..." : "Сохранить" }}
        </Button>

        <Button
            class="m:flex-1"
            size="sm"
            :disabled="isSyncing"
            @click="loadStateFromSupabase"
        >
          {{ isSyncing ? "Загрузка..." : "Загрузить" }}
        </Button>
      </div>
    </div>

    <div v-if="syncError" class="mt-2 text-sm text-red-500">
      {{ syncError }}
    </div>
    <div v-if="syncSuccess" class="mt-2 text-sm text-emerald-500">
      {{ syncSuccess }}
    </div>

    <!-- Таблица -->
    <div class="mt-3 dark:bg-neutral-900 bg-neutral-100 px-5 py-4 rounded-lg overflow-x-auto">
      <div class="flex font-black m:hidden">
        <div class="flex-1">Вопрос</div>
        <div class="flex-1">Ответ</div>
        <div class="flex-1">Дата показа</div>
        <div class="flex-1">Статус</div>
        <div class="flex-1">Уровень</div>
        <div class="flex-1"></div>
      </div>
      <div v-for="c in cards" :key="c.getQuestion()" class="">
        <div class="flex items-center mt-2 m:flex-col m:items-start">
          <div class="flex-1">{{ c.getQuestion() }}</div>
          <div class="flex-1"><!-- {{ c.getAnswer() }} --></div>
          <div class="flex items-center space-x-2 flex-1 m:hidden">
            {{ c.getFormattedNextShowDate() }}
          </div>
          <div class="flex-1 m:hidden">
            <Badge variant="secondary">
              {{ c.isReady() ? "готово" : "не готов" }}
            </Badge>
          </div>
          <div class="flex-1 m:hidden">{{ c.getLevel() }}</div>
          <div class="flex-1 ">
            <Button size="sm" class="m:mt-3" @click="removeCard(c)">Удалить</Button>
          </div>
        </div>
        <hr class="my-5">
      </div>
    </div>
  </div>

  <Dialog :isShow="showImportModal" @update:isShow="showImportModal = $event">
    <template #header>
      <DialogTitle>Импорт вопросов в JSON формате</DialogTitle>
    </template>
    <Textarea
        placeholder='[{"q": "", "a": ""}]'
        v-model="importJsonForm"
        class="min-h-40"
    ></Textarea>
    <Button class="w-full mt-5" size="sm" @click="importJson">
      Начать импорт
    </Button>
  </Dialog>

  <Dialog :isShow="isLearningMode" @update:isShow="isLearningMode = $event">
    <template #header>
      <DialogTitle>Изучение

        <Badge variant="secondary" class="ml-2">{{ dueCards.length }}</Badge>

      </DialogTitle>
    </template>

    <div class="flex flex-col h-[87dvh]">
      <div v-if="currentCard" class="flex-1 overflow-y-auto scroll-nice">
        <div v-if="!isShowAnswer" class="mb-2">
          <div class="mb-1 text-xs">Вопрос:</div>
          <div>{{ currentCard.getQuestion() }}</div>
        </div>

        <div v-if="isShowAnswer" class="mb-4">
          <div class="mb-1 text-xs">Ответ:</div>
          <div>{{ currentCard.getAnswer() }}</div>
          <div v-if="currentCardDetail">
            <hr class="my-5">
            {{ currentCardDetail }}
          </div>
          <div v-else class="mt-5">
            <Button @click="aiDescription">{{ isLoadingAi ? 'Loading' : 'AI объяснение' }}</Button>
            <a class="ml-2" target="_blank" :href="`https://chatgpt.com/?prompt=${getPrompt()}`"><Button>Спросить в ChatGPT</Button></a>
          </div>
        </div>
      </div>

      <div v-if="currentCard" class="mt-10 mb-5">
        <div class="w-full flex">
        <Button variant="outline" @click="removeCard(currentCard)"
                class="w-full max-w-sm mx-auto flex justify-center mb-3">Удалить карточку
        </Button>
        </div>
        <div v-if="!isShowAnswer" class="flex flex-col w-full gap-y-5">
          <Button
              @click="isShowAnswer = true"
              class="w-full max-w-sm mx-auto flex justify-center"
          >
            Показать ответ
          </Button>
        </div>

        <div v-if="isShowAnswer" class="flex justify-center gap-3 flex-col max-w-sm mx-auto">
          <Button variant="destructive" @click="answer('again')" class="flex-1">Не вспомнил (+{{currentCard.calculateMinutesNextShowDateByDifficulty('again')}} мин)</Button>
          <Button variant="warning" @click="answer('hard')" class="flex-1">Можно и лучше (+{{currentCard.calculateMinutesNextShowDateByDifficulty('hard')}} мин)</Button>
          <Button variant="success" @click="answer('good')" class="flex-1">Помню (+{{currentCard.calculateMinutesNextShowDateByDifficulty('good')}} мин)</Button>
        </div>
      </div>

      <div v-if="!currentCard">
        На сейчас нет карточек для повторения 🎉
      </div>
    </div>
  </Dialog>
</template>
