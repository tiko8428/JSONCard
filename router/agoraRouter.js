const express = require('express');
const router = express.Router();

// In-memory bot state tracker
let botState = {
  isRunning: false,
  channel: null,
  startedAt: null,
  error: null,
};

/**
 * IMPORTANT: The Agora bot uses browser-only APIs (AudioContext, MediaRecorder)
 * and cannot run directly in Node.js. 
 * 
 * Options to make this work with your iOS app:
 * 1. Use Puppeteer to run the bot in a headless browser (recommended for server)
 * 2. Deploy the bot as a separate web service that your iOS app triggers
 * 3. Use a different Agora SDK that supports Node.js (not agora-rtc-sdk-ng)
 */

// Start the bot for a specific channel
router.post('/start', async (req, res) => {
  try {
    const { channel, token, appId } = req.body;

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

    // TODO: Launch bot using Puppeteer or similar
    // For now, just update state
    botState = {
      isRunning: true,
      channel: channel,
      startedAt: new Date().toISOString(),
      error: null,
    };

    res.json({
      success: true,
      message: 'Bot start requested',
      channel: channel,
      note: 'Bot requires browser environment - use Puppeteer to launch',
    });

  } catch (error) {
    console.error('Error starting bot:', error);
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

    // TODO: Stop the Puppeteer instance
    const previousChannel = botState.channel;
    
    botState = {
      isRunning: false,
      channel: null,
      startedAt: null,
      error: null,
    };

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
    ...botState,
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
    const { userId, userName } = req.body;

    // Generate a unique channel for this user session
    const channel = `tutor-${userId}-${Date.now()}`;
    
    // Start bot in this channel
    botState = {
      isRunning: true,
      channel: channel,
      startedAt: new Date().toISOString(),
      error: null,
      userId: userId,
      userName: userName,
    };

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520',
      channel: channel,
      token: null, // Generate token here if using token authentication
      message: 'Bot is starting. Join this channel from your iOS app.',
    });

  } catch (error) {
    console.error('Error in join-with-bot:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

