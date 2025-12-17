const { OpenAI } = require('openai');
const AgoraRTC = require('agora-rtc-sdk-ng');

// Optional, Lambda-friendly headless Chromium for environments without `wrtc`.
let chromium;
let puppeteer;
try {
  // eslint-disable-next-line global-require
  chromium = require('@sparticuz/chromium');
  // eslint-disable-next-line global-require
  puppeteer = require('puppeteer-core');
} catch (err) {
  chromium = null;
  puppeteer = null;
}

let RTCAudioSink = null;
try {
  // Available when `wrtc` native bindings are installed.
  // eslint-disable-next-line global-require
  ({ RTCAudioSink } = require('wrtc').nonstandard);
} catch (err) {
  RTCAudioSink = null;
}

/**
 * Lightweight German Tutor Bot - Server-side API only
 * 
 * This version doesn't require Agora SDK on the server.
 * The iOS app handles all Agora communication directly.
 * This bot just provides AI conversation capabilities via REST API.
 */

/**
 * Listens to an Agora voice channel, captures remote audio frames on the server,
 * and converts them to AI responses (speech + text).
 */
class AgoraGermanTutorBot {
  constructor(config) {
    this.config = {
      appId: config.appId,
      channel: config.channel,
      token: config.token,
      openAiApiKey: config.openAiApiKey,
      uid: config.uid || Math.floor(Math.random() * 2 ** 20),
      chunkMs: config.chunkMs || 3000,
    };
    
    this.openai = new OpenAI({ apiKey: this.config.openAiApiKey });
    this.isRunning = false;
    this.conversationHistory = [];
    this.audioBridge = null;
    this.captureStrategy = null;
  }

  async start() {
    AgoraRTC.setLogLevel(AgoraRTC.LOG_LEVEL.ERROR);
    this.isRunning = true;
    console.log(`✅ Bot session started for channel: ${this.config.channel}`);
    console.log(`🎧 Server will capture audio directly from Agora channel`);

    // Prefer native wrtc capture when available, otherwise fall back to
    // a serverless-friendly Puppeteer bridge that runs WebRTC in headless Chrome.
    const bridges = [];

    if (RTCAudioSink) {
      bridges.push({
        name: 'wrtc',
        factory: () =>
          new AgoraChannelAudioBridge({
            appId: this.config.appId,
            channel: this.config.channel,
            token: this.config.token,
            uid: this.config.uid,
            chunkMs: this.config.chunkMs,
            onAudioChunk: async (audioBuffer, meta) => {
              await this.handleIncomingAudio(audioBuffer, meta);
            },
          }),
      });
    }

    if (puppeteer && chromium) {
      bridges.push({
        name: 'puppeteer',
        factory: () =>
          new ServerlessPuppeteerAudioBridge({
            appId: this.config.appId,
            channel: this.config.channel,
            token: this.config.token,
            uid: this.config.uid,
            chunkMs: this.config.chunkMs,
            onAudioChunk: async (base64, meta) => {
              await this.handleIncomingAudio(base64, meta);
            },
          }),
      });
    }

    if (bridges.length === 0) {
      throw new Error('No audio capture strategy available (missing wrtc and puppeteer)');
    }

    let startError = null;
    for (const bridge of bridges) {
      try {
        this.audioBridge = bridge.factory();
        await this.audioBridge.start();
        this.captureStrategy = bridge.name;
        console.log(`🎧 Audio capture strategy: ${bridge.name}`);
        break;
      } catch (err) {
        console.warn(`Capture strategy ${bridge.name} failed:`, err.message);
        startError = err;
        this.audioBridge = null;
      }
    }

    if (!this.audioBridge) {
      throw startError || new Error('Failed to start any audio bridge');
    }

    return {
      success: true,
      channel: this.config.channel,
      mode: this.captureStrategy || 'unknown',
    };
  }

  async stop() {
    if (this.audioBridge) {
      await this.audioBridge.stop();
      this.audioBridge = null;
    }
    this.isRunning = false;
    this.conversationHistory = [];
    console.log(`🛑 Bot session stopped`);
  }

  /**
   * Handles audio captured by the server from the Agora channel.
   */
  async handleIncomingAudio(audioInput, meta) {
    try {
      if (!this.isRunning) {
        throw new Error('Bot session is not running');
      }

      const buffer = this.toAudioBuffer(audioInput);

      // Transcribe audio (WAV or browser-recorded buffer)
      const transcription = await this.transcribe(buffer, meta.mimeType || 'audio/wav');
      if (!transcription?.trim()) {
        return { success: false, error: 'No speech detected' };
      }

      console.log(`📝 [${meta.uid ?? 'unknown'}] Transcribed: "${transcription}"`);

      // Generate reply
      const reply = await this.generateReply(transcription);
      console.log(`🗣️ Bot reply: "${reply}"`);

      // Convert to speech
      const audioResponse = await this.speak(reply);
      
      return {
        success: true,
        transcription: transcription,
        reply: reply,
        audio: audioResponse.toString('base64'), // Base64 encoded audio
      };
    } catch (err) {
      console.error('❌ Error processing audio:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Process text input (for testing or text-based interaction)
   */
  async processText(text) {
    try {
      if (!this.isRunning) {
        throw new Error('Bot session is not running');
      }

      const reply = await this.generateReply(text);
      const audioResponse = await this.speak(reply);

      return {
        success: true,
        reply: reply,
        audio: audioResponse.toString('base64'),
      };
    } catch (err) {
      console.error('❌ Error processing text:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async transcribe(audioBuffer, mimeType) {
    try {
      // Create a temporary file with correct extension
      const ext = mimeType.includes('webm') ? 'webm' : 
                  mimeType.includes('wav') ? 'wav' : 
                  mimeType.includes('mp3') ? 'mp3' : 'webm';
      
      const response = await this.openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: 'de',
        prompt: 'German language learning conversation',
      });
      return response.text || '';
    } catch (err) {
      console.error('Transcription error:', err.message);
      throw err;
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
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    });

    return Buffer.from(await response.arrayBuffer());
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      channel: this.config.channel,
      conversationLength: this.conversationHistory.length,
      captureStrategy: this.captureStrategy,
    };
  }

  toAudioBuffer(audioInput) {
    if (!audioInput) return Buffer.alloc(0);
    if (Buffer.isBuffer(audioInput)) {
      return audioInput;
    }
    if (audioInput instanceof ArrayBuffer) {
      return Buffer.from(audioInput);
    }
    if (typeof audioInput === 'string') {
      return Buffer.from(audioInput, 'base64');
    }
    throw new Error('Unsupported audio input type for transcription');
  }
}

/**
 * Utility: capture raw PCM from Agora remote audio tracks in Node (via wrtc RTCAudioSink)
 * and batch into short WAV buffers for transcription.
 */
class AgoraChannelAudioBridge {
  constructor({ appId, channel, token, uid, chunkMs = 3000, onAudioChunk }) {
    this.appId = appId;
    this.channel = channel;
    this.token = token;
    this.uid = uid;
    this.chunkMs = chunkMs;
    this.onAudioChunk = onAudioChunk;

    this.client = null;
    this.sinks = new Map();
    this.buffers = new Map();
    this.running = false;
  }

  async start() {
    if (!RTCAudioSink) {
      throw new Error('wrtc RTCAudioSink is not available in this environment');
    }

    this.running = true;
    this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    this.client.setClientRole('audience');

    this.client.on('user-published', (user, mediaType) => {
      if (mediaType === 'audio') {
        this.subscribeUser(user);
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        this.teardownSink(user.uid);
      }
    });

    await this.client.join(this.appId, this.channel, this.token || null, this.uid);
    console.log(`🔊 AgoraChannelAudioBridge joined channel ${this.channel} as ${this.uid}`);
  }

  async stop() {
    this.running = false;
    for (const [, { sink }] of this.sinks) {
      sink.stop();
    }
    this.sinks.clear();
    this.buffers.clear();
    if (this.client) {
      try {
        await this.client.leave();
      } catch (e) {
        console.warn('Error leaving Agora client', e);
      }
    }
    this.client = null;
  }

  async subscribeUser(user) {
    try {
      const track = await this.client.subscribe(user, 'audio');
      this.attachSink(user, track);
    } catch (err) {
      console.error(`Failed to subscribe to user ${user.uid}:`, err);
    }
  }

  attachSink(user, remoteAudioTrack) {
    this.teardownSink(user.uid);

    const mediaStreamTrack = remoteAudioTrack.getMediaStreamTrack();
    const sink = new RTCAudioSink(mediaStreamTrack);

    this.sinks.set(user.uid, { sink, mediaStreamTrack });
    this.buffers.set(user.uid, {
      chunks: [],
      totalMs: 0,
      sampleRate: null,
      channelCount: null,
      bitsPerSample: null,
    });

    sink.ondata = (audioData) => {
      if (!this.running) return;
      this.handlePCM(user.uid, audioData);
    };
  }

  teardownSink(uid) {
    const existing = this.sinks.get(uid);
    if (existing) {
      existing.sink.stop();
      if (existing.mediaStreamTrack && existing.mediaStreamTrack.stop) {
        existing.mediaStreamTrack.stop();
      }
      this.sinks.delete(uid);
    }
    this.buffers.delete(uid);
  }

  handlePCM(uid, audioData) {
    const entry = this.buffers.get(uid);
    if (!entry) return;

    const { bitsPerSample, sampleRate, channelCount, samples } = audioData;
    entry.bitsPerSample = bitsPerSample;
    entry.sampleRate = sampleRate;
    entry.channelCount = channelCount;

    const pcmBuffer = Buffer.from(samples.buffer);
    entry.chunks.push(pcmBuffer);

    const bytesPerSample = bitsPerSample / 8;
    const frameMs = (pcmBuffer.length / (sampleRate * channelCount * bytesPerSample)) * 1000;
    entry.totalMs += frameMs;

    if (entry.totalMs >= this.chunkMs) {
      const combined = Buffer.concat(entry.chunks);
      const wav = pcmToWav(combined, sampleRate, channelCount, bitsPerSample);
      this.onAudioChunk?.(wav, { uid, mimeType: 'audio/wav' });

      entry.chunks = [];
      entry.totalMs = 0;
    }
  }
}


/**
 * Serverless Puppeteer bridge: joins the Agora channel inside headless Chrome
 * and records remote audio tracks with MediaRecorder. Suitable for Lambda /
 * Cloud Functions where `wrtc` native bindings are unavailable.
 */
class ServerlessPuppeteerAudioBridge {
  constructor({ appId, channel, token, uid, chunkMs = 3000, onAudioChunk }) {
    this.appId = appId;
    this.channel = channel;
    this.token = token;
    this.uid = uid;
    this.chunkMs = chunkMs;
    this.onAudioChunk = onAudioChunk;
    this.browser = null;
    this.page = null;
  }

  async start() {
    const executablePath =
      process.env.CHROME_EXECUTABLE_PATH ||
      (chromium ? await chromium.executablePath() : null) ||
      null;

    this.browser = await puppeteer.launch({
      args: chromium ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium ? chromium.defaultViewport : null,
      executablePath,
      headless: true,
    });

    this.page = await this.browser.newPage();

    await this.page.exposeFunction('deliverChunk', async (base64Chunk, meta) => {
      if (this.onAudioChunk) {
        await this.onAudioChunk(base64Chunk, meta);
      }
    });

    await this.page.goto('about:blank');

    await this.page.evaluate(
      async ({ appId, channel, token, uid, chunkMs }) => {
        const AgoraRTCScript = 'https://download.agora.io/sdk/release/AgoraRTC_N.js';
        if (!window.AgoraRTC) {
          await import(AgoraRTCScript);
        }

        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        client.setClientRole('audience');

        const recorders = new Map();
        const audioContainerId = 'agora-audio-container';
        let container = document.getElementById(audioContainerId);
        if (!container) {
          container = document.createElement('div');
          container.id = audioContainerId;
          container.style.display = 'none';
          document.body.appendChild(container);
        }

        const startRecorder = (user, track) => {
          const mediaStream = new MediaStream([track.getMediaStreamTrack()]);
          const recorder = new MediaRecorder(mediaStream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 32000,
          });

          recorder.ondataavailable = async (event) => {
            if (!event.data || !event.data.size) return;
            const buffer = await event.data.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            await window.deliverChunk(base64, {
              uid: user.uid,
              mimeType: event.data.type || 'audio/webm',
            });
          };

          recorder.start(chunkMs);
          recorders.set(user.uid, recorder);
        };

        client.on('user-published', async (user, mediaType) => {
          if (mediaType !== 'audio') return;
          await client.subscribe(user, mediaType);
          user.audioTrack?.play(audioContainerId);
          startRecorder(user, user.audioTrack);
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType !== 'audio') return;
          const recorder = recorders.get(user.uid);
          recorder?.stop();
          recorders.delete(user.uid);
        });

        await client.join(appId, channel, token || null, uid);
      },
      {
        appId: this.appId,
        channel: this.channel,
        token: this.token,
        uid: this.uid,
        chunkMs: this.chunkMs,
      }
    );
  }

  async stop() {
    try {
      await this.page?.close();
    } catch (err) {
      console.warn('Failed to close Puppeteer page', err);
    }
    try {
      await this.browser?.close();
    } catch (err) {
      console.warn('Failed to close Puppeteer browser', err);
    }
    this.page = null;
    this.browser = null;
  }
}

function pcmToWav(pcmBuffer, sampleRate, channelCount, bitsPerSample) {
  const byteRate = (sampleRate * channelCount * bitsPerSample) / 8;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);

  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20); // PCM
  wavBuffer.writeUInt16LE(channelCount, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(pcmBuffer.length, 40);
  pcmBuffer.copy(wavBuffer, 44);

  return wavBuffer;
}

module.exports = AgoraGermanTutorBot;
