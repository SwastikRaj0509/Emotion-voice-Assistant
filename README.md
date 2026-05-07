# 🎤 AskMitr - Emotion-Aware Voice Assistant

An AI-powered voice assistant that combines real-time emotion detection with intelligent conversational responses using Google Gemini API.

## 🎯 Features

- **Voice Recognition**: Real-time speech-to-text using Web Speech API
- **Emotion Detection**: Real-time emotion detection from webcam feed using PyTorch
- **AI Responses**: Intelligent responses using Google Gemini API
- **Text-to-Speech**: Natural language synthesis with emotion context
- **Real-time Chat UI**: Interactive chat interface with emotion indicators

## 🏗️ Architecture

```
Frontend (HTML/JS)
    ↓
Node.js Server (Express)
    ├→ Gemini API (LLM responses)
    └→ Python FastAPI Backend (emotion detection)
         └→ PyTorch + OpenCV (face detection & classification)
```

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Webcam & microphone
- Google Gemini API key

## ⚙️ Installation

### 1. Clone the repository
```bash
cd EmotionVoiceAssistant
```

### 2. Setup Frontend
No additional setup needed - files are ready in `Client/` folder

### 3. Setup Node.js Server

```bash
cd Server
npm install
```

Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 4. Setup Python Backend

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Important**: You need to obtain a trained emotion detection model (`emotion_model.pth`) and place it in the `Server/` folder.

## 🚀 Running the Application

### Terminal 1: Start Python Backend
```bash
cd Server
# Activate venv if not already active
python -m uvicorn app_emotion:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Start Node.js Server
```bash
cd Server
node server.js
# or use npm start
npm start
```

### Terminal 3: Open Frontend
```bash
# Open Client/EmotionVoiceAssistant.html in your browser
# or use a local server:
cd Client
python -m http.server 5000
# Then navigate to http://localhost:5000/EmotionVoiceAssistant.html
```

## 📝 Configuration

### Environment Variables (`.env`)
```
GEMINI_API_KEY=your_api_key_here
```

Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🔧 Emotion Model

The system requires a pre-trained PyTorch emotion recognition model. Expected format:
- Model file: `emotion_model.pth`
- Input: Grayscale image (48×48)
- Output: 7 emotion classes (Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral)

### Training Your Own Model
You can train a model using datasets like FER2013 or AffectNet.

## 📊 API Endpoints

### Node.js Server (Port 3000)

**POST** `/gemini` - Get AI response
```json
Request: { "prompt": "Hello, how are you?" }
Response: { 
  "replyText": "I'm doing well, thanks for asking!",
  "replyHtml": "<p>I'm doing well, thanks for asking!</p>",
  "rawReply": "I'm doing well, thanks for asking!"
}
```

**POST** `/emotion` - Detect emotion from image
```
Request: FormData with image file
Response: { "emotion": "happy" }
```

### Python Backend (Port 8000)

**POST** `/emotion` - Detect emotion from uploaded image
```
Request: FormData with image file
Response: { "emotion": "happy" }
```

## 🐛 Troubleshooting

### Webcam not loading
- Check browser permissions for camera access
- Ensure webcam is not in use by another application
- Try a different browser

### Emotion detection fails
- Ensure face is clearly visible and well-lit
- Check that `emotion_model.pth` exists in Server folder
- Verify Python backend is running on port 8000

### Gemini API errors
- Verify API key is correct in `.env`
- Check API quotas in Google Cloud Console
- Ensure model name matches: `models/gemini-2.5-flash`

### CORS errors
- Verify all servers are running (Node.js on 3000, Python on 8000)
- Check that CORS middleware is enabled in both backends

## 📚 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Web Speech API, WebRTC)
- **Backend**: Node.js + Express, Python + FastAPI
- **ML**: PyTorch, OpenCV, torchvision
- **API**: Google Generative AI (Gemini)
- **Deployment**: Not configured (local development only)

## 📄 License

ISC

## 🤝 Contributing

Feel free to fork and submit pull requests for improvements.

## 📞 Support

For issues and questions, please open an issue in the repository.
