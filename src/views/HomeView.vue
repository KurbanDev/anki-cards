<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import Button from "@/components/ui/Button.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import Badge from "@/components/ui/Badge.vue";
import {Card, Difficulty} from "@/composables/Card.js";
import Textarea from "@/components/ui/Textarea.vue";
import {createClient} from "@supabase/supabase-js";
import {useAi} from "@/composables/useAi";

const LS_KEY = "cards-data";


// ========= Supabase =========
const supabaseUrl = 'https://glgjvggbedqijbqogtfx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZ2p2Z2diZWRxaWpicW9ndGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNDc3OTksImV4cCI6MjA4MDcyMzc5OX0.4m8TQorl64ila2m3wfndAC94YBH_vq7EtYdrxLNJWog'
const supabase = createClient(supabaseUrl, supabaseKey)

// ========= Рефы / состояние =========
const isLearningMode = ref(false);
const showImportModal = ref(false);
const isShowAnswer = ref(false);
const importJsonForm = ref("");
const isLoadingAi = ref(false)

const isSyncing = ref(false);
const syncError = ref<string | null>(null);
const syncSuccess = ref<string | null>(null);

const cards = ref<Card[]>(loadCards() ?? []);
const version = ref(localStorage.getItem('cards-version') ?? 1)

const now = ref(Date.now());
let timerId: any;

// ========= Тип для JSON-состояния =========
interface CardState {
  q: string;
  a: string;
  level: number;
  nextShowDate: number;
}

// ========= Компьютед =========
const dueCards = computed(() =>
    cards.value
        .filter((c: Card) => c.getNextShowDate() <= now.value)
        .sort((a: Card, b: Card) => a.getNextShowDate() - b.getNextShowDate())
);

const currentCard = computed(() => dueCards.value[0] ?? null);

// ========= Работа с localStorage =========
function loadCards(): Card[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);

    if (!raw) return null;

    const parsed: CardState[] = JSON.parse(raw);

    return parsed.map((c) => {
      return new Card({
        q: c.q,
        a: c.a,
        level: c.level,
        nextShowDate: c.nextShowDate,
      });
    });
  } catch (e) {
    console.error("Ошибка чтения localStorage:", e);
    return null;
  }
}

function serializeCards(): CardState[] {
  // Преобразуем Card в простой json
  return cards.value.map((c) => ({
    q: c.getQuestion(),
    a: c.getAnswer(),
    level: c.getLevel(),
    nextShowDate: c.getNextShowDate(),
  }));
}

function deserializeCards(data: CardState[]): Card[] {
  return data.map(
      (c) =>
          new Card({
            q: c.q,
            a: c.a,
            level: c.level,
            nextShowDate: c.nextShowDate,
          })
  );
}


// ========= Логика карточек =========

function answer(difficulty: Difficulty) {
  if (!currentCard.value) return;

  currentCard.value.selectDifficulty(difficulty);

  isShowAnswer.value = false;

  if (!dueCards.value.length) {
    isLearningMode.value = false;
  }
}

function importJson() {
  try {
    const parsedText = JSON.parse(importJsonForm.value);
    importJsonForm.value = "";

    parsedText.map((c: any) => {
      cards.value.push(
          new Card({
            q: c.q,
            a: c.a,
            level: 0,
            nextShowDate: Date.now(),
          })
      );
    });
  } catch (e) {
    console.error("Ошибка парсинга json при импорте:", e);
  }
}

// ========= Supabase: сохранение / загрузка =========

async function saveStateToSupabase() {


  // userId больше не нужен
  isSyncing.value = true;
  syncError.value = null;
  syncSuccess.value = null;

  const data = serializeCards();

  try {


    // 1. Ищем первую строку в таблице state
    const {data: rows, error: selectError} = await supabase
        .from("state")
        .select("id, version")
        .order("id", {ascending: true})
        .limit(1);

    if (rows[0].version > version.value) {
      if (!confirm('Версия в базе выше вашей')) {
        return;
      }
    }

    if (selectError) {
      console.error("Ошибка чтения из Supabase:", selectError);
      syncError.value = "Не удалось прочитать состояние из Supabase";
      return;
    }

    if (rows && rows.length > 0) {
      // 2. Строка есть — обновляем её
      const id = rows[0].id;

      const { data: updated, updateError } = await supabase
          .from("state")
          .update({ data })
          .eq("id", id)
          .select("version")
          .single();

      version.value = updated.version

      if (updateError) {
        console.error("Ошибка обновления в Supabase:", updateError);
        syncError.value = "Не удалось обновить состояние в Supabase";
        return;
      }

      syncSuccess.value = "Состояние успешно обновлено в Supabase";
    } else {
      // 3. Строк нет — создаём новую


      console.log(version.value)

      const {error: insertError} = await supabase
          .from("state")
          .insert({ data, version: 1 })
          .select()
          .single();

      version.value = 1;

      if (insertError) {
        console.error("Ошибка создания записи в Supabase:", insertError);
        syncError.value = "Не удалось создать состояние в Supabase";
        return;
      }

      syncSuccess.value = "Состояние успешно создано в Supabase";
    }
  } catch (e) {
    console.error("Неизвестная ошибка при сохранении в Supabase:", e);
    syncError.value = "Произошла ошибка при сохранении в Supabase";
  } finally {
    isSyncing.value = false;
  }
}

async function loadStateFromSupabase() {

  // localStorage.setItem('cards-version', String(Date.now()))

  /*  if (!userId.value) {
      ensureUserId();
    }
    if (!userId.value) return;*/

  isSyncing.value = true;
  syncError.value = null;
  syncSuccess.value = null;

  try {
    const {data, error} = await supabase
        .from("state")
        .select("data, version")
        .single();

    version.value = data.version;

    if (error) {
      console.error("Ошибка загрузки из Supabase:", error);
      syncError.value = "Не удалось загрузить состояние из Supabase";
      return;
    }

    if (data && data.data) {
      cards.value = deserializeCards(data.data as CardState[]);
      syncSuccess.value = "Состояние успешно загружено из Supabase";
    } else {
      syncError.value = "Для этого пользователя нет сохранённого состояния";
    }
  } catch (e) {
    console.error("Неизвестная ошибка при загрузке из Supabase:", e);
    syncError.value = "Произошла ошибка при загрузке из Supabase";
  } finally {
    isSyncing.value = false;
  }
}


function clear() {
  if (confirm('Подтвердите удаление')) {
    cards.value = [];
  }
}

// ========= Жизненный цикл =========

onMounted(async () => {
  // ensureUserId();

  const {data: rows, error: selectError} = await supabase
      .from("state")
      .select("version")
      .order("id", {ascending: true})
      .limit(1);

  if (rows[0].version > Number(version.value)) {
    alert('Данные на сервере опережают локальные. Необходимо загрузить данные из базы')
  }

  timerId = setInterval(() => (now.value = Date.now()), 60 * 1000);
});

onBeforeUnmount(() => clearInterval(timerId));

// По-прежнему сохраняем снапшот в localStorage (как сейчас)
watch(
    cards,
    (newVal) => localStorage.setItem(LS_KEY, JSON.stringify(serializeCards())),
    {deep: true}
);

watch(version, (newVal) => localStorage.setItem('cards-version', String(newVal)))


function removeCard(card: Card) {
  if (confirm('Подтверждение')) {
    cards.value = cards.value.filter(c => c.getQuestion() !== card.getQuestion());
  }
  isShowAnswer.value = false
}

function getPrompt() {
  return `Я отвечаю на вопросы. У меня есть вопрос ${currentCard.value.getQuestion()}, а в ответе указано: ${currentCard.value.getAnswer()}. Объясни подробно этот ответ.`;
}

async function aiDescription() {
  if (isLoadingAi.value) {
    return;
  }
  const context = `Я отвечаю на вопросы. У меня есть вопрос ${currentCard.value.getQuestion()}, а в ответе указано: ${currentCard.value.getAnswer()}. Объясни подробно этот ответ.`;
  isLoadingAi.value = true
  await useAi().send(context).then((a) => {
    currentCard.value.detailAnswer = a
  })
  isLoadingAi.value = false
}
</script>

<template>
  <div class="container mx-auto m:px-2 mt-5">
    <div class="flex justify-between items-center gap-2 m:flex-col">
      <div class="text-xl">Список вопросов ver.{{ version }}</div>
      <div class="flex items-center gap-x-2 justify-end m:justify-center m:grid m:grid-cols-2 m:gap-1">


        <Button class="m:flex-1" size="sm" @click="isLearningMode = true">
          Начать изучение
          <Badge variant="secondary">+{{ dueCards.length }}</Badge>
        </Button>

        <Button class="m:flex-1" size="sm" @click="showImportModal = true">
          Импортировать вопросы
        </Button>

        <Button class="m:flex-1" size="sm" @click="clear">Очистить</Button>

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
          <div v-if="currentCard.detailAnswer">
            <hr class="my-5">
            {{ currentCard.detailAnswer }}
          </div>
          <div v-else class="mt-5">
            <Button @click="aiDescription">{{ isLoadingAi ? 'Loading' : 'AI объяснение' }}</Button>
            <a class="ml-2" target="_blank" :href="`https://chatgpt.com/?prompt=${getPrompt()}`"><Button @click="">Спросить в ChatGPT</Button></a>
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
