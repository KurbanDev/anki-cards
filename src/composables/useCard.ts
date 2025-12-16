import {reactive} from "vue";

export function card({q, a, nextShow, level = 0}) {

    const state = reactive({
        q: q,
        a: a,
        nextShow: nextShow,
        level: level
    })

    function isReady() {
        return new Date(state.nextShow).getTime() <= Date.now()
    }

    function getQuestion() {
        return state.q
    }

    function getAnswer() {
        return state.a
    }

    function getLevel() {
        return state.level
    }

    function getNextShowDate() {
        return new Date(state.nextShow).toLocaleString("ru-RU")
    }

    return {
        getQuestion,
        getAnswer,
        getLevel,
        getNextShowDate,
        isReady
    }

}