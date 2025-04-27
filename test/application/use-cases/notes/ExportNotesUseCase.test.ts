// src/application/use-cases/notes/ExportNotesUseCase.test.ts
import { Note } from '../../../../src/domain/entities/Note';
import { NoteRepository } from '../../../../src/domain/repositories/NoteRepository';
import { ExportNotesUseCase } from '../../../../src/application/use-cases/notes/ExportNotesUseCase';

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

describe('ExportNotesUseCase', () => {
    let mockRepository: NoteRepository;
    let exportNotesUseCase: ExportNotesUseCase;
    let sampleNotes: Note[];

    beforeEach(() => {
        // Crear algunas notas de prueba
        sampleNotes = [
            new Note('Reunión de trabajo', 'Discutir proyecto X', '1', new Date('2025-01-01'), new Date('2025-01-01'), ['1', '2']),
            new Note('Lista de compras', 'Leche, pan, huevos', '2', new Date('2025-01-02'), new Date('2025-01-02'), ['3']),
            new Note('Ideas para proyecto', 'Implementar feature Y', '3', new Date('2025-01-03'), new Date('2025-01-03'), ['2', '4']),
        ];

        mockRepository = new MockNoteRepository(sampleNotes);
        exportNotesUseCase = new ExportNotesUseCase(mockRepository);
    });

    // Test para exportar todas las notas
    it('should export all notes to JSON format', async () => {
        const result = await exportNotesUseCase.execute();

        // Verificar que el resultado sea una cadena válida JSON
        expect(typeof result).toBe('string');

        // Intentar parsear el resultado como JSON
        const parsed = JSON.parse(result);

        // Verificar que el resultado contenga un array de notas
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(3);

        // Verificar que cada nota tenga las propiedades correctas
        parsed.forEach((note: any, index: number) => {
            expect(note).toHaveProperty('id');
            expect(note).toHaveProperty('title');
            expect(note).toHaveProperty('content');
            expect(note).toHaveProperty('createdAt');
            expect(note).toHaveProperty('updatedAt');
            expect(note).toHaveProperty('tags');

            // Verificar que los datos coincidan con las notas originales
            expect(note.id).toBe(sampleNotes[index].id);
            expect(note.title).toBe(sampleNotes[index].title);
            expect(note.content).toBe(sampleNotes[index].content);
            expect(note.tags).toEqual(sampleNotes[index].tags);
        });
    });

    // Test para exportar notas filtradas por ID
    it('should export only specified notes when noteIds are provided', async () => {
        const noteIds = ['1', '3']; // Solo exportar la primera y tercera nota

        const result = await exportNotesUseCase.execute(noteIds);

        // Verificar que el resultado sea una cadena válida JSON
        expect(typeof result).toBe('string');

        // Intentar parsear el resultado como JSON
        const parsed = JSON.parse(result);

        // Verificar que el resultado contenga solo las notas especificadas
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(2);

        // Verificar que las IDs correspondan a las solicitadas
        const exportedIds = parsed.map((note: any) => note.id);
        expect(exportedIds).toContain('1');
        expect(exportedIds).toContain('3');
        expect(exportedIds).not.toContain('2');
    });

    // Test para manejar el caso de no encontrar notas
    it('should return empty array JSON when no notes are found', async () => {
        // Crear un repositorio vacío
        mockRepository = new MockNoteRepository([]);
        exportNotesUseCase = new ExportNotesUseCase(mockRepository);

        const result = await exportNotesUseCase.execute();

        // Verificar que el resultado sea una cadena válida JSON
        expect(typeof result).toBe('string');

        // Intentar parsear el resultado como JSON
        const parsed = JSON.parse(result);

        // Verificar que el resultado sea un array vacío
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(0);
    });

    // Test para verificar el formato de fecha correcto en el JSON
    it('should format dates correctly in the exported JSON', async () => {
        const result = await exportNotesUseCase.execute();
        const parsed = JSON.parse(result);

        // Verificar que las fechas estén en formato ISO para ser compatibles con JSON
        expect(new Date(parsed[0].createdAt).toISOString()).toBe(sampleNotes[0].createdAt.toISOString());
        expect(new Date(parsed[0].updatedAt).toISOString()).toBe(sampleNotes[0].updatedAt.toISOString());
    });
});