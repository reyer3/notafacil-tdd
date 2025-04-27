import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';
import { CreateNoteUseCase } from './CreateNoteUseCase';

// Mock del repositorio
class MockNoteRepository implements NoteRepository {
  private notes: Note[] = [];

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

describe('CreateNoteUseCase', () => {
  let mockRepository: NoteRepository;
  let createNoteUseCase: CreateNoteUseCase;
  
  beforeEach(() => {
    mockRepository = new MockNoteRepository();
    createNoteUseCase = new CreateNoteUseCase(mockRepository);
  });

  // Test de creación exitosa
  it('should create a note with valid data', async () => {
    const input = {
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      tagIds: ['tag1', 'tag2']
    };
    
    const result = await createNoteUseCase.execute(input);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe(input.title);
    expect(result.content).toBe(input.content);
    expect(result.tags).toEqual(input.tagIds);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    
    // Verificar que la nota fue guardada en el repositorio
    const allNotes = await mockRepository.findAll();
    expect(allNotes).toHaveLength(1);
    expect(allNotes[0].id).toBe(result.id);
  });

  // Test de creación sin etiquetas
  it('should create a note without tags', async () => {
    const input = {
      title: 'Título de prueba',
      content: 'Contenido de prueba'
    };
    
    const result = await createNoteUseCase.execute(input);
    
    expect(result.tags).toEqual([]);
  });

  // Test de validación de título vacío
  it('should throw error when title is empty', async () => {
    const input = {
      title: '',
      content: 'Contenido de prueba'
    };
    
    await expect(createNoteUseCase.execute(input)).rejects.toThrow('El título de la nota es obligatorio');
  });

  // Test de validación de título demasiado largo
  it('should throw error when title exceeds maximum length', async () => {
    const longTitle = 'a'.repeat(101); // 101 caracteres
    const input = {
      title: longTitle,
      content: 'Contenido de prueba'
    };
    
    await expect(createNoteUseCase.execute(input)).rejects.toThrow('El título de la nota no puede exceder los 100 caracteres');
  });

  // Test de validación de contenido demasiado largo
  it('should throw error when content exceeds maximum length', async () => {
    const longContent = 'a'.repeat(10001); // 10001 caracteres
    const input = {
      title: 'Título válido',
      content: longContent
    };
    
    await expect(createNoteUseCase.execute(input)).rejects.toThrow('El contenido de la nota no puede exceder los 10000 caracteres');
  });
});