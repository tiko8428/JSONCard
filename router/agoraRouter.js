const express = require('express');
const router = express.Router();
const AgoraBot = require('../agora/agoraGermanBotSimple'); // Using simple version


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Bot instance tracker
let botInstance = null;
let botState = {
  isRunning: false,
  channel: null,
  startedAt: null,
  error: null,
};

// Start the bot for a specific channel
router.post('/start', async (req, res) => {
  try {
    const { channel, token, openAiApiKey } = req.body;
    const appId ="8189340d7b2e4ddc809cb96ecd47e520";
    if (!channel) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel ID is required' 
      });
    }

    if (botState.isRunning) {
      return res.json({
        success: false,
        error: 'Bot is already running',
        channel: botState.channel,
      });
    }

    // Create and start bot instance
    botInstance = new AgoraBot({
      appId: appId || process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
      channel: channel,
      token: token || null,
      openAiApiKey: openAiApiKey || OPENAI_API_KEY,
    });

    await botInstance.start();
    
    botState.isRunning = true;
    botState.channel = channel;
    botState.startedAt = new Date().toISOString();
    botState.error = null;

    console.log(`Bot started in channel: ${channel}`);

    res.json({
      success: true,
      message: 'Bot started successfully',
      channel: channel,
      startedAt: botState.startedAt,
    });

  } catch (error) {
    console.error('Error starting bot:', error);
    
    // Cleanup on error
    if (botInstance) {
      try {
        await botInstance.stop();
      } catch (e) {}
      botInstance = null;
    }
    
    botState.error = error.message;
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop the bot
router.post('/stop', async (req, res) => {
  try {
    if (!botState.isRunning) {
      return res.json({
        success: false,
        error: 'Bot is not running',
      });
    }

    const previousChannel = botState.channel;
    
    // Stop the bot instance
    if (botInstance) {
      await botInstance.stop();
      botInstance = null;
    }
    
    botState = {
      isRunning: false,
      channel: null,
      startedAt: null,
      error: null,
    };

    console.log(`Bot stopped. Was in channel: ${previousChannel}`);

    res.json({
      success: true,
      message: 'Bot stopped',
      previousChannel: previousChannel,
    });

  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isRunning: botState.isRunning,
    channel: botState.channel,
    startedAt: botState.startedAt,
    error: botState.error,
  });
});

// Get health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    service: 'agora-bot',
    status: 'available',
    botRunning: botState.isRunning,
  });
});

// Get bot configuration (for iOS app to join same channel)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
    currentChannel: botState.channel,
    botRunning: botState.isRunning,
  });
});

// iOS app endpoint: Get channel info and start bot
router.post('/join-with-bot', async (req, res) => {
  try {
    const { userId, userName, openAiApiKey } = req.body;

    if (botState.isRunning) {
      // Return existing channel if bot is already running
      return res.json({
        success: true,
        appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
        channel: botState.channel,
        token: null,
        message: 'Bot is already running. Join the existing channel.',
      });
    }

    // Generate a unique channel for this user session
    const channel = `tutor-${userId}-${Date.now()}`;
    
    // Create and start bot instance
    botInstance = new AgoraBot({
      appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
      channel: channel,
      token: null,
      openAiApiKey: openAiApiKey || OPENAI_API_KEY,
    });

    await botInstance.start();
    
    botState.isRunning = true;
    botState.channel = channel;
    botState.startedAt = new Date().toISOString();
    botState.userId = userId;
    botState.userName = userName;

    console.log(`Bot started for user ${userName} in channel: ${channel}`);

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
      channel: channel,
      token: null, // Generate token here if using token authentication
      message: 'Bot started. Join this channel from your iOS app.',
    });

  } catch (error) {
    console.error('Error in join-with-bot:', error);
    
    if (botInstance) {
      try {
        await botInstance.stop();
      } catch (e) {}
      botInstance = null;
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process audio from iOS app
router.post('/process-audio', async (req, res) => {
  try {
    if (!botState.isRunning || !botInstance) {
      return res.status(400).json({
        success: false,
        error: 'Bot is not running. Start a session first.',
      });
    }

    // Audio should be sent as base64 or multipart/form-data
    let audioBuffer;
    let mimeType = 'audio/webm';

    if (req.files && req.files.audio) {
      // File upload
      audioBuffer = req.files.audio.data;
      mimeType = req.files.audio.mimetype;
    } else if (req.body.audio) {
      // Base64 encoded
      audioBuffer = Buffer.from(req.body.audio, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
    } else {
      return res.status(400).json({
        success: false,
        error: 'No audio data provided',
      });
    }

    const result = await botInstance.processAudioFromApp(audioBuffer, mimeType);
    res.json(result);

  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process text input (alternative to audio)
router.post('/process-text', async (req, res) => {
  try {
    if (!botState.isRunning || !botInstance) {
      return res.status(400).json({
        success: false,
        error: 'Bot is not running. Start a session first.',
      });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const result = await botInstance.processText(text);
    res.json(result);

  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

