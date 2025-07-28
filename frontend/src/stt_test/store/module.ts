import actions, { SttActions } from "./actions"
import mutations, { SttMutations } from "./mutations"
import state, { SttState } from "./states"


export interface SttModule {
    namespaced: true
    state: SttState
    actions: SttActions
    mutations: SttMutations,
}

const sttModule: SttModule = {
    namespaced: true,
    state,
    actions,
    mutations,
}

export default sttModule