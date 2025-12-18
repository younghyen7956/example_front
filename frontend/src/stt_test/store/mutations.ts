import { MutationTree } from "vuex";
import { SttState, SttTranscription } from "./states";
import { REQUEST_AUIDO_TO_FASTAPI } from "./mutation-types";

export interface SttMutations extends MutationTree<SttState> {
  [REQUEST_AUIDO_TO_FASTAPI](state: SttState, payload: SttTranscription): void;
  clearResult(state: SttState): void;
}

const mutations: SttMutations = {
  [REQUEST_AUIDO_TO_FASTAPI](state, payload) {
    // SttTranscription -> sttResult 로 변경
    state.SttTranscription = payload;
  },
  clearResult(state) {
    // SttTranscription -> sttResult 로 변경
    state.SttTranscription = null;
  },
};

export default mutations;