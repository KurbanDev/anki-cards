<script setup lang="ts">
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";

const props = defineProps<{
  version: number;
  dueCount: number;
  isSyncing: boolean;
}>();

const emit = defineEmits<{
  (e: "start-learning"): void;
  (e: "open-import"): void;
  (e: "clear-cards"): void;
  (e: "save-state"): void;
  (e: "load-state"): void;
}>();

const handleStart = () => emit("start-learning");
const handleImport = () => emit("open-import");
const handleClear = () => emit("clear-cards");
const handleSave = () => emit("save-state");
const handleLoad = () => emit("load-state");
</script>

<template>
  <div class="flex justify-between items-center gap-2 m:flex-col">
    <div class="text-xl">Список вопросов ver.{{ props.version }}</div>

    <div
        class="flex items-center gap-x-2 justify-end m:justify-center m:grid m:grid-cols-2 m:gap-1"
    >
      <Button class="m:flex-1" size="sm" @click="handleStart">
        Начать изучение
        <Badge variant="secondary">+{{ props.dueCount }}</Badge>
      </Button>

      <Button class="m:flex-1" size="sm" @click="handleImport">
        Импортировать вопросы
      </Button>

      <Button class="m:flex-1" size="sm" @click="handleClear">Очистить</Button>

      <Button
          class="m:flex-1"
          size="sm"
          :disabled="props.isSyncing"
          @click="handleSave"
      >
        {{ props.isSyncing ? "Сохранение..." : "Сохранить" }}
      </Button>

      <Button
          class="m:flex-1"
          size="sm"
          :disabled="props.isSyncing"
          @click="handleLoad"
      >
        {{ props.isSyncing ? "Загрузка..." : "Загрузить" }}
      </Button>
    </div>
  </div>
</template>
