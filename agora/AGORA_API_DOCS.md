# Agora German Tutor Bot API Documentation

## Overview
REST API for AI-powered German language tutoring. The bot uses OpenAI's Whisper (transcription), GPT-4 (conversation), and TTS (text-to-speech) to provide interactive German learning sessions.

**Key Features:**
- ✅ No Agora SDK required on server (lightweight REST API)
- ✅ Voice-to-voice German conversation
- ✅ Real-time transcription and translation
- ✅ Context-aware responses (maintains conversation history)
- ✅ Easy iOS integration

## Base URL
```
Production: https://thegeneralapps.com/api/agora
Development: http://localhost:8000/api/agora
```

---

## Authentication
Currently no authentication required. For production, consider:
- API key authentication
- User session tokens
- Rate limiting per user

---

## Architecture

```
iOS App                    Server (Node.js)              OpenAI API
   |                              |                           |
   |--POST /join-with-bot-------->|                           |
   |<--{channel, appId}-----------|                           |
   |                              |                           |
   | Records audio (3-5s)         |                           |
   |                              |                           |
   |--POST /process-audio-------->|--Whisper Transcribe------>|
   |  (base64 audio)              |<--German text-------------|
   |                              |                           |
   |                              |--GPT-4 Generate Reply---->|
   |                              |<--German response---------|
   |                              |                           |
   |                              |--TTS Convert------------->|
   |                              |<--Audio MP3---------------|
   |                              |                           |
   |<--{transcription, reply}-----|                           |
   |                              |                           |
   | Plays audio response         |                           |
```

---

## Endpoints

### 1. Health Check
Check if the API service is running.

**Endpoint:** `GET /api/agora/health`

**Response (200):**
```json
{
  "success": true,
  "service": "agora-bot",
  "status": "available",
  "botRunning": false
}
```

**Example:**
```bash
curl https://thegeneralapps.com/api/agora/health
```

---

### 2. Get Bot Status
Check current bot session status.

**Endpoint:** `GET /api/agora/status`

**Response (200):**
```json
{
  "success": true,
  "isRunning": true,
  "channel": "tutor-user123-1703671234567",
  "startedAt": "2025-12-18T10:30:00.000Z",
  "error": null
}
```

**Example:**
```bash
curl https://thegeneralapps.com/api/agora/status
```

---

### 3. Get Configuration
Get Agora app configuration (for iOS app setup).

**Endpoint:** `GET /api/agora/config`

**Response (200):**
```json
{
  "success": true,
  "appId": "8189340d7b2e4ddc809cb96ecd47e520",
  "currentChannel": "tutor-user123-1703671234567",
  "botRunning": true
}
```

**Example:**
```bash
curl https://thegeneralapps.com/api/agora/config
```

---

### 4. Join with Bot ⭐ (Primary iOS Endpoint)
Start a new tutoring session. Creates a unique channel for the user.

**Endpoint:** `POST /api/agora/join-with-bot`

**Request Body:**
```json
{
  "userId": "user123",              // Required: Unique user identifier
  "userName": "John Doe",            // Optional: Display name
  "openAiApiKey": "sk-..."          // Optional: Custom OpenAI key (uses server key by default)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "appId": "8189340d7b2e4ddc809cb96ecd47e520",
  "channel": "tutor-user123-1703671234567",
  "token": null,
  "message": "Bot started. Join this channel from your iOS app."
}
```

**If Bot Already Running (200):**
```json
{
  "success": true,
  "appId": "8189340d7b2e4ddc809cb96ecd47e520",
  "channel": "tutor-existing-1703670000000",
  "token": null,
  "message": "Bot is already running. Join the existing channel."
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "OpenAI API key not configured"
}
```

**iOS Example:**
```swift
struct JoinRequest: Codable {
    let userId: String
    let userName: String?
}

func joinWithBot(userId: String, userName: String) async throws -> AgoraConfig {
    let url = URL(string: "https://thegeneralapps.com/api/agora/join-with-bot")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = JoinRequest(userId: userId, userName: userName)
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(AgoraConfig.self, from: data)
}
```

**cURL Example:**
```bash
curl -X POST https://thegeneralapps.com/api/agora/join-with-bot \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userName": "John Doe"
  }'
```

---

### 5. Start Bot (Advanced)
Start bot with custom channel. Use `/join-with-bot` instead for most cases.

**Endpoint:** `POST /api/agora/start`

**Request Body:**
```json
{
  "channel": "my-channel-123",     // Required: Custom channel identifier
  "token": "agora-token",           // Optional: Agora authentication token
  "openAiApiKey": "sk-..."          // Optional: Custom OpenAI key
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bot started successfully",
  "channel": "my-channel-123",
  "startedAt": "2025-12-18T10:30:00.000Z"
}
```

**Error - Missing Channel (400):**
```json
{
  "success": false,
  "error": "Channel ID is required"
}
```

**Error - Bot Already Running (200):**
```json
{
  "success": false,
  "error": "Bot is already running",
  "channel": "existing-channel"
}
```

**cURL Example:**
```bash
curl -X POST https://thegeneralapps.com/api/agora/start \
  -H "Content-Type: application/json" \
  -d '{"channel": "test-channel-1"}'
```

---

### 6. Process Audio ⭐ (Main Conversation Endpoint)
Send user's audio to bot for transcription and response.

**Endpoint:** `POST /api/agora/process-audio`

**Request Methods:**

#### Method 1: JSON with Base64 (Recommended for iOS)
```json
{
  "audio": "base64-encoded-audio-data",
  "mimeType": "audio/m4a"           // or "audio/mp3", "audio/wav", "audio/webm"
}
```

#### Method 2: Multipart Form Data
```
Content-Type: multipart/form-data
audio: [binary audio file]
```

**Success Response (200):**
```json
{
  "success": true,
  "transcription": "Hallo, wie geht es dir?",
  "reply": "Mir geht es gut, danke! Und dir?",
  "audio": "base64-encoded-mp3-audio"
}
```

**Error - Bot Not Running (400):**
```json
{
  "success": false,
  "error": "Bot is not running. Start a session first."
}
```

**Error - No Audio Data (400):**
```json
{
  "success": false,
  "error": "No audio data provided"
}
```

**Error - Processing Failed (500):**
```json
{
  "success": false,
  "error": "Failed to transcribe audio"
}
```

**iOS Example:**
```swift
struct AudioRequest: Codable {
    let audio: String  // Base64 encoded
    let mimeType: String
}

struct BotResponse: Codable {
    let success: Bool
    let transcription: String?
    let reply: String?
    let audio: String?  // Base64 encoded MP3
    let error: String?
}

func processAudio(audioData: Data) async throws -> BotResponse {
    let url = URL(string: "https://thegeneralapps.com/api/agora/process-audio")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = AudioRequest(
        audio: audioData.base64EncodedString(),
        mimeType: "audio/m4a"
    )
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(BotResponse.self, from: data)
}
```

**cURL Example (Base64):**
```bash
# First, encode audio file
AUDIO_BASE64=$(base64 -i recording.m4a)

curl -X POST https://thegeneralapps.com/api/agora/process-audio \
  -H "Content-Type: application/json" \
  -d "{
    \"audio\": \"$AUDIO_BASE64\",
    \"mimeType\": \"audio/m4a\"
  }"
```

**cURL Example (File Upload):**
```bash
curl -X POST https://thegeneralapps.com/api/agora/process-audio \
  -F "audio=@recording.m4a"
```

---

### 7. Process Text (Testing Alternative)
Send text input instead of audio for testing or text-based interaction.

**Endpoint:** `POST /api/agora/process-text`

**Request Body:**
```json
{
  "text": "Hallo, wie geht es dir?"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "transcription": "Hallo, wie geht es dir?",
  "reply": "Mir geht es gut, danke! Und dir?",
  "audio": "base64-encoded-mp3-audio"
}
```

**Error - Bot Not Running (400):**
```json
{
  "success": false,
  "error": "Bot is not running. Start a session first."
}
```

**Error - No Text (400):**
```json
{
  "success": false,
  "error": "Text is required"
}
```

**iOS Example:**
```swift
struct TextRequest: Codable {
    let text: String
}

func processText(text: String) async throws -> BotResponse {
    let url = URL(string: "https://thegeneralapps.com/api/agora/process-text")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = TextRequest(text: text)
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(BotResponse.self, from: data)
}
```

**cURL Example:**
```bash
curl -X POST https://thegeneralapps.com/api/agora/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Hallo, wie geht es dir?"}'
```

---

### 8. Stop Bot
Stop the current bot session and cleanup resources.

**Endpoint:** `POST /api/agora/stop`

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bot stopped",
  "previousChannel": "tutor-user123-1703671234567"
}
```

**Error - Bot Not Running (200):**
```json
{
  "success": false,
  "error": "Bot is not running"
}
```

**iOS Example:**
```swift
func stopBot() async throws {
    let url = URL(string: "https://thegeneralapps.com/api/agora/stop")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(StopResponse.self, from: data)
    print(response.message)
}
```

**cURL Example:**
```bash
curl -X POST https://thegeneralapps.com/api/agora/stop
```

---

## Complete iOS Integration Flow

### Step 1: Start Session
```swift
let config = try await joinWithBot(userId: "user123", userName: "John")
// Response: { appId, channel, token }
```

### Step 2: Record Audio
```swift
let audioData = try await recordAudio(duration: 5.0)  // 5 seconds
```

### Step 3: Send to Bot
```swift
let response = try await processAudio(audioData: audioData)
print("User said: \(response.transcription ?? "")")
print("Bot replied: \(response.reply ?? "")")
```

### Step 4: Play Response
```swift
if let audioBase64 = response.audio,
   let audioData = Data(base64Encoded: audioBase64) {
    playAudio(data: audioData)
}
```

### Step 5: Repeat or Stop
```swift
// Keep recording and sending audio...
// When done:
try await stopBot()
```

---

## Data Models

### Swift Models
```swift
struct AgoraConfig: Codable {
    let success: Bool
    let appId: String
    let channel: String
    let token: String?
    let message: String
}

struct BotResponse: Codable {
    let success: Bool
    let transcription: String?
    let reply: String?
    let audio: String?  // Base64 encoded MP3
    let error: String?
}

struct BotStatus: Codable {
    let success: Bool
    let isRunning: Bool
    let channel: String?
    let startedAt: String?
    let error: String?
}
```

---

## Audio Format Requirements

### Supported Formats
- ✅ **M4A** (AAC) - Recommended for iOS
- ✅ **MP3** 
- ✅ **WAV**
- ✅ **WEBM**
- ✅ **OGG**

### Recommended Settings
```
Format: M4A (AAC)
Sample Rate: 16000 Hz
Channels: 1 (mono)
Bitrate: 64 kbps
Duration: 3-8 seconds per recording
```

### iOS Recording Setup
```swift
let settings: [String: Any] = [
    AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
    AVSampleRateKey: 16000,
    AVNumberOfChannelsKey: 1,
    AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue
]
```

---

## Error Handling

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | "Bot is not running" | Session not started | Call `/join-with-bot` first |
| 400 | "No audio data provided" | Missing audio in request | Include audio in body |
| 400 | "Text is required" | Empty text field | Provide text string |
| 500 | "Failed to transcribe audio" | OpenAI API error | Check audio format, API key |
| 500 | OpenAI errors | API key invalid/quota | Verify OPENAI_API_KEY env variable |

### iOS Error Handling
```swift
do {
    let response = try await processAudio(audioData: audioData)
    
    if !response.success {
        print("Error: \(response.error ?? "Unknown error")")
        return
    }
    
    // Success - use response.transcription, response.reply, response.audio
    
} catch {
    print("Network error: \(error)")
}
```

---

## Rate Limiting & Costs

### OpenAI API Usage Per Request
- **Whisper** (transcription): ~$0.006 per minute of audio
- **GPT-4** (conversation): ~$0.03 per request (varies by length)
- **TTS** (speech synthesis): ~$0.015 per request

### Recommended Limits
- Max 60 requests per user per hour
- Max 10 concurrent sessions
- Audio duration: 3-10 seconds optimal

---

## Testing

### Test with cURL

1. **Start session:**
```bash
curl -X POST http://localhost:8000/api/agora/join-with-bot \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userName": "Test"}'
```

2. **Test with text (no audio needed):**
```bash
curl -X POST http://localhost:8000/api/agora/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Guten Tag!"}'
```

3. **Check status:**
```bash
curl http://localhost:8000/api/agora/status
```

4. **Stop:**
```bash
curl -X POST http://localhost:8000/api/agora/stop
```

### Test Audio File
You can test with a sample audio file:
```bash
# Record or download a German audio file
# Convert to base64
AUDIO=$(base64 -i test.m4a)

# Send to API
curl -X POST http://localhost:8000/api/agora/process-audio \
  -H "Content-Type: application/json" \
  -d "{\"audio\": \"$AUDIO\", \"mimeType\": \"audio/m4a\"}"
```

---

## Environment Variables

Required on server:
```bash
OPENAI_API_KEY=sk-proj-...
AGORA_APP_ID=8189340d7b2e4ddc809cb96ecd47e520  # Optional, has default
PORT_PRODUCTION=3000
PORT_DEVELOPMENT=8000
```

---

## Conversation Context

The bot maintains conversation history (last 10 messages) for contextual responses:

**Example conversation:**
```
User: "Hallo!"
Bot: "Hallo! Wie geht es dir?"

User: "Gut, danke. Und dir?"
Bot: "Mir geht es auch gut! Was möchtest du heute lernen?"

User: "Ich möchte Deutsch üben."
Bot: "Sehr gut! Lass uns mit einfachen Sätzen beginnen..."
```

The bot remembers previous exchanges within the same session.

---

## Best Practices

### For iOS Developers

1. **Session Management**
   - Call `/join-with-bot` once when user starts learning
   - Keep session active during conversation
   - Call `/stop` when user exits

2. **Audio Recording**
   - Record in chunks of 3-5 seconds
   - Use background queue for processing
   - Show loading indicator during API call

3. **Error Handling**
   - Retry on network errors (max 3 attempts)
   - Show user-friendly error messages
   - Fallback to text input if audio fails

4. **UI/UX**
   - Visual feedback when recording
   - Display transcription to user
   - Show bot's text response
   - Auto-play audio response

5. **Performance**
   - Cache audio player instance
   - Cleanup temporary audio files
   - Use async/await properly

### Example Implementation
```swift
class GermanTutorService {
    private var sessionActive = false
    private let baseURL = "https://thegeneralapps.com/api/agora"
    
    func startSession(userId: String) async throws {
        let config = try await joinWithBot(userId: userId, userName: "User")
        sessionActive = true
    }
    
    func sendMessage(audioData: Data) async throws -> BotResponse {
        guard sessionActive else {
            throw TutorError.sessionNotActive
        }
        return try await processAudio(audioData: audioData)
    }
    
    func endSession() async throws {
        guard sessionActive else { return }
        try await stopBot()
        sessionActive = false
    }
}
```

---

## Support & Troubleshooting

### Server Logs
Check server logs for detailed error information:
```bash
pm2 logs app
```

### Common Issues

**Issue:** "Bot is not running"
- **Solution:** Call `/join-with-bot` before `/process-audio`

**Issue:** Audio not transcribing
- **Solution:** Check audio format is supported (M4A, MP3, WAV)
- Verify audio duration > 0.5 seconds
- Check OPENAI_API_KEY is set

**Issue:** No audio response
- **Solution:** Check TTS is working (test with `/process-text`)
- Verify response.audio is base64 encoded correctly
- Check iOS audio player setup

**Issue:** Bot responses are slow
- **Solution:** OpenAI API can take 2-5 seconds
- Show loading indicator to user
- Consider shorter audio inputs

---

## Source Code

- **Router:** `/router/agoraRouter.js`
- **Bot Logic:** `/agora/agoraGermanBotSimple.js`
- **iOS Guide:** `/agora/IOS_INTEGRATION.md`

---

## License

Part of the JSONCard project.

---

## Changelog

### v1.0.0 (2025-12-18)
- Initial release
- REST API approach (no Agora SDK on server)
- OpenAI integration (Whisper, GPT-4, TTS)
- iOS-friendly endpoints
- Base64 audio support
- Conversation history tracking
