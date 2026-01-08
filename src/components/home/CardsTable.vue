<script setup lang="ts">
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import {computed} from "vue";
import {Card} from "@/composables/Card";

type CardLike = Card | {
  q: string;
  a: string;
  level?: number;
  nextShowDate?: number;
};
const props = defineProps<{
  cards: CardLike[];
}>();

const normalizedCards = computed(() =>
    props.cards.map((card) => {
      if (card instanceof Card) return card;

      const {q, a, level = 0, nextShowDate = Date.now()} = card;
      return new Card({q, a, level, nextShowDate});
    })
);

const emit = defineEmits<{
  (e: "remove", card: Card): void;
}>();

const onRemove = (card: Card) => emit("remove", card);
</script>

<template>
  <div class="mt-3 dark:bg-neutral-900 bg-neutral-100 px-5 py-4 rounded-lg overflow-x-auto">
    <div class="flex font-black m:hidden">
      <div class="flex-1">Вопрос</div>
      <div class="flex-1">Ответ</div>
      <div class="flex-1">Дата показа</div>
      <div class="flex-1">Статус</div>
      <div class="flex-1">Уровень</div>
      <div class="flex-1"></div>
    </div>

    <div v-for="card in normalizedCards" :key="card.getQuestion()">
      <div class="flex items-center mt-2 m:flex-col m:items-start">
        <div class="flex-1">{{ card.getQuestion() }}</div>
        <div class="flex-1"><!-- {{ card.getAnswer() }} --></div>
        <div class="flex items-center space-x-2 flex-1 m:hidden">
          {{ card.getFormattedNextShowDate() }}
        </div>
        <div class="flex-1 m:hidden">
          <Badge variant="secondary">
            {{ card.isReady() ? "готово" : "не готов" }}
          </Badge>
        </div>
        <div class="flex-1 m:hidden">{{ card.getLevel() }}</div>
        <div class="flex-1">
          <Button size="sm" class="m:mt-3" @click="onRemove(card)">Удалить</Button>
        </div>
      </div>
      <hr class="my-5">
    </div>
  </div>
</template>
