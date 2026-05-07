import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { config } from './config/index';
import passport from './config/passport';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import { startEmailWorker } from './workers/emailWorker';
import { prisma } from './config/prisma';

const app = express();

// Middleware
const isProduction = process.env.NODE_ENV === 'production' || config.frontendUrl.startsWith('https');

app.set('trust proxy', 1);
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Database connected');

    // Start BullMQ worker
    startEmailWorker();

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
