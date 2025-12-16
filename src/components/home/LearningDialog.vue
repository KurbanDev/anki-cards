<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import Badge from "@/components/ui/Badge.vue";
import type {Card, Difficulty} from "@/composables/Card";

const props = defineProps<{
  isLearningMode: boolean;
  isShowAnswer: boolean;
  dueCount: number;
  currentCard: Card | null;
  currentCardDetail: string | undefined;
  isLoadingAi: boolean;
  chatPrompt: string;
}>();

const emit = defineEmits<{
  (e: "update:isLearningMode", value: boolean): void;
  (e: "update:isShowAnswer", value: boolean): void;
  (e: "answer", difficulty: Difficulty): void;
  (e: "remove", card: Card): void;
  (e: "ai-description"): void;
}>();

const closeDialog = (value: boolean) => emit("update:isLearningMode", value);
const showAnswer = () => emit("update:isShowAnswer", true);
const hideAnswer = () => emit("update:isShowAnswer", false);
const onAnswer = (difficulty: Difficulty) => emit("answer", difficulty);
const onRemove = (card: Card) => emit("remove", card);
const requestAi = () => emit("ai-description");
</script>

<template>
  <Dialog :isShow="props.isLearningMode" @update:isShow="closeDialog($event)">
    <template #header>
      <DialogTitle>
        Изучение
        <Badge variant="secondary" class="ml-2">{{ props.dueCount }}</Badge>
      </DialogTitle>
    </template>

    <div class="flex flex-col h-[87dvh]">
      <div v-if="props.currentCard" class="flex-1 overflow-y-auto scroll-nice">
        <div v-if="!props.isShowAnswer" class="mb-2">
          <div class="mb-1 text-xs">Вопрос:</div>
          <div>{{ props.currentCard.getQuestion() }}</div>
        </div>

        <div v-if="props.isShowAnswer" class="mb-4">
          <div class="mb-1 text-xs">Ответ:</div>
          <div>{{ props.currentCard.getAnswer() }}</div>
          <div v-if="props.currentCardDetail">
            <hr class="my-5">
            {{ props.currentCardDetail }}
          </div>
          <div v-else class="mt-5 flex gap-2">
            <Button @click="requestAi">{{ props.isLoadingAi ? 'Loading' : 'AI объяснение' }}</Button>
            <a class="ml-2" target="_blank" :href="`https://chatgpt.com/?prompt=${props.chatPrompt}`">
              <Button>Спросить в ChatGPT</Button>
            </a>
          </div>
        </div>
      </div>

      <div v-if="props.currentCard" class="mt-10 mb-5">
        <div class="w-full flex">
          <Button
              variant="outline"
              class="w-full max-w-sm mx-auto flex justify-center mb-3"
              @click="onRemove(props.currentCard); hideAnswer();"
          >
            Удалить карточку
          </Button>
        </div>

        <div v-if="!props.isShowAnswer" class="flex flex-col w-full gap-y-5">
          <Button
              class="w-full max-w-sm mx-auto flex justify-center"
              @click="showAnswer"
          >
            Показать ответ
          </Button>
        </div>

        <div v-if="props.isShowAnswer" class="flex justify-center gap-3 flex-col max-w-sm mx-auto">
          <Button variant="destructive" class="flex-1" @click="onAnswer('again')">
            Не вспомнил (+{{ props.currentCard.calculateMinutesNextShowDateByDifficulty('again') }} мин)
          </Button>
          <Button variant="warning" class="flex-1" @click="onAnswer('hard')">
            Можно и лучше (+{{ props.currentCard.calculateMinutesNextShowDateByDifficulty('hard') }} мин)
          </Button>
          <Button variant="success" class="flex-1" @click="onAnswer('good')">
            Помню (+{{ props.currentCard.calculateMinutesNextShowDateByDifficulty('good') }} мин)
          </Button>
        </div>
      </div>

      <div v-if="!props.currentCard">
        На сейчас нет карточек для повторения 🎉
      </div>
    </div>
  </Dialog>
</template>
