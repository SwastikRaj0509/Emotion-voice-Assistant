const btn = document.getElementById('talk');
const chatBox = document.getElementById('chat-box');
const video = document.getElementById('video');
const emotionStatus = document.getElementById('emotion-status');
const statusIndicator = document.getElementById('status-indicator');
const micHint = document.getElementById('mic-hint');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

let listeningMsg = null;
let isRecognizing = false;
let latestEmotion = "unknown";
let latestConfidence = 0;

// Emotion emoji mapping
const emotionEmoji = {
  "Angry": "😠",
  "Disgust": "🤢",
  "Fear": "😨",
  "Happy": "😊",
  "Sad": "😢",
  "Surprise": "😮",
  "Neutral": "😐",
  "NoFace": "👤",
  "unknown": "🤔"
};

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { 
    video.srcObject = stream;
    updateStatus("Ready", true);
  })
  .catch(err => {
    console.error("Webcam error:", err);
    updateStatus("Webcam unavailable", false);
  });

// Update UI status
function updateStatus(text, isActive) {
  if (statusIndicator) {
    const dot = statusIndicator.querySelector('.status-dot');
    const textEl = statusIndicator.querySelector('.status-text');
    if (dot) dot.style.backgroundColor = isActive ? '#10b981' : '#ef4444';
    if (textEl) textEl.textContent = text;
  }
}

// Update emotion display
function updateEmotion(emotion, confidence) {
  if (emotionStatus) {
    const emoji = emotionEmoji[emotion] || "🤔";
    const confidenceText = confidence > 0 ? ` (${(confidence * 100).toFixed(0)}%)` : '';
    emotionStatus.textContent = `${emoji} ${emotion}${confidenceText}`;
  }
}

// Capture a single frame as Blob
function captureFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/jpeg");
  });
}

// Periodically send frame to backend for emotion detection
async function detectEmotion() {
  const frameBlob = await captureFrame();
  if (!frameBlob) return;

  const formData = new FormData();
  formData.append("file", frameBlob, "frame.jpg");

  try {
    const res = await fetch("http://localhost:3000/emotion", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    latestEmotion = data.emotion || "unknown";
    latestConfidence = data.confidence || 0;
    updateEmotion(latestEmotion, latestConfidence);
    console.log("Detected emotion:", latestEmotion, "Confidence:", latestConfidence);
  } catch (err) {
    console.error("Emotion fetch error:", err);
    updateStatus("Error detecting emotion", false);
  }
}
setInterval(detectEmotion, 5000); // check every 5s

// Speech recognition flow
btn.addEventListener("click", () => {
  if (isRecognizing) return;
  recognition.start();
});

recognition.onstart = () => {
  isRecognizing = true;
  btn.classList.add("listening");
  updateStatus("Listening", true);
  if (micHint) micHint.textContent = "🎤 Listening... speak clearly";
  listeningMsg = addMessage("🎤 Listening...", "user", true);
};

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;

  if (listeningMsg) { 
    listeningMsg.innerHTML = `<strong>You:</strong> ${transcript}`; 
    listeningMsg = null; 
  }

  const typingMsg = addMessage("⏳ Processing your request...", "gemini", true);
  updateStatus("Processing", true);

  try {
    const response = await fetch("http://localhost:3000/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: transcript })
    });

    const data = await response.json();
    const emotionEmoji = {
      "Angry": "😠",
      "Disgust": "🤢",
      "Fear": "😨",
      "Happy": "😊",
      "Sad": "😢",
      "Surprise": "😮",
      "Neutral": "😐",
      "NoFace": "👤",
      "unknown": "🤔"
    }[latestEmotion] || "🤔";

    typingMsg.innerHTML = data.replyHtml + `<div class="emotion-badge">${emotionEmoji} Your emotion: <strong>${latestEmotion}</strong></div>`;
    updateStatus("Ready", true);
    if (micHint) micHint.textContent = "🎤 Click to ask another question";
    speakQueue(splitSentences(data.replyText));
  } catch (error) {
    typingMsg.innerHTML = `<p style="color:#ef4444">❌ Error getting response. Please try again.</p>`;
    updateStatus("Error", false);
  }
};

recognition.onerror = (event) => {
  console.error("Speech recognition error:", event.error);
  if (listeningMsg) { 
    listeningMsg.innerHTML = `❌ Error: ${event.error}`; 
    listeningMsg = null; 
  }
  updateStatus("Error", false);
};

recognition.onend = () => {
  isRecognizing = false;
  btn.classList.remove("listening");
  if (listeningMsg) { listeningMsg.remove(); listeningMsg = null; }
  if (micHint) micHint.textContent = "Click the microphone and speak clearly";
};

// Split text for TTS
function splitSentences(text) {
  if (!text) return [];
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\. |\? |\! /)
    .filter(Boolean);
}

// Queue TTS
function speakQueue(sentences) {
  if (!sentences.length) return;
  const utterance = new SpeechSynthesisUtterance(sentences.shift());
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.onend = () => speakQueue(sentences);
  speechSynthesis.speak(utterance);
}

// Chat messages
function addMessage(text, sender, returnEl = false) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  const bubble = document.createElement("div");
  bubble.classList.add(sender === "user" ? "user-message" : "gemini-message");
  bubble.innerHTML = text;
  msgDiv.appendChild(bubble);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return returnEl ? bubble : null;
}

// Initialize emotion display
updateEmotion("Neutral", 0);
