import { Note } from '@domain/entities/Note';
import { NoteRepository } from '@domain/repositories/NoteRepository';
import { SearchNotesUseCase, SearchScope } from '@application/use-cases/notes/SearchNotesUseCase';

// Mock del repositorio
class MockNoteRepository implements NoteRepository {
  private notes: Note[] = [];

  constructor(initialNotes: Note[] = []) {
    this.notes = initialNotes;
  }

  async findById(id: string): Promise<Note | null> {
    return this.notes.find(note => note.id === id) || null;
  }

  async findAll(): Promise<Note[]> {
    return [...this.notes];
  }

  async findByTitle(title: string): Promise<Note[]> {
    return this.notes.filter(note => note.title.includes(title));
  }

  async findByTag(tagId: string): Promise<Note[]> {
    return this.notes.filter(note => note.tags.includes(tagId));
  }

  async create(note: Note): Promise<Note> {
    this.notes.push(note);
    return note;
  }

  async update(note: Note): Promise<Note> {
    const index = this.notes.findIndex(n => n.id === note.id);
    if (index >= 0) {
      this.notes[index] = note;
      return note;
    }
    throw new Error(`Nota con ID ${note.id} no encontrada`);
  }

  async delete(id: string): Promise<void> {
    const index = this.notes.findIndex(note => note.id === id);
    if (index >= 0) {
      this.notes.splice(index, 1);
    }
  }
}

describe('SearchNotesUseCase', () => {
  let mockRepository: NoteRepository;
  let searchNotesUseCase: SearchNotesUseCase;
  
  beforeEach(() => {
    // Crear algunas notas de prueba
    const notes = [
      new Note('Reunión de trabajo', 'Discutir proyecto X', '1', new Date(), new Date(), ['1', '2']),
      new Note('Lista de compras', 'Leche, pan, huevos', '2', new Date(), new Date(), ['3']),
      new Note('Ideas para proyecto', 'Implementar feature Y', '3', new Date(), new Date(), ['2', '4']),
      new Note('Recordatorios', 'Llamar al dentista', '4', new Date(), new Date(), ['1']),
    ];
    
    mockRepository = new MockNoteRepository(notes);
    searchNotesUseCase = new SearchNotesUseCase(mockRepository);
  });

  // Test de búsqueda por texto en título
  it('should find notes by text in title', async () => {
    const result = await searchNotesUseCase.execute({ 
      searchText: 'proyecto', 
      tagIds: [],
      searchScope: SearchScope.TITLE_ONLY
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Ideas para proyecto');
  });

  // Test de búsqueda por texto en contenido
  it('should find notes by text in content', async () => {
    const result = await searchNotesUseCase.execute({ 
      searchText: 'dentista', 
      tagIds: [],
      searchScope: SearchScope.CONTENT_ONLY
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Recordatorios');
  });

  // Test de búsqueda en título y contenido
  it('should find notes by text in both title and content', async () => {
    const result = await searchNotesUseCase.execute({ 
      searchText: 'proyecto', 
      tagIds: [],
      searchScope: SearchScope.BOTH
    });
    
    expect(result).toHaveLength(2);
    expect(result.map(note => note.title)).toContain('Ideas para proyecto');
    expect(result.map(note => note.title)).toContain('Reunión de trabajo');
  });

  // Test de búsqueda por etiqueta
  it('should find notes by tag id', async () => {
    const result = await searchNotesUseCase.execute({ searchText: '', tagIds: ['2'] });
    
    expect(result).toHaveLength(2);
    expect(result.map(note => note.title)).toContain('Reunión de trabajo');
    expect(result.map(note => note.title)).toContain('Ideas para proyecto');
  });

  // Test de búsqueda combinada (texto + etiqueta)
  it('should find notes by text and tag id', async () => {
    const result = await searchNotesUseCase.execute({ 
      searchText: 'proyecto', 
      tagIds: ['2'],
      searchScope: SearchScope.TITLE_ONLY
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Ideas para proyecto');
  });

  // Test de búsqueda con múltiples etiquetas
  it('should find notes with any of the specified tags', async () => {
    const result = await searchNotesUseCase.execute({ searchText: '', tagIds: ['1', '3'] });
    
    expect(result).toHaveLength(3);
    expect(result.map(note => note.title)).toContain('Reunión de trabajo');
    expect(result.map(note => note.title)).toContain('Lista de compras');
    expect(result.map(note => note.title)).toContain('Recordatorios');
  });

  // Test de búsqueda sin resultados
  it('should return empty array when no matches found', async () => {
    const result = await searchNotesUseCase.execute({ searchText: 'inexistente', tagIds: [] });
    
    expect(result).toHaveLength(0);
  });

  // Test de búsqueda sin parámetros
  it('should return all notes when no search criteria provided', async () => {
    const result = await searchNotesUseCase.execute({ searchText: '', tagIds: [] });
    
    expect(result).toHaveLength(4);
  });
});