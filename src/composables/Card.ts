import {INTERVAL_TABLE} from "@/composables/Cards";

export type Difficulty = "again" | "hard" | "good";

export class Card {

    private readonly q: string
    private readonly a: string
    private detailAnswer?: string

    private nextShowDate: number
    private level: number

    constructor({q, a, nextShowDate, level = 0}) {
        this.q = q;
        this.a = a;
        this.nextShowDate = nextShowDate
        this.level = level
    }

    isReady() {
        return new Date(this.nextShowDate).getTime() <= Date.now()
    }

    getQuestion() {
        return this.q
    }

    getAnswer() {
        return this.a
    }

    getLevel() {
        return this.level
    }

    getFormattedNextShowDate() {
        return new Date(this.nextShowDate).toLocaleString("ru-RU")
    }

    getNextShowDate() {
        return this.nextShowDate
    }

    getDetailAnswer() {
        return this.detailAnswer
    }

    setDetailAnswer(detail: string) {
        this.detailAnswer = detail
    }

    calculateMinutesNextShowDateByDifficulty(difficulty: Difficulty) {
        const lvl = this.getLevel();
        const intervals = INTERVAL_TABLE[lvl] ?? INTERVAL_TABLE[0];
        return intervals[difficulty];
    }

    selectDifficulty(difficulty: Difficulty) {
        const lvl = this.getLevel();
        const intervals = INTERVAL_TABLE[lvl] ?? INTERVAL_TABLE[0];
        const addMinutes = intervals[difficulty] * 60 * 1000;

        this.nextShowDate = Date.now() + addMinutes;

        const nextLevelByDifficulty: Record<Difficulty, number> = {
            again: 0,
            hard: lvl,
            good: Math.min(lvl + 1, 7),
        };

        this.level = nextLevelByDifficulty[difficulty];
    }
}
