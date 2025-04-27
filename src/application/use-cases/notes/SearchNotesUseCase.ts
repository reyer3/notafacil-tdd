import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';

export enum SearchScope {
  TITLE_ONLY = 'title_only',
  CONTENT_ONLY = 'content_only',
  BOTH = 'both'
}

export interface SearchNotesInput {
  searchText: string;
  tagIds: string[];
  searchScope?: SearchScope;
}

export class SearchNotesUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: SearchNotesInput): Promise<Note[]> {
    const { searchText, tagIds, searchScope = SearchScope.TITLE_ONLY } = input;
    
    // Si no hay criterios de búsqueda, devolver todas las notas
    if (!searchText && tagIds.length === 0) {
      return this.noteRepository.findAll();
    }
    
    let results: Note[] = [];
    
    // Buscar por texto según el scope indicado
    if (searchText) {
      if (searchScope === SearchScope.TITLE_ONLY || searchScope === SearchScope.BOTH) {
        // Buscar por título
        results = await this.noteRepository.findByTitle(searchText);
      }
      
      if (searchScope === SearchScope.CONTENT_ONLY || searchScope === SearchScope.BOTH) {
        // Buscar por contenido
        const allNotes = await this.noteRepository.findAll();
        const notesByContent = allNotes.filter(note => 
          note.content.toLowerCase().includes(searchText.toLowerCase())
        );
        
        // Si estamos buscando solo en contenido, asignamos directamente
        if (searchScope === SearchScope.CONTENT_ONLY) {
          results = notesByContent;
        } else {
          // Si estamos buscando en ambos, combinamos eliminando duplicados
          for (const note of notesByContent) {
            if (!results.some(n => n.id === note.id)) {
              results.push(note);
            }
          }
        }
      }
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