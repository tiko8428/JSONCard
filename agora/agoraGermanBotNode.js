const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Try to load Agora SDK - will fail if not installed correctly
let AgoraRtcEngine;
try {
  // For Electron-based apps
  AgoraRtcEngine = require('agora-electron-sdk').default;
} catch (err) {
  console.warn('⚠️  Agora Electron SDK not found. Bot will run in API-only mode.');
  console.warn('To enable real-time audio: npm install agora-electron-sdk');
  AgoraRtcEngine = null;
}

/**
 * Agora German Tutor Bot for Node.js with Real-time Audio
 * 
 * Uses Agora RTC SDK to join voice channels and communicate with iOS app
 */

class AgoraGermanTutorBot {
  constructor(config) {
    this.config = {
      appId: config.appId,
      channel: config.channel,
      token: config.token,
      openAiApiKey: config.openAiApiKey,
      uid: config.uid || 0,
    };
    
    this.openai = new OpenAI({ apiKey: this.config.openAiApiKey });
    this.rtcEngine = null;
    this.isRunning = false;
    this.conversationHistory = [];
    this.audioChunks = [];
    this.recordingTimer = null;
    this.captureWindow = 8000; // 8 seconds
  }

  async start() {
    try {
      // Check if Agora SDK is available
      if (!AgoraRtcEngine) {
        console.log(`⚠️  Running in API-only mode (no real-time audio)`);
        console.log(`📱 iOS app can join channel: ${this.config.channel}`);
        console.log(`💡 To enable audio: npm install agora-electron-sdk`);
        
        this.isRunning = true;
        return {
          success: true,
          channel: this.config.channel,
          mode: 'api-only',
        };
      }

      // Create Agora RTC Engine
      this.rtcEngine = new AgoraRtcEngine();
      
      // Initialize with App ID
      this.rtcEngine.initialize(this.config.appId);
      
      // Set channel profile to Live Broadcasting
      this.rtcEngine.setChannelProfile(1);
      
      // Set client role as Broadcaster
      this.rtcEngine.setClientRole(1);
      
      // Enable audio
      this.rtcEngine.enableAudio();
      
      // Set audio profile for voice
      this.rtcEngine.setAudioProfile(0, 1);
      
      // Register event handlers
      this.setupEventHandlers();
      
      // Join channel
      const result = this.rtcEngine.joinChannel(
        this.config.token,
        this.config.channel,
        '',
        this.config.uid
      );
      
      if (result < 0) {
        throw new Error(`Failed to join channel: ${result}`);
      }
      
      this.isRunning = true;
      console.log(`✅ Bot joined Agora channel: ${this.config.channel}`);
      console.log(`📱 iOS app can now join the same channel to talk with the bot`);
      
      // Start recording timer
      this.startRecordingTimer();
      
      return {
        success: true,
        channel: this.config.channel,
      };
    } catch (err) {
      console.error('Failed to start bot:', err);
      throw err;
    }
  }

  setupEventHandlers() {
    // User joined event
    this.rtcEngine.on('userJoined', (uid, elapsed) => {
      console.log(`👤 User ${uid} joined the channel`);
    });

    // User offline event
    this.rtcEngine.on('userOffline', (uid, reason) => {
      console.log(`👋 User ${uid} left the channel (reason: ${reason})`);
    });

    // Audio frame received (for recording user's speech)
    this.rtcEngine.on('audioFrameReceived', (uid, audioFrame) => {
      if (uid !== this.config.uid) {
        // Store audio from other users
        this.audioChunks.push({
          uid: uid,
          data: audioFrame,
          timestamp: Date.now(),
        });
      }
    });

    // Channel joined successfully
    this.rtcEngine.on('joinedChannel', (channel, uid, elapsed) => {
      console.log(`✅ Successfully joined channel ${channel} as uid ${uid}`);
    });

    // Error handling
    this.rtcEngine.on('error', (err, msg) => {
      console.error(`❌ Agora error: ${err} - ${msg}`);
    });
  }

  startRecordingTimer() {
    // Process accumulated audio every 8 seconds
    this.recordingTimer = setInterval(async () => {
      if (this.audioChunks.length > 0) {
        await this.processAudioChunks();
      }
    }, this.captureWindow);
  }

  async processAudioChunks() {
    const chunks = [...this.audioChunks];
    this.audioChunks = [];

    if (chunks.length === 0) return;

    try {
      // Convert audio chunks to WAV file
      const audioBuffer = this.convertToWavBuffer(chunks);
      const tempFile = path.join(__dirname, `temp-audio-${Date.now()}.wav`);
      
      fs.writeFileSync(tempFile, audioBuffer);
      
      // Transcribe
      const transcription = await this.transcribe(tempFile);
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      if (!transcription?.trim()) return;

      console.log(`📝 Transcribed: "${transcription}"`);

      // Generate reply
      const reply = await this.generateReply(transcription);
      console.log(`🗣️ Bot reply: "${reply}"`);

      // Speak response back to channel
      await this.speak(reply);
      
    } catch (err) {
      console.error('❌ Error processing audio:', err.message);
    }
  }

  convertToWavBuffer(chunks) {
    // Simple PCM to WAV conversion
    // Assuming 16kHz, 16-bit, mono audio
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // Concatenate all audio data
    const audioData = Buffer.concat(chunks.map(c => c.data));
    
    // Create WAV header
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + audioData.length, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // audio format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);
    header.writeUInt16LE(numChannels * bitsPerSample / 8, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(audioData.length, 40);
    
    return Buffer.concat([header, audioData]);
  }

  async stop() {
    try {
      // Clear recording timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      // Leave channel only if we have rtcEngine
      if (this.rtcEngine) {
        this.rtcEngine.leaveChannel();
        this.rtcEngine.release();
        this.rtcEngine = null;
      }

      this.isRunning = false;
      this.conversationHistory = [];
      this.audioChunks = [];
      
      console.log(`🛑 Bot stopped and left channel`);
    } catch (err) {
      console.error('Error stopping bot:', err);
    }
  }

  async transcribe(audioFilePath) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: 'de',
        prompt: 'German language learning conversation',
      });
      return response.text || '';
    } catch (err) {
      console.error('Transcription error:', err.message);
      return '';
    }
  }

  async generateReply(text) {
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: text });

    // Keep only last 10 messages to manage token usage
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    const messages = [
      {
        role: 'system',
        content:
          'Du bist eine freundliche, geduldige deutsche Lehrerin. ' +
          'Korrigiere behutsam, erkläre Grammatik knapp, biete neue Vokabeln ' +
          'und stelle Rückfragen, um die Unterhaltung lebendig zu halten. ' +
          'Antworte kurz und klar (max 2-3 Sätze).',
      },
      ...this.conversationHistory,
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content.trim();
    
    // Add bot reply to history
    this.conversationHistory.push({ role: 'assistant', content: reply });
    
    return reply;
  }

  async speak(text) {
    try {
      // Generate speech using OpenAI TTS
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'pcm', // PCM format for direct audio streaming
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      // Send audio to Agora channel
      // Note: This requires converting PCM to the format Agora expects
      this.sendAudioToChannel(audioBuffer);
      
    } catch (err) {
      console.error('TTS error:', err.message);
    }
  }

  sendAudioToChannel(audioBuffer) {
    if (!this.rtcEngine || !this.isRunning) return;

    try {
      // Push audio frame to Agora channel
      // The audio should be in PCM format matching Agora's requirements
      this.rtcEngine.pushAudioFrame(audioBuffer);
      console.log(`🔊 Sent audio response to channel`);
    } catch (err) {
      console.error('Error sending audio to channel:', err.message);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      channel: this.config.channel,
      conversationLength: this.conversationHistory.length,
      audioChunksQueued: this.audioChunks.length,
    };
  }
}

module.exports = AgoraGermanTutorBot;
