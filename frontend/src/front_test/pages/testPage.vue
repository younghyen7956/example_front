<template>
  <div class="image-search">
    <input type="file" accept="image/*" @change="onFileChange" />
    <button :disabled="!selectedFile" @click="searchImage">
      이미지 검색
    </button>
+    <div v-if="resultUrl" class="result">
       <h3>검색 결과:</h3>
       <img :src="resultUrl" alt="검색 결과 이미지" />
     </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "ImageSearch",
  setup() {
    const store = useStore();
    const selectedFile = ref<File | null>(null);

    const resultUrl = computed(() => {
      const url = (store.state as any).testModule.resultUrl
      // console.log('현재 resultUrl:', url)
      return url
    })

    function onFileChange(e: Event) {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        selectedFile.value = input.files[0];
      }
    }

    async function searchImage() {
      if (!selectedFile.value) return;
      try {
        // 네임스페이스 액션 호출
        await store.dispatch(
          'testModule/requestImageToFastAPI',
          selectedFile.value
        );
      } catch (e) {
        alert("이미지 검색 중 오류가 발생했습니다.");
      }
    }

    return {
      selectedFile,
      resultUrl,
      onFileChange,
      searchImage,
    };
  },
});
</script>

<style scoped>
.image-search {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 결과 영역 이미지 크기 조정 */
.result img {
  /* 최대 가로 폭을 400px로 제한 */
  max-width: 400px;
  /* 비율대로 높이 자동 조정 */
  height: auto;

  /* 원하시면 고정 크기로도 설정 가능 */
  /* width: 300px;
     height: 200px; */
}
</style>

