const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const aiRoutes = require('./routes/ai');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');
const notificationRoutes = require('./routes/notifications');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Accept requests from the Vite dev server (port 3000) and any CLIENT_URL in .env
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173', // keep as fallback
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow no-origin requests (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── Security ─────────────────────────────────────────────────────────────────
// In development: disable the default strict CSP so Chrome DevTools / HMR work fine.
// In production: enforce a proper CSP.
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.gemini.google.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  }));
} else {
  // Development — turn off CSP entirely so browser DevTools / HMR never get blocked
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
}

// ─── Body / Cookies ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Chrome DevTools well-known handler ───────────────────────────────────────
// Prevents Chrome from logging CSP / 404 errors when it probes for DevTools config
app.get('/.well-known/*', (req, res) => res.status(204).end());

// ─── Root route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'VoyageAI API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Phase 1+ routes (AI/ML engine) ──────────────────────────────────────────
app.use('/api/places',          require('./routes/places'));
app.use('/api/restaurants',     require('./routes/restaurants'));
app.use('/api/interactions',    require('./routes/interactions'));
app.use('/api/recommendations', require('./routes/recommendations'));

// ─── AI Travel Agent ──────────────────────────────────────────────────────────
app.use('/api/agent',           require('./routes/agent'));


app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'VoyageAI API is running ✅', timestamp: new Date().toISOString() })
);

// ─── Test email route (verify Gmail SMTP works) ───────────────────────────────
// Usage: GET http://localhost:5000/api/test-email
// Sends a test email to EMAIL_USER defined in .env
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendTestEmail } = require('./utils/mailer');
    const recipient = req.query.to || process.env.EMAIL_USER;
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'No recipient. Set EMAIL_USER in .env or pass ?to=email@example.com' });
    }
    await sendTestEmail(recipient);
    return res.json({ success: true, message: `Test email sent to ${recipient}. Check your inbox!` });
  } catch (err) {
    console.error('[TestEmail]', err.message);
    return res.status(500).json({ success: false, message: `Email failed: ${err.message}` });
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
