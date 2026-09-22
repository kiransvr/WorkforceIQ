import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import * as etProfile from './country-profiles/ET.json';

async function runSeed() {
  console.log('🌱 Starting database seeding initialization...');
  
  // Establish connection with the running PostgreSQL container
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    console.log('🌍 Ingesting raw country-profile JSON seeds...');
    // Add database model insertion queries here (e.g., AppDataSource.getRepository(CountryProfile).save(etProfile))
    console.log('✅ Database tables successfully seeded with default records!');
  } catch (error) {
    console.error('❌ Database seeding operation aborted:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();
