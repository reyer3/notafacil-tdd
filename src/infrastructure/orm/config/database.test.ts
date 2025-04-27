import { DataSource } from 'typeorm';
import * as database from './database';

// Mock para TypeORM DataSource
jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  
  // Crear un mock de DataSource
  const mockDataSource = {
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    isInitialized: false,
    options: {
      database: 'test_db',
      type: 'postgres'
    },
    getRepository: jest.fn()
  };
  
  // Mock de constructor de DataSource
  const MockDataSource = jest.fn().mockImplementation(() => mockDataSource);
  
  return {
    ...originalModule,
    DataSource: MockDataSource
  };
});

describe('Database Configuration', () => {
  // Guardar y restaurar NODE_ENV
  const originalEnv = process.env.NODE_ENV;
  
  // Limpiar mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });
  
  // Restaurar NODE_ENV después de todas las pruebas
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  describe('getDataSource', () => {
    it('should return development data source when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const dataSource = database.getDataSource();
      expect(dataSource).toBe(database.developmentDataSource);
    });
    
    it('should return test data source when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const dataSource = database.getDataSource();
      expect(dataSource).toBe(database.testDataSource);
    });
    
    it('should return production data source when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const dataSource = database.getDataSource();
      expect(dataSource).toBe(database.productionDataSource);
    });
    
    it('should default to development data source when NODE_ENV is not set', () => {
      process.env.NODE_ENV = '';
      const dataSource = database.getDataSource();
      expect(dataSource).toBe(database.developmentDataSource);
    });
  });
  
  describe('initializeDatabase', () => {
    it('should initialize the database connection', async () => {
      const dataSource = database.getDataSource() as unknown as { initialize: jest.Mock; isInitialized: boolean };
      dataSource.isInitialized = false;
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).toHaveBeenCalledTimes(1);
      expect(result).toBe(dataSource);
      expect(database.isDatabaseConnected()).toBe(true);
    });
    
    it('should not initialize the database if it is already initialized', async () => {
      const dataSource = database.getDataSource() as unknown as { initialize: jest.Mock; isInitialized: boolean };
      dataSource.isInitialized = true;
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).not.toHaveBeenCalled();
      expect(result).toBe(dataSource);
    });
    
    it('should throw an error when initialization fails', async () => {
      const dataSource = database.getDataSource() as unknown as { initialize: jest.Mock; isInitialized: boolean };
      dataSource.isInitialized = false;
      dataSource.initialize.mockRejectedValueOnce(new Error('Connection error'));
      
      await expect(database.initializeDatabase()).rejects.toThrow('Connection error');
      expect(database.isDatabaseConnected()).toBe(false);
    });
  });
  
  describe('closeDatabase', () => {
    it('should close the database connection if it is initialized', async () => {
      const dataSource = database.getDataSource() as unknown as { 
        destroy: jest.Mock; 
        isInitialized: boolean;
      };
      dataSource.isInitialized = true;
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).toHaveBeenCalledTimes(1);
      expect(database.isDatabaseConnected()).toBe(false);
    });
    
    it('should not close the database if it is not initialized', async () => {
      const dataSource = database.getDataSource() as unknown as { 
        destroy: jest.Mock; 
        isInitialized: boolean;
      };
      dataSource.isInitialized = false;
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).not.toHaveBeenCalled();
    });
  });
  
  describe('Database Options', () => {
    it('should configure development database with synchronize enabled and logging', () => {
      expect(database.developmentDataSource.options.synchronize).toBeTruthy();
      expect(database.developmentDataSource.options.logging).toBeTruthy();
    });
    
    it('should configure test database with dropSchema and synchronize enabled', () => {
      expect(database.testDataSource.options.dropSchema).toBeTruthy();
      expect(database.testDataSource.options.synchronize).toBeTruthy();
    });
    
    it('should configure production database with synchronize disabled and migrations enabled', () => {
      expect(database.productionDataSource.options.synchronize).toBeFalsy();
      expect(database.productionDataSource.options.migrationsRun).toBeTruthy();
    });
  });
});