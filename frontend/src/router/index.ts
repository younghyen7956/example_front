import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TestRoutes from '@/front_test/router/frontTestRouter'
import AnotherRoutes from '@/RagProject/router/ragRouter'


const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomeView },
  ...TestRoutes,
  ...AnotherRoutes
]

// 여기에 로그 추가
// console.log('Registered routes:', routes.map(r => r.path))

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
