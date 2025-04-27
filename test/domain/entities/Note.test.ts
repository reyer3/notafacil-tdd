import { Note } from '@domain/entities/Note';

describe('Note Entity', () => {
  // Test de creación exitosa
  it('should create a note with valid data', () => {
    const note = new Note('Título de prueba', 'Contenido de prueba');
    
    expect(note.id).toBeDefined();
    expect(note.title).toBe('Título de prueba');
    expect(note.content).toBe('Contenido de prueba');
    expect(note.createdAt).toBeInstanceOf(Date);
    expect(note.updatedAt).toBeInstanceOf(Date);
    expect(note.tags).toEqual([]);
  });

  // Test de validación de título vacío
  it('should throw error when title is empty', () => {
    expect(() => {
      new Note('', 'Contenido de prueba');
    }).toThrow('El título de la nota no puede estar vacío');
  });

  // Test de validación de título demasiado largo
  it('should throw error when title exceeds maximum length', () => {
    const longTitle = 'a'.repeat(101); // 101 caracteres
    
    expect(() => {
      new Note(longTitle, 'Contenido de prueba');
    }).toThrow('El título de la nota no puede exceder los 100 caracteres');
  });

  // Test de validación de contenido demasiado largo
  it('should throw error when content exceeds maximum length', () => {
    const longContent = 'a'.repeat(10001); // 10001 caracteres
    
    expect(() => {
      new Note('Título válido', longContent);
    }).toThrow('El contenido de la nota no puede exceder los 10000 caracteres');
  });

  // Test de actualización de título
  it('should update title correctly', () => {
    const note = new Note('Título original', 'Contenido de prueba');
    const originalUpdatedAt = note.updatedAt;
    
    // Esperamos un momento para que la fecha sea diferente
    setTimeout(() => {
      note.updateTitle('Nuevo título');
      
      expect(note.title).toBe('Nuevo título');
      expect(note.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    }, 1);
  });

  // Test de actualización de contenido
  it('should update content correctly', () => {
    const note = new Note('Título de prueba', 'Contenido original');
    const originalUpdatedAt = note.updatedAt;
    
    // Esperamos un momento para que la fecha sea diferente
    setTimeout(() => {
      note.updateContent('Nuevo contenido');
      
      expect(note.content).toBe('Nuevo contenido');
      expect(note.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    }, 1);
  });

  // Test de adición de etiqueta
  it('should add tag correctly', () => {
    const note = new Note('Título de prueba', 'Contenido de prueba');
    
    note.addTag('tag-1');
    expect(note.tags).toContain('tag-1');
    expect(note.tags.length).toBe(1);
    
    // Verificar que no se añade un tag duplicado
    note.addTag('tag-1');
    expect(note.tags.length).toBe(1);
  });

  // Test de eliminación de etiqueta
  it('should remove tag correctly', () => {
    const note = new Note('Título de prueba', 'Contenido de prueba', undefined, undefined, undefined, ['tag-1', 'tag-2']);
    
    note.removeTag('tag-1');
    expect(note.tags).not.toContain('tag-1');
    expect(note.tags).toContain('tag-2');
    expect(note.tags.length).toBe(1);
  });

  // Test de serialización a JSON
  it('should serialize to JSON correctly', () => {
    const note = new Note('Título de prueba', 'Contenido de prueba', 'test-id', new Date('2025-01-01'), new Date('2025-01-02'), ['tag-1']);
    const json = note.toJSON();
    
    expect(json).toEqual({
      id: 'test-id',
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      tags: ['tag-1']
    });
  });
});