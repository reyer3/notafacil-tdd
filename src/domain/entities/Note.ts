import { v4 as uuidv4 } from 'uuid';

export class Note {
  private _id: string;
  private _title: string;
  private _content: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _tags: string[] = [];

  constructor(
    title: string,
    content: string,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    tags?: string[]
  ) {
    this._id = id || uuidv4();
    this._title = title;
    this._content = content;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._tags = tags || [];

    this.validate();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get tags(): string[] {
    return [...this._tags]; // Devuelve una copia para evitar modificación externa
  }

  // Métodos para modificar la nota
  updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = new Date();
    this.validate();
  }

  updateContent(content: string): void {
    this._content = content;
    this._updatedAt = new Date();
    this.validate();
  }

  addTag(tagId: string): void {
    if (!this._tags.includes(tagId)) {
      this._tags.push(tagId);
      this._updatedAt = new Date();
    }
  }

  removeTag(tagId: string): void {
    this._tags = this._tags.filter(id => id !== tagId);
    this._updatedAt = new Date();
  }

  // Validación
  private validate(): void {
    if (this._title.trim().length === 0) {
      throw new Error('El título de la nota no puede estar vacío');
    }

    if (this._title.length > 100) {
      throw new Error('El título de la nota no puede exceder los 100 caracteres');
    }

    // El contenido puede estar vacío, pero si existe, limitamos su longitud
    if (this._content.length > 10000) {
      throw new Error('El contenido de la nota no puede exceder los 10000 caracteres');
    }
  }

  // Método para serializar a objeto plano
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      tags: [...this._tags]
    };
  }
}