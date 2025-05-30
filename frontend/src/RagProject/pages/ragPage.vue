<template>
  <div class="stream-viewer">
    <nav class="viewer-nav">
      <button @click="toggleSidebar" class="sidebar-toggle-btn">
        {{ showSidebar ? "✕" : "☰" }}
      </button>
      <div class="nav-title">RAG를 사용한 챗봇</div>
    </nav>
    <div class="viewer-body">
      <transition name="sidebar-transition">
        <aside class="sidebar" v-show="showSidebar">
          <h2>메뉴</h2>
          <ul>
            <!-- <li><a href="#"><span>⚙️</span> 설정</a></li> -->
            <!-- <li><a href="#"><span>📜</span> 히스토리</a></li> -->
            <!-- <li><a href="#"><span>❓</span> 도움말</a></li> -->
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
            <template v-else> <div class="assistant-content">
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
import { ref, computed, watch, nextTick } from "vue";
import { useStore } from "vuex";
// REQUEST_TO_FASTAPI는 액션 내부에서 chunk를 커밋할 때 사용되므로 여기서 직접 필요 없을 수 있습니다.
// SET_RAW_DATA는 rawdata를 초기화할 때 필요합니다.
import { SET_RAW_DATA } from "@/RagProject/store/mutation-types"; // 경로가 올바른지 확인해주세요.

const store = useStore();
const query = ref("");
const chatBox = ref<HTMLElement | null>(null);
const showSidebar = ref(false);

const rawdata = computed(() => store.state.anotherModule.rawdata);
const messages = ref<{ role: "user" | "assistant"; content: string }[]>([]);
let currentAssistantIndex: number | null = null;
const isStreaming = ref(false);

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

  // rawdata를 초기화하기 위해 SET_RAW_DATA 뮤테이션을 사용합니다.
  store.commit(`anotherModule/${SET_RAW_DATA}`, "");

  // 어시스턴트 메시지 추가 (이때 content는 "" 이므로, v-if="!msg.content.trim()"에 의해 로더가 보임)
  messages.value.push({ role: "assistant", content: "" });
  currentAssistantIndex = messages.value.length - 1;
  await scrollToBottom();

  try {
    // requestToFastAPI 액션은 내부적으로 (이어붙이는) REQUEST_TO_FASTAPI 뮤테이션을 사용합니다.
    // rawdata가 위에서 비워졌으므로 새로운 내용만 추가됩니다.
    // 스트림 데이터가 rawdata에 처음 기록되면, watch 콜백이 실행되어
    // messages.value[currentAssistantIndex].content가 업데이트되고 로더가 사라집니다.
    await store.dispatch("anotherModule/requestToFastAPI", q);
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    if (currentAssistantIndex !== null && messages.value[currentAssistantIndex]) {
      // 오류 발생 시 로더 대신 오류 메시지 표시
      messages.value[currentAssistantIndex].content =
        "오류가 발생했습니다. 다시 시도해주세요.";
    }
  } finally {
    isStreaming.value = false; // 버튼 상태 및 "답변 생성 중..." 텍스트 제어
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
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}

.sidebar li {
  margin-bottom: 0.25rem;
}

.sidebar li a {
  display: flex;
  align-items: center;
  color: #e1e1e1;
  text-decoration: none;
  padding: 0.6rem 0.8rem;
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
  display: flex;  /* 이 부분을 주석 처리하거나 유지할 수 있습니다. align-items: stretch와 함께 사용 시 효과가 있을 수 있음 */
  flex-direction: column;  /* 위와 동일 */
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #000; /* 이전 코드에서 이 부분이 있었으므로 유지 */
  /* align-items: stretch; */ /* 이 부분은 자식 요소들의 너비를 부모에 맞추려 할 때 사용 */
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
/* 메시지 박스 */
.chat-message {
  max-width: 75%; /* 모든 메시지의 최대 너비 */
  padding: 0.8rem 1.2rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  /* width: fit-content; /* 좀 더 명시적으로 하고 싶다면 추가할 수 있지만, flex 아이템은 기본적으로 내용에 맞춤 */
}

.chat-message.user {
  background: #007aff;
  color: #fff;
  align-self: flex-end; /* ✏️ .chat-box가 flex container일 때 오른쪽 끝으로 정렬 */
  margin-left: auto;  /*align-self: flex-end와 함께라면 이 줄은 생략 가능하나, 유지해도 무방 */
}

.chat-message.assistant {
  background: #3a3a3c;
  color: #e1e1e1;
  align-self: flex-start; /* 어시스턴트 메시지는 왼쪽에 정렬 */
  margin-right: auto; /* 위와 마찬가지로 생략 가능*/
}
.assistant-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

/* 로더 애니메이션 */
.loader {
  display: block;
  width: 200px; /* 로더 너비 예시 */
  height: 20px;
  background: linear-gradient(#00cc66 0 0) 0/0% no-repeat #444;
  animation: l1 2s infinite linear;
  border-radius: 4px;
  margin: 0.5rem 0; /* 위아래 마진, 좌우는 기본값(왼쪽) */
}
@keyframes l1 {
  100% {
    background-size: 100%;
  }
}
</style>