// DataSourceMother.ts (puedes crear este archivo en una carpeta /test/mothers o similar)
import { DataSource } from 'typeorm';

export class DataSourceMother {
    static createMock(overrides = {}): DataSource {
        const defaultMock = {
            isInitialized: false,
            initialize: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            options: { database: 'test_db' }
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