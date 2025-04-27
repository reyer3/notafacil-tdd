import { Repository } from 'typeorm';
import { Tag } from '@domain/entities/Tag';
import { TagModel } from '@infrastructure/orm/models/TagModel';
import { TagRepositoryImpl } from '@infrastructure/orm/repositories/TagRepositoryImpl';

// Mock de Repository<TagModel> de TypeORM
class MockRepository<T> {
  private items: any[] = [];

  async findOne(options: any): Promise<any> {
    const { where } = options;
    const id = where.id;
    const item = this.items.find(item => item.id === id);
    
    if (!item) {
      return null;
    }
    
    return item;
  }

  async find(options?: any): Promise<any[]> {
    if (!options) {
      return [...this.items];
    }
    
    const { where } = options;
    let filteredItems = [...this.items];
    
    // Aplicar filtros si existen
    if (where) {
      if (where.name) {
        filteredItems = filteredItems.filter(item => item.name === where.name);
      }
    }
    
    return filteredItems;
  }

  async save(entity: any): Promise<any> {
    const existingItemIndex = this.items.findIndex(item => item.id === entity.id);
    
    if (existingItemIndex >= 0) {
      // Actualizar entidad existente
      this.items[existingItemIndex] = { ...entity };
      return this.items[existingItemIndex];
    } else {
      // Crear nueva entidad
      this.items.push({ ...entity });
      return entity;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex(item => item.id === id);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  // Método para poblar el mock con datos
  __setItems(items: any[]): void {
    this.items = items;
  }
}

describe('TagRepositoryImpl', () => {
  let mockRepository: MockRepository<TagModel>;
  let tagRepository: TagRepositoryImpl;
  let testTags: TagModel[];
  
  beforeEach(() => {
    // Crear el mock del repositorio
    mockRepository = new MockRepository<TagModel>();
    
    // Crear instancia del repositorio a probar
    tagRepository = new TagRepositoryImpl(mockRepository as unknown as Repository<TagModel>);
    
    // Datos de prueba
    testTags = [
      {
        id: 'tag1',
        name: 'Importante',
        color: '#ff0000',
        createdAt: new Date('2025-01-01')
      },
      {
        id: 'tag2',
        name: 'Trabajo',
        color: '#00ff00',
        createdAt: new Date('2025-01-02')
      },
      {
        id: 'tag3',
        name: 'Personal',
        color: '#0000ff',
        createdAt: new Date('2025-01-03')
      },
      {
        id: 'tag4',
        name: 'Importante', // Etiqueta con el mismo nombre
        color: '#ffff00',
        createdAt: new Date('2025-01-04')
      }
    ];
    
    // Poblar el repositorio mock con datos de prueba
    mockRepository.__setItems(testTags);
  });
  
  describe('findById', () => {
    it('should return a tag when given a valid id', async () => {
      const tag = await tagRepository.findById('tag1');
      
      expect(tag).not.toBeNull();
      expect(tag?.id).toBe('tag1');
      expect(tag?.name).toBe('Importante');
      expect(tag?.color).toBe('#ff0000');
      expect(tag?.createdAt).toEqual(new Date('2025-01-01'));
    });
    
    it('should return null when given an invalid id', async () => {
      const tag = await tagRepository.findById('tag999');
      
      expect(tag).toBeNull();
    });
  });
  
  describe('findAll', () => {
    it('should return all tags', async () => {
      const tags = await tagRepository.findAll();
      
      expect(tags).toHaveLength(4);
      expect(tags[0].id).toBe('tag1');
      expect(tags[1].id).toBe('tag2');
      expect(tags[2].id).toBe('tag3');
      expect(tags[3].id).toBe('tag4');
    });
  });
  
  describe('findByName', () => {
    it('should return tags that match the name', async () => {
      const tags = await tagRepository.findByName('Importante');
      
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe('Importante');
      expect(tags[1].name).toBe('Importante');
      expect(tags[0].id).toBe('tag1');
      expect(tags[1].id).toBe('tag4');
    });
    
    it('should return empty array when no tags match the name', async () => {
      const tags = await tagRepository.findByName('Inexistente');
      
      expect(tags).toHaveLength(0);
    });
  });
  
  describe('create', () => {
    it('should create a new tag and return it', async () => {
      const newTag = new Tag(
        'Nueva etiqueta',
        '#123456',
        'tag5',
        new Date('2025-01-05')
      );
      
      const createdTag = await tagRepository.create(newTag);
      
      expect(createdTag.id).toBe('tag5');
      expect(createdTag.name).toBe('Nueva etiqueta');
      expect(createdTag.color).toBe('#123456');
      expect(createdTag.createdAt).toEqual(new Date('2025-01-05'));
      
      // Verificar que la etiqueta se agregó al repositorio
      const allTags = await tagRepository.findAll();
      expect(allTags).toHaveLength(5);
    });
  });
  
  describe('update', () => {
    it('should update an existing tag and return it', async () => {
      // Primero obtener la etiqueta
      const existingTag = (await tagRepository.findById('tag1')) as Tag;
      
      // Modificar la etiqueta
      existingTag.updateName('Nombre actualizado');
      existingTag.updateColor('#999999');
      
      // Actualizar en el repositorio
      const updatedTag = await tagRepository.update(existingTag);
      
      expect(updatedTag.id).toBe('tag1');
      expect(updatedTag.name).toBe('Nombre actualizado');
      expect(updatedTag.color).toBe('#999999');
      
      // Verificar que la etiqueta se actualizó en el repositorio
      const retrievedTag = await tagRepository.findById('tag1');
      expect(retrievedTag?.name).toBe('Nombre actualizado');
      expect(retrievedTag?.color).toBe('#999999');
    });
    
    it('should throw an error when updating a non-existent tag', async () => {
      const nonExistentTag = new Tag(
        'Etiqueta inexistente',
        '#ffffff',
        'tag999',
        new Date()
      );
      
      await expect(tagRepository.update(nonExistentTag)).rejects.toThrow('Etiqueta con ID tag999 no encontrada');
    });
  });
  
  describe('delete', () => {
    it('should delete an existing tag', async () => {
      await tagRepository.delete('tag1');
      
      // Verificar que la etiqueta ya no existe
      const deletedTag = await tagRepository.findById('tag1');
      expect(deletedTag).toBeNull();
      
      // Verificar que solo quedan 3 etiquetas
      const allTags = await tagRepository.findAll();
      expect(allTags).toHaveLength(3);
    });
    
    it('should not throw an error when deleting a non-existent tag', async () => {
      // No debería lanzar error al intentar eliminar una etiqueta que no existe
      await expect(tagRepository.delete('tag999')).resolves.not.toThrow();
    });
  });
  
  describe('Mapping functions', () => {
    it('should correctly map domain entity to model', async () => {
      const domainTag = new Tag(
        'Etiqueta de dominio',
        '#abcdef',
        'tag6',
        new Date('2025-01-06')
      );
      
      await tagRepository.create(domainTag);
      
      // Buscar la etiqueta creada en el repositorio mock
      const mockItem = await mockRepository.findOne({ where: { id: 'tag6' } });
      
      // Verificar que los campos se mapearon correctamente
      expect(mockItem.id).toBe('tag6');
      expect(mockItem.name).toBe('Etiqueta de dominio');
      expect(mockItem.color).toBe('#abcdef');
      expect(mockItem.createdAt).toEqual(new Date('2025-01-06'));
    });
    
    it('should correctly map model to domain entity', async () => {
      const tag = await tagRepository.findById('tag1');
      
      // Verificar que el mapeo de modelo a entidad fue correcto
      expect(tag).toBeInstanceOf(Tag);
      expect(tag?.id).toBe('tag1');
      expect(tag?.name).toBe('Importante');
      expect(tag?.color).toBe('#ff0000');
      expect(tag?.createdAt).toBeInstanceOf(Date);
    });
  });
});
