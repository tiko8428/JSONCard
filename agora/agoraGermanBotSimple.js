const { OpenAI } = require('openai');

/**
 * Lightweight German Tutor Bot - Server-side API only
 * 
 * This version doesn't require Agora SDK on the server.
 * The iOS app handles all Agora communication directly.
 * This bot just provides AI conversation capabilities via REST API.
 */

class AgoraGermanTutorBot {
  constructor(config) {
    this.config = {
      appId: config.appId,
      channel: config.channel,
      token: config.token,
      openAiApiKey: config.openAiApiKey,
    };
    
    this.openai = new OpenAI({ apiKey: this.config.openAiApiKey });
    this.isRunning = false;
    this.conversationHistory = [];
  }

  async start() {
    this.isRunning = true;
    console.log(`✅ Bot session started for channel: ${this.config.channel}`);
    console.log(`📱 iOS app can join channel and use /process-audio endpoint`);
    
    return {
      success: true,
      channel: this.config.channel,
      mode: 'rest-api',
    };
  }

  async stop() {
    this.isRunning = false;
    this.conversationHistory = [];
    console.log(`🛑 Bot session stopped`);
  }

  /**
   * Process audio sent from iOS app
   * iOS app records user speech and sends it here for processing
   */
  async processAudioFromApp(audioBuffer, mimeType = 'audio/webm') {
    try {
      if (!this.isRunning) {
        throw new Error('Bot session is not running');
      }

      // Transcribe audio
      const transcription = await this.transcribe(audioBuffer, mimeType);
      if (!transcription?.trim()) {
        return { success: false, error: 'No speech detected' };
      }

      console.log(`📝 Transcribed: "${transcription}"`);

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
    };
  }
}

module.exports = AgoraGermanTutorBot;
