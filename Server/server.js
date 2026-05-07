require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { marked } = require('marked');

// Node-fetch workaround
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());
app.use(upload.any());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-2.5-flash";

// ✅ Utility: Markdown/HTML → TTS-friendly plain text
function markdownToPlain(md) {
  return md
    .replace(/<[^>]+>/g, " ")              // remove HTML tags
    .replace(/[#*_`>]/g, "")               // remove markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")    // [text](url) → text
    .replace(/\n+/g, ". ")                 // line breaks → periods
    .replace(/-\s+/g, "• ")                // bullets
    .replace(/\s+/g, " ")                  // collapse spaces
    .trim();
}

// 🔹 Gemini route
app.post('/gemini', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }] }),
      }
    );

    const data = await response.json();
    console.log("🔸 Gemini response:", data);

    const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    // HTML for chat display
    const replyHtml = marked.parse(rawReply);

    // Plain text for TTS
    const replyText = markdownToPlain(rawReply);

    res.json({ replyText, replyHtml, rawReply });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

// 🔹 Emotion route (talks to Python backend)
app.post('/emotion', async (req, res) => {
  try {
    const file = req.files?.file;  // multer middleware will parse FormData
    
    if (!file) {
      return res.status(400).json({ emotion: "unknown", error: "No image provided" });
    }

    // Forward the image to Python FastAPI backend
    const formData = new FormData();
    formData.append("file", file.data, "frame.jpg");

    const response = await fetch("http://127.0.0.1:8000/emotion", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    res.json(data);  // { emotion: "happy" }
  } catch (err) {
    console.error("❌ Emotion API error:", err);
    res.status(500).json({ emotion: "unknown", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Node.js server running at http://localhost:${PORT}`);
});

