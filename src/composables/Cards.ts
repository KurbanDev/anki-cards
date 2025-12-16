export const INTERVAL_TABLE = {
    0: {again: 1, hard: 10, good: 1440},       // 0min, 10min, 1day,
    1: {again: 1, hard: 1440, good: 4320},     // 0min, 1day, 3days,
    2: {again: 1, hard: 1440, good: 10080},    // 0min, 1day, 7days,
    3: {again: 1, hard: 4320, good: 20160},    // 0min, 3days, 14days,
    4: {again: 1, hard: 10080, good: 43200},   // 0min, 7days, 30days,
    5: {again: 1, hard: 20160, good: 86400},   // 0min, 14days, 60day
    6: {again: 1, hard: 43200, good: 172800},  // 0min, 30days, 120days,
    7: {again: 1, hard: 86400, good: 172800},  // 0min, 60days, 120days,  
};

export class Cards {

    public load() {

    }

}