import { v4 as uuidv4 } from 'uuid';

export class Tag {
  private _id: string;
  private _name: string;
  private _color: string;
  private _createdAt: Date;

  constructor(name: string, color: string = '#cccccc', id?: string, createdAt?: Date) {
    this._id = id || uuidv4();
    this._name = name;
    this._color = color;
    this._createdAt = createdAt || new Date();

    this.validate();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Setters
  updateName(name: string): void {
    this._name = name;
    this.validate();
  }

  updateColor(color: string): void {
    if (!this.isValidColor(color)) {
      throw new Error('El color debe ser un código hexadecimal válido (formato: #RRGGBB)');
    }
    this._color = color;
    this.validate();
  }

  // Validadores
  private validate(): void {
    if (this._name.trim().length === 0) {
      throw new Error('El nombre de la etiqueta no puede estar vacío');
    }

    if (this._name.length > 50) {
      throw new Error('El nombre de la etiqueta no puede exceder los 50 caracteres');
    }

    if (!this.isValidColor(this._color)) {
      throw new Error('El color debe ser un código hexadecimal válido (formato: #RRGGBB)');
    }
  }

  private isValidColor(color: string): boolean {
    // Verificar si es un código hexadecimal válido (#RRGGBB o #RGB)
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  }

  // Método para serializar a objeto plano
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      name: this._name,
      color: this._color,
      createdAt: this._createdAt
    };
  }
}