import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';

export interface SearchNotesInput {
  searchText: string;
  tagIds: string[];
}

export class SearchNotesUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: SearchNotesInput): Promise<Note[]> {
    const { searchText, tagIds } = input;
    
    // Si no hay criterios de búsqueda, devolver todas las notas
    if (!searchText && tagIds.length === 0) {
      return this.noteRepository.findAll();
    }
    
    let results: Note[] = [];
    
    // Buscar por texto en título y contenido
    if (searchText) {
      // Primero buscamos por título que contenga el texto
      const notesByTitle = await this.noteRepository.findByTitle(searchText);
      
      // Luego buscamos todas y filtramos por contenido
      const allNotes = await this.noteRepository.findAll();
      const notesByContent = allNotes.filter(note => 
        note.content.toLowerCase().includes(searchText.toLowerCase())
      );
      
      // Combinamos los resultados eliminando duplicados
      const combinedNotes = [...notesByTitle];
      
      for (const note of notesByContent) {
        if (!combinedNotes.some(n => n.id === note.id)) {
          combinedNotes.push(note);
        }
      }
      
      results = combinedNotes;
    } else {
      // Si no hay texto de búsqueda, comenzamos con todas las notas
      results = await this.noteRepository.findAll();
    }
    
    // Filtrar por etiquetas si se especificaron
    if (tagIds.length > 0) {
      results = results.filter(note => 
        tagIds.some(tagId => note.tags.includes(tagId))
      );
    }
    
    return results;
  }
}