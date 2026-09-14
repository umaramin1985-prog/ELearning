import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  const { room, username, userId } = req.query;

  if (!room || !username) {
    return res.status(400).json({ error: 'Missing room or username' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Server misconfigured. Missing API key or secret.' });
  }

  try {
    const identity = userId || username;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: username,
    });
    
    // Set permissions for the token
    at.addGrant({ roomJoin: true, room: room });

    const token = await at.toJwt();
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
