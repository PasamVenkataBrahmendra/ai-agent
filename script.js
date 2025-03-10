document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.querySelector(".message-input");
    const chatBody = document.querySelector(".chatbot-body");
    const sendButton = document.querySelector(".chatbot-controls button[type='submit']");
    const fileInput = document.querySelector("#file-input");
    const cameraBtn = document.querySelector("#camera-btn");

    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const API_KEY = "AIzaSyA4MEUO-_pJf_IZXQp_OkSJVczLYn6FrM4";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

    cameraBtn.addEventListener("click", async function () {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.play();

            const captureBtn = document.createElement("button");
            captureBtn.textContent = "📸 Capture";
            captureBtn.classList.add("capture-btn");
            document.body.appendChild(captureBtn);

            captureBtn.addEventListener("click", () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = canvas.toDataURL("image/png");
                analyzeImage(imageData);

                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(captureBtn);
            });
        } catch (error) {
            console.error("Camera access denied:", error);
            addMessage("🚫 Unable to access camera.", "bot");
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

    async function analyzeImage(base64Image) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ inline_data: { mime_type: "image/png", data: base64Image.split(",")[1] } }] }]
                })
            });
            if (!response.ok) throw new Error("Failed to analyze image");
            const data = await response.json();
            addMessage(`📷 Image Analysis: ${data.candidates?.[0]?.content?.parts?.[0]?.text || "No text extracted."}`, "bot");
        } catch (error) {
            console.error("Error:", error);
            addMessage("❌ Error analyzing image.", "bot");
        }
    }

    async function analyzeFileContent(fileContent, fileType) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: fileContent }] }] })
            });
            if (!response.ok) throw new Error("Failed to analyze file");
            const data = await response.json();
            addMessage(`📂 File Analysis: ${data.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't extract information."}`, "bot");
        } catch (error) {
            console.error("Error:", error);
            addMessage("❌ Error analyzing file.", "bot");
        }
    }
});
