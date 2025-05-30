// src/front_test/router/frontTestRouter.ts
import { RouteRecordRaw } from 'vue-router'
import RagPage from '../pages/ragPage.vue'


const AnotherRoutes: Array<RouteRecordRaw> = [
  {
    path: '/rag',
    name: 'ragPage',               // .vue 확장자는 빼는 게 관례입니다
    component: RagPage
  },
]

export default AnotherRoutes
