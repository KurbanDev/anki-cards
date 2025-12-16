<script setup lang="ts">
import CardsTable from "@/components/home/CardsTable.vue";
import CardsToolbar from "@/components/home/CardsToolbar.vue";
import ImportDialog from "@/components/home/ImportDialog.vue";
import LearningDialog from "@/components/home/LearningDialog.vue";
import {computed} from "vue";
import {useCardsState} from "@/composables/useCardsState";
import type {Card, Difficulty} from "@/composables/Card";

const state = useCardsState();

const dueCount = computed(() => state.dueCards.value.length);
const chatPrompt = computed(() => state.getPrompt());

const handleAnswer = (difficulty: Difficulty) => {
  state.answer(difficulty);
  state.isShowAnswer.value = false;
};

const handleRemove = (card: Card) => state.removeCard(card);
</script>

<template>
  <div class="container mx-auto m:px-2 mt-5 space-y-4">
    <CardsToolbar
        :version="state.version"
        :due-count="dueCount"
        :is-syncing="state.isSyncing"
        @start-learning="state.startLearning"
        @open-import="state.showImportModal = true"
        @clear-cards="state.clearCards"
        @save-state="state.saveStateToSupabase"
        @load-state="state.loadStateFromSupabase"
    />

    <div v-if="state.syncError" class="text-sm text-red-500">
      {{ state.syncError }}
    </div>
    <div v-if="state.syncSuccess" class="text-sm text-emerald-500">
      {{ state.syncSuccess }}
    </div>

    <CardsTable :cards="state.cards" @remove="handleRemove" />

    <ImportDialog
        :is-show="state.showImportModal"
        :import-json-form="state.importJsonForm"
        @update:isShow="state.showImportModal = $event"
        @update:importJsonForm="state.importJsonForm = $event"
        @import-json="state.importJson"
    />

    <LearningDialog
        :is-learning-mode="state.isLearningMode"
        :is-show-answer="state.isShowAnswer"
        :due-count="dueCount"
        :current-card="state.currentCard"
        :current-card-detail="state.currentCardDetail"
        :is-loading-ai="state.isLoadingAi"
        :chat-prompt="chatPrompt"
        @update:isLearningMode="state.isLearningMode = $event"
        @update:isShowAnswer="state.isShowAnswer = $event"
        @answer="handleAnswer"
        @remove="handleRemove"
        @ai-description="state.aiDescription"
    />
  </div>
</template>
