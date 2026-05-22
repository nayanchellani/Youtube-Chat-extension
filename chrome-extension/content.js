let chatContainer = null;
let currentVideoId = null;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

const BACKEND_URL = "http://localhost:8000";

function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_widget") {
    toggleWidget();
    sendResponse({ status: "widget_toggled" });
  }
  return true;
});

function toggleWidget() {
  if (chatContainer) {
    if (chatContainer.style.display === "none") {
      chatContainer.style.display = "flex";
      const activeId = getVideoId();
      if (activeId && activeId !== currentVideoId) {
        currentVideoId = activeId;
        initChatForCurrentVideo();
      }
    } else {
      chatContainer.style.display = "none";
    }
  } else {
    createWidget();
  }
}

function createWidget() {
  currentVideoId = getVideoId();
  if (!currentVideoId) {
    alert("Please open a YouTube video page to use this chatbot!");
    return;
  }

  chatContainer = document.createElement("div");
  chatContainer.className = "yt-neobrutal-chat-container";
  chatContainer.style.top = "120px";
  chatContainer.style.right = "24px";
  chatContainer.style.display = "flex";

  chatContainer.innerHTML = `
    <div class="yt-neobrutal-chat-header" id="yt-drag-header">
      <div class="yt-neobrutal-chat-header-title">
        <span class="yt-neobrutal-chat-header-dot" id="yt-status-dot"></span>
        <span>Video Chatbot RAG</span>
      </div>
      <button class="yt-neobrutal-chat-close-btn" id="yt-close-btn" title="Close">X</button>
    </div>
    <div class="yt-neobrutal-chat-messages" id="yt-chat-messages"></div>
    <div class="yt-neobrutal-chat-input-area">
      <input type="text" class="yt-neobrutal-chat-input" id="yt-chat-input" placeholder="Ask about this video..." autocomplete="off" />
      <button class="yt-neobrutal-chat-send-btn" id="yt-send-btn">Send</button>
    </div>
  `;

  document.body.appendChild(chatContainer);
  setupDragHandlers();
  
  document.getElementById("yt-close-btn").addEventListener("click", () => {
    chatContainer.style.display = "none";
  });

  const chatInput = document.getElementById("yt-chat-input");
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  document.getElementById("yt-send-btn").addEventListener("click", handleSendMessage);
  initChatForCurrentVideo();
}

function setupDragHandlers() {
  const header = document.getElementById("yt-drag-header");
  
  header.addEventListener("mousedown", (e) => {
    if (e.target.closest("#yt-close-btn")) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = chatContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const widgetWidth = chatContainer.offsetWidth;
    const widgetHeight = chatContainer.offsetHeight;
    
    if (newLeft < 0) newLeft = 0;
    if (newLeft + widgetWidth > viewportWidth) newLeft = viewportWidth - widgetWidth;
    if (newTop < 0) newTop = 0;
    if (newTop + widgetHeight > viewportHeight) newTop = viewportHeight - widgetHeight;
    
    chatContainer.style.right = "auto";
    chatContainer.style.bottom = "auto";
    chatContainer.style.left = `${newLeft}px`;
    chatContainer.style.top = `${newTop}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function appendMessage(sender, text, isSystem = false) {
  const messagesArea = document.getElementById("yt-chat-messages");
  if (!messagesArea) return;

  const msgDiv = document.createElement("div");
  if (isSystem) {
    msgDiv.className = "yt-neobrutal-msg yt-neobrutal-msg-system";
  } else {
    msgDiv.className = `yt-neobrutal-msg yt-neobrutal-msg-${sender}`;
  }
  msgDiv.innerText = text;

  messagesArea.appendChild(msgDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showTypingIndicator() {
  const messagesArea = document.getElementById("yt-chat-messages");
  if (!messagesArea) return;

  const typingDiv = document.createElement("div");
  typingDiv.className = "yt-neobrutal-msg yt-neobrutal-msg-bot";
  typingDiv.id = "yt-typing-indicator";
  typingDiv.innerHTML = `
    <div class="yt-neobrutal-typing">
      <div class="yt-neobrutal-dot"></div>
      <div class="yt-neobrutal-dot"></div>
      <div class="yt-neobrutal-dot"></div>
    </div>
  `;
  messagesArea.appendChild(typingDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("yt-typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

function setStatusActive(active) {
  const dot = document.getElementById("yt-status-dot");
  if (!dot) return;
  
  if (active) {
    dot.className = "yt-neobrutal-chat-header-dot";
    dot.classList.remove("loading");
  } else {
    dot.className = "yt-neobrutal-chat-header-dot loading";
  }
}

async function initChatForCurrentVideo() {
  const messagesArea = document.getElementById("yt-chat-messages");
  if (messagesArea) messagesArea.innerHTML = "";

  if (!currentVideoId) return;

  setStatusActive(false);
  appendMessage("system", "Initializing chatbot: Loading video transcript...", true);

  try {
    const response = await fetch(`${BACKEND_URL}/api/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_id: currentVideoId }),
    });

    if (!response.ok) {
      const errDetail = await response.json();
      throw new Error(errDetail.detail || "Server error");
    }

    await response.json();
    setStatusActive(true);
    if (messagesArea) messagesArea.innerHTML = "";
    appendMessage("system", "Chatbot ready! Ask me anything about this video.", true);
  } catch (error) {
    console.error("Initialization error:", error);
    setStatusActive(true);
    const dot = document.getElementById("yt-status-dot");
    if (dot) dot.style.backgroundColor = "#FF5C5C";
    
    appendMessage("system", `Failed to initialize: ${error.message}`, true);
  }
}

async function handleSendMessage() {
  const chatInput = document.getElementById("yt-chat-input");
  if (!chatInput) return;

  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  appendMessage("user", text);
  showTypingIndicator();
  setStatusActive(false);

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: currentVideoId,
        question: text,
      }),
    });

    removeTypingIndicator();
    setStatusActive(true);

    if (!response.ok) {
      const errDetail = await response.json();
      throw new Error(errDetail.detail || "Failed to get response");
    }

    const data = await response.json();
    appendMessage("bot", data.answer);
  } catch (error) {
    console.error("Chat error:", error);
    removeTypingIndicator();
    setStatusActive(true);
    appendMessage("bot", `Sorry, I encountered an error: ${error.message}`);
  }
}

document.addEventListener("yt-navigate-finish", () => {
  const activeId = getVideoId();
  if (chatContainer && chatContainer.style.display !== "none" && activeId && activeId !== currentVideoId) {
    currentVideoId = activeId;
    initChatForCurrentVideo();
  }
});
