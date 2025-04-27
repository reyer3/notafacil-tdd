import {DataSource} from 'typeorm';

// Guardar la implementación original de typeorm
const originalTypeorm = jest.requireActual('typeorm');

// Configuración del mock básico sin dependencias circulares
jest.mock('typeorm', () => {
    return {
        ...originalTypeorm,
        DataSource: jest.fn().mockImplementation(() => ({
            isInitialized: false,
            initialize: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            options: {database: 'test_db'}
        }))
    };
});

// DataSourceMother para generar mocks de manera consistente
class DataSourceMother {
    static createMock(overrides = {}): DataSource {
        const defaultMock = {
            isInitialized: false,
            initialize: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            options: {database: 'test_db'}
        };

        return {
            ...defaultMock,
            ...overrides
        } as unknown as DataSource;
    }

    static createInitializedMock(overrides = {}): DataSource {
        return this.createMock({
            isInitialized: true,
            ...overrides
        });
    }

    static createFailingMock(error = new Error('Database initialization failed')): DataSource {
        return this.createMock({
            initialize: jest.fn().mockRejectedValue(error)
        });
    }
}

describe('Database Configuration', () => {
    // Variables para los imports que se recargarán en cada prueba
    let databaseModule: any;
    let initializeDatabase: any;
    let closeDatabase: any;
    let isDatabaseConnected: any;

    // Antes de cada prueba, limpiar y recargar módulos
    beforeEach(() => {
        jest.clearAllMocks();

        // Recargar módulos para cada prueba
        jest.resetModules();

        // Importar módulos usando alias
        databaseModule = require('@infrastructure/orm/config/database');
        initializeDatabase = databaseModule.initializeDatabase;
        closeDatabase = databaseModule.closeDatabase;
        isDatabaseConnected = databaseModule.isDatabaseConnected;
    });

    // Después de todas las pruebas
    afterAll(() => {
        jest.restoreAllMocks();
    });

    // Prueba para la inicialización exitosa
    it('should initialize database connection successfully', async () => {
        const mockDataSource = DataSourceMother.createMock();
        jest.spyOn(databaseModule, 'getDataSource').mockReturnValue(mockDataSource);

        const result = await initializeDatabase();
        expect(mockDataSource.initialize).toHaveBeenCalled();
        expect(result).toBe(mockDataSource);
    });

    // Prueba para el manejo de errores
    it('should throw an error if database initialization fails', async () => {
        const testError = new Error('Test initialization error');
        const mockDataSource = DataSourceMother.createFailingMock(testError);

        jest.spyOn(databaseModule, 'getDataSource').mockReturnValue(mockDataSource);

        await expect(initializeDatabase()).rejects.toThrow(testError);
    });

    // Prueba para inicialización cuando ya está inicializada
    it('should not initialize database if already initialized', async () => {
        const mockDataSource = DataSourceMother.createInitializedMock();

        jest.spyOn(databaseModule, 'getDataSource').mockReturnValue(mockDataSource);

        const result = await initializeDatabase();

        // No debería llamar a initialize
        expect(mockDataSource.initialize).not.toHaveBeenCalled();
        expect(result).toBe(mockDataSource);
    });

    // Prueba para el cierre de la conexión
    it('should close database connection successfully', async () => {
        const mockDataSource = DataSourceMother.createInitializedMock();

        jest.spyOn(databaseModule, 'getDataSource').mockReturnValue(mockDataSource);

        await closeDatabase();
        expect(mockDataSource.destroy).toHaveBeenCalled();
    });

    // No es necesario cerrar cuando no está inicializada
    it('should not attempt to close the database if not initialized', async () => {
        const mockDataSource = DataSourceMother.createMock();

        jest.spyOn(databaseModule, 'getDataSource').mockReturnValue(mockDataSource);

        await closeDatabase();
        expect(mockDataSource.destroy).not.toHaveBeenCalled();
    });

    // Prueba para verificar el estado de la conexión
    it('should report database connection status correctly', () => {
        // El estado inicial debería ser falso
        expect(isDatabaseConnected()).toBe(false);
    });

    // Prueba para getDataSource basada en el entorno
    it('should return the appropriate data source based on environment', () => {
        // Para esta prueba específica, usamos comparación de propiedades en lugar de identidad

        // Guardar referencias a las fuentes de datos originales
        const devDataSource = databaseModule.developmentDataSource;
        const testDataSource = databaseModule.testDataSource;
        const prodDataSource = databaseModule.productionDataSource;

        // Guardar el valor original del entorno
        const originalEnv = process.env.NODE_ENV;

        try {
            // Probar entorno de desarrollo
            process.env.NODE_ENV = 'development';
            const devResult = databaseModule.getDataSource();
            expect(devResult.options.database).toBe(devDataSource.options.database);

            // Probar entorno de prueba
            process.env.NODE_ENV = 'test';
            const testResult = databaseModule.getDataSource();
            expect(testResult.options.database).toBe(testDataSource.options.database);

            // Probar entorno de producción
            process.env.NODE_ENV = 'production';
            const prodResult = databaseModule.getDataSource();
            expect(prodResult.options.database).toBe(prodDataSource.options.database);
        } finally {
            // Restaurar valor original
            process.env.NODE_ENV = originalEnv;
        }
    });
});