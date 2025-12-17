const express = require('express');
const router = express.Router();
const AgoraBot = require('../agora/agoraGermanBotSimple'); // Server-side audio capture version

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_APP_ID = process.env.AGORA_APP_ID || '8189340d7b2e4ddc809cb96ecd47e520';

// Track bot instances per channel so multiple rooms can coexist
const bots = new Map();

// Start the bot for a specific channel
router.post('/start', async (req, res) => {
  try {
    const { channel, token, openAiApiKey } = req.body;

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel ID is required'
      });
    }

    const existing = bots.get(channel);
    if (existing?.isRunning) {
      return res.json({
        success: true,
        message: 'Bot is already running on this channel',
        channel,
        startedAt: existing.startedAt,
        participants: existing.participants,
      });
    }

    const appId = DEFAULT_APP_ID;

    // Create and start bot instance
    const botInstance = await createBotInstance({
      appId,
      channel,
      token,
      openAiApiKey,
    });

    console.log(`Bot started in channel: ${channel}`);

    res.json({
      success: true,
      message: 'Bot started successfully',
      channel: botInstance.channel,
      startedAt: botInstance.startedAt,
      participants: botInstance.participants,
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
    const { channel } = req.body || {};

    if (channel) {
      const stopped = await stopBot(channel);
      if (!stopped) {
        return res.json({
          success: false,
          error: `Bot is not running for channel ${channel}`,
        });
      }

      return res.json({
        success: true,
        message: 'Bot stopped',
        previousChannel: channel,
      });
    }

    if (!bots.size) {
      return res.json({
        success: false,
        error: 'Bot is not running',
      });
    }

    res.json({
      success: true,
      message: 'All bots stopped',
      stoppedChannels: await stopAllBots(),
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
  if (req.query.channel) {
    const state = bots.get(req.query.channel);
    if (!state) {
      return res.status(404).json({
        success: false,
        error: `Bot not running for channel ${req.query.channel}`,
      });
    }
    return res.json({
      success: true,
      ...state,
    });
  }

  res.json({
    success: true,
    bots: Array.from(bots.entries()).map(([channel, state]) => ({
      channel,
      startedAt: state.startedAt,
      participants: state.participants,
      isRunning: state.isRunning,
      captureStrategy: state.captureStrategy,
    })),
  });
});

// Get health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'agora-bot',
    status: 'available',
    botRunning: bots.size > 0,
  });
});

// Get bot configuration (for iOS app to join same channel)
router.get('/config', (req, res) => {
  const { channel } = req.query;
  const state = channel ? bots.get(channel) : null;

  res.json({
    success: true,
    appId: DEFAULT_APP_ID,
    currentChannel: state?.channel || null,
    botRunning: Boolean(state?.isRunning),
    participants: state?.participants || [],
  });
});

// iOS app endpoint: Get channel info and start bot
router.post('/join-with-bot', async (req, res) => {
  try {
    const { userId, userName, channel: requestedChannel, token, openAiApiKey } = req.body;
    const channel = requestedChannel || (userId ? `tutor-${userId}` : null);

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel ID is required',
      });
    }

    const existing = bots.get(channel);
    if (existing?.isRunning) {
      addParticipant(channel, userId, userName);

      return res.json({
        success: true,
        appId: DEFAULT_APP_ID,
        channel: existing.channel,
        token: existing.token ?? null,
        message: 'Bot is already running. Join the existing channel.',
        startedAt: existing.startedAt,
        participants: existing.participants,
      });
    }

    const botInstance = await createBotInstance({
      appId: DEFAULT_APP_ID,
      channel,
      token,
      openAiApiKey,
    });

    addParticipant(channel, userId, userName);

    console.log(`Bot started for user ${userName || userId} in channel: ${channel}`);

    res.json({
      success: true,
      appId: botInstance.appId,
      channel: botInstance.channel,
      token: botInstance.token ?? null, // Generate token here if using token authentication
      message: 'Bot started. Join this channel from your iOS app.',
      participants: botInstance.participants,
    });

  } catch (error) {
    console.error('Error in join-with-bot:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process audio from iOS app
// Deprecated: the server now captures Agora audio directly. Kept to avoid 404s.
router.post('/process-audio', (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Client audio upload is no longer supported. The bot listens directly on the Agora channel.',
  });
});

// Process text input (alternative to audio)
router.post('/process-text', async (req, res) => {
  try {
    const { text, channel } = req.body;

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel is required',
      });
    }

    const botInstance = bots.get(channel);

    if (!botInstance?.instance) {
      return res.status(400).json({
        success: false,
        error: 'Bot is not running. Start a session first.',
        channel,
      });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const result = await botInstance.instance.processText(text);
    res.json(result);

  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/participant/leave', async (req, res) => {
  try {
    const { channel, userId, userName } = req.body || {};
    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel is required',
      });
    }

    const remaining = removeParticipant(channel, userId, userName);
    if (remaining === null) {
      return res.status(404).json({
        success: false,
        error: `Bot not running for channel ${channel}`,
      });
    }

    if (remaining === 0) {
      await stopBot(channel);
    }

    res.json({
      success: true,
      participantsRemaining: remaining,
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

function addParticipant(channel, userId, userName) {
  if (!userId && !userName) return;

  const participantId = userId || userName;
  if (!participantId) return;

  const botState = bots.get(channel);
  if (!botState) return;

  const exists = botState.participants.find((p) => p.id === participantId);
  if (exists) return;

  botState.participants.push({
    id: participantId,
    userId,
    userName,
    joinedAt: new Date().toISOString(),
  });
}

function removeParticipant(channel, userId, userName) {
  const participantId = userId || userName;
  const botState = bots.get(channel);
  if (!botState) return null;
  if (!participantId) return botState.participants.length;

  botState.participants = botState.participants.filter((p) => p.id !== participantId);
  return botState.participants.length;
}

async function createBotInstance({ appId, channel, token, openAiApiKey }) {
  const instance = new AgoraBot({
    appId,
    channel,
    token: token || null,
    openAiApiKey: openAiApiKey || OPENAI_API_KEY,
    uid: Math.floor(Math.random() * 2 ** 20),
    chunkMs: 3500,
  });

  await instance.start();

  const state = {
    instance,
    isRunning: true,
    channel,
    appId,
    token: token || null,
    startedAt: new Date().toISOString(),
    error: null,
    participants: [],
    captureStrategy: instance.getStatus().captureStrategy,
  };

  bots.set(channel, state);
  return state;
}

async function stopBot(channel) {
  const botState = bots.get(channel);
  if (!botState) return false;

  try {
    await botState.instance?.stop();
  } catch (err) {
    console.warn(`Failed to stop bot for channel ${channel}:`, err);
  }
  bots.delete(channel);
  console.log(`Bot stopped. Was in channel: ${channel}`);
  return true;
}

async function stopAllBots() {
  const channels = Array.from(bots.keys());
  await Promise.all(channels.map(stopBot));
  return channels;
}

module.exports = router;
