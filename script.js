document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.querySelector(".message-input");
    const chatBody = document.querySelector(".chatbot-body");
    const sendButton = document.querySelector(".chatbot-controls button[type='submit']");
    const fileInput = document.querySelector("#file-input");
    const cameraBtn = document.querySelector("#camera-btn");
    const menuButton = document.querySelector(".menu-button");
    const sidebar = document.querySelector(".sidebar");
    
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const API_KEY = "AIzaSyA4MEUO-_pJf_IZXQp_OkSJVczLYn6FrM4";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });

    messageInput.addEventListener("input", function () {
        this.style.height = "40px";
        this.style.height = this.scrollHeight + "px";
    });

    function sendMessage() {
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, "user");
        messageInput.value = "";
        messageInput.style.height = "40px";

        showThinkingEffect();

        fetchBotResponse(userMessage)
            .then(botResponse => addMessage(botResponse, "bot"))
            .catch(() => addMessage("❌ Oops! Something went wrong.", "bot"));
    }

    messageInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener("click", sendMessage);

    fileInput.addEventListener("change", function () {
        if (fileInput.files.length === 0) return;

        const file = fileInput.files[0];
        addMessage(`📎 File Uploaded: ${file.name}`, "user");

        const reader = new FileReader();
        reader.onload = (e) => analyzeFileContent(e.target.result, file.type);

        if (file.type.includes("text") || file.type.includes("json")) {
            reader.readAsText(file);
        } else if (file.type.includes("pdf")) {
            reader.readAsDataURL(file);
        } else {
            addMessage("⚠️ Unsupported file format.", "bot");
        }
    });

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "user" ? "message-user" : "message-bot");
        messageDiv.innerHTML = `<div class="message-text">${text}</div>`;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showThinkingEffect() {
        const thinkingDiv = document.createElement("div");
        thinkingDiv.classList.add("message-bot", "thinking");
        thinkingDiv.innerHTML = `<div class="message-text">🤔 Thinking...</div>`;
        chatBody.appendChild(thinkingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        setTimeout(() => thinkingDiv.remove(), 2000);
    }

    async function fetchBotResponse(userMessage) {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
        });
        if (!response.ok) throw new Error("Failed to fetch response");
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand that. 🤖";
    }

    function addChatHistory() {
        const chatHistory = document.createElement("div");
        chatHistory.classList.add("chat-history");
        chatHistory.textContent = "📜 Chat History (Coming Soon)";
        sidebar.appendChild(chatHistory);
    }

    addChatHistory();
});
