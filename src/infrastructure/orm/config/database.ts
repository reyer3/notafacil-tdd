import { DataSource } from 'typeorm';
import { NoteModel } from '../models/NoteModel';
import { TagModel } from '../models/TagModel';

// Configuración para entorno de desarrollo
export const developmentDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'notafacil_dev',
  entities: [NoteModel, TagModel],
  synchronize: true,
  logging: true
});

// Configuración para entorno de pruebas
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [NoteModel, TagModel],
  synchronize: true,
  dropSchema: true
});

// Función para obtener la fuente de datos según el entorno
export const getDataSource = (): DataSource => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      return testDataSource;
    case 'development':
    default:
      return developmentDataSource;
  }
};

// Inicialización de la conexión
export const initializeDatabase = async (): Promise<DataSource> => {
  const dataSource = getDataSource();
  
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  
  return dataSource;
};