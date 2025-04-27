import { Repository } from 'typeorm';
import { Note } from '@domain/entities/Note';
import { NoteModel } from '@infrastructure/orm/models/NoteModel';
import { NoteRepositoryImpl } from '@infrastructure/orm/repositories/NoteRepositoryImpl';

// Mock de Repository<NoteModel> de TypeORM
class MockRepository<T> {
  private items: any[] = [];

  async findOne(options: any): Promise<any> {
    const { where, relations } = options;
    const id = where.id;
    const item = this.items.find(item => item.id === id);
    
    if (!item) {
      return null;
    }
    
    // Si se solicitan relaciones, asegurarse de que estén incluidas
    if (relations && relations.includes('tags') && !item.tags) {
      item.tags = [];
    }
    
    return item;
  }

  async find(options?: any): Promise<any[]> {
    if (!options) {
      return [...this.items];
    }
    
    const { where, relations } = options;
    let filteredItems = [...this.items];
    
    // Aplicar filtros si existen
    if (where) {
      if (where.title) {
        filteredItems = filteredItems.filter(item => item.title.includes(where.title));
      }
    }
    
    // Asegurar que las relaciones estén incluidas
    if (relations && relations.includes('tags')) {
      filteredItems = filteredItems.map(item => ({
        ...item,
        tags: item.tags || []
      }));
    }
    
    return filteredItems;
  }

  async save(entity: any): Promise<any> {
    const existingItemIndex = this.items.findIndex(item => item.id === entity.id);
    
    if (existingItemIndex >= 0) {
      // Actualizar entidad existente
      this.items[existingItemIndex] = {
        ...entity,
        // Asegurar que no perdemos ninguna relación existente
        tags: entity.tags || this.items[existingItemIndex].tags || []
      };
      return this.items[existingItemIndex];
    } else {
      // Crear nueva entidad
      this.items.push({
        ...entity,
        tags: entity.tags || []
      });
      return entity;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex(item => item.id === id);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  // Métodos adicionales para pruebas
  createQueryBuilder(alias: string): any {
    return {
      innerJoinAndSelect: (property: string, alias: string, condition: string, parameters: any) => {
        return {
          getMany: async () => {
            // Filtrar notas que tengan la etiqueta especificada
            const tagId = parameters.tagId;
            return this.items.filter(item => 
              item.tags && item.tags.some((tag: any) => tag.id === tagId)
            );
          }
        };
      }
    };
  }

  // Método para poblar el mock con datos
  __setItems(items: any[]): void {
    this.items = items;
  }
}

describe('NoteRepositoryImpl', () => {
  let mockRepository: MockRepository<NoteModel>;
  let noteRepository: NoteRepositoryImpl;
  let testNotes: NoteModel[];
  
  beforeEach(() => {
    // Crear el mock del repositorio
    mockRepository = new MockRepository<NoteModel>();
    
    // Crear instancia del repositorio a probar
    noteRepository = new NoteRepositoryImpl(mockRepository as unknown as Repository<NoteModel>);
    
    // Datos de prueba
    testNotes = [
      {
        id: '1',
        title: 'Nota de prueba 1',
        content: 'Contenido de prueba 1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [
          { id: 'tag1', name: 'Importante', color: '#ff0000', createdAt: new Date() },
          { id: 'tag2', name: 'Trabajo', color: '#00ff00', createdAt: new Date() }
        ]
      },
      {
        id: '2',
        title: 'Nota de prueba 2',
        content: 'Contenido de prueba 2',
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
        tags: [
          { id: 'tag2', name: 'Trabajo', color: '#00ff00', createdAt: new Date() }
        ]
      },
      {
        id: '3',
        title: 'Recordatorio importante',
        content: 'No olvidar reunión',
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-03'),
        tags: []
      }
    ];
    
    // Poblar el repositorio mock con datos de prueba
    mockRepository.__setItems(testNotes);
  });
  
  describe('findById', () => {
    it('should return a note when given a valid id', async () => {
      const note = await noteRepository.findById('1');
      
      expect(note).not.toBeNull();
      expect(note?.id).toBe('1');
      expect(note?.title).toBe('Nota de prueba 1');
      expect(note?.content).toBe('Contenido de prueba 1');
      expect(note?.tags).toHaveLength(2);
      expect(note?.tags).toContain('tag1');
      expect(note?.tags).toContain('tag2');
    });
    
    it('should return null when given an invalid id', async () => {
      const note = await noteRepository.findById('999');
      
      expect(note).toBeNull();
    });
  });
  
  describe('findAll', () => {
    it('should return all notes', async () => {
      const notes = await noteRepository.findAll();
      
      expect(notes).toHaveLength(3);
      expect(notes[0].id).toBe('1');
      expect(notes[1].id).toBe('2');
      expect(notes[2].id).toBe('3');
    });
  });
  
  describe('findByTitle', () => {
    it('should return notes that contain the title', async () => {
      const notes = await noteRepository.findByTitle('prueba');
      
      expect(notes).toHaveLength(2);
      expect(notes[0].title).toBe('Nota de prueba 1');
      expect(notes[1].title).toBe('Nota de prueba 2');
    });
    
    it('should return empty array when no notes match the title', async () => {
      const notes = await noteRepository.findByTitle('inexistente');
      
      expect(notes).toHaveLength(0);
    });
  });
  
  describe('findByTag', () => {
    it('should return notes that have the specified tag', async () => {
      const notes = await noteRepository.findByTag('tag2');
      
      expect(notes).toHaveLength(2);
      expect(notes[0].id).toBe('1');
      expect(notes[1].id).toBe('2');
    });
    
    it('should return empty array when no notes have the tag', async () => {
      const notes = await noteRepository.findByTag('tag999');
      
      expect(notes).toHaveLength(0);
    });
  });
  
  describe('create', () => {
    it('should create a new note and return it', async () => {
      const newNote = new Note(
        'Nueva nota',
        'Contenido de la nueva nota',
        '4',
        new Date(),
        new Date(),
        ['tag1']
      );
      
      const createdNote = await noteRepository.create(newNote);
      
      expect(createdNote.id).toBe('4');
      expect(createdNote.title).toBe('Nueva nota');
      expect(createdNote.content).toBe('Contenido de la nueva nota');
      expect(createdNote.tags).toContain('tag1');
      
      // Verificar que la nota se agregó al repositorio
      const allNotes = await noteRepository.findAll();
      expect(allNotes).toHaveLength(4);
    });
  });
  
  describe('update', () => {
    it('should update an existing note and return it', async () => {
      // Primero obtener la nota
      const existingNote = (await noteRepository.findById('1')) as Note;
      
      // Modificar la nota
      existingNote.updateTitle('Título actualizado');
      existingNote.updateContent('Contenido actualizado');
      
      // Actualizar en el repositorio
      const updatedNote = await noteRepository.update(existingNote);
      
      expect(updatedNote.id).toBe('1');
      expect(updatedNote.title).toBe('Título actualizado');
      expect(updatedNote.content).toBe('Contenido actualizado');
      
      // Verificar que la nota se actualizó en el repositorio
      const retrievedNote = await noteRepository.findById('1');
      expect(retrievedNote?.title).toBe('Título actualizado');
    });
    
    it('should throw an error when updating a non-existent note', async () => {
      const nonExistentNote = new Note(
        'Nota inexistente',
        'Contenido de nota inexistente',
        '999',
        new Date(),
        new Date()
      );
      
      await expect(noteRepository.update(nonExistentNote)).rejects.toThrow('Nota con ID 999 no encontrada');
    });
  });
  
  describe('delete', () => {
    it('should delete an existing note', async () => {
      await noteRepository.delete('1');
      
      // Verificar que la nota ya no existe
      const deletedNote = await noteRepository.findById('1');
      expect(deletedNote).toBeNull();
      
      // Verificar que solo quedan 2 notas
      const allNotes = await noteRepository.findAll();
      expect(allNotes).toHaveLength(2);
    });
    
    it('should not throw an error when deleting a non-existent note', async () => {
      // No debería lanzar error al intentar eliminar una nota que no existe
      await expect(noteRepository.delete('999')).resolves.not.toThrow();
    });
  });
  
  describe('Mapping functions', () => {
    it('should correctly map domain entity to model', async () => {
      const domainNote = new Note(
        'Nota de dominio',
        'Contenido de dominio',
        '5',
        new Date('2025-01-05'),
        new Date('2025-01-05'),
        ['tag1', 'tag3']
      );
      
      await noteRepository.create(domainNote);
      
      // Buscar la nota creada en el repositorio mock
      const mockItem = await mockRepository.findOne({ where: { id: '5' } });
      
      // Verificar que los campos se mapearon correctamente
      expect(mockItem.id).toBe('5');
      expect(mockItem.title).toBe('Nota de dominio');
      expect(mockItem.content).toBe('Contenido de dominio');
      expect(mockItem.tags).toHaveLength(2);
      expect(mockItem.tags[0].id).toBe('tag1');
      expect(mockItem.tags[1].id).toBe('tag3');
    });
    
    it('should correctly map model to domain entity', async () => {
      const note = await noteRepository.findById('1');
      
      // Verificar que el mapeo de modelo a entidad fue correcto
      expect(note).toBeInstanceOf(Note);
      expect(note?.id).toBe('1');
      expect(note?.title).toBe('Nota de prueba 1');
      expect(note?.content).toBe('Contenido de prueba 1');
      expect(note?.createdAt).toBeInstanceOf(Date);
      expect(note?.updatedAt).toBeInstanceOf(Date);
      expect(note?.tags).toHaveLength(2);
      expect(note?.tags).toContain('tag1');
      expect(note?.tags).toContain('tag2');
    });
  });
});
