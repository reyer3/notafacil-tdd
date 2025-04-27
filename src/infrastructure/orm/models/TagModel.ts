import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tag')
export class TagModel {
  @PrimaryColumn()
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 7 })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}