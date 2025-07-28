// store/actions.ts
import { ActionContext } from "vuex";
import { AnotherState } from "./states";
import fastapiAxiosInst from "@/utility/axiosInstance";
import { REQUEST_TO_FASTAPI } from "./mutation-types";

export type AnotherActions = {
  requestToFastAPI(
    context: ActionContext<AnotherState, any>,
    payload: { query: string; sessionId: string | null }          
  ): Promise<void>;
};

const actions: AnotherActions = {
  async requestToFastAPI(
    { commit }: ActionContext<AnotherState, any>,
    payload: { query: string; sessionId: string | null }
  ): Promise<void> {
    // console.log("🔥 Action received payload:", payload);
    // console.log("🔥 sessionId value:", payload.sessionId);

    const resp = await fetch(
      (fastapiAxiosInst.defaults.baseURL || "") + "/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          query: payload.query,
          session_id: payload.sessionId,
        }),
      }
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const reader = resp.body!.getReader();
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
          try {
            // ✨ 백엔드는 이제 { "token": "..." } 형태의 JSON만 보냅니다.
            const data = JSON.parse(part.slice(5));
            // ✨ 토큰 문자열만 뮤테이션으로 커밋합니다.
            commit(REQUEST_TO_FASTAPI, data.token);
          } catch (e) {
            console.error("Error parsing stream data:", e);
          }
        }
      }
    }
  },
};

export default actions;