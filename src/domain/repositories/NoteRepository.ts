import { Note } from '../entities/Note';

export interface NoteRepository {
  findById(id: string): Promise<Note | null>;
  findAll(): Promise<Note[]>;
  findByTitle(title: string): Promise<Note[]>;
  findByTag(tagId: string): Promise<Note[]>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
}