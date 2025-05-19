// store/actions.ts
import { ActionContext } from "vuex";
import { TestState } from "./states";
import fastapiAxiosInst from "@/utility/axiosInstance";
import { REQUEST_IMAGE_TO_FASTAPI } from "./mutation-types";

export type TestActions = {
  requestImageToFastAPI(
    context: ActionContext<TestState, any>,
    file: File
  ): Promise<void>;
};

const actions: TestActions = {
  async requestImageToFastAPI(
    { commit }
  , file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // console.log(121212121)

      const res = await fastapiAxiosInst.post("/image-search", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",              // 서버가 이미지 파일을 blob으로 반환
        timeout: 10000,
      });

      // Blob → 브라우저에서 보여줄 수 있는 URL 생성
      const blobUrl = URL.createObjectURL(res.data);
      commit(REQUEST_IMAGE_TO_FASTAPI, blobUrl);
      // console.log(111111111, blobUrl)
    } catch (error) {
      console.error("requestImageToFastAPI() 문제 발생:", error);
      throw error;
    }
  },
};

export default actions;
