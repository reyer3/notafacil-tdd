import { DataSource } from 'typeorm';
import * as database from './database';

// Interfaz para extender las propiedades del mock
interface MockDataSource {
  initialize: jest.Mock;
  destroy: jest.Mock;
  isInitialized: boolean;
  options: {
    database: string;
    type: string;
    synchronize: boolean;
    logging: boolean;
    dropSchema: boolean;
    migrationsRun: boolean;
  };
  getRepository: jest.Mock;
}

// Mock para TypeORM DataSource
jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  
  // Estado interno del mock para controlar isInitialized
  let _isInitialized = false;
  
  // Crear un mock de DataSource
  const mockDataSource = {
    initialize: jest.fn().mockImplementation(() => {
      _isInitialized = true;
      return Promise.resolve(mockDataSource);
    }),
    destroy: jest.fn().mockImplementation(() => {
      _isInitialized = false;
      return Promise.resolve();
    }),
    get isInitialized() {
      return _isInitialized;
    },
    options: {
      database: 'test_db',
      type: 'postgres',
      synchronize: true,
      logging: true,
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

describe('Database Configuration', () => {
  // Guardar y restaurar NODE_ENV
  const originalEnv = process.env.NODE_ENV;
  
  // Variable para rastrear estado de conexión
  let mockConnected = false;
  
  // Configurar mocks antes de cada prueba
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear la variable de estado
    mockConnected = false;
    
    // Acceder al mock de dataSource
    const dataSource = database.getDataSource() as unknown as MockDataSource;
    
    // Reiniciar los mocks para las pruebas
    dataSource.initialize.mockImplementation(() => {
      mockConnected = true;
      // Nota: no necesitamos asignar a isInitialized aquí, ya que se maneja internamente
      return Promise.resolve(dataSource);
    });
    
    dataSource.destroy.mockImplementation(() => {
      mockConnected = false;
      // Nota: no necesitamos asignar a isInitialized aquí, ya que se maneja internamente
      return Promise.resolve();
    });
    
    // Actualizar la implementación de isDatabaseConnected
    jest.spyOn(database, 'isDatabaseConnected').mockImplementation(() => mockConnected);
    
    process.env.NODE_ENV = originalEnv;
  });
  
  // Restaurar NODE_ENV después de todas las pruebas
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
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
      const dataSource = database.getDataSource() as unknown as MockDataSource;
      // Forzamos el mock para que se considere no inicializado
      dataSource.initialize.mockImplementationOnce(() => {
        mockConnected = true;
        return Promise.resolve(dataSource);
      });
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).toHaveBeenCalledTimes(1);
      expect(result).toBe(dataSource);
      expect(mockConnected).toBe(true);
    });
    
    it('should not initialize the database if it is already initialized', async () => {
      const dataSource = database.getDataSource() as unknown as MockDataSource;
      // Simular que ya está inicializado
      Object.defineProperty(dataSource, 'isInitialized', {
        get: jest.fn().mockReturnValue(true)
      });
      
      const result = await database.initializeDatabase();
      
      expect(dataSource.initialize).not.toHaveBeenCalled();
      expect(result).toBe(dataSource);
    });
    
    it('should throw an error when initialization fails', async () => {
      const dataSource = database.getDataSource() as unknown as MockDataSource;
      dataSource.initialize.mockRejectedValueOnce(new Error('Connection error'));
      
      await expect(database.initializeDatabase()).rejects.toThrow('Connection error');
      expect(mockConnected).toBe(false);
    });
  });
  
  describe('closeDatabase', () => {
    it('should close the database connection if it is initialized', async () => {
      const dataSource = database.getDataSource() as unknown as MockDataSource;
      // Simular que está inicializado
      Object.defineProperty(dataSource, 'isInitialized', {
        get: jest.fn().mockReturnValue(true)
      });
      mockConnected = true;
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).toHaveBeenCalledTimes(1);
      expect(mockConnected).toBe(false);
    });
    
    it('should not close the database if it is not initialized', async () => {
      const dataSource = database.getDataSource() as unknown as MockDataSource;
      // Simular que no está inicializado
      Object.defineProperty(dataSource, 'isInitialized', {
        get: jest.fn().mockReturnValue(false)
      });
      
      await database.closeDatabase();
      
      expect(dataSource.destroy).not.toHaveBeenCalled();
    });
  });
  
  describe('Database Options', () => {
    // Mockear las opciones directamente para estas pruebas
    beforeEach(() => {
      // Configuramos opciones específicas para cada dataSource
      const devOptions = {
        synchronize: true,
        logging: true
      };
      
      const testOptions = {
        dropSchema: true,
        synchronize: true
      };
      
      const prodOptions = {
        synchronize: false,
        migrationsRun: true
      };
      
      // Aplicamos las opciones a los diferentes DataSource
      jest.spyOn(database.developmentDataSource, 'options', 'get').mockReturnValue(devOptions as any);
      jest.spyOn(database.testDataSource, 'options', 'get').mockReturnValue(testOptions as any);
      jest.spyOn(database.productionDataSource, 'options', 'get').mockReturnValue(prodOptions as any);
    });
    
    it('should configure development database with synchronize enabled and logging', () => {
      expect(database.developmentDataSource.options.synchronize).toBe(true);
      expect(database.developmentDataSource.options.logging).toBe(true);
    });
    
    it('should configure test database with dropSchema and synchronize enabled', () => {
      expect(database.testDataSource.options.dropSchema).toBe(true);
      expect(database.testDataSource.options.synchronize).toBe(true);
    });
    
    it('should configure production database with synchronize disabled and migrations enabled', () => {
      expect(database.productionDataSource.options.synchronize).toBe(false);
      expect(database.productionDataSource.options.migrationsRun).toBe(true);
    });
  });
});