import cv2
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import random

app = FastAPI()

# Allow frontend (React/HTML) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Haarcascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Define emotion classes (FER2013 typical)
classes = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# Try to load pretrained PyTorch model, otherwise use demo mode
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
model_available = False

try:
    model = torch.load("emotion_model.pth", map_location=device)
    model.eval()
    model_available = True
except FileNotFoundError:
    print("⚠️  emotion_model.pth not found. Using DEMO mode with random predictions.")
    print("    To use real emotion detection, train a model and place it in Server/emotion_model.pth")
    model_available = False

# Preprocessing
transform = transforms.Compose([
    transforms.Grayscale(),              # FER2013 is grayscale
    transforms.Resize((48, 48)),         # Standard size
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

@app.get("/health")
async def health():
    """Health check endpoint"""
    status = "✅ Ready (with real model)" if model_available else "ℹ️  DEMO mode (no model)"
    return {"status": status, "model_available": model_available}

@app.post("/emotion")
async def detect_emotion(file: UploadFile = File(...)):
    try:
        # Validate file
        if not file:
            return {"emotion": "unknown", "error": "No file provided"}
        
        if not file.content_type.startswith("image/"):
            return {"emotion": "unknown", "error": "Invalid file type. Please upload an image."}
        
        # Read uploaded image
        image_bytes = await file.read()
        if not image_bytes:
            return {"emotion": "unknown", "error": "Empty file"}
        
        img = np.array(Image.open(BytesIO(image_bytes)).convert("RGB"))

        # Convert to grayscale for OpenCV
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        if len(faces) == 0:
            return {"emotion": "NoFace", "error": "No face detected in image", "confidence": 0.0}

        # DEMO MODE: Use random emotion for testing
        if not model_available:
            emotion = random.choice(classes)
            confidence = round(random.uniform(0.6, 0.99), 3)
            print(f"📊 DEMO MODE: Detected {emotion} (confidence: {confidence})")
            return {"emotion": emotion, "confidence": confidence}

        # Take first face
        (x, y, w, h) = faces[0]
        face_img = gray[y:y+h, x:x+w]

        # Preprocess
        face_pil = Image.fromarray(face_img)
        tensor = transform(face_pil).unsqueeze(0).to(device)

        # Predict
        with torch.no_grad():
            outputs = model(tensor)
            _, predicted = torch.max(outputs, 1)
            emotion = classes[predicted.item()]
            confidence = torch.nn.functional.softmax(outputs, dim=1)[0][predicted].item()

        return {"emotion": emotion, "confidence": round(confidence, 3)}
    except Exception as e:
        print("❌ Error:", e)
        return {"emotion": "unknown", "error": str(e), "confidence": 0.0}

