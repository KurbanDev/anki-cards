<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import Textarea from "@/components/ui/Textarea.vue";

const props = defineProps<{
  isShow: boolean;
  importJsonForm: string;
}>();

const emit = defineEmits<{
  (e: "update:isShow", value: boolean): void;
  (e: "update:importJsonForm", value: string): void;
  (e: "import-json"): void;
}>();

const updateVisibility = (value: boolean) => emit("update:isShow", value);
const updateImportValue = (value: string) => emit("update:importJsonForm", value);
</script>

<template>
  <Dialog :isShow="props.isShow" @update:isShow="updateVisibility($event)">
    <template #header>
      <DialogTitle>Импорт вопросов в JSON формате</DialogTitle>
    </template>
    <Textarea
        placeholder='[{"q": "", "a": ""}]'
        :model-value="props.importJsonForm"
        class="min-h-40"
        @update:model-value="updateImportValue"
    />
    <Button class="w-full mt-5" size="sm" @click="emit('import-json')">
      Начать импорт
    </Button>
  </Dialog>
</template>
