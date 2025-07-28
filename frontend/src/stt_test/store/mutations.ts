import { MutationTree } from "vuex";
import { SttState } from "./states";
import {REQUEST_AUIDO_TO_FASTAPI } from "./mutation-types";

export interface RequestAudioPayload { // 전사(Transcription)를 위한 Payload
  filename: string;
  text: string;
  audio_base64:string
}

export interface SttMutations extends MutationTree<SttState> {
  [REQUEST_AUIDO_TO_FASTAPI](state: SttState, payload: RequestAudioPayload): void;
}

const mutations: SttMutations = {
  [REQUEST_AUIDO_TO_FASTAPI](state, payload) { // 전사(Transcription) 결과를 처리하는 뮤테이션
    // payload로 받은 데이터로 새로운 SttTranscription 객체를 만들어 할당합니다.
    state.SttTranscription = {
      filename: payload.filename,
      text: payload.text,
      answer_audio_base64: payload.audio_base64,
    };
  },
};

export default mutations;