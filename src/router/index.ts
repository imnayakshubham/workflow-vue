import { createRouter, createWebHistory } from 'vue-router'
import FlowView from '@/views/FlowView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'flow', component: FlowView },
        { path: '/nodes/:id', name: 'node', component: FlowView },
    ],
})

export default router
