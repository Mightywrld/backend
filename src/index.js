require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_KEY = process.env.CLIENT_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  keyGenerator: (req) => req.headers['x-client-key'] || req.ip,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests, slow down!' }),
});

// JWT middleware to protect routes
function jwtAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Generate JWT token for frontend client
app.post('/api/auth/token', (req, res) => {
  const { clientKey } = req.body;
  if (clientKey !== CLIENT_KEY) {
    return res.status(401).json({ error: 'Invalid client key' });
  }
  const token = jwt.sign({ clientKey }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Dummy AI generation endpoint (replace with real AI call)
app.post('/api/ai/generate-hero', aiLimiter, jwtAuth, (req, res) => {
  // You can integrate OpenAI or other AI here using OPENAI_API_KEY

  // Example response:
  res.json({
    html: '<section style="background:#0047ab; color:#fff; padding:30px;"><h1>Welcome to Axel Logistics</h1><p>Your gateway to reliable airport security and logistics jobs.</p></section>',
    css: 'section { font-family: Arial, sans-serif; }'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
