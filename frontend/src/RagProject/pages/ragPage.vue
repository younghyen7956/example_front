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
          <div class="sidebar-footer">
          </div>
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
              {{ msg.content }}
            </template>
            <template v-else>
              <div class="assistant-content">
                <template v-if="!msg.content.trim()">
                  <div class="loader"></div>
                </template>
                <template v-else>
                  <div v-html="sanitizeAndFormatHtml(msg.content)"></div>
                </template>
              </div>
            </template>
          </div>
        </div>

        <div class="input-area">
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
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick,onMounted } from "vue";
import { useStore } from "vuex";
import { SET_RAW_DATA, SET_USER_SESSION} from "@/RagProject/store/mutation-types"; // 경로가 올바른지 확인해주세요.
import { v4 as uuidv4 } from 'uuid';

const store = useStore();
const query = ref("");
const chatBox = ref<HTMLElement | null>(null);
const showSidebar = ref(true);
const sessionId = computed(() => store.state.anotherModule.sessionId);
const rawdata = computed(() => store.state.anotherModule.rawdata);
const messages = ref<{ role: "user" | "assistant"; content: string }[]>([]);
let currentAssistantIndex: number | null = null;
const isStreaming = ref(false);

// Toast 알림을 위한 상태
const showToast = ref(false);
const toastMessage = ref("");
let toastTimer: number | undefined;

onMounted(() => {
  if (!sessionId.value) {
    const newSessionId = uuidv4();
    // console.log("새로운 세션 ID 생성:", newSessionId); // 디버깅용 로그
    store.commit(`anotherModule/${SET_USER_SESSION}`, newSessionId);
  }
});

// Toast 알림을 활성화하는 함수
function triggerToast(message: string) {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  
  toastMessage.value = message;
  showToast.value = true;
  
  toastTimer = window.setTimeout(() => {
    showToast.value = false;
  }, 2000); // 2초 후에 사라짐
}

function sanitizeAndFormatHtml(content: string): string {
  if (!content) return "";
  let formatted = content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  formatted = formatted
    .replace(/\.\s*(\d+\.)/g, ".<br><br>$1")
    .replace(/:\s*([가-힣])/g, ":<br>$1")
    .replace(/<br\s*\/?>/gi, "<br>")
    .replace(/(<br>){3,}/gi, "<br><br>");
  formatted = formatted
    .replace(/<\/?strong>/gi, (m) => m.toLowerCase())
    .replace(/<strong><strong>/gi, "<strong>")
    .replace(/<\/strong><\/strong>/gi, "</strong>");
  return formatted.replace(/^<br>+/, "").replace(/<br>+$/, "").trim();
}

async function scrollToBottom() {
  await nextTick();
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
}

async function copyToClipboard(text: string) {
  query.value = text;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      triggerToast("클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("클립보드 복사 실패 (navigator):", err);
      triggerToast("복사에 실패했습니다.");
    }
  } else {
    // 2. 구형 방식(execCommand)으로 대체
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
}

watch(rawdata, async (newVal) => {
  if (currentAssistantIndex !== null && messages.value[currentAssistantIndex]) {
    messages.value[currentAssistantIndex].content = newVal;
    await scrollToBottom();
  }
});

async function startStream() {
  if (!query.value.trim() || isStreaming.value) return;
  const q = query.value.trim();
  query.value = "";
  isStreaming.value = true;

  messages.value.push({ role: "user", content: q });
  await scrollToBottom();

  store.commit(`anotherModule/${SET_RAW_DATA}`, "");

  messages.value.push({ role: "assistant", content: "" });
  currentAssistantIndex = messages.value.length - 1;
  await scrollToBottom();

  try {
    await store.dispatch("anotherModule/requestToFastAPI", {
        query: q,
        sessionId: sessionId.value
    });
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    if (currentAssistantIndex !== null && messages.value[currentAssistantIndex]) {
      messages.value[currentAssistantIndex].content =
        "오류가 발생했습니다. 다시 시도해주세요.";
    }
  } finally {
    isStreaming.value = false;
    query.value = ""; // 질문 전송 후 입력창 비우기
  }
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};
</script>

<style scoped>
/* 전체 레이아웃 */
.stream-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #1c1c1e;
  color: #e1e1e1;
  overflow: hidden;
}

/* 네비바: 타이틀 + 토글 */
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
  line-height: 1;
}
.sidebar-toggle-btn:hover {
  color: #00e673;
}

.nav-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #00cc66;
}

/* 본문: 사이드바 + 채팅 영역 */
.viewer-body {
  display: flex;
  flex: 1;
  width: 100%;
  overflow: hidden;
}

/* 사이드바 */
.sidebar {
  width: 250px;
  background: #2c2c2e;
  padding: 1.5rem 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
}

.sidebar h2 {
  margin: 0 0 1rem;
  color: #00cc66;
  font-size: 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #3a3a3c;
  text-align: left
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  text-align: left
}

.sidebar li {
  margin-bottom: 0.25rem;
}

.sidebar li a {
  display: flex;
  align-items: center;
  color: #e1e1e1;
  text-decoration: none;
  padding: 0.8rem 0.6rem 0.8rem 0rem;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.sidebar li a:hover {
  background-color: #3a3a3c;
  color: #fff;
}
.sidebar li a span {
  margin-right: 0.8rem;
  font-size: 1.2rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #3a3a3c;
  font-size: 0.8rem;
  color: #888;
}

.sidebar-transition-enter-active,
.sidebar-transition-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.sidebar-transition-enter-from,
.sidebar-transition-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.sidebar-transition-enter-to,
.sidebar-transition-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 채팅 컨테이너 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  background-color: #1c1c1e;
  overflow: hidden;
}

/* 채팅 기록 */
.chat-box {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #000;
}

/* 입력창 */
.input-area {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #3a3a3c;
  background: #2c2c2e;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
.query-input {
  flex: 1;
  padding: 0.75rem 1rem;
  margin-right: 0.75rem;
  background: #121212;
  border: 1px solid #4a4a4c;
  border-radius: 8px;
  color: #e1e1e1;
  font-size: 1rem;
}
.query-input:focus {
  outline: none;
  border-color: #00cc66;
  box-shadow: 0 0 0 2px rgba(0, 204, 102, 0.3);
}

.query-button {
  padding: 0.75rem 1.25rem;
  background: #00cc66;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.query-button:hover:not(:disabled) {
  background: #00b359;
}
.query-button.streaming,
.query-button:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

/* 메시지 박스 */
.chat-message {
  max-width: 75%;
  padding: 0.8rem 1.2rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.chat-message.user {
  background: #007aff;
  color: #fff;
  align-self: flex-end;
  margin-left: auto;
  text-align: right;
}

.chat-message.assistant {
  background: #3a3a3c;
  color: #e1e1e1;
  align-self: flex-start;
  margin-right: auto;
  text-align: left;
}
.assistant-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

/* 로더 애니메이션 */
.loader {
  display: block;
  width: 200px;
  height: 20px;
  background: linear-gradient(#00cc66 0 0) 0/0% no-repeat #444;
  animation: l1 2s infinite linear;
  border-radius: 4px;
  margin: 0.5rem 0;
}
@keyframes l1 {
  100% {
    background-size: 100%;
  }
}

/* Toast 스타일 및 애니메이션 */
.toast-popup {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #00cc66;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-size: 0.9rem;
  font-weight: 500;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>