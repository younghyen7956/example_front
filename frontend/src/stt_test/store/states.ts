
// 개별 전사 결과의 인터페이스
export interface SttTranscription {
    filename: string;
    original_query: string;
    original_language_answer: string;
    korean_answer: string;
    original_language_answer_audio_base64: string | null;
}

// STT 모듈의 전체 상태 인터페이스
export interface SttState {
    SttTranscription : SttTranscription | null; // 단일 전사 결과를 담거나 null
}

const state: SttState = {
    SttTranscription: null,
};

export default state;