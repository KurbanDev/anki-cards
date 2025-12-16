<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import Button from "@/components/ui/Button.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import Badge from "@/components/ui/Badge.vue";
import {Card, Difficulty} from "@/composables/Card.js";
import Textarea from "@/components/ui/Textarea.vue";

const LS_KEY = "cards-data"

const isLearningMode = ref(false);
const showImportModal = ref(false)
const isShowAnswer = ref(false);
const importJsonForm = ref('')

const cards = ref<Card[]>(loadCards() ?? []);

const now = ref(Date.now());
let timerId: any;

const dueCards = computed(() =>
    cards.value
        .filter((c: Card) => c.getNextShowDate() <= now.value)
        .sort((a: Card, b: Card) => a.getNextShowDate() - b.getNextShowDate())
);

const currentCard = computed(() => dueCards.value[0] ?? null);

function loadCards() {
  try {
    const raw = localStorage.getItem(LS_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw).map(c => {
      return new Card({
        q: c.q,
        a: c.a,
        level: c.level,
        nextShowDate: c.nextShowDate
      })
    })
  } catch (e) {
    console.error("Ошибка чтения localStorage:", e)
    return null
  }
}

function answer(difficulty: Difficulty) {
  if (!currentCard.value) {
    return
  }

  currentCard.value.selectDifficulty(difficulty)

  isShowAnswer.value = false

  if (!dueCards.value.length) {
    isLearningMode.value = false;
  }
}

function importJson() {
  try {
    const parsedText = JSON.parse(importJsonForm.value)
    importJsonForm.value = ''

    parsedText.map(c => {
      cards.value.push(new Card({
        q: c.q,
        a: c.a,
        level: 0,
        nextShowDate: Date.now()
      }))
    })

  } catch (e) {

  }
}


onMounted(() => {
  timerId = setInterval(() => now.value = Date.now(), 60 * 1000);
});

onBeforeUnmount(() => clearInterval(timerId));

watch(cards, (newVal) => localStorage.setItem(LS_KEY, JSON.stringify(newVal)), {deep: true})

</script>

<template>

  <div class="container mx-auto m:px-2 mt-5">

    <div class="flex justify-between items-center">
      <div class="text-xl">Список вопросов</div>
      <div class="flex items-center gap-x-2 justify-end m:justify-center">
        <Button class="m:flex-1" size="sm" @click="isLearningMode = true">
          Начать изучение
          <Badge variant="secondary">+{{ dueCards.length }}</Badge>
        </Button>

        <Button class="m:flex-1" size="sm" @click="showImportModal = true">Импортировать вопросы</Button>
      </div>
    </div>

    <div class="mt-3 dark:bg-neutral-900 bg-neutral-100  px-5 py-4 rounded-lg">
      <div class="flex font-black">
        <div class="flex-1">Вопрос</div>
        <div class="flex-1">Ответ</div>
        <div class="flex-1">Дата показа</div>
        <div class="flex-1">Статус</div>
        <div class="flex-1">Уровень</div>
      </div>
      <div v-for="c in cards" class="flex items-center mt-2">
        <div class="flex-1">{{ c.getQuestion() }}</div>
        <div class="flex-1"><!--{{ c.getAnswer() }}--></div>
        <div class="flex items-center space-x-2 flex-1">
          {{ c.getFormattedNextShowDate() }}
        </div>
        <div class="flex-1">
          <Badge variant="secondary">
            {{ c.isReady() ? 'готово' : 'не готов' }}
          </Badge>
        </div>
        <div class="flex-1">{{ c.getLevel() }}</div>
      </div>
    </div>
  </div>


  <Dialog :isShow="showImportModal" @update:isShow="showImportModal = $event">
    <template #header>
      <DialogTitle>Импорт вопросов в JSON формате</DialogTitle>
    </template>
    <Textarea placeholder="[{q: '', a: ''}]" v-model="importJsonForm" class="min-h-40"></Textarea>
    <Button class="w-full mt-5" size="sm" @click="importJson">Начать импорт</Button>
  </Dialog>


  <Dialog :isShow="isLearningMode" @update:isShow="isLearningMode = $event">
    <template #header>
      <DialogTitle>Изучение</DialogTitle>
    </template>

    <div  class="flex flex-col h-[87dvh]">

      <div v-if="currentCard" class="flex-1 overflow-y-auto scroll-nice">
        <div v-if="!isShowAnswer" class="mb-2">
          <div class="mb-1 text-xs">Вопрос:</div>
          <div>{{ currentCard.getQuestion() }}</div>
        </div>

        <div v-if="isShowAnswer" class="mb-4">
          <div class="mb-1 text-xs">Ответ:</div>
          <div>{{ currentCard.getAnswer() }} </div>
        </div>
      </div>

      <div v-if="currentCard" class="mt-10">
        <div v-if="!isShowAnswer" class="flex w-full">
          <Button
              @click="isShowAnswer = true"
              class="w-full max-w-sm mx-auto flex justify-center "
          >
            Показать ответ
          </Button>
        </div>

        <div v-if="isShowAnswer" class="flex justify-center gap-3">
          <Button @click="answer('again')" class="flex-1">Снова</Button>
          <Button @click="answer('hard')" class="flex-1">Трудно</Button>
          <Button @click="answer('good')" class="flex-1">Норм</Button>
          <Button @click="answer('easy')" class="flex-1">Легко</Button>
        </div>
      </div>

      <div v-if="!currentCard">
        На сейчас нет карточек для повторения 🎉
      </div>
    </div>
  </Dialog>
</template>
