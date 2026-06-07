import convict from 'convict';
import 'dotenv/config';

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['development', 'production', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  app: {
    frontendUrl: {
      doc: 'Base URL of the frontend, used to redirect after OAuth.',
      default: 'http://localhost:5173',
      env: 'FRONTEND_URL'
    }
  },
  db: {
    host: { default: 'localhost', env: 'DB_HOST' },
    port: { default: 5432, env: 'DB_PORT', format: 'port' },
    user: { default: 'user', env: 'DB_USER' },
    pass: { default: 'password', env: 'DB_PASS' },
    name: { default: 'closet_db', env: 'DB_NAME' }
  },
  upload: {
    dir: { default: './uploads', env: 'UPLOAD_DIR' },
    maxSizeBytes: { default: 5 * 1024 * 1024, env: 'UPLOAD_MAX_SIZE_BYTES', format: 'int' }, // 5MB
    allowedMimeTypes: {
      default: ['image/jpeg', 'image/png', 'image/webp'],
      format: Array
    }
  },
  jwt: {
    secret: { default: 'secret', env: 'JWT_SECRET' },
    expiresIn: { default: '7d', env: 'JWT_EXPIRES_IN' }
  },
  google: {
    clientId: {
      doc: 'Google OAuth client ID. If empty, the Google strategy is not registered.',
      default: '',
      env: 'GOOGLE_CLIENT_ID'
    },
    clientSecret: {
      doc: 'Google OAuth client secret. If empty, the Google strategy is not registered.',
      default: '',
      env: 'GOOGLE_CLIENT_SECRET'
    },
    callbackUrl: {
      doc: 'Google OAuth callback URL registered with Google.',
      default: 'http://localhost:3000/auth/google/callback',
      env: 'GOOGLE_CALLBACK_URL'
    }
  }
});

config.validate({ allowed: 'strict' });
export default config;
