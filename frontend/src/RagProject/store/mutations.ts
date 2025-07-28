// store/mutations.ts
import { MutationTree } from "vuex";
import { AnotherState } from "./states";
import { REQUEST_TO_FASTAPI, SET_RAW_DATA,SET_USER_SESSION } from "./mutation-types";

export interface AnotherMutations extends MutationTree<AnotherState> {
  [REQUEST_TO_FASTAPI](state: AnotherState, chunk: string): void;
  [SET_RAW_DATA](state: AnotherState, data: string): void; // 새 뮤테이션 타입 인터페이스 추가
  [SET_USER_SESSION](state: AnotherState, sessionId:string):void
}

const mutations: AnotherMutations = {
  // 스트림으로부터 받은 데이터 조각(chunk)을 기존 rawdata에 추가합니다.
  [REQUEST_TO_FASTAPI](state, chunk) {
    state.rawdata += chunk;
  },
  // rawdata의 내용을 전달받은 data로 완전히 교체합니다.
  // (초기화 시에는 빈 문자열 ""을 data로 전달받게 됩니다.)
  [SET_RAW_DATA](state, data) {
    state.rawdata = data;
  },
  [SET_USER_SESSION](state, sessionId){
    state.sessionId = sessionId
  }
};

export default mutations;
