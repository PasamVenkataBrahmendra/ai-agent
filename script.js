document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.querySelector(".message-input");
    const chatForm = document.querySelector(".chat-form");
    const chatBody = document.querySelector(".chatbot-body");
    const chatbotContainer = document.querySelector(".chatbot");
    const sendButton = document.querySelector(".send-button"); 
    const fileInput = document.querySelector("#file-input"); 

    // Auto-expand textarea
    messageInput.addEventListener("input", function () {
        this.style.height = "40px";
        this.style.height = this.scrollHeight + "px";
    });

    // Replace with your API key
    const API_KEY = "AIzaSyA4MEUO-_pJf_IZXQp_OkSJVczLYn6FrM4"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // ✅ Handle File Upload
    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            addMessage(`📎 File Uploaded: ${fileName}`, "user");
        }
    });

    // ✅ Send Message Function
    function sendMessage() {
        const userMessage = messageInput.value.trim();
        if (userMessage === "") return;

        addMessage(userMessage, "user");
        messageInput.value = "";
        messageInput.style.height = "40px"; 

        showThinkingEffect();

        fetchBotResponse(userMessage)
            .then(botResponse => addMessage(botResponse, "bot"))
            .catch(() => addMessage("❌ Oops! Something went wrong.", "bot"));
    }

    // ✅ Handle Enter Key (Shift + Enter for newline)
    messageInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ✅ Handle Send Button Click
    sendButton.addEventListener("click", sendMessage);

    // ✅ Add Message to Chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "user" ? "message-user" : "message-bot");

        const messageText = document.createElement("div");
        messageText.classList.add("message-text");
        messageText.textContent = text;

        messageDiv.appendChild(messageText);
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // ✅ Show Chatbot "Thinking..."
    function showThinkingEffect() {
        const thinkingDiv = document.createElement("div");
        thinkingDiv.classList.add("message-bot", "thinking");
        thinkingDiv.innerHTML = `<div class="message-text">🤔 Thinking...</div>`;

        chatBody.appendChild(thinkingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => thinkingDiv.remove(), 2000);
    }

    // ✅ Fetch Response from Gemini API
    async function fetchBotResponse(userMessage) {
        const requestBody = {
            contents: [{ parts: [{ text: userMessage }] }]
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error("Failed to fetch response");

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand that. 🤖";
    }

    // Prevent chatbot from closing unexpectedly
    chatbotContainer.addEventListener("click", (e) => e.stopPropagation());

    // Close chatbot on button click
    document.querySelector(".chatbot-close").addEventListener("click", () => {
        chatbotContainer.style.display = "none";
    });
});
