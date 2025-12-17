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

struct AgoraBotError: Codable {
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
            let error = try JSONDecoder().decode(AgoraBotError.self, from: data)
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

## Step 4: Create Agora Manager

Create `AgoraGermanTutorManager.swift`:

```swift
import AgoraRtcKit

protocol GermanTutorDelegate: AnyObject {
    func tutorDidConnect()
    func tutorDidDisconnect()
    func tutorDidStartSpeaking()
    func tutorDidStopSpeaking()
    func didReceiveError(_ error: Error)
}

class AgoraGermanTutorManager: NSObject {
    static let shared = AgoraGermanTutorManager()
    
    private var agoraKit: AgoraRtcEngineKit?
    private var currentChannel: String?
    weak var delegate: GermanTutorDelegate?
    
    private override init() {
        super.init()
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
        
        // Set audio profile for voice
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
        } else {
            throw NSError(domain: "Failed to join channel", code: result ?? -1)
        }
    }
    
    // End the session
    func endSession() async {
        agoraKit?.leaveChannel(nil)
        agoraKit = nil
        currentChannel = nil
        
        // Stop bot on server
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
}

// MARK: - AgoraRtcEngineDelegate
extension AgoraGermanTutorManager: AgoraRtcEngineDelegate {
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinChannel channel: String, withUid uid: UInt, elapsed: Int) {
        print("📱 Local user joined channel: \(channel)")
        delegate?.tutorDidConnect()
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinedOfUser uid: UInt, elapsed: Int) {
        print("🤖 Bot joined the channel (uid: \(uid))")
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didOfflineOfUser uid: UInt, reason: AgoraUserOfflineReason) {
        print("🤖 Bot left the channel")
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, didOccurError errorCode: AgoraErrorCode) {
        let error = NSError(domain: "Agora Error", code: Int(errorCode.rawValue))
        delegate?.didReceiveError(error)
    }
    
    func rtcEngine(_ engine: AgoraRtcEngineKit, reportAudioVolumeIndicationOfSpeakers speakers: [AgoraRtcAudioVolumeInfo], totalVolume: Int) {
        // Detect when bot is speaking
        for speaker in speakers {
            if speaker.uid != 0 && speaker.volume > 0 {
                delegate?.tutorDidStartSpeaking()
            }
        }
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
    @Published var showError = false
    @Published var errorMessage = ""
    
    private let tutorManager = AgoraGermanTutorManager.shared
    
    init() {
        tutorManager.delegate = self
    }
    
    func startSession() async {
        do {
            statusMessage = "Connecting to tutor..."
            
            // Get user ID (replace with your user management)
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
    }
    
    func toggleMute() {
        isMuted.toggle()
        tutorManager.muteMicrophone(isMuted)
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

### Start Tutoring Session
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

### Stop Bot
```
POST /api/agora/stop

Response:
{
  "success": true,
  "message": "Bot stopped",
  "previousChannel": "tutor-user123-1703671234567"
}
```

### Get Status
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

## Testing

### Test the API Connection
```swift
func testBotAPI() async {
    do {
        let config = try await AgoraBotAPI.shared.startTutoringSession(
            userId: "test123",
            userName: "Test User"
        )
        print("✅ Channel created: \(config.channel)")
        
        // Wait a moment
        try await Task.sleep(nanoseconds: 2_000_000_000)
        
        try await AgoraBotAPI.shared.stopBot()
        print("✅ Bot stopped")
    } catch {
        print("❌ Error: \(error)")
    }
}
```

---

## Troubleshooting

### Bot doesn't respond
- Check server logs for errors
- Verify OpenAI API key is set on server
- Ensure microphone permissions granted

### Connection fails
- Verify server URL is correct
- Check App ID matches server configuration
- Ensure network connectivity

### No audio from bot
- Check device volume
- Verify audio is enabled in Agora settings
- Check server logs for TTS errors

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Cleanup**: Call `endSession()` when view disappears
3. **Permissions**: Request microphone permission before starting
4. **Background**: Handle app going to background gracefully
5. **Network**: Show loading states during API calls

---

## Production Considerations

1. **Token Authentication**: Implement Agora token generation for security
2. **User Management**: Link sessions to your user system
3. **Analytics**: Track session duration and quality
4. **Error Reporting**: Send errors to crash reporting service
5. **Rate Limiting**: Implement session limits per user

---

## Support

For issues or questions:
- Check server logs at `/api/agora/status`
- Review Agora documentation: https://docs.agora.io/en/
- OpenAI API docs: https://platform.openai.com/docs
