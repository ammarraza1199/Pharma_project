import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const defaultClientUrl = 'https://wonderful-coast-068f3b810.6.azurestaticapps.net';

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/genquantaa_pharmacy',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supports one origin or a comma-separated list of origins.
  // The Azure Static Web App is always included as a safe production default.
  clientUrl:
    process.env.CLIENT_URL ||
    (isProduction ? defaultClientUrl : 'http://localhost:5173'),

  allowedOrigins: [
    ...new Set(
      [
        defaultClientUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        ...(process.env.CLIENT_URL || '').split(','),
      ]
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean),
    ),
  ],

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@genquantaa.com',
  },
};
