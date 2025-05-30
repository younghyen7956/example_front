import anotherModule from '@/RagProject/store/module'
import testModule from '@/front_test/store/module'
import { createStore } from 'vuex'

export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    testModule,
    anotherModule,
  }
})
