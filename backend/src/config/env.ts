import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  corsOrigin: string;
  loginRateLimitWindowMs: number;
  loginRateLimitMax: number;
}

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env: EnvConfig = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '5000')),
  databaseUrl: getEnv('DATABASE_URL', ''),
  jwtSecret: getEnv('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000,https://nga-my.vercel.app,https://ngamy-api.onrender.com'),
  loginRateLimitWindowMs: Number(getEnv('LOGIN_RATE_LIMIT_WINDOW_MS', '900000')),
  loginRateLimitMax: Number(getEnv('LOGIN_RATE_LIMIT_MAX', '10')),
};
