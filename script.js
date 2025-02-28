document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.querySelector(".message-input");
    const chatForm = document.querySelector(".chat-form");
    const chatBody = document.querySelector(".chatbot-body");
    const chatbotContainer = document.querySelector(".chatbot");
    const sendButton = document.querySelector(".material-symbols-outlined[aria-label='arrow_upward']");
    const fileInput = document.querySelector("#file-input");
    const cameraBtn = document.querySelector("#camera-btn");

    // Camera Elements
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Auto-expand textarea
    messageInput.addEventListener("input", function () {
        this.style.height = "40px";
        this.style.height = this.scrollHeight + "px";
    });

    const API_KEY = "AIzaSyA4MEUO-_pJf_IZXQp_OkSJVczLYn6FrM4";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // ✅ Handle File Upload and Analysis
    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            addMessage(`📎 File Uploaded: ${fileName}`, "user");

            const reader = new FileReader();

            reader.onload = function (e) {
                const fileContent = e.target.result;
                analyzeFileContent(fileContent, file.type);
            };

            if (file.type.includes("text") || file.type.includes("json")) {
                reader.readAsText(file);
            } else if (file.type.includes("pdf")) {
                reader.readAsDataURL(file);
            } else {
                addMessage("⚠️ Unsupported file format.", "bot");
            }
        }
    });

    // ✅ Handle Camera Capture and Image Analysis
    cameraBtn.addEventListener("click", async function () {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();

            const captureBtn = document.createElement("button");
            captureBtn.textContent = "📸 Capture";
            captureBtn.classList.add("capture-btn");
            chatbotContainer.appendChild(captureBtn);

            captureBtn.addEventListener("click", () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = canvas.toDataURL("image/png");
                analyzeImage(imageData);

                stream.getTracks().forEach(track => track.stop());
                chatbotContainer.removeChild(captureBtn);
            });

        } catch (error) {
            console.error("Camera access denied:", error);
            addMessage("🚫 Unable to access camera.", "bot");
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

    // ✅ Analyze Captured Image
    async function analyzeImage(base64Image) {
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: base64Image.split(",")[1]
                            }
                        }
                    ]
                }
            ]
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Failed to fetch response");

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No text extracted.";
            addMessage(`📷 Image Analysis: ${generatedText}`, "bot");

        } catch (error) {
            console.error("Error:", error);
            addMessage("❌ Error analyzing image.", "bot");
        }
    }

    // ✅ Analyze File Content
    async function analyzeFileContent(fileContent, fileType) {
        const requestBody = {
            contents: [{ parts: [{ text: fileContent }] }]
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Failed to fetch response");

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't extract information.";
            addMessage(`📂 File Analysis: ${generatedText}`, "bot");

        } catch (error) {
            console.error("Error:", error);
            addMessage("❌ Error analyzing file.", "bot");
        }
    }

    // Prevent chatbot from closing unexpectedly
    chatbotContainer.addEventListener("click", (e) => e.stopPropagation());

    // Close chatbot on button click
    document.querySelector(".chatbot-close").addEventListener("click", () => {
        chatbotContainer.style.display = "none";
    });
});
