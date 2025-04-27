import request from 'supertest';
import { app, startServer } from './server';
import * as database from './orm/config/database';
import { Note } from '../domain/entities/Note';
import { SearchScope } from '../application/use-cases/notes/SearchNotesUseCase';

// Definir tipo para el mock de notas
interface MockNote {
  title: string;
  content: string;
  tags: string[];
}

// Mock para las notas en el repositorio
const mockNotes = [
  new Note('Nota 1', 'Contenido 1', '1', new Date(), new Date(), ['tag1']),
  new Note('Nota 2', 'Contenido 2', '2', new Date(), new Date(), ['tag2'])
];

// Mock completo para database
jest.mock('./orm/config/database', () => {
  const mockRepository = {
    findAll: jest.fn().mockResolvedValue([]),
    findByTitle: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByTag: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((note: any) => Promise.resolve(note)),
    update: jest.fn().mockImplementation((note: any) => Promise.resolve(note)),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  
  const dataSourceMock = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
    isInitialized: true
  };
  
  return {
    initializeDatabase: jest.fn().mockResolvedValue(dataSourceMock),
    closeDatabase: jest.fn().mockResolvedValue(undefined),
    isDatabaseConnected: jest.fn().mockReturnValue(true)
  };
});

// Configura los mocks específicos para las pruebas
const setupMockRepository = () => {
  const mockRepository = {
    findAll: jest.fn().mockResolvedValue(mockNotes),
    findByTitle: jest.fn().mockImplementation((title: string) => {
      return Promise.resolve(
        mockNotes.filter(note => note.title.includes(title))
      );
    }),
    findById: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve(
        mockNotes.find(note => note.id === id) || null
      );
    }),
    findByTag: jest.fn().mockImplementation((tagId: string) => {
      return Promise.resolve(
        mockNotes.filter(note => note.tags.includes(tagId))
      );
    }),
    create: jest.fn().mockImplementation((note: MockNote) => Promise.resolve(note)),
    update: jest.fn().mockImplementation((note: MockNote) => Promise.resolve(note)),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  
  const dataSourceMock = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
    isInitialized: true
  };
  
  (database.initializeDatabase as jest.Mock).mockResolvedValue(dataSourceMock);
  
  return mockRepository;
};

describe('Server', () => {
  let mockRepository: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = setupMockRepository();
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  describe('startServer', () => {
    it('should initialize database and set up repositories', async () => {
      await startServer();
      
      expect(database.initializeDatabase).toHaveBeenCalled();
    });
    
    it('should handle database initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
      it('should return status ok', async () => {
        const response = await request(app).get('/api/health');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
      });
    });
    
    describe('GET /api/notes', () => {
      it('should return all notes when no search params are provided', async () => {
        const response = await request(app).get('/api/notes');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].title).toBe('Nota 1');
        expect(response.body[1].title).toBe('Nota 2');
      });
      
      it('should filter notes by search text in title', async () => {
        // Mock para el caso específico
        const filteredNotes = [mockNotes[0]]; // Solo la primera nota
        mockRepository.findByTitle.mockResolvedValueOnce(filteredNotes);
        
        const response = await request(app).get('/api/notes?search=Nota 1');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Nota 1');
      });
      
      it('should filter notes by tag IDs', async () => {
        // Mock para el caso específico
        mockRepository.findAll.mockImplementationOnce(() => {
          // Filtrado simulado por tag
          return Promise.resolve(mockNotes.filter(note => note.tags.includes('tag1')));
        });
        
        const response = await request(app).get('/api/notes?tags=tag1');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Nota 1');
      });
      
      it('should handle search scope parameter', async () => {
        // Mock para simular búsqueda en contenido
        const contentNotes = mockNotes.filter(note => note.content.includes('Contenido 2'));
        mockRepository.findAll.mockResolvedValueOnce(contentNotes);
        
        const response = await request(app).get('/api/notes?search=Contenido 2&scope=content');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Nota 2');
      });
      
      it('should handle errors during note search', async () => {
        mockRepository.findAll.mockRejectedValueOnce(new Error('Search error'));
        
        const response = await request(app).get('/api/notes');
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Search error');
      });
    });
    
    describe('POST /api/notes', () => {
      it('should create a new note', async () => {
        const newNote = {
          title: 'Nueva nota',
          content: 'Nuevo contenido',
          tagIds: ['tag3']
        };
        
        // Mock para crear nota
        mockRepository.create.mockImplementationOnce((note: any) => {
          return Promise.resolve(new Note(
            note.title,
            note.content,
            '3',
            new Date(),
            new Date(),
            note.tagIds || []
          ));
        });
        
        const response = await request(app)
          .post('/api/notes')
          .send(newNote)
          .set('Content-Type', 'application/json');
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('title', 'Nueva nota');
        expect(response.body).toHaveProperty('content', 'Nuevo contenido');
      });
      
      it('should handle validation errors when creating note', async () => {
        const invalidNote = {
          title: '',  // Título vacío, debería fallar la validación
          content: 'Contenido'
        };
        
        mockRepository.create.mockRejectedValueOnce(new Error('El título de la nota es obligatorio'));
        
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