import request from 'supertest';
import {app, startServer} from '@infrastructure/server';
import * as database from '@infrastructure/orm/config/database';
import {Note} from '@domain/entities/Note';
import {NoteRepository} from '@domain/repositories/NoteRepository';
import {Repository} from 'typeorm';
import {NoteModel} from '@infrastructure/orm/models/NoteModel';

// Tipos
interface MockNote {
    title: string;
    content: string;
    tags: string[];
}

// Interfaz para el mock del repositorio de dominio
interface MockNoteRepository extends NoteRepository {
    findAll: jest.Mock;
    findByTitle: jest.Mock;
    findById: jest.Mock;
    findByTag: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
}

// Interfaz para el mock del repositorio de TypeORM
interface MockTypeORMRepository extends Partial<Repository<NoteModel>> {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
}

// Datos de prueba
const createMockNotes = () => [
    new Note('Nota 1', 'Contenido 1', '1', new Date(), new Date(), ['tag1']),
    new Note('Nota 2', 'Contenido 2', '2', new Date(), new Date(), ['tag2'])
];

// Mock para database que devuelve un mock de TypeORM Repository
jest.mock('@infrastructure/orm/config/database', () => {
    const createTypeORMRepositoryMock = (): MockTypeORMRepository => ({
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
        delete: jest.fn().mockResolvedValue(undefined),
        createQueryBuilder: jest.fn().mockReturnValue({
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([])
        })
    });

    const dataSourceMock = {
        getRepository: jest.fn().mockReturnValue(createTypeORMRepositoryMock()),
        isInitialized: true
    };

    return {
        initializeDatabase: jest.fn().mockResolvedValue(dataSourceMock),
        closeDatabase: jest.fn().mockResolvedValue(undefined),
        isDatabaseConnected: jest.fn().mockReturnValue(true)
    };
});

// Mock para NoteRepository (para los casos de uso)
jest.mock('@infrastructure/orm/repositories/NoteRepositoryImpl', () => {
    return {
        NoteRepositoryImpl: jest.fn().mockImplementation(() => ({
            findAll: jest.fn().mockResolvedValue([]),
            findByTitle: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            findByTag: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockImplementation((note: Note) => Promise.resolve(note)),
            update: jest.fn().mockImplementation((note: Note) => Promise.resolve(note)),
            delete: jest.fn().mockResolvedValue(undefined)
        }))
    };
});

describe('Server', () => {
    let mockTypeORMRepository: MockTypeORMRepository;
    let mockNoteRepository: MockNoteRepository;
    let mockNotes: Note[];

    // Configuración de mocks para cada test
    const setupMocks = () => {
        mockNotes = createMockNotes();

        // Mock del repositorio TypeORM
        mockTypeORMRepository = {
            find: jest.fn().mockImplementation((options: any) => {
                if (options && options.where && options.where.title) {
                    return Promise.resolve(mockNotes.filter(note =>
                        note.title.includes(options.where.title)));
                }
                return Promise.resolve(mockNotes);
            }),
            findOne: jest.fn().mockImplementation((options: any) => {
                if (options && options.where && options.where.id) {
                    const note = mockNotes.find(note => note.id === options.where.id);
                    return Promise.resolve(note || null);
                }
                return Promise.resolve(null);
            }),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({
                ...entity,
                id: entity.id || '3',
                createdAt: new Date(),
                updatedAt: new Date()
            })),
            delete: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue({
                innerJoinAndSelect: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockImplementation(() => {
                    return Promise.resolve(mockNotes);
                })
            })
        };

        // Mock del repositorio de dominio
        mockNoteRepository = {
            findAll: jest.fn().mockResolvedValue(mockNotes),
            findByTitle: jest.fn().mockImplementation((title: string) =>
                Promise.resolve(mockNotes.filter(note => note.title.includes(title)))
            ),
            findById: jest.fn().mockImplementation((id: string) =>
                Promise.resolve(mockNotes.find(note => note.id === id) || null)
            ),
            findByTag: jest.fn().mockImplementation((tagId: string) =>
                Promise.resolve(mockNotes.filter(note => note.tags.includes(tagId)))
            ),
            create: jest.fn().mockImplementation((note: Note) => Promise.resolve(note)),
            update: jest.fn().mockImplementation((note: Note) => Promise.resolve(note)),
            delete: jest.fn().mockResolvedValue(undefined)
        };

        // Configurar que el DataSource devuelva nuestro mock de TypeORM
        const dataSourceMock = {
            getRepository: jest.fn().mockReturnValue(mockTypeORMRepository),
            isInitialized: true
        };

        (database.initializeDatabase as jest.Mock).mockResolvedValue(dataSourceMock);

        // Configurar que NoteRepositoryImpl use nuestro mock de dominio
        const NoteRepositoryImplMock = require('@infrastructure/orm/repositories/NoteRepositoryImpl').NoteRepositoryImpl;
        NoteRepositoryImplMock.mockImplementation(() => mockNoteRepository);

        return {mockTypeORMRepository, mockNoteRepository};
    };

    beforeEach(() => {
        jest.clearAllMocks();
        const mocks = setupMocks();
        mockTypeORMRepository = mocks.mockTypeORMRepository;
        mockNoteRepository = mocks.mockNoteRepository;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('startServer', () => {
        it('debería inicializar la base de datos y configurar repositorios', async () => {
            await startServer();
            expect(database.initializeDatabase).toHaveBeenCalled();
        });

        it('debería manejar errores de inicialización de base de datos', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);

            (database.initializeDatabase as jest.Mock).mockRejectedValueOnce(new Error('DB connection error'));

            await startServer();

            expect(consoleSpy).toHaveBeenCalledWith('Error al iniciar el servidor:', expect.any(Error));
            expect(processExitSpy).toHaveBeenCalledWith(1);

            consoleSpy.mockRestore();
            processExitSpy.mockRestore();
        });
    });

    describe('API Endpoints', () => {
        beforeEach(async () => {
            await startServer();
        });

        describe('GET /api/health', () => {
            it('debería retornar estado ok', async () => {
                const response = await request(app).get('/api/health');

                expect(response.status).toBe(200);
                expect(response.body).toEqual({status: 'ok'});
            });
        });

        describe('GET /api/notes', () => {
            it('debería retornar todas las notas cuando no se proporcionan parámetros de búsqueda', async () => {
                const response = await request(app).get('/api/notes');

                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(2);
                expect(response.body[0].title).toBe('Nota 1');
                expect(response.body[1].title).toBe('Nota 2');
            });

            it('debería filtrar notas por texto de búsqueda en el título', async () => {
                const filteredNotes = [mockNotes[0]]; // Solo la primera nota
                mockNoteRepository.findByTitle.mockResolvedValueOnce(filteredNotes);

                // También necesitamos mockear el método find de TypeORM que se usa en NoteRepositoryImpl
                mockNoteRepository.findAll.mockImplementationOnce((options: any) => {
                    if (options && options.where && options.where.title) {
                        return Promise.resolve([mockNotes[0]]);
                    }
                    return Promise.resolve(mockNotes);
                });

                const response = await request(app).get('/api/notes?search=Nota 1');

                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(1);
                expect(response.body[0].title).toBe('Nota 1');
            });

            it('debería filtrar notas por IDs de etiquetas', async () => {
                // Configurar el repositorio de dominio
                mockNoteRepository.findAll.mockImplementationOnce(() =>
                    Promise.resolve(mockNotes.filter(note => note.tags.includes('tag1')))
                );

                // Configurar el repositorio TypeORM
                mockTypeORMRepository.find.mockImplementationOnce(() => {
                    return Promise.resolve(mockNotes.filter(note => note.tags.includes('tag1')));
                });

                mockTypeORMRepository.createQueryBuilder.mockReturnValueOnce({
                    innerJoinAndSelect: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue(mockNotes.filter(note => note.tags.includes('tag1')))
                });

                const response = await request(app).get('/api/notes?tags=tag1');

                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(1);
                expect(response.body[0].title).toBe('Nota 1');
            });

            it('debería crear una nueva nota', async () => {
                const newNote = {
                    title: 'Nueva nota',
                    content: 'Nuevo contenido',
                    tagIds: ['tag3']
                };

                mockNoteRepository.create.mockImplementationOnce((note: any) => {
                    return Promise.resolve(new Note(
                        note.title,
                        note.content,
                        '3',
                        new Date(),
                        new Date(),
                        note.tagIds || []
                    ));
                });

                // Configurar el repositorio TypeORM
                mockTypeORMRepository.save.mockImplementationOnce((noteModel: any) => {
                    return Promise.resolve({
                        ...noteModel,
                        id: '3',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        tags: (noteModel.tags || []).map((tag: any) => ({
                            id: tag.id,
                            name: `Tag ${tag.id}`
                        }))
                    });
                });

                const response = await request(app)
                    .post('/api/notes')
                    .send(newNote)
                    .set('Content-Type', 'application/json');

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('title', 'Nueva nota');
                expect(response.body).toHaveProperty('content', 'Nuevo contenido');
            });

            it('debería manejar el parámetro de alcance de búsqueda', async () => {
                const contentNotes = mockNotes.filter(note => note.content.includes('Contenido 2'));
                mockNoteRepository.findAll.mockResolvedValueOnce(contentNotes);

                const response = await request(app).get('/api/notes?search=Contenido 2&scope=content');

                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(1);
                expect(response.body[0].title).toBe('Nota 2');
            });

            it('debería manejar errores durante la búsqueda de notas', async () => {
                mockNoteRepository.findAll.mockRejectedValueOnce(new Error('Search error'));

                const response = await request(app).get('/api/notes');

                expect(response.status).toBe(500);
                expect(response.body).toHaveProperty('error', 'Search error');
            });
        });

        describe('POST /api/notes', () => {
            it('debería crear una nueva nota', async () => {
                const newNote = {
                    title: 'Nueva nota',
                    content: 'Nuevo contenido',
                    tagIds: ['tag3']
                };

                mockNoteRepository.create.mockImplementationOnce((note: any) => {
                    return Promise.resolve(new Note(
                        note.title,
                        note.content,
                        '3',
                        new Date(),
                        new Date(),
                        note.tagIds || []
                    ));
                });

                // También necesitamos mockear el método save de TypeORM
                mockNoteRepository.create.mockImplementationOnce((noteModel: any) => {
                    return Promise.resolve({
                        ...noteModel,
                        id: '3',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        // Asegurar que las etiquetas estén en el formato correcto para mapeo
                        tags: (noteModel.tags || []).map((tag: any) => ({
                            id: tag.id,
                            name: `Tag ${tag.id}`
                        }))
                    });
                });

                const response = await request(app)
                    .post('/api/notes')
                    .send(newNote)
                    .set('Content-Type', 'application/json');

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('title', 'Nueva nota');
                expect(response.body).toHaveProperty('content', 'Nuevo contenido');
            });

            it('debería manejar errores de validación al crear una nota', async () => {
                const invalidNote = {
                    title: '',  // Título vacío, debería fallar la validación
                    content: 'Contenido'
                };

                // Ya no es necesario mockear el repositorio en este caso,
                // porque el error de validación debería ocurrir en el caso de uso
                // antes de llegar al repositorio

                const response = await request(app)
                    .post('/api/notes')
                    .send(invalidNote)
                    .set('Content-Type', 'application/json');

                expect(response.status).toBe(500);
                expect(response.body).toHaveProperty('error', 'El título de la nota es obligatorio');
            });
        });
    });
});