// store/actions.ts
import { ActionContext } from "vuex";
import { AnotherState } from "./states";
import fastapiAxiosInst from "@/utility/axiosInstance";
import { REQUEST_TO_FASTAPI } from "./mutation-types";

export type AnotherActions = {
  requestToFastAPI(
    context: ActionContext<AnotherState, any>,
    query: string             // POST 바디로 보낼 질의 문자열
  ): Promise<void>;
};

const actions: AnotherActions = {
  async requestToFastAPI(
    { commit }: ActionContext<AnotherState, any>,
    query: string
  ): Promise<void> {
    // 1) fetch 로 SSE 스트림 열기
    const resp = await fetch(
      // axios 인스턴스의 baseURL 이 설정돼 있다면 꺼내 써도 되고, 없으면 절대경로로 변경하세요.
      (fastapiAxiosInst.defaults.baseURL || "") + "/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({ query }),
      }
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    // 2) ReadableStream reader & decoder 준비
    const reader  = resp.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
    
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop()!;
    
      for (const part of parts) {
        if (part.startsWith("data:")) {
          // data: 까지만 떼고, 그 뒤에 오는 모든 문자(공백 포함)를 token으로
          const token = part.slice(5);
          commit(REQUEST_TO_FASTAPI, token);
        }
      }
    }
  },
};

export default actions;