// src/front_test/router/frontTestRouter.ts
import { RouteRecordRaw } from 'vue-router'
import sttPage from '@/stt_test/pages/sttPage.vue'  // ← @ 로 절대 경로 지정

const SttRoutes: Array<RouteRecordRaw> = [
  {
    path: '/audio',
    name: 'STT',               // .vue 확장자는 빼는 게 관례입니다
    component: sttPage
  },
]

export default SttRoutes
