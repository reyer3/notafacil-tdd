import { Repository } from 'typeorm';
import { Tag } from '@domain/entities/Tag';
import { TagRepository } from '@domain/repositories/TagRepository';
import { TagModel } from '../models/TagModel';

export class TagRepositoryImpl implements TagRepository {
  constructor(private readonly repository: Repository<TagModel>) {}

  async findById(id: string): Promise<Tag | null> {
    const tagModel = await this.repository.findOne({
      where: { id }
    });

    if (!tagModel) {
      return null;
    }

    return this.mapToDomain(tagModel);
  }

  async findAll(): Promise<Tag[]> {
    const tagModels = await this.repository.find();
    return tagModels.map(model => this.mapToDomain(model));
  }

  async findByName(name: string): Promise<Tag[]> {
    const tagModels = await this.repository.find({
      where: { name }
    });
    return tagModels.map(model => this.mapToDomain(model));
  }

  async create(tag: Tag): Promise<Tag> {
    const tagModel = this.mapToModel(tag);
    const savedModel = await this.repository.save(tagModel);
    return this.mapToDomain(savedModel);
  }

  async update(tag: Tag): Promise<Tag> {
    const tagModel = this.mapToModel(tag);
    
    // Verificar si la etiqueta existe
    const existingTag = await this.repository.findOne({
      where: { id: tag.id }
    });
    
    if (!existingTag) {
      throw new Error(`Etiqueta con ID ${tag.id} no encontrada`);
    }
    
    const updatedModel = await this.repository.save(tagModel);
    return this.mapToDomain(updatedModel);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private mapToDomain(tagModel: TagModel): Tag {
    return new Tag(
      tagModel.name,
      tagModel.color,
      tagModel.id,
      tagModel.createdAt
    );
  }

  private mapToModel(tag: Tag): TagModel {
    const tagModel = new TagModel();
    tagModel.id = tag.id;
    tagModel.name = tag.name;
    tagModel.color = tag.color;
    tagModel.createdAt = tag.createdAt;
    return tagModel;
  }
}