import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {Card, Difficulty} from "@/composables/Card";
import {createClient} from "@supabase/supabase-js";
import {useAi} from "@/composables/useAi";

const LS_KEY = "cards-data";
const VERSION_KEY = "cards-version";

const supabaseUrl = "https://glgjvggbedqijbqogtfx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZ2p2Z2diZWRxaWpicW9ndGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNDc3OTksImV4cCI6MjA4MDcyMzc5OX0.4m8TQorl64ila2m3wfndAC94YBH_vq7EtYdrxLNJWog";
const supabase = createClient(supabaseUrl, supabaseKey);

interface CardState {
  q: string;
  a: string;
  level: number;
  nextShowDate: number;
}

function loadCardsFromStorage(): Card[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];

    const parsed: CardState[] = JSON.parse(raw);

    return parsed.map(
        (c) =>
            new Card({
              q: c.q,
              a: c.a,
              level: c.level,
              nextShowDate: c.nextShowDate,
            })
    );
  } catch (e) {
    console.error("Ошибка чтения localStorage:", e);
    return [];
  }
}

function serializeCards(cards: Card[]): CardState[] {
  return cards.map((c) => ({
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

export function useCardsState() {
  const isLearningMode = ref(false);
  const showImportModal = ref(false);
  const isShowAnswer = ref(false);
  const importJsonForm = ref("");
  const isLoadingAi = ref(false);

  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);
  const syncSuccess = ref<string | null>(null);

  const cards = ref<Card[]>(loadCardsFromStorage());
  const version = ref<number>(Number(localStorage.getItem(VERSION_KEY)) || 1);

  const now = ref(Date.now());
  let timerId: number | null = null;

  const dueCards = computed(() =>
      cards.value
          .filter((c: Card) => c.getNextShowDate() <= now.value)
          .sort((a: Card, b: Card) => a.getNextShowDate() - b.getNextShowDate())
  );

  const currentCard = computed(() => dueCards.value[0] ?? null);
  const currentCardDetail = computed(() => currentCard.value?.getDetailAnswer());

  function persistCards() {
    localStorage.setItem(LS_KEY, JSON.stringify(serializeCards(cards.value)));
  }

  function persistVersion() {
    localStorage.setItem(VERSION_KEY, String(version.value));
  }

  function startLearning() {
    isLearningMode.value = true;
  }

  function clearCards() {
    if (confirm("Подтвердите удаление")) {
      cards.value = [];
    }
  }

  function answer(difficulty: Difficulty) {
    if (!currentCard.value) return;

    currentCard.value.selectDifficulty(difficulty);
    isShowAnswer.value = false;

    if (!dueCards.value.length) {
      isLearningMode.value = false;
    }
  }

  function importJson() {
    if (!importJsonForm.value.trim()) return;

    try {
      const parsedText = JSON.parse(importJsonForm.value);
      importJsonForm.value = "";

      const importedCards = parsedText.map(
          (c: any) =>
              new Card({
                q: c.q,
                a: c.a,
                level: 0,
                nextShowDate: Date.now(),
              })
      );

      cards.value = [...cards.value, ...importedCards];
    } catch (e) {
      console.error("Ошибка парсинга json при импорте:", e);
    }
  }

  async function saveStateToSupabase() {
    isSyncing.value = true;
    syncError.value = null;
    syncSuccess.value = null;

    try {
      const {data: rows, error: selectError} = await supabase
          .from("state")
          .select("id, version")
          .order("id", {ascending: true})
          .limit(1);

      if (selectError) {
        console.error("Ошибка чтения из Supabase:", selectError);
        syncError.value = "Не удалось прочитать состояние из Supabase";
        return;
      }

      const existingRow = rows?.[0];
      if (existingRow && existingRow.version > version.value) {
        if (!confirm("Версия в базе выше вашей")) {
          return;
        }
      }

      const data = serializeCards(cards.value);

      if (existingRow) {
        const {data: updated, error: updateError} = await supabase
            .from("state")
            .update({data})
            .eq("id", existingRow.id)
            .select("version")
            .single();

        if (updateError) {
          console.error("Ошибка обновления в Supabase:", updateError);
          syncError.value = "Не удалось обновить состояние в Supabase";
          return;
        }

        version.value = updated?.version ?? version.value;
        syncSuccess.value = "Состояние успешно обновлено в Supabase";
      } else {
        const {data: inserted, error: insertError} = await supabase
            .from("state")
            .insert({data, version: 1})
            .select("version")
            .single();

        if (insertError) {
          console.error("Ошибка создания записи в Supabase:", insertError);
          syncError.value = "Не удалось создать состояние в Supabase";
          return;
        }

        version.value = inserted?.version ?? 1;
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
    isSyncing.value = true;
    syncError.value = null;
    syncSuccess.value = null;

    try {
      const {data, error} = await supabase
          .from("state")
          .select("data, version")
          .single();

      if (error) {
        console.error("Ошибка загрузки из Supabase:", error);
        syncError.value = "Не удалось загрузить состояние из Supabase";
        return;
      }

      if (data?.data) {
        cards.value = deserializeCards(data.data as CardState[]);
        version.value = data.version;
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

  function removeCard(card: Card) {
    if (confirm("Подтверждение")) {
      cards.value = cards.value.filter((c) => c.getQuestion() !== card.getQuestion());
    }
    isShowAnswer.value = false;
  }

  function getPrompt() {
    if (!currentCard.value) return "";
    return `Я отвечаю на вопросы. У меня есть вопрос ${currentCard.value.getQuestion()}, а в ответе указано: ${currentCard.value.getAnswer()}. Объясни подробно этот ответ.`;
  }

  async function aiDescription() {
    if (isLoadingAi.value || !currentCard.value) {
      return;
    }
    const context = getPrompt();
    isLoadingAi.value = true;

    try {
      const aiAnswer = await useAi().send(context);
      currentCard.value?.setDetailAnswer(aiAnswer);
    } catch (e) {
      console.error("Ошибка получения ответа AI:", e);
    } finally {
      isLoadingAi.value = false;
    }
  }

  onMounted(async () => {
    const {data: rows} = await supabase
        .from("state")
        .select("version")
        .order("id", {ascending: true})
        .limit(1);

    const remoteVersion = rows?.[0]?.version;
    if (remoteVersion && remoteVersion > Number(version.value)) {
      alert("Данные на сервере опережают локальные. Необходимо загрузить данные из базы");
    }

    timerId = window.setInterval(() => (now.value = Date.now()), 60 * 1000);
  });

  onBeforeUnmount(() => {
    if (timerId) {
      clearInterval(timerId);
    }
  });

  watch(cards, persistCards, {deep: true});
  watch(version, persistVersion);

  return {
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
  };
}
