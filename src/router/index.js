import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CardsView from "@/views/CardsView.vue";
import LearnView from "@/views/LearnView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/learn',
            name: 'learn',
            component: LearnView,
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/AboutView.vue'),
        },
        {
            path: '/project/:id/questions',
            name: 'questions',
            component: () => import('../views/QuestionsView.vue'),
        },
    ],
})

export default router
