<template>
  <Dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <template #header>
      <DialogTitle>Добавить карточки</DialogTitle>
      <DialogDescription>
        Добавьте карточку по одной или загрузите несколько через JSON
      </DialogDescription>
    </template>

    <div class="space-y-4">
      <div class="flex gap-2 max-[1000px]:flex-col">
        <Button
          :variant="mode === 'single' ? 'default' : 'outline'"
          @click="mode = 'single'"
          class="flex-1 w-full"
        >
          Одна карточка
        </Button>
        <Button
          :variant="mode === 'json' ? 'default' : 'outline'"
          @click="mode = 'json'"
          class="flex-1 w-full"
        >
          JSON массив
        </Button>
      </div>

      <!-- Single card mode -->
      <div v-if="mode === 'single'" class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">Вопрос</label>
          <Input
            v-model="singleCard.question"
            placeholder="Введите вопрос"
          />
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">Ответ</label>
          <Textarea
            v-model="singleCard.answer"
            placeholder="Введите ответ (можно использовать HTML)"
            rows="4"
          />
        </div>
        <Button @click="addSingleCard" :disabled="!singleCard.question || !singleCard.answer" class="w-full">
          Добавить карточку
        </Button>
      </div>

      <!-- JSON mode -->
      <div v-if="mode === 'json'" class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">JSON массив</label>
          <Textarea
            v-model="jsonInput"
            placeholder='[{"question": "...", "answer": "..."}, ...]'
            rows="8"
            class="font-mono text-xs"
          />
        </div>
        <Button @click="addJsonCards" :disabled="!jsonInput" class="w-full">
          Загрузить карточки
        </Button>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" @click="$emit('update:modelValue', false)">
        Закрыть
      </Button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Dialog from './ui/Dialog.vue'
import DialogTitle from './ui/DialogTitle.vue'
import DialogDescription from './ui/DialogDescription.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import Textarea from './ui/Textarea.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'add-cards'])

const mode = ref('single')
const singleCard = ref({ question: '', answer: '' })
const jsonInput = ref('')

const addSingleCard = () => {
  if (singleCard.value.question && singleCard.value.answer) {
    emit('add-cards', [{
      question: singleCard.value.question,
      answer: singleCard.value.answer
    }])
    singleCard.value = { question: '', answer: '' }
    emit('update:modelValue', false)
  }
}

const addJsonCards = () => {
  try {
    const cards = JSON.parse(jsonInput.value)
    if (Array.isArray(cards)) {
      const validCards = cards.filter(card => card.question && card.answer)
      if (validCards.length > 0) {
        emit('add-cards', validCards)
        jsonInput.value = ''
        emit('update:modelValue', false)
      } else {
        alert('Не найдено валидных карточек в массиве')
      }
    } else {
      alert('JSON должен быть массивом')
    }
  } catch (e) {
    alert('Ошибка парсинга JSON: ' + e.message)
  }
}
</script>

