import { Tag } from '../entities/Tag';

export interface TagRepository {
  findById(id: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  findByName(name: string): Promise<Tag[]>;
  create(tag: Tag): Promise<Tag>;
  update(tag: Tag): Promise<Tag>;
  delete(id: string): Promise<void>;
}