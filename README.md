# 🌿 PhytoScan – AI-Based Plant Disease Detection App

**PhytoScan** is a mobile application that helps farmers and gardeners detect plant diseases using AI-powered image classification. It combines a React Native frontend with TensorFlow Lite inference, and a Node.js + Flask backend for image upload, authentication, and real-time predictions.

---

## 📱 Features

- 📷 Upload plant images (camera/gallery)
- 🤖 Detect plant species and diseases using EfficientNetB0
- 💊 Get instant treatment suggestions
- 📈 View prediction history with feedback system
- 🔐 User authentication with email + OTP
- 💾 Secure storage via MySQL database

---

## 🏗️ Project Structure

PhytoScan/
├── PhytoScan-Front-end/ # React Native app (Expo + TFLite)
├── phyto-scan-backend/ # Node.js + Flask + MySQL
└── run.py # (Optional root runner, if used)


---

## ⚙️ Tech Stack

| Layer           | Technology                          |
|----------------|--------------------------------------|
| Frontend       | React Native + Expo                  |
| AI Inference   | TensorFlow Lite (EfficientNetB0)     |
| Backend        | Node.js + Express (Auth & Upload)    |
| AI API         | Python Flask + EfficientNetB0        |
| Database       | MySQL                                |
| Auth           | JWT + Bcrypt + OTP (Nodemailer)      |

---

## 🔋 AI Model Details

- ✅ Transfer learning with EfficientNetB0
- ✅ Trained on PlantVillage dataset (10 classes)
- ✅ Converted to `.tflite` for mobile use
- ✅ Achieved **95.83% test accuracy**

---

## 🚀 Getting Started

### 📦 Frontend (React Native)

```bash
cd PhytoScan/PhytoScan-Front-end
npm install
npx expo start


🔙 Backend (Node + Flask)
cd PhytoScan/phyto-scan-backend

# Node.js (Authentication, Uploads)
npm install
node server.js

# Python Flask (AI Inference)
pip install -r requirements.txt
python app.py

