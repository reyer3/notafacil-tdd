import { Repository } from 'typeorm';
import { Note } from '@domain/entities/Note';
import { NoteRepository } from '@domain/repositories/NoteRepository';
import { NoteModel } from '../models/NoteModel';
import { TagModel } from '../models/TagModel';

export class NoteRepositoryImpl implements NoteRepository {
  constructor(private readonly repository: Repository<NoteModel>) {}

  async findById(id: string): Promise<Note | null> {
    const noteModel = await this.repository.findOne({
      where: { id },
      relations: ['tags']
    });

    if (!noteModel) {
      return null;
    }

    return this.mapToDomain(noteModel);
  }

  async findAll(): Promise<Note[]> {
    const noteModels = await this.repository.find({ relations: ['tags'] });
    return noteModels.map(model => this.mapToDomain(model));
  }

  async findByTitle(title: string): Promise<Note[]> {
    const noteModels = await this.repository.find({
      where: { title: title },
      relations: ['tags']
    });
    return noteModels.map(model => this.mapToDomain(model));
  }

  async findByTag(tagId: string): Promise<Note[]> {
    const noteModels = await this.repository
      .createQueryBuilder('note')
      .innerJoinAndSelect('note.tags', 'tag', 'tag.id = :tagId', { tagId })
      .getMany();

    return noteModels.map(model => this.mapToDomain(model));
  }

  async create(note: Note): Promise<Note> {
    const noteModel = this.mapToModel(note);
    const savedModel = await this.repository.save(noteModel);
    return this.mapToDomain(savedModel);
  }

  async update(note: Note): Promise<Note> {
    const noteModel = this.mapToModel(note);
    
    // Verificar si la nota existe
    const existingNote = await this.repository.findOne({
      where: { id: note.id }
    });
    
    if (!existingNote) {
      throw new Error(`Nota con ID ${note.id} no encontrada`);
    }
    
    const updatedModel = await this.repository.save(noteModel);
    return this.mapToDomain(updatedModel);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private mapToDomain(noteModel: NoteModel): Note {
    return new Note(
      noteModel.title,
      noteModel.content,
      noteModel.id,
      noteModel.createdAt,
      noteModel.updatedAt,
      noteModel.tags ? noteModel.tags.map(tag => tag.id) : []
    );
  }

  private mapToModel(note: Note): NoteModel {
    const noteModel = new NoteModel();
    noteModel.id = note.id;
    noteModel.title = note.title;
    noteModel.content = note.content;
    noteModel.createdAt = note.createdAt;
    noteModel.updatedAt = note.updatedAt;
    
    // Las etiquetas se deben manejar separadamente debido a las relaciones
    // En un caso real, se cargarían las entidades completas de Tag
    noteModel.tags = note.tags.map(tagId => {
      const tagModel = new TagModel();
      tagModel.id = tagId;
      return tagModel;
    });

    return noteModel;
  }
}