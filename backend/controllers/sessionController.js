import crypto from 'crypto';
import Session from '../models/Session.js';

const mapSession = (session, currentId) => ({
  id: session._id.toString(),
  createdAt: session.createdAt,
  lastActive: session.lastActive,
  expiresAt: session.expiresAt,
  deviceInfo: session.deviceInfo,
  location: session.location,
  ipAddress: session.ipAddress,
  isValid: session.isValid,
  isCurrent: currentId ? session._id.toString() === currentId : false,
});

export const listSessions = async (req, res) => {
  try {
    const currentId = req.authSession?._id?.toString() || null;
    const sessions = await Session.find({
      userId: req.user._id,
      isValid: true,
    })
      .sort({ lastActive: -1 })
      .lean();

    return res.json({
      sessions: sessions.map((session) => mapSession(session, currentId)),
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ message: 'Failed to load sessions' });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isValid: true,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (req.authSession && session._id.equals(req.authSession._id)) {
      return res.status(400).json({
        message: 'Use the main sign out button to close this device',
      });
    }

    session.isValid = false;
    session.tokenHash = crypto.randomBytes(64).toString('hex');
    session.expiresAt = new Date();
    session.lastActive = new Date();
    await session.save();

    return res.json({ message: 'Session signed out', id: sessionId });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ message: 'Failed to sign out session' });
  }
};
