<template>
  <div class="stt-tool-container">
    <h2>오디오 파일 STT 및 번역</h2>

    <section class="file-upload-section">
      <label for="audio-file-input">오디오 파일 선택:</label>
      <input
        type="file"
        id="audio-file-input"
        @change="handleFileSelection"
        accept="audio/*"
        :disabled="isLoadingTranscription || isLoadingTranslation"
      />
      <p v-if="!selectedFile" class="file-status-message">
        STT 또는 번역을 진행할 오디오 파일을 선택해주세요.
      </p>
      <p v-if="selectedFile" class="file-status-message">
        선택된 파일: {{ selectedFile.name }}
      </p>
    </section>

    <section class="action-buttons-section" v-if="selectedFile">
      <button
        @click="triggerTranscription"
        :disabled="isLoadingTranscription || isLoadingTranslation"
        class="action-button"
      >
        <span v-if="isLoadingTranscription">음성 분석 중...</span>
        <span v-else>선택 파일 STT(음성 분석) 실행</span>
      </button>
      <button
        @click="triggerTranslation"
        :disabled="isLoadingTranslation || isLoadingTranscription"
        class="action-button"
      >
        <span v-if="isLoadingTranslation">번역 중...</span>
        <span v-else>선택 파일 번역 실행 (STT 포함)</span>
      </button>
    </section>

    <section v-if="shouldShowTranscriptionResult" class="result-display-section">
      <h3>음성 분석(STT) 결과</h3>
      <div class="result-content">
        <p><strong>파일명:</strong> {{ transcriptionDisplay.filename }}</p>
        <p><strong>분석된 텍스트:</strong></p>
        <pre>{{ transcriptionDisplay.text }}</pre>
      </div>
    </section>
    <div v-if="transcriptionError && showResultType === 'stt'" class="error-message-box">
      <p><strong>음성 분석 오류:</strong> {{ transcriptionError }}</p>
    </div>

    <section v-if="shouldShowTranslationResult" class="result-display-section">
      <h3>번역 결과</h3>
      <div class="result-content">
        <p><strong>파일명:</strong> {{ translationDisplay.filename }}</p>
        
        <div class="original-text-toggle-section">
          <p><strong>원본 텍스트 (STT):</strong></p>
          <button @click="toggleOriginalTextVisibility" class="toggle-button">
            {{ isOriginalTextVisible ? '원본 숨기기' : '원본 보기' }}
          </button>
        </div>
        <pre v-if="isOriginalTextVisible">{{ translationDisplay.original_text }}</pre>
        <p><strong>한국어 번역:</strong></p>
        <pre>{{ translationDisplay.korean_translation }}</pre>
      </div>
    </section>
    <div v-if="translationError && showResultType === 'translation'" class="error-message-box">
      <p><strong>번역 오류:</strong> {{ translationError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const selectedFile = ref<File | null>(null);
const isLoadingTranscription = ref(false);
const isLoadingTranslation = ref(false);
const transcriptionError = ref<string | null>(null);
const translationError = ref<string | null>(null);
const showResultType = ref<'stt' | 'translation' | null>(null);

// 원본 텍스트 표시 여부 상태 (기본값: 보이도록 설정)
const isOriginalTextVisible = ref(true);

const handleFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    transcriptionError.value = null;
    translationError.value = null;
    showResultType.value = null;
    isOriginalTextVisible.value = true; // 새 파일 선택 시 원본 텍스트는 다시 보이도록 설정
  } else {
    selectedFile.value = null;
    showResultType.value = null;
  }
};

const transcriptionDisplay = computed(() => store.state.sttModule.SttTranscriptionList);
const translationDisplay = computed(() => store.state.sttModule.SttTranslationList);

const shouldShowTranscriptionResult = computed(() => {
  return showResultType.value === 'stt' && transcriptionDisplay.value && !transcriptionError.value;
});

const shouldShowTranslationResult = computed(() => {
  return showResultType.value === 'translation' && translationDisplay.value && !translationError.value;
});

// 원본 텍스트 표시/숨김 토글 함수
const toggleOriginalTextVisibility = () => {
  isOriginalTextVisible.value = !isOriginalTextVisible.value;
};

const triggerTranscription = async () => {
  if (!selectedFile.value) {
    alert('먼저 오디오 파일을 선택해주세요.');
    return;
  }
  isLoadingTranscription.value = true;
  transcriptionError.value = null;
  translationError.value = null;
  showResultType.value = null;
  isOriginalTextVisible.value = true; // STT 작업 시 원본 텍스트 관련 상태 초기화 (번역 섹션에만 해당되므로 영향 X)

  try {
    await store.dispatch('sttModule/requestAudioToFastAPI', selectedFile.value);
    if (store.state.sttModule.SttTranscriptionList) {
      showResultType.value = 'stt';
    } else {
      throw new Error("STT 분석 결과를 가져오지 못했습니다.");
    }
  } catch (error: any) {
    console.error('STT(전사) 요청 실패:', error);
    showResultType.value = 'stt';
    if (error.response && error.response.data && error.response.data.detail) {
      transcriptionError.value = error.response.data.detail;
    } else {
      transcriptionError.value = error.message || '음성 분석 중 오류가 발생했습니다.';
    }
  } finally {
    isLoadingTranscription.value = false;
  }
};

const triggerTranslation = async () => {
  if (!selectedFile.value) {
    alert('먼저 오디오 파일을 선택해주세요.');
    return;
  }
  isLoadingTranslation.value = true;
  translationError.value = null;
  transcriptionError.value = null;
  showResultType.value = null;
  // isOriginalTextVisible.value = true; // 번역 작업 시작 시 원본 텍스트는 보이도록 설정 (선택적)

  try {
    await store.dispatch('sttModule/requestAudioTranslateToFastAPI', selectedFile.value);
    if (store.state.sttModule.SttTranslationList) {
      showResultType.value = 'translation';
    } else {
      throw new Error("번역 결과를 가져오지 못했습니다.");
    }
  } catch (error: any) {
    console.error('번역 요청 실패:', error);
    showResultType.value = 'translation';
    if (error.response && error.response.data && error.response.data.detail) {
      translationError.value = error.response.data.detail;
    } else {
      translationError.value = error.message || '번역 중 오류가 발생했습니다.';
    }
  } finally {
    isLoadingTranslation.value = false;
  }
};
</script>

<style scoped>
/* 기본 폰트 및 전체적인 분위기 설정 */
.stt-tool-container {
  max-width: 70%; /* 너비를 조금 더 넓게 */
  margin: 40px auto; /* 상하 여백 증가 */
  padding: 30px;   /* 내부 여백 증가 */
  background-color: #ffffff; /* 배경을 흰색으로 */
  border-radius: 12px; /* 모서리를 더 둥글게 */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); /* 부드러운 그림자 효과 */
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; /* 깔끔한 산세리프 폰트 (Pretendard 예시, 실제 사용 폰트로 변경) */
  color: #333; /* 기본 글자색 */
}

/* 페이지 제목 */
h2 {
  font-size: 2em; /* 제목 크기 증가 */
  font-weight: 600; /* 폰트 두께 */
  color: #2c3e50; /* 제목 색상 (짙은 회색/남색 계열) */
  text-align: center; /* 가운데 정렬 */
  margin-bottom: 30px; /* 아래 여백 증가 */
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0; /* 구분선을 연하게 */
}

/* 섹션 공통 스타일 (카드 형태) */
.file-upload-section,
.action-buttons-section,
.result-display-section {
  background-color: #ffffff;
  padding: 30px; /* 내부 여백 증가 */
  margin-bottom: 30px; /* 섹션 간 여백 증가 */
  border-radius: 10px; /* 모서리 둥글게 */
  border: 1px solid #e9ecef; /* 테두리를 연하게 */
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 은은한 그림자 */
}

/* 파일 업로드 섹션 레이블 */
.file-upload-section label {
  display: block;
  font-size: 1.1em;
  font-weight: 500;
  margin-bottom: 15px; /* 레이블과 입력 필드 사이 여백 */
  color: #34495e;
}

/* 파일 입력(input[type=file]) 커스텀 스타일 (기본 디자인 숨김) */
#audio-file-input {
  /* 실제 input은 숨기고 label로 디자인 제어 (더 복잡한 커스텀은 JS 필요) */
  /* 여기서는 기본적인 스타일만 개선합니다. */
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #dce4f0;
  border-radius: 6px;
  font-size: 0.95em;
  background-color: #f8f9fa;
  transition: border-color 0.2s;
}
#audio-file-input:hover {
  border-color: #007bff;
}

.file-status-message {
  margin-top: 15px;
  font-size: 0.9em;
  color: #555;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

/* 액션 버튼 스타일 */
.action-button {
  background-color: #007bff; /* 주조색 (이미지의 파란색 계열) */
  color: white;
  border: none;
  padding: 12px 24px; /* 패딩 조정 */
  margin: 8px; /* 버튼 간 여백 */
  border-radius: 6px; /* 모서리 둥글게 */
  cursor: pointer;
  font-size: 1em;
  font-weight: 500; /* 폰트 두께 */
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-button:hover:not(:disabled) {
  background-color: #0056b3; /* 호버 시 조금 더 진한 파란색 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-button:disabled {
  background-color: #b0bec5; /* 비활성화 시 색상 */
  color: #eceff1;
  cursor: not-allowed;
  box-shadow: none;
}
.action-buttons-section {
  text-align: center; /* 버튼들 가운데 정렬 */
}

/* 결과 표시 섹션 제목 */
.result-display-section h3 {
  font-size: 1.4em;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.result-content p {
  margin-bottom: 10px;
  line-height: 1.7; /* 줄 간격 조정 */
  color: #454545;
}

.result-content strong {
  color: #2c3e50; /* 강조 텍스트 색상 */
  font-weight: 600;
}

/* 결과 텍스트 (pre 태그) 스타일 */
.result-content pre {
  background-color: #f8f9fa; /* 연한 배경색 */
  padding: 20px; /* 패딩 증가 */
  border-radius: 6px; /* 모서리 둥글게 */
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1.05em; /* 글자 크기 약간 증가 (기존 1.1em에서 조정 또는 유지) */
  color: #333;
  max-height: 350px; /* 최대 높이 약간 증가 */
  overflow-y: auto;
  line-height: 1.6; /* pre 태그 내부 줄 간격 */
  border: 1px solid #e0e0e0; /* 연한 테두리 */
}

/* 원본 텍스트 토글 섹션 및 버튼 */
.original-text-toggle-section {
  display: flex;
  align-items: center;
  margin-top: 15px; /* 위 요소와의 간격 */
  margin-bottom: 10px;
}
.original-text-toggle-section p {
  margin-bottom: 0; /* p 태그 자체의 하단 마진 제거 */
}

.toggle-button {
  margin-left: 15px; /* 레이블과의 간격 증가 */
  padding: 6px 12px; /* 패딩 조정 */
  font-size: 0.9em;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px; /* 모서리 둥글게 */
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-button:hover {
  background-color: #545b62;
}

/* 오류 메시지 박스 */
.error-message-box {
  background-color: #fff0f1; /* 오류 배경색 (연한 빨강) */
  color: #c82333; /* 오류 텍스트 색 (진한 빨강) */
  border: 1px solid #f5c6cb; /* 오류 테두리색 */
  padding: 15px 20px; /* 패딩 조정 */
  margin-top: 20px;
  border-radius: 8px; /* 모서리 둥글게 */
  font-size: 0.95em;
}
.error-message-box p strong {
  color: #a01c28; /* 오류 메시지 내 strong 태그 색상 */
}

/* 로딩 스피너 (버튼 내) - 간단한 텍스트 변경 외의 시각적 스피너는 추가 작업 필요 */
.action-button span[v-if="isLoadingTranscription"],
.action-button span[v-if="isLoadingTranslation"] {
  /* 필요한 경우 여기에 로딩 애니메이션 효과를 위한 스타일 추가 */
  display: inline-block; /* 너비/높이, 애니메이션 적용을 위해 */
}
</style>