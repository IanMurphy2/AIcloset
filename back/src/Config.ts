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
  }
});

config.validate({ allowed: 'strict' });
export default config;
