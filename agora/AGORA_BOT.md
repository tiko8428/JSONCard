# Agora German Bot integration with the iOS app

The bot connects to the same Agora project and channel as the iOS app. It can run on a server (for example in a headless browser) as long as it receives the same credentials that the iOS client uses.

## 1) Match the Agora credentials
- **App ID**: The iOS app reads `AGORA_APP_ID` from `Words/Config.plist` at runtime. Use that exact value for `AGORA_APP_ID` when launching `agoraGermanBot.js`.
- **Channel**: Join the channel your iOS client uses (e.g. the live room name). Set it with `AGORA_CHANNEL`.
- **Token (optional)**: If your iOS app requires tokens, issue one token for each participant (iOS user _and_ the bot) and pass the bot's token via `AGORA_TOKEN`.

## 2) Run the bot in a browser

The bot uses `agora-rtc-sdk-ng` which is a browser-only SDK. You have two options:

**Option A: Use the HTML runner (easiest)**
1. Open `agora/bot-runner.html` in a web browser
2. Update the CONFIG values in the HTML file to match your iOS app settings
3. Click "Start Bot" button

**Option B: Deploy with Puppeteer (for server automation)**
Use a headless browser automation tool like Puppeteer to run the bot on a server:

```bash
npm install puppeteer
node run-bot-headless.js
```

The bot needs a browser environment because it uses AudioContext, MediaRecorder, and other browser APIs.

## 3) How the connection lines up with iOS
- Both the bot and the iOS app join the same Agora project (via App ID) and channel name, so audio from iOS users is published to the bot and vice versa.
- The bot subscribes to every remote audio track, transcribes it, generates a German response, and publishes synthesized speech back to the channel. The iOS client receives that audio like any other participant.

## 4) Quick checklist
- App ID in `AGORA_APP_ID` **equals** the iOS `Config.plist` value.
- Channel in `AGORA_CHANNEL` **equals** the iOS channel the user joins.
- If tokens are required, provide a bot-specific token in `AGORA_TOKEN`.
- Ensure the bot runtime has microphone/audio output support (headless browser or desktop runtime) so it can capture and publish audio.
