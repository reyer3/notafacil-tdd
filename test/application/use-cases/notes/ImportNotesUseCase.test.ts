// test/application/use-cases/notes/ImportNotesUseCase.test.ts
import { Note } from '@domain/entities/Note';
import { NoteRepository } from '@domain/repositories/NoteRepository';
import { ImportNotesUseCase } from '@application/use-cases/notes/ImportNotesUseCase';

// Mock del repositorio
class MockNoteRepository implements NoteRepository {
    private readonly notes: Note[] = [];

    constructor(notes: Note[] = []) {
        this.notes = notes;
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

describe('ImportNotesUseCase', () => {
    let mockRepository: MockNoteRepository;
    let importNotesUseCase: ImportNotesUseCase;

    beforeEach(() => {
        // Inicializar el repositorio con algunas notas existentes
        const existingNotes = [
            new Note('Nota existente 1', 'Contenido existente 1', 'existing-1', new Date('2025-01-01'), new Date('2025-01-01'), ['tag1']),
            new Note('Nota existente 2', 'Contenido existente 2', 'existing-2', new Date('2025-01-02'), new Date('2025-01-02'), ['tag2']),
        ];

        mockRepository = new MockNoteRepository(existingNotes);
        importNotesUseCase = new ImportNotesUseCase(mockRepository);
    });

    // Test para importar notas nuevas
    it('should import new notes from valid JSON', async () => {
        // JSON de notas a importar
        const notesJson = JSON.stringify([
            {
                id: 'import-1',
                title: 'Nota importada 1',
                content: 'Contenido importado 1',
                createdAt: '2025-02-01T00:00:00.000Z',
                updatedAt: '2025-02-01T00:00:00.000Z',
                tags: ['tag1', 'tag3']
            },
            {
                id: 'import-2',
                title: 'Nota importada 2',
                content: 'Contenido importado 2',
                createdAt: '2025-02-02T00:00:00.000Z',
                updatedAt: '2025-02-02T00:00:00.000Z',
                tags: ['tag2', 'tag4']
            }
        ]);

        // Ejecutar el caso de uso
        const result = await importNotesUseCase.execute(notesJson);

        // Verificar que se devolvió el número correcto de notas importadas
        expect(result.importedCount).toBe(2);
        expect(result.skippedCount).toBe(0);
        expect(result.updatedCount).toBe(0);

        // Verificar que las notas se agregaron al repositorio
        const allNotes = await mockRepository.findAll();
        expect(allNotes.length).toBe(4); // 2 existentes + 2 importadas

        // Verificar que las notas importadas existen en el repositorio
        const importedNote1 = await mockRepository.findById('import-1');
        const importedNote2 = await mockRepository.findById('import-2');

        expect(importedNote1).not.toBeNull();
        expect(importedNote2).not.toBeNull();
        expect(importedNote1?.title).toBe('Nota importada 1');
        expect(importedNote2?.title).toBe('Nota importada 2');
    });

    // Test para actualizar notas existentes
    it('should update existing notes when importMode is set to UPDATE', async () => {
        // JSON de notas a importar, incluyendo una con ID existente
        const notesJson = JSON.stringify([
            {
                id: 'existing-1', // Esta ID ya existe
                title: 'Nota actualizada',
                content: 'Contenido actualizado',
                createdAt: '2025-01-01T00:00:00.000Z', // Mantener la fecha de creación original
                updatedAt: '2025-02-05T00:00:00.000Z', // Nueva fecha de actualización
                tags: ['tag1', 'tag5']
            },
            {
                id: 'import-3', // Esta es una nota nueva
                title: 'Nota importada 3',
                content: 'Contenido importado 3',
                createdAt: '2025-02-03T00:00:00.000Z',
                updatedAt: '2025-02-03T00:00:00.000Z',
                tags: ['tag3']
            }
        ]);

        // Ejecutar el caso de uso con modo de actualización
        const result = await importNotesUseCase.execute(notesJson, 'UPDATE');

        // Verificar que se devolvió el número correcto de notas importadas/actualizadas
        expect(result.importedCount).toBe(1); // Una nota nueva
        expect(result.updatedCount).toBe(1); // Una nota actualizada
        expect(result.skippedCount).toBe(0);

        // Verificar que las notas se agregaron/actualizaron en el repositorio
        const allNotes = await mockRepository.findAll();
        expect(allNotes.length).toBe(3); // 2 existentes (1 actualizada) + 1 importada

        // Verificar que la nota existente se actualizó
        const updatedNote = await mockRepository.findById('existing-1');
        expect(updatedNote).not.toBeNull();
        expect(updatedNote?.title).toBe('Nota actualizada');
        expect(updatedNote?.content).toBe('Contenido actualizado');

        // La fecha de creación debe mantenerse
        expect(updatedNote?.createdAt.toISOString()).toBe('2025-01-01T00:00:00.000Z');

        // La fecha de actualización debe ser la nueva
        expect(updatedNote?.updatedAt.toISOString()).toBe('2025-02-05T00:00:00.000Z');

        // Las etiquetas deben actualizarse
        expect(updatedNote?.tags).toContain('tag1');
        expect(updatedNote?.tags).toContain('tag5');
    });

    // Test para omitir notas existentes en modo SKIP
    it('should skip existing notes when importMode is set to SKIP', async () => {
        // JSON de notas a importar, incluyendo una con ID existente
        const notesJson = JSON.stringify([
            {
                id: 'existing-1', // Esta ID ya existe
                title: 'No debería actualizarse',
                content: 'No debería actualizarse',
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-02-05T00:00:00.000Z',
                tags: ['tag1', 'tag5']
            },
            {
                id: 'import-3', // Esta es una nota nueva
                title: 'Nota importada 3',
                content: 'Contenido importado 3',
                createdAt: '2025-02-03T00:00:00.000Z',
                updatedAt: '2025-02-03T00:00:00.000Z',
                tags: ['tag3']
            }
        ]);

        // Ejecutar el caso de uso con modo de omisión
        const result = await importNotesUseCase.execute(notesJson, 'SKIP');

        // Verificar que se devolvió el número correcto de notas
        expect(result.importedCount).toBe(1); // Una nota nueva
        expect(result.updatedCount).toBe(0); // Ninguna actualización
        expect(result.skippedCount).toBe(1); // Una nota omitida

        // Verificar que solo se agregó la nota nueva
        const allNotes = await mockRepository.findAll();
        expect(allNotes.length).toBe(3); // 2 existentes + 1 importada

        // Verificar que la nota existente NO se actualizó
        const existingNote = await mockRepository.findById('existing-1');
        expect(existingNote?.title).toBe('Nota existente 1');
        expect(existingNote?.content).toBe('Contenido existente 1');
    });

    // Test para validar el formato JSON
    it('should throw error when JSON format is invalid', async () => {
        // JSON inválido (falta una llave de cierre)
        const invalidJson = '{"id": "invalid-1", "title": "Nota inválida"';

        // Verificar que se lanza un error
        await expect(importNotesUseCase.execute(invalidJson)).rejects.toThrow('JSON inválido');
    });

    // Test para validar los datos de las notas
    it('should throw error when note data is invalid', async () => {
        // JSON con datos inválidos (título vacío)
        const invalidDataJson = JSON.stringify([
            {
                id: 'invalid-data',
                title: '',
                content: 'Contenido',
                createdAt: '2025-02-01T00:00:00.000Z',
                updatedAt: '2025-02-01T00:00:00.000Z',
                tags: []
            }
        ]);

        // Verificar que se lanza un error
        await expect(importNotesUseCase.execute(invalidDataJson)).rejects.toThrow('Datos de nota inválidos');
    });

    // Test para validar estructura del JSON
    it('should throw error when JSON structure is not an array', async () => {
        // JSON con estructura inválida (objeto en lugar de array)
        const invalidStructureJson = JSON.stringify({
            note: {
                id: 'invalid-structure',
                title: 'Nota inválida',
                content: 'Contenido',
                createdAt: '2025-02-01T00:00:00.000Z',
                updatedAt: '2025-02-01T00:00:00.000Z',
                tags: []
            }
        });

        // Verificar que se lanza un error
        await expect(importNotesUseCase.execute(invalidStructureJson)).rejects.toThrow('Formato de datos inválido');
    });
});