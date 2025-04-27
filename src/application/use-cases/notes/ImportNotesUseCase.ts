// src/application/use-cases/notes/ImportNotesUseCase.ts
import { Note } from '@domain/entities/Note';
import { NoteRepository } from '@domain/repositories/NoteRepository';

export type ImportMode = 'SKIP' | 'UPDATE';

export interface ImportResult {
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
}

export class ImportNotesUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(jsonData: string, importMode: ImportMode = 'SKIP'): Promise<ImportResult> {
        // Inicializar contadores para el resultado
        const result: ImportResult = {
            importedCount: 0,
            updatedCount: 0,
            skippedCount: 0
        };

        // Validar y parsear el JSON
        let parsedData: any[];
        try {
            const parsed = JSON.parse(jsonData);

            // Verificar que el JSON parseado es un array
            if (!Array.isArray(parsed)) {
                throw new Error('Formato de datos inválido: se esperaba un array de notas');
            }

            parsedData = parsed;
        } catch (error) {
            throw new Error('JSON inválido: ' + (error as Error).message);
        }

        // Procesar cada nota en el JSON
        for (const noteData of parsedData) {
            try {
                // Verificar si la nota ya existe
                const existingNote = await this.noteRepository.findById(noteData.id);

                if (existingNote) {
                    // La nota ya existe
                    if (importMode === 'UPDATE') {
                        // Crear nueva instancia de Note para actualizar con todos los campos
                        // incluyendo las fechas exactas que vienen del JSON
                        const updatedNote = new Note(
                            noteData.title,
                            noteData.content,
                            noteData.id,
                            new Date(noteData.createdAt), // Preservar fecha de creación original
                            new Date(noteData.updatedAt), // Usar fecha de actualización del JSON
                            noteData.tags
                        );

                        // Guardar la nota actualizada
                        await this.noteRepository.update(updatedNote);
                        result.updatedCount++;
                    } else {
                        // Omitir la nota existente
                        result.skippedCount++;
                    }
                } else {
                    // Es una nota nueva, crear una instancia de Note
                    const newNote = new Note(
                        noteData.title,
                        noteData.content,
                        noteData.id,
                        new Date(noteData.createdAt),
                        new Date(noteData.updatedAt),
                        noteData.tags
                    );

                    // Guardar la nota
                    await this.noteRepository.create(newNote);
                    result.importedCount++;
                }
            } catch (error) {
                throw new Error('Datos de nota inválidos: ' + (error as Error).message);
            }
        }

        return result;
    }
}