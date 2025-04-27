import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { TagModel } from './TagModel';

@Entity('note')
export class NoteModel {
  @PrimaryColumn()
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => TagModel)
  @JoinTable({
    name: 'note_tag',
    joinColumn: {
      name: 'note_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id'
    }
  })
  tags: TagModel[];
}