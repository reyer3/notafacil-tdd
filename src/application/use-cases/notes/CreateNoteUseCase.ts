import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';

export interface CreateNoteInput {
  title: string;
  content: string;
  tagIds?: string[];
}

export class CreateNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: CreateNoteInput): Promise<Note> {
    const { title, content, tagIds } = input;
    
    // Validaciones adicionales si son necesarias
    this.validateInput(input);
    
    // Crear la entidad Note
    const note = new Note(title, content, undefined, undefined, undefined, tagIds);
    
    // Persistir en el repositorio
    return this.noteRepository.create(note);
  }

  private validateInput(input: CreateNoteInput): void {
    const { title, content } = input;
    
    if (!title || title.trim().length === 0) {
      throw new Error('El título de la nota es obligatorio');
    }
    
    if (title.length > 100) {
      throw new Error('El título de la nota no puede exceder los 100 caracteres');
    }
    
    if (content && content.length > 10000) {
      throw new Error('El contenido de la nota no puede exceder los 10000 caracteres');
    }
  }
}