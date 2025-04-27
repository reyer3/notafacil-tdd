import { DataSource } from 'typeorm';
import * as database from './database';

// Variables para controlar el estado del mock
let mockIsInitialized = false;
let mockDataSourceInitialized = false;

// Mock para TypeORM DataSource
jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  
  // Crear un mock de DataSource
  const mockDataSource = {
    initialize: jest.fn().mockImplementation(() => {
      mockIsInitialized = true;
      mockDataSourceInitialized = true;
      return Promise.resolve(mockDataSource);
    }),
    destroy: jest.fn().mockImplementation(() => {
      mockIsInitialized = false;
      mockDataSourceInitialized = false;
      return Promise.resolve();
    }),
    get isInitialized() {
      return mockIsInitialized;
    },
    options: {
      database: 'test_db',
      type: 'postgres',
      synchronize: true,
      dropSchema: true,
      migrationsRun: true
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

// Mock de isDatabaseConnected para controlarlo en pruebas
jest.spyOn(database, 'isDatabaseConnected').mockImplementation(() => mockDataSourceInitialized);

describe('Database Configuration', () => {
  // Guardar y restaurar NODE_ENV
  const originalEnv = process.env.NODE_ENV;
  
  // Limpiar mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
    mockIsInitialized = false;
    mockDataSourceInitialized = false;
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
      const dataSource = database.getDataSource();
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).toHaveBeenCalledTimes(1);
      expect(result).toBe(dataSource);
      expect(database.isDatabaseConnected()).toBe(true);
    });
    
    it('should not initialize the database if it is already initialized', async () => {
      const dataSource = database.getDataSource();
      mockIsInitialized = true;
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).not.toHaveBeenCalled();
      expect(result).toBe(dataSource);
    });
    
    it('should throw an error when initialization fails', async () => {
      const dataSource = database.getDataSource();
      mockIsInitialized = false;
      
      // Simular error en initialize
      dataSource.initialize.mockRejectedValueOnce(new Error('Connection error'));
      
      await expect(database.initializeDatabase()).rejects.toThrow('Connection error');
      expect(database.isDatabaseConnected()).toBe(false);
    });
  });
  
  describe('closeDatabase', () => {
    it('should close the database connection if it is initialized', async () => {
      const dataSource = database.getDataSource();
      mockIsInitialized = true;
      mockDataSourceInitialized = true;
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).toHaveBeenCalledTimes(1);
      expect(database.isDatabaseConnected()).toBe(false);
    });
    
    it('should not close the database if it is not initialized', async () => {
      const dataSource = database.getDataSource();
      mockIsInitialized = false;
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).not.toHaveBeenCalled();
    });
  });
  
  describe('Database Options', () => {
    it('should configure development database with synchronize enabled and logging', () => {
      expect(database.developmentDataSource.options).toBeDefined();
      expect(database.developmentDataSource.options.synchronize).toBe(true);
      expect(database.developmentDataSource.options.logging).toBe(true);
    });
    
    it('should configure test database with dropSchema and synchronize enabled', () => {
      expect(database.testDataSource.options).toBeDefined();
      expect(database.testDataSource.options.dropSchema).toBe(true);
      expect(database.testDataSource.options.synchronize).toBe(true);
    });
    
    it('should configure production database with synchronize disabled and migrations enabled', () => {
      expect(database.productionDataSource.options).toBeDefined();
      expect(database.productionDataSource.options.synchronize).toBe(false);
      expect(database.productionDataSource.options.migrationsRun).toBe(true);
    });
  });
});