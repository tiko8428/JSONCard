# Agora German Tutor Bot - iOS Integration Guide

## Overview
This guide shows how to integrate the German Tutor Bot into your iOS application. The bot runs on your Node.js server and provides AI-powered German tutoring through audio processing. Your iOS app handles all Agora communication directly and sends audio to the server for AI processing.

## Architecture

```
iOS App                           Server (Node.js)
├─ Agora RTC (Audio)             ├─ OpenAI Whisper (Transcription)
├─ Record User Speech            ├─ GPT-4 (Conversation)
├─ Join Agora Channel            └─ TTS (Text-to-Speech)
└─ Send Audio to Server
   ↓
   Process & Reply
   ↓
   Play Bot Response
```

**Note:** The server does NOT use Agora SDK. All real-time audio is handled by your iOS app. The server only provides AI services via REST API.

---

## Prerequisites

### Server Side
- Node.js server running with Agora bot
- API endpoint: `/api/agora/join-with-bot`
- Agora App ID: `8189340d7b2e4ddc809cb96ecd47e520`

### iOS Side
- Xcode 14.0+
- iOS 13.0+
- AgoraRtcEngine_iOS SDK
- CocoaPods or Swift Package Manager

---

## Step 1: Install Agora SDK

### Using CocoaPods

Add to your `Podfile`:

```ruby
platform :ios, '13.0'
use_frameworks!

target 'YourApp' do
  pod 'AgoraRtcEngine_iOS', '~> 4.0'
end
```

Then run:
```bash
pod install
```

### Using Swift Package Manager

1. In Xcode: File → Add Packages
2. Enter: `https://github.com/AgoraIO/AgoraRtcEngine_iOS`
3. Select version 4.x
4. Add to your target

---

## Step 2: Configure Info.plist

Add microphone permissions to `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to practice German with the AI tutor</string>
```

---

## Step 3: Create API Service

Create `AgoraBotAPI.swift`:

```swift
import Foundation

struct AgoraBotConfig: Codable {
    let success: Bool
    let appId: String
    let channel: String
    let token: String?
    let message: String
}

struct BotResponse: Codable {
    let success: Bool
    let transcription: String?
    let reply: String
    let audio: String // Base64 encoded audio
}

struct BotError: Codable {
    let success: Bool
    let error: String
}

class AgoraBotAPI {
    static let shared = AgoraBotAPI()
    private let baseURL = "http://yourserver.com:8000/api/agora"
    
    // Start a tutoring session
    func startTutoringSession(userId: String, userName: String, openAiApiKey: String? = nil) async throws -> AgoraBotConfig {
        let url = URL(string: "\(baseURL)/join-with-bot")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var body: [String: Any] = [
            "userId": userId,
            "userName": userName
        ]
        
        if let apiKey = openAiApiKey {
            body["openAiApiKey"] = apiKey
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "Invalid response", code: -1)
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(AgoraBotConfig.self, from: data)
        } else {
            let error = try JSONDecoder().decode(BotError.self, from: data)
            throw NSError(domain: error.error, code: httpResponse.statusCode)
        }
    }
    
    // Process audio and get bot response
    func processAudio(_ audioData: Data, mimeType: String = "audio/mp3") async throws -> BotResponse {
        let url = URL(string: "\(baseURL)/process-audio")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "audio": audioData.base64EncodedString(),
            "mimeType": mimeType
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "Invalid response", code: -1)
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(BotResponse.self, from: data)
        } else {
            let error = try JSONDecoder().decode(BotError.self, from: data)
            throw NSError(domain: error.error, code: httpResponse.statusCode)
        }
    }
    
    // Process text (for testing or text-based interaction)
    func processText(_ text: String) async throws -> BotResponse {
        let url = URL(string: "\(baseURL)/process-text")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["text": text]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "Invalid response", code: -1)
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(BotResponse.self, from: data)
        } else {
            let error = try JSONDecoder().decode(BotError.self, from: data)
            throw NSError(domain: error.error, code: httpResponse.statusCode)
        }
    }
    
    // Stop the bot
    func stopBot() async throws {
        let url = URL(string: "\(baseURL)/stop")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let (_, _) = try await URLSession.shared.data(for: request)
    }
    
    // Get bot status
    func getBotStatus() async throws -> [String: Any] {
        let url = URL(string: "\(baseURL)/status")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return json ?? [:]
    }
}
```

---

## Step 4: Create Agora Manager with Audio Recording

Create `AgoraGermanTutorManager.swift`:

```swift
import AgoraRtcKit
import AVFoundation

protocol GermanTutorDelegate: AnyObject {
    func tutorDidConnect()
    func tutorDidDisconnect()
    func tutorDidStartSpeaking()
    func tutorDidStopSpeaking()
    func didReceiveTranscription(_ text: String)
    func didReceiveError(_ error: Error)
}

class AgoraGermanTutorManager: NSObject {
    static let shared = AgoraGermanTutorManager()
    
    private var agoraKit: AgoraRtcEngineKit?
    private var currentChannel: String?
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var recordingTimer: Timer?
    weak var delegate: GermanTutorDelegate?
    
    // Audio recording settings
    private let recordingInterval: TimeInterval = 8.0 // Record every 8 seconds
    private var isRecording = false
    
    private override init() {
        super.init()
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try? session.setActive(true)
    }
    
    // Start a tutoring session
    func startSession(userId: String, userName: String) async throws {
        // Get channel info from server
        let config = try await AgoraBotAPI.shared.startTutoringSession(
            userId: userId,
            userName: userName
        )
        
        // Initialize Agora engine
        let engineConfig = AgoraRtcEngineConfig()
        engineConfig.appId = config.appId
        engineConfig.channelProfile = .liveBroadcasting
        
        agoraKit = AgoraRtcEngineKit.sharedEngine(with: engineConfig, delegate: self)
        agoraKit?.setClientRole(.broadcaster)
        
        // Enable audio
        agoraKit?.enableAudio()
        agoraKit?.setAudioProfile(.speechStandard)
        
        // Join channel
        let option = AgoraRtcChannelMediaOptions()
        option.publishMicrophoneTrack = true
        option.autoSubscribeAudio = true
        option.clientRoleType = .broadcaster
        
        let result = agoraKit?.joinChannel(
            byToken: config.token,
            channelId: config.channel,
            uid: 0,
            mediaOptions: option
        )
        
        if result == 0 {
            currentChannel = config.channel
            print("✅ Joined channel: \(config.channel)")
            startPeriodicRecording()
        } else {
            throw NSError(domain: "Failed to join channel", code: result ?? -1)
        }
    }
    
    // Start recording user's speech every 8 seconds and send to server
    private func startPeriodicRecording() {
        recordingTimer = Timer.scheduledTimer(withTimeInterval: recordingInterval, repeats: true) { [weak self] _ in
            Task {
                await self?.recordAndProcessAudio()
            }
        }
    }
    
    private func recordAndProcessAudio() async {
        guard !isRecording else { return }
        
        isRecording = true
        
        do {
            // Record audio for 8 seconds
            let audioURL = try await recordAudioSegment(duration: recordingInterval)
            
            // Read audio data
            let audioData = try Data(contentsOf: audioURL)
            
            // Send to server for processing
            let response = try await AgoraBotAPI.shared.processAudio(audioData, mimeType: "audio/mp3")
            
            if response.success {
                // Notify delegate about transcription
                if let transcription = response.transcription {
                    await MainActor.run {
                        delegate?.didReceiveTranscription(transcription)
                    }
                }
                
                // Play bot's audio response
                if let audioData = Data(base64Encoded: response.audio) {
                    try await playAudioResponse(audioData)
                }
            }
            
            // Clean up temp file
            try? FileManager.default.removeItem(at: audioURL)
            
        } catch {
            print("❌ Error processing audio: \(error)")
            await MainActor.run {
                delegate?.didReceiveError(error)
            }
        }
        
        isRecording = false
    }
    
    private func recordAudioSegment(duration: TimeInterval) async throws -> URL {
        let fileName = "recording_\(Date().timeIntervalSince1970).m4a"
        let audioURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        audioRecorder = try AVAudioRecorder(url: audioURL, settings: settings)
        audioRecorder?.record(forDuration: duration)
        
        // Wait for recording to finish
        try await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
        
        audioRecorder?.stop()
        
        return audioURL
    }
    
    private func playAudioResponse(_ audioData: Data) async throws {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("response.mp3")
        try audioData.write(to: tempURL)
        
        await MainActor.run {
            delegate?.tutorDidStartSpeaking()
        }
        
        audioPlayer = try AVAudioPlayer(contentsOf: tempURL)
        audioPlayer?.play()
        
        // Wait for playback to finish
        if let duration = audioPlayer?.duration {
            try await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
        }
        
        await MainActor.run {
            delegate?.tutorDidStopSpeaking()
        }
        
        try? FileManager.default.removeItem(at: tempURL)
    }
    
    // End the session
    func endSession() async {
        recordingTimer?.invalidate()
        recordingTimer = nil
        
        audioRecorder?.stop()
        audioPlayer?.stop()
        
        agoraKit?.leaveChannel(nil)
        agoraKit = nil
        currentChannel = nil
        
        try? await AgoraBotAPI.shared.stopBot()
        
        delegate?.tutorDidDisconnect()
    }
    
    // Mute/unmute microphone
    func muteMicrophone(_ mute: Bool) {
        agoraKit?.muteLocalAudioStream(mute)
    }
    
    // Adjust volume
    func setVolume(_ volume: Int) {
        agoraKit?.adjustPlaybackSignalVolume(volume)
    }
    
    // Send text instead of audio (for testing)
    func sendText(_ text: String) async throws {
        let response = try await AgoraBotAPI.shared.processText(text)
        
        if response.success {
            delegate?.didReceiveTranscription(text)
            
            if let audioData = Data(base64Encoded: response.audio) {
                try await playAudioResponse(audioData)
            }
        }
    }
}

// MARK: - AgoraRtcEngineDelegate
extension AgoraGermanTutorManager: AgoraRtcEngineDelegate {
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinChannel channel: String, withUid uid: UInt, elapsed: Int) {
        print("📱 Local user joined channel: \(channel)")
        delegate?.tutorDidConnect()
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinedOfUser uid: UInt, elapsed: Int) {
        print("👤 User joined (uid: \(uid))")
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didOfflineOfUser uid: UInt, reason: AgoraUserOfflineReason) {
        print("👤 User left")
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didOccurError errorCode: AgoraErrorCode) {
        let error = NSError(domain: "Agora Error", code: Int(errorCode.rawValue))
        delegate?.didReceiveError(error)
    }
}
```

---

## Step 5: Create UI (SwiftUI Example)

Create `GermanTutorView.swift`:

```swift
import SwiftUI

struct GermanTutorView: View {
    @StateObject private var viewModel = GermanTutorViewModel()
    
    var body: some View {
        VStack(spacing: 30) {
            // Status
            VStack {
                Image(systemName: viewModel.isConnected ? "mic.fill" : "mic.slash")
                    .font(.system(size: 60))
                    .foregroundColor(viewModel.isConnected ? .green : .gray)
                
                Text(viewModel.statusMessage)
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
            .padding()
            
            // Bot speaking indicator
            if viewModel.isBotSpeaking {
                HStack {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 10, height: 10)
                    Text("Bot is speaking...")
                        .font(.subheadline)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(10)
            }
            
            Spacer()
            
            // Controls
            VStack(spacing: 20) {
                if !viewModel.isConnected {
                    Button(action: {
                        Task {
                            await viewModel.startSession()
                        }
                    }) {
                        Text("Start German Lesson")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                } else {
                    HStack(spacing: 20) {
                        Button(action: {
                            viewModel.toggleMute()
                        }) {
                            Image(systemName: viewModel.isMuted ? "mic.slash.fill" : "mic.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(viewModel.isMuted ? Color.red : Color.blue)
                                .clipShape(Circle())
                        }
                        
                        Button(action: {
                            Task {
                                await viewModel.endSession()
                            }
                        }) {
                            Image(systemName: "phone.down.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.red)
                                .clipShape(Circle())
                        }
                    }
                }
            }
            .padding()
        }
        .padding()
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(viewModel.errorMessage)
        }
    }
}

@MainActor
class GermanTutorViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var isMuted = false
    @Published var isBotSpeaking = false
    @Published var statusMessage = "Ready to practice German"
    @Published var currentTranscription = ""
    @Published var showError = false
    @Published var errorMessage = ""
    
    private let tutorManager = AgoraGermanTutorManager.shared
    
    init() {
        tutorManager.delegate = self
    }
    
    func startSession() async {
        do {
            statusMessage = "Connecting to tutor..."
            
            let userId = UUID().uuidString
            let userName = "Student"
            
            try await tutorManager.startSession(userId: userId, userName: userName)
            
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            statusMessage = "Failed to connect"
        }
    }
    
    func endSession() async {
        await tutorManager.endSession()
        statusMessage = "Session ended"
        currentTranscription = ""
    }
    
    func toggleMute() {
        isMuted.toggle()
        tutorManager.muteMicrophone(isMuted)
    }
    
    func sendTestMessage(_ text: String) async {
        do {
            try await tutorManager.sendText(text)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

extension GermanTutorViewModel: GermanTutorDelegate {
    func tutorDidConnect() {
        isConnected = true
        statusMessage = "Connected! Start speaking German"
    }
    
    func tutorDidDisconnect() {
        isConnected = false
        isBotSpeaking = false
        statusMessage = "Disconnected"
    }
    
    func tutorDidStartSpeaking() {
        isBotSpeaking = true
    }
    
    func tutorDidStopSpeaking() {
        isBotSpeaking = false
    }
    
    func didReceiveTranscription(_ text: String) {
        currentTranscription = text
    }
    
    func didReceiveError(_ error: Error) {
        errorMessage = error.localizedDescription
        showError = true
    }
}
```

---

## Step 6: UIKit Implementation (Alternative)

Create `GermanTutorViewController.swift`:

```swift
import UIKit

class GermanTutorViewController: UIViewController {
    
    private let tutorManager = AgoraGermanTutorManager.shared
    private var isConnected = false
    
    // UI Elements
    private let statusLabel = UILabel()
    private let micButton = UIButton()
    private let endCallButton = UIButton()
    private let startButton = UIButton()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        tutorManager.delegate = self
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Status Label
        statusLabel.text = "Ready to practice German"
        statusLabel.textAlignment = .center
        statusLabel.font = .systemFont(ofSize: 18, weight: .medium)
        view.addSubview(statusLabel)
        
        // Start Button
        startButton.setTitle("Start German Lesson", for: .normal)
        startButton.backgroundColor = .systemBlue
        startButton.layer.cornerRadius = 10
        startButton.addTarget(self, action: #selector(startTapped), for: .touchUpInside)
        view.addSubview(startButton)
        
        // Mic Button
        micButton.setImage(UIImage(systemName: "mic.fill"), for: .normal)
        micButton.backgroundColor = .systemBlue
        micButton.layer.cornerRadius = 35
        micButton.tintColor = .white
        micButton.addTarget(self, action: #selector(muteTapped), for: .touchUpInside)
        micButton.isHidden = true
        view.addSubview(micButton)
        
        // End Call Button
        endCallButton.setImage(UIImage(systemName: "phone.down.fill"), for: .normal)
        endCallButton.backgroundColor = .systemRed
        endCallButton.layer.cornerRadius = 35
        endCallButton.tintColor = .white
        endCallButton.addTarget(self, action: #selector(endCallTapped), for: .touchUpInside)
        endCallButton.isHidden = true
        view.addSubview(endCallButton)
        
        // Layout
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        startButton.translatesAutoresizingMaskIntoConstraints = false
        micButton.translatesAutoresizingMaskIntoConstraints = false
        endCallButton.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 100),
            
            startButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            startButton.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            startButton.widthAnchor.constraint(equalToConstant: 250),
            startButton.heightAnchor.constraint(equalToConstant: 50),
            
            micButton.leadingAnchor.constraint(equalTo: view.centerXAnchor, constant: -100),
            micButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            micButton.widthAnchor.constraint(equalToConstant: 70),
            micButton.heightAnchor.constraint(equalToConstant: 70),
            
            endCallButton.trailingAnchor.constraint(equalTo: view.centerXAnchor, constant: 100),
            endCallButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            endCallButton.widthAnchor.constraint(equalToConstant: 70),
            endCallButton.heightAnchor.constraint(equalToConstant: 70)
        ])
    }
    
    @objc private func startTapped() {
        Task {
            do {
                statusLabel.text = "Connecting..."
                
                let userId = UUID().uuidString
                try await tutorManager.startSession(userId: userId, userName: "Student")
                
                startButton.isHidden = true
                micButton.isHidden = false
                endCallButton.isHidden = false
            } catch {
                statusLabel.text = "Connection failed"
                showAlert(title: "Error", message: error.localizedDescription)
            }
        }
    }
    
    @objc private func muteTapped() {
        isConnected.toggle()
        tutorManager.muteMicrophone(isConnected)
        
        let imageName = isConnected ? "mic.slash.fill" : "mic.fill"
        micButton.setImage(UIImage(systemName: imageName), for: .normal)
        micButton.backgroundColor = isConnected ? .systemRed : .systemBlue
    }
    
    @objc private func endCallTapped() {
        Task {
            await tutorManager.endSession()
            
            startButton.isHidden = false
            micButton.isHidden = true
            endCallButton.isHidden = true
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

extension GermanTutorViewController: GermanTutorDelegate {
    func tutorDidConnect() {
        statusLabel.text = "Connected! Start speaking German"
    }
    
    func tutorDidDisconnect() {
        statusLabel.text = "Disconnected"
    }
    
    func tutorDidStartSpeaking() {
        statusLabel.text = "Bot is speaking..."
    }
    
    func tutorDidStopSpeaking() {
        statusLabel.text = "Your turn to speak"
    }
    
    func didReceiveError(_ error: Error) {
        showAlert(title: "Error", message: error.localizedDescription)
    }
}
```

---

## API Endpoints Reference

### 1. Start Tutoring Session
```
POST /api/agora/join-with-bot

Request:
{
  "userId": "user123",
  "userName": "John Doe",
  "openAiApiKey": "sk-..." // Optional
}

Response:
{
  "success": true,
  "appId": "8189340d7b2e4ddc809cb96ecd47e520",
  "channel": "tutor-user123-1703671234567",
  "token": null,
  "message": "Bot started. Join this channel from your iOS app."
}
```

### 2. Process Audio
**Primary endpoint for audio processing**
```
POST /api/agora/process-audio

Request:
{
  "audio": "base64EncodedAudioData",
  "mimeType": "audio/mp3" // or "audio/wav", "audio/webm"
}

Response:
{
  "success": true,
  "transcription": "Hallo, wie geht es dir?",
  "reply": "Mir geht es gut, danke! Und dir?",
  "audio": "base64EncodedResponseAudio"
}
```

### 3. Process Text (Testing)
```
POST /api/agora/process-text

Request:
{
  "text": "Hallo, wie geht es dir?"
}

Response:
{
  "success": true,
  "reply": "Mir geht es gut, danke! Und dir?",
  "audio": "base64EncodedAudio"
}
```

### 4. Stop Bot
```
POST /api/agora/stop

Response:
{
  "success": true,
  "message": "Bot stopped",
  "previousChannel": "tutor-user123-1703671234567"
}
```

### 5. Get Status
```
GET /api/agora/status

Response:
{
  "success": true,
  "isRunning": true,
  "channel": "tutor-user123-1703671234567",
  "startedAt": "2025-12-17T10:30:00.000Z"
}
```

---

## How It Works - Complete Flow

```
1. iOS App starts session
   POST /api/agora/join-with-bot
   ↓
2. Server creates bot session, returns channel info
   Response: { channel, appId }
   ↓
3. iOS App joins Agora channel
   agoraKit.joinChannel(...)
   ↓
4. iOS App records user speech (every 8 seconds)
   AVAudioRecorder
   ↓
5. iOS App sends audio to server
   POST /api/agora/process-audio
   ↓
6. Server processes:
   - Transcribes with Whisper
   - Generates reply with GPT-4
   - Creates TTS audio
   ↓
7. Server returns:
   { transcription, reply, audio }
   ↓
8. iOS App plays bot's audio response
   AVAudioPlayer
   ↓
9. Repeat steps 4-8 until session ends
   ↓
10. iOS App stops session
    POST /api/agora/stop
```

**Key Points:**
- Server does NOT join Agora channel (no Agora SDK on server)
- iOS app handles ALL real-time audio via Agora
- Server provides AI services (transcription, conversation, TTS) via REST API
- Audio is processed in 8-second chunks automatically

---

## Testing

### Test the API Connection
```swift
func testBotAPI() async {
    do {
        // Start session
        let config = try await AgoraBotAPI.shared.startTutoringSession(
            userId: "test123",
            userName: "Test User"
        )
        print("✅ Channel created: \(config.channel)")
        
        // Test text processing
        let response = try await AgoraBotAPI.shared.processText("Hallo!")
        print("✅ Bot replied: \(response.reply)")
        
        // Stop session
        try await AgoraBotAPI.shared.stopBot()
        print("✅ Bot stopped")
    } catch {
        print("❌ Error: \(error)")
    }
}
```

### Test Audio Processing
```swift
func testAudioProcessing() async {
    // Record a short audio clip
    let audioURL = // ... your recording
    let audioData = try! Data(contentsOf: audioURL)
    
    do {
        let response = try await AgoraBotAPI.shared.processAudio(audioData)
        print("Transcription: \(response.transcription ?? "")")
        print("Bot reply: \(response.reply)")
        
        // Decode and play response audio
        if let audioData = Data(base64Encoded: response.audio) {
            // Play audioData
        }
    } catch {
        print("Error: \(error)")
    }
}
```

---

## Troubleshooting

### Bot doesn't respond
- Check server logs for errors
- Verify OpenAI API key is set on server (`OPENAI_API_KEY` env variable)
- Check audio data is being sent correctly (base64 encoded)
- Verify server endpoint URL is correct

### Connection fails
- Verify server URL is correct (check baseURL in `AgoraBotAPI`)
- Check App ID matches server configuration
- Ensure network connectivity

### No audio from bot
- Check device volume
- Verify audio session is configured correctly
- Check base64 decoding of response audio
- Review server logs for TTS errors

### Audio quality issues
- Increase recording sample rate (currently 16kHz)
- Use better audio format (e.g., WAV instead of M4A)
- Check microphone permissions
- Reduce background noise

### Recording not working
- Verify microphone permissions granted
- Check AVAudioSession is properly configured
- Ensure no other app is using microphone
- Check audio file is being created in temp directory

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Cleanup**: Call `endSession()` when view disappears
3. **Permissions**: Request microphone permission before starting
4. **Background**: Handle app going to background gracefully
5. **Network**: Show loading states during API calls
6. **Audio Files**: Clean up temporary audio files after use
7. **Memory**: Release audio players/recorders when done
8. **Feedback**: Show visual feedback when bot is processing/speaking

---

## Production Considerations

1. **Token Authentication**: Implement Agora token generation for security
2. **User Management**: Link sessions to your user system  
3. **Analytics**: Track session duration, transcription accuracy
4. **Error Reporting**: Send errors to crash reporting service (e.g., Sentry)
5. **Rate Limiting**: Implement session limits per user
6. **Audio Optimization**: Compress audio before sending to server
7. **Caching**: Cache bot responses for common phrases
8. **Background Mode**: Support audio in background mode if needed
9. **Battery**: Monitor battery usage during long sessions
10. **Network**: Handle poor network conditions gracefully

---

## Advanced Features

### Manual Audio Recording
If you want more control over when audio is sent:

```swift
// Disable automatic recording
// Instead, add manual record button

func manualRecord() async {
    let audioURL = try await recordAudioSegment(duration: 5.0)
    let audioData = try Data(contentsOf: audioURL)
    
    let response = try await AgoraBotAPI.shared.processAudio(audioData)
    // Handle response...
}
```

### Custom Recording Interval
Change the recording frequency:

```swift
// In AgoraGermanTutorManager
private let recordingInterval: TimeInterval = 5.0 // Record every 5 seconds instead of 8
```

### Conversation History
Display conversation history in UI:

```swift
struct Message {
    let isUser: Bool
    let text: String
    let timestamp: Date
}

@Published var messages: [Message] = []

func didReceiveTranscription(_ text: String) {
    messages.append(Message(isUser: true, text: text, timestamp: Date()))
}
```

---

## Architecture Benefits

✅ **No Heavy SDKs on Server**: Server only needs OpenAI SDK  
✅ **Scalable**: Server can handle many sessions without Agora overhead  
✅ **Flexible**: Easy to switch AI providers or add features  
✅ **iOS Native**: Full control over audio quality and UX  
✅ **Cost Effective**: Only pay for OpenAI API usage  
✅ **Simple Deployment**: Standard Node.js server, no special requirements

---

## Support

For issues or questions:
- Check server logs at `/api/agora/status`
- Review Agora documentation: https://docs.agora.io/en/
- OpenAI API docs: https://platform.openai.com/docs
- Server source: `/router/agoraRouter.js` and `/agora/agoraGermanBotSimple.js`
