import AgoraRTC from 'agora-rtc-sdk-ng';
import { OpenAI } from 'openai';
import http from 'http';

/**
 * Minimal AI-driven German tutor bot for Agora live audio rooms.
 *
 * The bot joins an audio channel as a broadcaster, listens to everyone
 * in the room, and uses OpenAI to generate friendly German replies.
 * Speech-to-text (STT) and text-to-speech (TTS) steps are wired to the
 * OpenAI Audio API to keep the example self contained. Replace the
 * placeholders with your own keys and deploy the file on a server or
 * in a browser environment that has a working microphone/audio output.
 *
 * To reach the iOS client, launch the bot with the same Agora App ID
 * and channel that the app uses (see AGORA_BOT.md for a quick setup
 * checklist). Run this JS on a server or desktop; the iOS app does not
 * execute it directly. When tokens are required, issue a dedicated
 * token for the bot and pass it through the AGORA_TOKEN environment
 * variable.
*/

const CONFIG = {
  appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
  channel: process.env.AGORA_CHANNEL || 'german-room',
  token: process.env.AGORA_TOKEN || null,
  uid: Number(process.env.AGORA_UID) || null,
  openAiApiKey: process.env.OPENAI_API_KEY || '<OPENAI_API_KEY>',
  // Time (ms) to buffer remote audio before sending it to STT.
  captureWindow: Number(process.env.CAPTURE_WINDOW_MS) || 8000,
  // Leave the channel if no audio/user events happen within this window.
  inactivityMs: Number(process.env.BOT_INACTIVITY_MS) || 5 * 60 * 1000,
  // Port for the lightweight HTTP control API (start/stop).
  controlPort: Number(process.env.BOT_CONTROL_PORT) || 8080,
  // Optional shared secret for HTTP control calls from iOS.
  controlSecret: process.env.BOT_CONTROL_SECRET || null,
};

const openai = new OpenAI({ apiKey: CONFIG.openAiApiKey });

class AgoraGermanTutorBot {
  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    this.remoteRecorders = new Map();
    this.bufferSourceTrack = null;
    this.inactivityTimer = null;
  }

  async start() {
    await this.client.join(CONFIG.appId, CONFIG.channel, CONFIG.token || null, CONFIG.uid || null);
    await this.client.setClientRole('host');
    this._wireClientEvents();
    this._touchActivity();
    console.log(`Joined channel ${CONFIG.channel} as German tutor bot`);
  }

  async stop() {
    this.remoteRecorders.forEach(({ recorder }) => recorder?.stop());
    if (this.bufferSourceTrack) {
      this.bufferSourceTrack.stop();
    }
    await this.client.leave();
    this._clearInactivity();
  }

  _wireClientEvents() {
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        const track = user.audioTrack;
        track.play();
        this._startRecordingTrack(user.uid, track);
        this._touchActivity();
      }
    });

    this.client.on('user-unpublished', (user) => {
      const recorderBundle = this.remoteRecorders.get(user.uid);
      recorderBundle?.recorder?.stop();
      this.remoteRecorders.delete(user.uid);
      this._touchActivity();
    });
  }

  _startRecordingTrack(uid, remoteAudioTrack) {
    const mediaStreamTrack = remoteAudioTrack.getMediaStreamTrack();
    const recorder = new MediaRecorder(new MediaStream([mediaStreamTrack]));
    const chunks = [];

    const flushAudio = async () => {
      if (!chunks.length) return;
      const blob = new Blob(chunks.splice(0, chunks.length), { type: 'audio/webm' });
      await this._handleCapturedAudio(uid, blob);
    };

    recorder.ondataavailable = (evt) => {
      if (evt.data.size > 0) {
        chunks.push(evt.data);
      }
    };

    recorder.onstop = () => {
      flushAudio();
    };

    recorder.start();
    const interval = setInterval(flushAudio, CONFIG.captureWindow);

    this.remoteRecorders.set(uid, { recorder, interval });
  }

  async _handleCapturedAudio(uid, blob) {
    try {
      const transcription = await this._transcribe(blob);
      if (!transcription?.trim()) return;

      const reply = await this._generateReply(transcription);
      console.log(`Replying to ${uid}: ${reply}`);
      await this._speak(reply);
      this._touchActivity();
    } catch (err) {
      console.error('Error while processing audio', err);
    }
  }

  async _transcribe(blob) {
    const file = new File([blob], 'segment.webm');
    const response = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-mini-audio',
      prompt: 'You are converting classroom voice into text for a German tutor bot.',
    });
    return response?.text || '';
  }

  async _generateReply(text) {
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'Du bist eine freundliche, geduldige deutsche Lehrerin. ' +
            'Korrigiere behutsam, erkläre Grammatik knapp, biete neue Vokabeln ' +
            'und stelle Rückfragen, um die Unterhaltung lebendig zu halten.',
        },
        { role: 'user', content: text },
      ],
    });

    const message = completion.output_text || completion.output[0].content[0].text;
    return message.trim();
  }

  async _speak(text) {
    const speech = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: text,
      format: 'wav',
    });

    const audioBuffer = await speech.arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(audioBuffer);
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    const track = await AgoraRTC.createBufferSourceAudioTrack({ source });
    await this.client.publish(track);
    source.start();
    this.bufferSourceTrack = track;
    this._touchActivity();
  }

  _touchActivity() {
    this._clearInactivity();
    if (!CONFIG.inactivityMs) return;
    this.inactivityTimer = setTimeout(async () => {
      console.log(`No activity for ${CONFIG.inactivityMs}ms; leaving channel.`);
      await this.stop();
    }, CONFIG.inactivityMs);
  }

  _clearInactivity() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}

let runningBot = null;

export async function startBot({ appId, channel, token } = {}) {
  if (runningBot) {
    return { status: 'already-running' };
  }

  if (appId) CONFIG.appId = appId;
  if (channel) CONFIG.channel = channel;
  if (token !== undefined) CONFIG.token = token;

  const bot = new AgoraGermanTutorBot();
  await bot.start();
  runningBot = bot;
  return { status: 'started', channel: CONFIG.channel };
}

export async function stopBot() {
  if (!runningBot) return { status: 'not-running' };
  await runningBot.stop();
  runningBot = null;
  return { status: 'stopped' };
}

function startControlServer() {
  const handler = async (req, res) => {
    if (!['/start', '/stop', '/health'].includes(new URL(req.url, 'http://localhost').pathname)) {
      res.writeHead(404); res.end(); return;
    }

    // Basic shared-secret guard.
    // if (CONFIG.controlSecret) {
    //   const secret = req.headers['x-bot-secret'];
    //   if (secret !== CONFIG.controlSecret) {
    //     res.writeHead(401); res.end('unauthorized'); return;
    //   }
    // }

    if (req.method === 'GET' && req.url.startsWith('/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: runningBot ? 'running' : 'idle' }));
      return;
    }

    if (req.method === 'POST' && req.url.startsWith('/start')) {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const result = await startBot({
            appId: payload.appId,
            channel: payload.channel,
            token: payload.token,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('Error starting bot from HTTP control', err);
          res.writeHead(500); res.end('error');
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url.startsWith('/stop')) {
      const result = await stopBot();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(405); res.end();
  };

  const server = http.createServer(handler);
  server.listen(CONFIG.controlPort, () => {
    console.log(`Bot control API listening on :${CONFIG.controlPort}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startControlServer();
  process.on('SIGINT', async () => {
    await stopBot();
    process.exit(0);
  });
}
