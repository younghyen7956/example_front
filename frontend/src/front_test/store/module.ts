import actions, { TestActions } from "./actions"
import mutations, { TestMutations } from "./mutations"
import state, { TestState } from "./states"


export interface TestModule {
    namespaced: true
    state: TestState
    actions: TestActions
    mutations: TestMutations,
}

const testModule: TestModule = {
    namespaced: true,
    state,
    actions,
    mutations,
}

export default testModule