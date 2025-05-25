# 🎤 VoiceGemmaApp

A React Native application that integrates local **Gemma 3** AI with voice recognition and text-to-speech. The app enables natural conversations with AI directly on your mobile device, without internet connection for inference.

## ✨ Features

- 🗣️ **Multilingual voice recognition** (French/English)
- 🤖 **Local Gemma 3 AI** for intelligent responses
- 🔊 **Text-to-speech** for AI responses
- 📱 **Intuitive interface** with model management
- 🌐 **Multilingual support** (French/English)
- 📁 **Model management** (local selection or download)
- 🚀 **Optimized performance** for Samsung S24 Ultra and other powerful devices

## 🚀 Installation

### Prerequisites

Make sure you have completed the React Native development environment setup. Check the [official guide](https://reactnative.dev/docs/set-up-your-environment).

### Special Dependencies

This application uses several specialized native libraries:

```bash
# Voice recognition
npm install @react-native-voice/voice

# Text-to-speech
npm install react-native-tts

# Local AI with Llama/Gemma
npm install llama.rn

# File management
npm install react-native-fs2

# Document selection
npm install @react-native-documents/picker

# Permissions
npm install react-native-permissions

# Local storage
npm install @react-native-async-storage/async-storage
```

### Pod installation (iOS)

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

## 🏃‍♂️ Running the Application

### Step 1: Start Metro

```bash
npm start
# or
yarn start
```

### Step 2: Launch the Application

#### Android
```bash
npm run android
# or
yarn android
```

#### iOS
```bash
npm run ios
# or
yarn ios
```

## 🤖 AI Model Configuration

### Supported Models

The application supports Gemma models in GGUF format:
- **Gemma 3 4B** (recommended) - Good performance/quality balance
- **Gemma 3 2B** - Lighter for less powerful devices
- Other GGUF compatible models

### Getting a Model

#### Option 1: Direct download in the app
1. Open the application
2. Tap "📥 Download Model"
3. Use the default URL or paste your own URL
4. Wait for download and automatic initialization

#### Option 2: Local file selection
1. Download a GGUF model to your device
2. In the app, tap "📁 Select Model"
3. Choose your .gguf file
4. The app will automatically copy and initialize the model

### Recommended Model URLs

```
# Gemma 3 4B (recommended)
https://huggingface.co/tensorblock/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q8_0.gguf

# Lighter alternative model
https://huggingface.co/lmstudio-community/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q3_K_L.gguf
```

## 🎯 Usage

1. **First launch**: Select or download an AI model
2. **Wait for initialization**: "Gemma is ready!" appears
3. **Speak**: Press the microphone button 🎤
4. **Listen to response**: AI responds automatically via text-to-speech
5. **Replay**: Use the 🔊 button to replay the last response

### Language Switching

Tap the flag (🇫🇷/🇺🇸) to switch between French and English.

## 🛠️ Technical Architecture

### Main Services

- **LlamaService**: Local AI management (llama.rn)
- **Voice Recognition**: @react-native-voice/voice
- **Text-to-Speech**: react-native-tts
- **File Management**: react-native-fs2

### Optimizations

- **GPU Acceleration**: Maximum use of mobile GPU
- **Reduced Context**: Optimized for short responses
- **Memory Management**: Automatic resource cleanup
- **Smart Caching**: Reuse of already downloaded models

## 📱 Compatibility

### Recommended Devices
- **Samsung Galaxy S24 Ultra** (tested on it)
- Android devices with 8GB+ RAM
- iPhone 13 Pro or newer

### Minimum Requirements
- Android 7.0+ or iOS 12+
- 4GB RAM minimum (8GB+ recommended)
- 4GB free storage for models
- Functional microphone and speakers

## 🔧 Troubleshooting

### Common Issues

**AI doesn't respond:**
- Check that a model is selected and initialized
- Restart the application if necessary

**Voice recognition doesn't work:**
- Grant microphone permissions
- Check that TTS is not running

**Model too slow:**
- Use a smaller model (2B instead of 4B)
- Close other applications to free up RAM

**Download error:**
- Check your internet connection
- Make sure you have enough storage space

## 📝 Logs and Debugging

The application generates detailed logs in the console:
- 🎤 Voice: Voice recognition
- 🤖 LLM: AI processing
- 🔊 TTS: Text-to-speech
- 📁 Model: Model management

## 📄 License

This project is the intellectual property of the author. All rights reserved.


## 🔗 Useful Resources

- [React Native](https://reactnative.dev)
- [Llama.rn Documentation](https://github.com/mybigday/llama.rn)
- [Gemma Models](https://huggingface.co/tensorblock/gemma-3-4b-it-GGUF)
- [Voice Recognition](https://github.com/react-native-voice/voice)
