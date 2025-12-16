import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {Card, Difficulty} from "@/composables/Card";
import {loadCardsFromStorage, persistCards, persistVersion} from "@/domain/cards/persistence/localStorageGateway";
import {buildCardPrompt, loadAiDescription} from "@/domain/cards/services/aiDescriptionService";
import {fetchRemoteVersion, loadStateFromSupabase, saveStateToSupabase} from "@/domain/cards/sync/supabaseGateway";

export function useCardsState() {
  const isLearningMode = ref(false);
  const showImportModal = ref(false);
  const isShowAnswer = ref(false);
  const importJsonForm = ref("");
  const isLoadingAi = ref(false);

  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);
  const syncSuccess = ref<string | null>(null);

  const {cards: initialCards, version: initialVersion} = loadCardsFromStorage();
  const cards = ref<Card[]>(initialCards);
  const version = ref<number>(initialVersion);

  const now = ref(Date.now());
  let timerId: number | null = null;

  const dueCards = computed(() =>
      cards.value
          .filter((c: Card) => c.getNextShowDate() <= now.value)
          .sort((a: Card, b: Card) => a.getNextShowDate() - b.getNextShowDate())
  );

  const currentCard = computed(() => dueCards.value[0] ?? null);
  const currentCardDetail = computed(() => currentCard.value?.getDetailAnswer());

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

  async function saveState() {
    isSyncing.value = true;
    syncError.value = null;
    syncSuccess.value = null;

    try {
      const remoteVersion = await fetchRemoteVersion();
      if (remoteVersion && remoteVersion > version.value) {
        if (!confirm("Версия в базе выше вашей")) {
          return;
        }
      }

      const newVersion = await saveStateToSupabase(cards.value, version.value);
      version.value = newVersion;
      syncSuccess.value = "Состояние успешно сохранено в Supabase";
    } catch (e) {
      console.error("Ошибка сохранения в Supabase:", e);
      syncError.value = "Не удалось сохранить состояние в Supabase";
    } finally {
      isSyncing.value = false;
    }
  }

  async function loadState() {
    isSyncing.value = true;
    syncError.value = null;
    syncSuccess.value = null;

    try {
      const {cards: remoteCards, version: remoteVersion} = await loadStateFromSupabase();
      cards.value = remoteCards;
      version.value = remoteVersion;
      syncSuccess.value = "Состояние успешно загружено из Supabase";
    } catch (e: any) {
      console.error("Ошибка загрузки из Supabase:", e);
      syncError.value = e?.message ?? "Произошла ошибка при загрузке из Supabase";
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
    return buildCardPrompt(currentCard.value);
  }

  async function aiDescription() {
    if (isLoadingAi.value || !currentCard.value) {
      return;
    }
    isLoadingAi.value = true;

    try {
      const aiAnswer = await loadAiDescription(currentCard.value);
      currentCard.value?.setDetailAnswer(aiAnswer);
    } catch (e) {
      console.error("Ошибка получения ответа AI:", e);
    } finally {
      isLoadingAi.value = false;
    }
  }

  onMounted(async () => {
    const remoteVersion = await fetchRemoteVersion();
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

  watch(cards, () => persistCards(cards.value), {deep: true});
  watch(version, () => persistVersion(version.value));

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
    saveStateToSupabase: saveState,
    loadStateFromSupabase: loadState,
    removeCard,
    aiDescription,
    getPrompt,
  };
}
