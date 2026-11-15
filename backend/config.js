import 'dotenv/config';

export const config = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  port: process.env.PORT || 3001,
};
