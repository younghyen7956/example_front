// store/actions.ts

import { ActionContext } from "vuex";
import { SttState } from "./states";
import fastapiAxiosInst from "@/utility/axiosInstance";
// 뮤테이션 타입과 페이로드 타입은 전체 응답을 저장하도록 수정해야 합니다.
import { REQUEST_AUIDO_TO_FASTAPI } from "./mutation-types"; 
import { SttTranscription } from "./states"; // states.ts에 정의 필요

export type SttActions = {
  // 액션을 하나로 통합하여 더 명확하게 만듭니다.
  processAudioFile(
    context: ActionContext<SttState, any>,
    file: File
  ): Promise<void>;
};

const actions: SttActions = {
  // requestAudioToFastAPI 와 requestAudioTranslateToFastAPI 를 하나로 통합
  async processAudioFile({ commit }, file) {
    try {
      const formData = new FormData();
      formData.append("audio_file", file);

      // 항상 'json' 타입으로 응답을 요청합니다.
      // 이렇게 하면 STT, 번역, Base64 오디오 데이터를 모두 한 번에 받습니다.
      const response = await fastapiAxiosInst.post(
        "/transcribe?response_type=json", // 쿼리 파라미터 추가!
        formData, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // 백엔드에서 받은 전체 응답 객체를 그대로 뮤테이션으로 전달합니다.
      commit(REQUEST_AUIDO_TO_FASTAPI, response.data);

    } catch (error) {
      console.error("Error processing audio file:", error);
      throw error; // 컴포넌트에서 에러를 잡을 수 있도록 다시 throw
    }
  },
};

export default actions;