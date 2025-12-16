import {useAi} from "@/composables/useAi";
import {Card} from "@/composables/Card";

export function buildCardPrompt(card: Card) {
  return `Я отвечаю на вопросы. У меня есть вопрос ${card.getQuestion()}, а в ответе указано: ${card.getAnswer()}. Объясни подробно этот ответ.`;
}

export async function loadAiDescription(card: Card) {
  const context = buildCardPrompt(card);
  const ai = useAi();
  return ai.send(context);
}
