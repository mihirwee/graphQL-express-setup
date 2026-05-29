import { mongoStore } from './mongoStore.js';
import { postgresStore } from './postgresStore.js';
import type { DataStore } from './types.js';

const provider = (process.env.DB_PROVIDER || 'postgres').toLowerCase();

export const dataStore: DataStore =
  provider === 'mongodb' ? mongoStore : postgresStore;

export async function initDataStore() {
  if (provider !== 'postgres' && provider !== 'mongodb') {
    throw new Error('DB_PROVIDER must be either "postgres" or "mongodb"');
  }

  await dataStore.init();
  console.log(`Connected to ${provider}`);
}
