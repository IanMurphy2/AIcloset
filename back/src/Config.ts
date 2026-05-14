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
    user: { default: 'user', env: 'DB_USER' },
    pass: { default: 'password', env: 'DB_PASS' },
    name: { default: 'closet_db', env: 'DB_NAME' }
  }
});

config.validate({ allowed: 'strict' });
export default config;
