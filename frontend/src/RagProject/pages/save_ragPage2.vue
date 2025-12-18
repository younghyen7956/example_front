<template>
    <div class="stream-viewer">
      <transition name="toast-fade">
        <div v-if="showToast" class="toast-popup">
          {{ toastMessage }}
        </div>
      </transition>
  
      <nav class="viewer-nav">
        <button @click="toggleSidebar" class="sidebar-toggle-btn">
          {{ showSidebar ? "✕" : "☰" }}
        </button>
        <div class="nav-title">건축 설계 검증 챗봇</div>
      </nav>
  
      <div class="viewer-body">
        <transition name="sidebar-transition">
          <aside class="sidebar" v-show="showSidebar">
            <h2>예시 질문</h2>
            <ul>
              <li>
                <a href="#" @click.prevent="copyToClipboard('검증위원 이문찬이 제출한 검토의견 LIST 정리해줘')">
                  <span></span> 검증위원 이문찬이 제출한 검토의견 LIST 정리해줘
                </a>
              </li>
              <li>
                <a href="#" @click.prevent="copyToClipboard('55m2 AL형 고빈도 오류순으로 체크리스트 항목을 10개 만들어줘')">
                  <span></span> 55m2 AL형 고빈도 오류순으로 체크리스트 항목을 10개 만들어줘
                </a>
              </li>
              <li>
                <a href="#" @click.prevent="copyToClipboard('AA-10974m2 A형 단열 관련 수정사항 알려줘')">
                  <span></span> AA-10974m2 A형 단열 관련 수정사항 알려줘
                </a>
              </li>
              <li>
                <a href="#" @click.prevent="copyToClipboard('59AL 단위세대 평면도 욕실 관련 수정사항 알려줘')">
                  <span></span> 59AL 단위세대 평면도 욕실 관련 수정사항 알려줘
                </a>
              </li>
              <li>
                <a href="#" @click.prevent="copyToClipboard('단열제 관련 체크리스트 항목 10개 만들어줘')">
                  <span></span> 단열제 관련 체크리스트 항목 10개 만들어줘
                </a>
              </li>
            </ul>
          </aside>
        </transition>
  
        <section
          class="chat-container"
          :class="{ 'sidebar-open': showSidebar }"
        >
          <div class="chat-box" ref="chatBox">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              :class="['chat-message', msg.role]"
            >
              <template v-if="msg.role === 'user'">
                <div class="user-message-content">
                  <img v-if="msg.imageUrl" :src="msg.imageUrl" alt="User attachment" class="message-image">
                  <div v-if="msg.content">{{ msg.content }}</div>
                </div>
              </template>
              <template v-else>
                <div class="assistant-content">
                  <template v-if="!msg.content.trim()">
                    <div class="loader"></div>
                  </template>
                  <template v-else>
                    <div v-html="sanitizeAndFormatHtml(msg.content)" class="markdown-body"></div>
                  </template>
                </div>
              </template>
            </div>
          </div>
  
          <div class="input-area-wrapper">
            <div class="file-preview" v-if="previewUrl">
              <img :src="previewUrl" alt="Image preview" />
              <button @click="removeImage" class="remove-file-btn" title="이미지 제거">✕</button>
            </div>
            <div class="input-area">
              <input type="file" @change="handleFileChange" accept="image/*" ref="fileInput" style="display: none;" />
              <button @click="triggerFileInput" class="attach-btn" title="이미지 첨부">📎</button>
              <input
                v-model="query"
                type="text"
                placeholder="질문을 입력하세요"
                @keyup.enter="startStream"
                class="query-input"
              />
              <button
                @click="startStream"
                :disabled="isStreaming"
                class="query-button"
                :class="{ streaming: isStreaming }"
              >
                {{ isStreaming ? "답변 생성 중..." : "검색" }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, nextTick, onMounted } from "vue";
  import { useStore } from "vuex";
  import { SET_USER_SESSION } from "@/RagProject/store/mutation-types"; // 경로는 실제 프로젝트에 맞게 수정해주세요
  import { v4 as uuidv4 } from 'uuid';
  import MarkdownIt from 'markdown-it';
  import DOMPurify from 'dompurify';
  
  // markdown-it 파서를 초기화합니다. (한 번만 생성해서 재사용)
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
  });
  
  // --- 상태 관리 (State Management) ---
  const store = useStore();
  const query = ref("");
  const messages = ref<{ role: "user" | "assistant"; content: string; imageUrl?: string | null }[]>([]);
  const isStreaming = ref(false);
  const sessionId = computed(() => store.state.anotherModule.sessionId);
  
  // --- UI 및 파일 관리 상태 ---
  const chatBox = ref<HTMLElement | null>(null);
  const showSidebar = ref(true);
  const fileInput = ref<HTMLInputElement | null>(null);
  const selectedImageFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);
  
  // --- 토스트 알림 상태 ---
  const showToast = ref(false);
  const toastMessage = ref("");
  let toastTimer: number | undefined;
  
  // --- 라이프사이클 훅 ---
  onMounted(() => {
    if (!sessionId.value) {
      store.commit(`anotherModule/${SET_USER_SESSION}`, uuidv4());
    }
  });
  
  // --- UI 헬퍼 함수 ---
  
  function triggerToast(message: string) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastMessage.value = message;
    showToast.value = true;
    toastTimer = window.setTimeout(() => {
      showToast.value = false;
    }, 2000);
  }
  
  function sanitizeAndFormatHtml(content: string): string {
    if (!content) return "";
  
    // AI가 보내주는 특정 패턴을 표준 마크다운으로 변경
    const preprocessedContent = content
      .replace(/- 문제점:/g, '- **문제점:**')
      .replace(/- 개선 사항:/g, '- **개선 사항:**');
  
    // 1. markdown-it을 사용해 마크다운을 HTML로 렌더링
    const rawHtml = md.render(preprocessedContent);
  
    // 2. DOMPurify를 사용해 변환된 HTML에서 잠재적인 XSS 공격을 방지
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
  
    return sanitizedHtml;
  }
  
  async function scrollToBottom() {
    await nextTick();
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight;
    }
  }
  
  async function copyToClipboard(text: string) {
    query.value = text;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        triggerToast("클립보드에 복사되었습니다!");
        return;
      } catch (err) {
        console.error("클립보드 복사 실패 (navigator):", err);
      }
    }
  
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      triggerToast("클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("클립보드 복사 실패 (execCommand):", err);
      triggerToast("복사에 실패했습니다.");
    } finally {
      document.body.removeChild(textArea);
    }
  }
  
  
  // --- 파일 및 입력 관련 함수 ---
  
  const triggerFileInput = () => {
      fileInput.value?.click();
  };
  
  const handleFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
          selectedImageFile.value = file;
          const reader = new FileReader();
          reader.onload = (e) => {
              previewUrl.value = e.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };
  
  const removeImage = () => {
      selectedImageFile.value = null;
      previewUrl.value = null;
      if (fileInput.value) {
          fileInput.value.value = '';
      }
  };
  
  // --- 핵심 로직: 스트리밍 시작 ---
  async function startStream() {
    if ((!query.value.trim() && !selectedImageFile.value) || isStreaming.value) {
      return;
    }
  
    isStreaming.value = true;
  
    const q = query.value.trim();
    const imageFile = selectedImageFile.value;
    const imageUrlForMessage = previewUrl.value;
  
    const userMessage: { role: 'user'; content: string; imageUrl?: string | null } = {
        role: 'user',
        content: q,
        imageUrl: imageUrlForMessage,
    };
  
    if (imageFile && !q) {
        userMessage.content = "";
    }
  
    messages.value.push(userMessage);
    await scrollToBottom();
  
    messages.value.push({ role: "assistant", content: "" });
    const currentAssistantIndex = messages.value.length - 1;
    await scrollToBottom();
  
    const onToken = (token: string) => {
      if (messages.value[currentAssistantIndex]) {
        messages.value[currentAssistantIndex].content += token;
        scrollToBottom();
      }
    };
    
    // ## 여기가 핵심 수정 부분입니다 ##
    try {
      // Vuex Action 'requestStream' 호출
      await store.dispatch("anotherModule/requestStream", {
        // 텍스트가 없으면 빈 문자열("") 대신 null을 전달합니다.
        query: q || null,
        sessionId: sessionId.value,
        imageFile: imageFile,
        onToken: onToken,
        // 에러 처리는 Vuex Action이 Error를 throw하고, 아래 catch 블록에서 잡도록 위임합니다.
        // 따라서 onError 콜백은 여기서는 필요 없습니다.
      });
  
    } catch (error: any) {
      // Vuex Action에서 throw된 에러를 여기서 잡아서 UI에 표시합니다.
      console.error("API 요청 처리 중 오류 발생:", error);
      if (messages.value[currentAssistantIndex]) {
        messages.value[currentAssistantIndex].content = `오류가 발생했습니다: ${error.message}`;
      }
    } finally {
      // 스트리밍이 성공하든 실패하든 항상 실행됩니다.
      isStreaming.value = false;
      query.value = "";
      removeImage();
    }
  }
  
  // 사이드바 토글 함수
  const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value;
  };
  </script>
  
  <style scoped>
  /* 마크다운 렌더링을 위한 스타일 */
  .markdown-body {
    text-align: left;
  }
  :deep(.markdown-body h3) {
    font-size: 1.1rem;
    color: #00dd77;
    border-bottom: 1px solid #4a4a4c;
    padding-bottom: 0.3em;
    margin-top: 1.5em;
    margin-bottom: 1em;
  }
  :deep(.markdown-body ul) {
    padding-left: 20px;
    margin-top: 0;
    margin-bottom: 1em;
  }
  :deep(.markdown-body li) {
    margin-bottom: 0.5em;
  }
  :deep(.markdown-body strong) {
    color: #efefef;
    font-weight: 600;
  }
  :deep(.markdown-body p) {
    margin-top: 0;
    margin-bottom: 1em;
  }
  
  
  /* 채팅 말풍선 안의 이미지와 컨텐츠를 위한 스타일 */
  .user-message-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }
  .message-image {
    max-width: 100%;
    max-height: 250px;
    border-radius: 10px;
    object-fit: contain;
  }
  
  /* --- 이하 기존 스타일 --- */
  .stream-viewer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: #1c1c1e;
    color: #e1e1e1;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .viewer-nav {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #2c2c2e;
    border-bottom: 1px solid #3a3a3c;
    flex-shrink: 0;
  }
  .sidebar-toggle-btn {
    background: none;
    border: none;
    color: #00cc66;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin-right: 1rem;
  }
  .nav-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #00cc66;
  }
  .viewer-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .sidebar {
    width: 280px;
    background: #2c2c2e;
    padding: 1.5rem 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    text-align: left;
  }
  .sidebar h2 {
    margin: 0 0 1rem;
    color: #00cc66;
    font-size: 1.1rem;
    text-align: center;
  }
  .sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .sidebar li a {
    color: #e1e1e1;
    text-decoration: none;
    padding: 0.8rem;
    border-radius: 6px;
    display: block;
    transition: background-color 0.2s ease;
  }
  .sidebar li a:hover {
    background-color: #3a3a3c;
  }
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #121212;
  }
  .chat-box {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .chat-message {
    max-width: 75%;
    padding: 0.8rem 1.2rem;
    margin-bottom: 0.75rem;
    border-radius: 18px;
    line-height: 1.5;
    word-break: break-word;
  }
  .chat-message.user {
    background: #007aff;
    color: #fff;
    align-self: flex-end;
    text-align: right;
  }
  .chat-message.assistant {
    background: #3a3a3c;
    color: #e1e1e1;
    align-self: flex-start;
    text-align: left;
  }
  .input-area-wrapper {
    padding: 1rem;
    border-top: 1px solid #3a3a3c;
    background: #2c2c2e;
    flex-shrink: 0;
  }
  .file-preview {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.75rem;
    background: #3a3a3c;
    padding: 0.5rem;
    border-radius: 8px;
  }
  .file-preview img {
    max-height: 50px;
    max-width: 100px;
    border-radius: 4px;
    margin-right: 0.75rem;
  }
  .remove-file-btn {
    background: #555;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    line-height: 20px;
    text-align: center;
  }
  .input-area {
    display: flex;
    align-items: center;
  }
  .attach-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    margin-right: 0.5rem;
  }
  .attach-btn:hover {
    color: #e1e1e1;
  }
  .query-input {
    flex: 1;
    padding: 0.75rem 1rem;
    background: #1c1c1e;
    border: 1px solid #4a4a4c;
    border-radius: 8px;
    color: #e1e1e1;
    font-size: 1rem;
  }
  .query-button {
    padding: 0.75rem 1.25rem;
    background: #00cc66;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    margin-left: 0.75rem;
    transition: background-color 0.2s ease;
  }
  .query-button:disabled {
    background: #555;
    cursor: not-allowed;
  }
  
  /* 로더 */
  .loader {
    width: 40px;
    height: 20px;
    background:
      radial-gradient(circle closest-side,#00cc66 90%,#0000) 0%    50%,
      radial-gradient(circle closest-side,#00cc66 90%,#0000) 50%  50%,
      radial-gradient(circle closest-side,#00cc66 90%,#0000) 100% 50%;
    background-size: calc(100%/3) 100%;
    background-repeat: no-repeat;
    animation: l16 1s infinite linear;
  }
  @keyframes l16 {
    20%{background-position:0%    50%, 50%  50%, 100% 50%}
    40%{background-position:0%    50%, 50%  50%, 100% 50%}
    60%{background-position:0%    50%, 50%  50%, 100% 50%}
    80%{background-position:0%    50%, 50%  50%, 100% 50%}
  }
  </style>