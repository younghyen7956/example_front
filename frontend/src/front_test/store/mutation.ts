// store/mutations.ts
import { MutationTree } from "vuex";
import { TestState } from "./states";
import { REQUEST_IMAGE_TO_FASTAPI } from "./mutation-types";

export interface TestMutations extends MutationTree<TestState> {
  [REQUEST_IMAGE_TO_FASTAPI](state: TestState, blobUrl: string): void;
}

const mutations: TestMutations = {
  [REQUEST_IMAGE_TO_FASTAPI](state, blobUrl) {
    state.resultUrl = blobUrl;
  },
};

export default mutations;
