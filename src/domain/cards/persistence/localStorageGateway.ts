import {Card} from "@/composables/Card";

export interface CardStateDto {
  q: string;
  a: string;
  level: number;
  nextShowDate: number;
}

const LS_KEY = "cards-data";
const VERSION_KEY = "cards-version";

function serializeCards(cards: Card[]): CardStateDto[] {
  return cards.map((c) => ({
    q: c.getQuestion(),
    a: c.getAnswer(),
    level: c.getLevel(),
    nextShowDate: c.getNextShowDate(),
  }));
}

function deserializeCards(data: CardStateDto[]): Card[] {
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

export function loadCardsFromStorage(storage: Storage = localStorage) {
  try {
    const raw = storage.getItem(LS_KEY);
    const rawVersion = storage.getItem(VERSION_KEY);
    const version = Number(rawVersion) || 1;
    if (!raw) return {cards: [], version};

    const parsed: CardStateDto[] = JSON.parse(raw);
    return {cards: deserializeCards(parsed), version};
  } catch (e) {
    console.error("Ошибка чтения localStorage:", e);
    return {cards: [], version: 1};
  }
}

export function persistCards(cards: Card[], storage: Storage = localStorage) {
  storage.setItem(LS_KEY, JSON.stringify(serializeCards(cards)));
}

export function persistVersion(version: number, storage: Storage = localStorage) {
  storage.setItem(VERSION_KEY, String(version));
}
