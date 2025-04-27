import * as dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
import { DataSource, DataSourceOptions } from 'typeorm';
import { NoteModel } from '../models/NoteModel';
import { TagModel } from '../models/TagModel';

// Entidades compartidas entre todas las configuraciones
const entities = [NoteModel, TagModel];

// Configuración base para PostgreSQL
const getBaseConfig = (env: string): Partial<DataSourceOptions> => {
  console.log('DB Connection:', {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: env === 'test' ? process.env.TEST_DB_NAME : process.env.DB_NAME
  });

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    entities,
    synchronize: env !== 'production',
    logging: env === 'development',
    ssl: process.env.SSLMODE === 'require' ? { rejectUnauthorized: false } : false
  };
};

// Configuración para entorno de desarrollo
export const developmentDataSource = new DataSource({
  ...getBaseConfig('development'),
  database: process.env.DB_NAME || 'notafacil_dev'
} as DataSourceOptions);

// Configuración para entorno de pruebas (PostgreSQL de prueba)
export const testDataSource = new DataSource({
  ...getBaseConfig('test'),
  database: process.env.TEST_DB_NAME || 'notafacil_test',
  dropSchema: true, // Esto limpia la BD de pruebas antes de cada ejecución
  synchronize: true
} as DataSourceOptions);

// Configuración para entorno de producción
export const productionDataSource = new DataSource({
  ...getBaseConfig('production'),
  database: process.env.DB_NAME || 'notafacil',
  synchronize: false, // En producción, usar migraciones en lugar de sincronización automática
  migrationsRun: true, // Ejecutar migraciones al iniciar
  migrations: [__dirname + '/../migrations/*.{js,ts}']
} as DataSourceOptions);

// Función para obtener la fuente de datos según el entorno
export const getDataSource = (): DataSource => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      return testDataSource;
    case 'production':
      return productionDataSource;
    case 'development':
    default:
      return developmentDataSource;
  }
};

// Estado de la conexión para pruebas
let dataSourceInitialized = false;

// Inicialización de la conexión
export const initializeDatabase = async (): Promise<DataSource> => {
  const dataSource = getDataSource();
  
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
      dataSourceInitialized = true;
      console.log(`Base de datos ${dataSource.options.database} conectada correctamente`);
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    }
  }
  
  return dataSource;
};

// Cierre de la conexión (útil para pruebas)
export const closeDatabase = async (): Promise<void> => {
  const dataSource = getDataSource();
  
  if (dataSource.isInitialized) {
    await dataSource.destroy();
    dataSourceInitialized = false;
    console.log('Conexión a la base de datos cerrada correctamente');
  }
};

// Función para comprobar el estado de la conexión
export const isDatabaseConnected = (): boolean => {
  return dataSourceInitialized;
};