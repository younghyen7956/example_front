<template>
  <div class="stt-tool-container">
    <h2>음성 경로 안내 서비스</h2>

    <section class="file-upload-section">
      <label for="audio-file-input">오디오 파일 선택:</label>
      <input
        type="file"
        id="audio-file-input"
        @change="handleFileSelection"
        accept="audio/*"
        :disabled="isLoading"
      />
      <p v-if="selectedFile" class="file-status-message">
        선택된 파일: {{ selectedFile.name }}
      </p>
    </section>

    <section class="action-buttons-section" v-if="selectedFile">
      <button @click="processAudio" :disabled="isLoading" class="action-button">
        <span v-if="isLoading">경로 탐색 중...</span>
        <span v-else>경로 안내받기</span>
      </button>
    </section>

    <section v-if="result && !error" class="result-display-section">
      <h3>경로 안내</h3>
      <div class="result-content">
        <p><strong>안내 내용 (텍스트):</strong></p>
        <pre>{{ result.original_language_answer }}</pre>
        <p><strong>안내 내용 한글 번역 (텍스트):</strong></p>
        <pre>{{ result.korean_answer }}</pre>

        <div v-if="result.original_language_answer_audio_base64">
          <p><strong>안내 내용(음성):</strong></p>
          <audio controls :src="audioPlayerSrc" class="audio-player"></audio>
        </div>
      </div>
    </section>

    <div v-if="error" class="error-message-box">
      <p><strong>오류 발생:</strong> {{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const selectedFile = ref<File | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// computed 속성이 state.sttModule.sttResult를 가리키도록 수정
const result = computed(() => store.state.sttModule.SttTranscription);

const audioPlayerSrc = computed(() => {
  if (result.value?.original_language_answer_audio_base64) {
    return `data:audio/wav;base64,${result.value.original_language_answer_audio_base64}`;
  }
  return "";
});

const handleFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    error.value = null;
    store.commit("sttModule/clearResult");
  } else {
    selectedFile.value = null;
  }
};

const processAudio = async () => {
  if (!selectedFile.value) {
    alert("먼저 오디오 파일을 선택해주세요.");
    return;
  }
  isLoading.value = true;
  error.value = null;

  try {
    await store.dispatch("sttModule/processAudioFile", selectedFile.value);
  } catch (err: any) {
    console.error("오디오 처리 실패:", err);
    if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else {
      error.value = err.message || "오디오 처리 중 알 수 없는 오류가 발생했습니다.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>


<style scoped>
/* CSS 변수를 사용하여 색상 팔레트와 스타일을 쉽게 관리합니다. */
:root {
  --primary-color-start: #43cea2;
  --primary-color-end: #185a9d;
  --text-dark: #1a202c;
  --text-light: #4a5568;
  --bg-main: #f8f9fa;
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
  --error-bg: #fff0f1;
  --error-text: #c82333;
  --error-border: #f5c6cb;
}

/* 전체적인 배경과 폰트 설정 (이 부분은 App.vue나 전역 CSS에 추가하면 더 좋습니다) */
body {
  background-color: var(--bg-main);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 메인 컨테이너 */
.stt-tool-container {
  max-width: 70%;
  margin: 50px auto;
  padding: 40px;
  background-color: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

/* 페이지 제목 */
h2 {
  font-size: 2.25em;
  font-weight: 700;
  color: var(--text-dark);
  text-align: center;
  margin-bottom: 40px;
  background: linear-gradient(90deg, var(--primary-color-start), var(--primary-color-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 섹션 공통 스타일 */
.file-upload-section,
.action-buttons-section,
.result-display-section {
  padding: 20px;
  margin-bottom: 25px;
  border: none; /* 테두리 제거 */
}

/* 파일 업로드 섹션 */
.file-upload-section label {
  display: block;
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--text-dark);
}

#audio-file-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  font-size: 1em;
  background-color: var(--bg-main);
  transition: border-color 0.3s, background-color 0.3s;
  cursor: pointer;
}
#audio-file-input:hover {
  border-color: var(--primary-color-start);
  background-color: #fff;
}

.file-status-message {
  margin-top: 15px;
  font-size: 0.95em;
  color: var(--text-light);
}

/* 액션 버튼 */
.action-buttons-section {
  text-align: center;
}

.action-button {
  background-image: linear-gradient(90deg, var(--primary-color-start), var(--primary-color-end));
  color: white;
  border: none;
  padding: 15px 35px;
  margin: 8px;
  border-radius: 50px; /* 알약 형태 */
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 600;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background-size: 200% auto;
}

.action-button:hover:not(:disabled) {
  background-position: right center; /* 그라데이션 이동 효과 */
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.action-button:disabled {
  background-image: none;
  background-color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* 결과 표시 섹션 */
.result-display-section {
    background-color: var(--bg-main);
    border-radius: 12px;
    padding: 30px;
}
.result-display-section h3 {
  font-size: 1.5em;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 25px;
  border-bottom: 2px solid var(--primary-color-start);
  padding-bottom: 10px;
  display: inline-block;
}

.result-content p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.result-content strong {
  color: var(--text-dark);
  font-weight: 600;
}

.result-content pre {
  background-color: var(--bg-card);
  padding: 20px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1em;
  color: var(--text-light);
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.7;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

/* 오디오 플레이어 */
.audio-player {
  width: 100%;
  margin-top: 10px;
}

/* 오류 메시지 박스 */
.error-message-box {
  background-color: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
  padding: 20px;
  margin-top: 20px;
  border-radius: 8px;
  font-size: 1em;
}
.error-message-box p strong {
  color: var(--error-text);
}
</style>