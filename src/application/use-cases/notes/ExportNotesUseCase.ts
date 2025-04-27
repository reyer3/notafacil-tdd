// src/application/use-cases/notes/ExportNotesUseCase.ts
import { Note } from '@domain/entities/Note';
import { NoteRepository } from '@domain/repositories/NoteRepository';

export class ExportNotesUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(noteIds?: string[]): Promise<string> {
        // Si se proporcionaron IDs, filtrar las notas por ID
        let notes: Note[] = [];

        if (noteIds && noteIds.length > 0) {
            // Obtener todas las notas y filtrar por las IDs proporcionadas
            const allNotes = await this.noteRepository.findAll();
            notes = allNotes.filter(note => noteIds.includes(note.id));
        } else {
            // Si no se proporcionaron IDs, obtener todas las notas
            notes = await this.noteRepository.findAll();
        }

        // Convertir notas a formato JSON
        const notesData = notes.map(note => note.toJSON());

        // Devolver cadena JSON
        return JSON.stringify(notesData, null, 2);
    }
}