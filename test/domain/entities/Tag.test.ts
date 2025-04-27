import { Tag } from '@domain/entities/Tag';

describe('Tag Entity', () => {
  // Test de creación exitosa
  it('should create a tag with valid data', () => {
    const tag = new Tag('Importante', '#ff0000');
    
    expect(tag.id).toBeDefined();
    expect(tag.name).toBe('Importante');
    expect(tag.color).toBe('#ff0000');
    expect(tag.createdAt).toBeInstanceOf(Date);
  });

  // Test de color por defecto
  it('should use default color when not provided', () => {
    const tag = new Tag('Importante');
    
    expect(tag.color).toBe('#cccccc');
  });

  // Test de validación de nombre vacío
  it('should throw error when name is empty', () => {
    expect(() => {
      new Tag('');
    }).toThrow('El nombre de la etiqueta no puede estar vacío');
  });

  // Test de validación de nombre demasiado largo
  it('should throw error when name exceeds maximum length', () => {
    const longName = 'a'.repeat(51); // 51 caracteres
    
    expect(() => {
      new Tag(longName);
    }).toThrow('El nombre de la etiqueta no puede exceder los 50 caracteres');
  });

  // Test de validación de color inválido
  it('should throw error when color format is invalid', () => {
    expect(() => {
      new Tag('Importante', 'red'); // No es un código hexadecimal
    }).toThrow('El color debe ser un código hexadecimal válido (formato: #RRGGBB)');
    
    expect(() => {
      new Tag('Importante', '#ff00'); // Código hexadecimal incompleto
    }).toThrow('El color debe ser un código hexadecimal válido (formato: #RRGGBB)');
  });

  // Test de validación de formato hexadecimal corto
  it('should accept short hexadecimal format (#RGB)', () => {
    const tag = new Tag('Importante', '#f00');
    
    expect(tag.color).toBe('#f00');
  });

  // Test de actualización de nombre
  it('should update name correctly', () => {
    const tag = new Tag('Nombre original', '#ff0000');
    
    tag.updateName('Nuevo nombre');
    
    expect(tag.name).toBe('Nuevo nombre');
  });

  // Test de actualización de color
  it('should update color correctly', () => {
    const tag = new Tag('Importante', '#ff0000');
    
    tag.updateColor('#00ff00');
    
    expect(tag.color).toBe('#00ff00');
  });

  // Test de error al actualizar con valores inválidos
  it('should throw error when updating with invalid values', () => {
    const tag = new Tag('Importante', '#ff0000');
    
    expect(() => {
      tag.updateName('');
    }).toThrow('El nombre de la etiqueta no puede estar vacío');
    
    expect(() => {
      tag.updateColor('invalid-color');
    }).toThrow('El color debe ser un código hexadecimal válido (formato: #RRGGBB)');
  });

  // Test de serialización a JSON
  it('should serialize to JSON correctly', () => {
    const createdAt = new Date('2025-01-01');
    const tag = new Tag('Importante', '#ff0000', 'test-id', createdAt);
    const json = tag.toJSON();
    
    expect(json).toEqual({
      id: 'test-id',
      name: 'Importante',
      color: '#ff0000',
      createdAt
    });
  });
});