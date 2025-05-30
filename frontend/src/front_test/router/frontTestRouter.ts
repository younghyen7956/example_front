// src/front_test/router/frontTestRouter.ts
import { RouteRecordRaw } from 'vue-router'
import TestPage from '@/front_test/pages/testPage.vue'  // ← @ 로 절대 경로 지정

const TestRoutes: Array<RouteRecordRaw> = [
  {
    path: '/front_test',
    name: 'TestPage',               // .vue 확장자는 빼는 게 관례입니다
    component: TestPage
  },
]

export default TestRoutes
