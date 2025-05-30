import actions, { AnotherActions } from "./actions"
import mutations, { AnotherMutations } from "./mutations"
import state, { AnotherState } from "./states"


export interface AnotherModule {
    namespaced: true
    state: AnotherState
    actions: AnotherActions
    mutations: AnotherMutations,
}

const anotherModule: AnotherModule = {
    namespaced: true,
    state,
    actions,
    mutations,
}

export default anotherModule