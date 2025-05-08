import '../module-alias';
import * as dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { DataSource, Repository } from 'typeorm';
import { initializeDatabase } from '@infrastructure/orm/config/database';
import { NoteModel } from '@infrastructure/orm/models/NoteModel';
import { TagModel } from '@infrastructure/orm/models/TagModel';
import { NoteRepositoryImpl } from '@infrastructure/orm/repositories/NoteRepositoryImpl';
import { TagRepositoryImpl } from '@infrastructure/orm/repositories/TagRepositoryImpl';
import { SearchNotesUseCase, SearchScope } from '@application/use-cases/notes/SearchNotesUseCase';
import { CreateNoteUseCase } from '@application/use-cases/notes/CreateNoteUseCase';
import { ExportNotesUseCase } from '@application/use-cases/notes/ExportNotesUseCase';
import { ImportNotesUseCase, ImportMode } from '@application/use-cases/notes/ImportNotesUseCase';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Instancia de Express
export const app = express();

// Variables para almacenar las instancias
let dataSource: DataSource;
let noteRepository: NoteRepositoryImpl;
let tagRepository: TagRepositoryImpl;
let searchNotesUseCase: SearchNotesUseCase;
let createNoteUseCase: CreateNoteUseCase;
let exportNotesUseCase: ExportNotesUseCase;
let importNotesUseCase: ImportNotesUseCase;

// Middlewares
app.use(express.json());

// Iniciar servidor
export const startServer = async (port = 0): Promise<number> => {
  try {
    // Inicializar la base de datos
    dataSource = await initializeDatabase();

    // Configurar repositorios
    const noteModelRepo: Repository<NoteModel> = dataSource.getRepository(NoteModel);
    const tagModelRepo: Repository<TagModel> = dataSource.getRepository(TagModel);
    noteRepository = new NoteRepositoryImpl(noteModelRepo);
    tagRepository = new TagRepositoryImpl(tagModelRepo);

    // Configurar casos de uso
    searchNotesUseCase = new SearchNotesUseCase(noteRepository);
    createNoteUseCase = new CreateNoteUseCase(noteRepository);
    exportNotesUseCase = new ExportNotesUseCase(noteRepository);
    importNotesUseCase = new ImportNotesUseCase(noteRepository);

    // Iniciar el servidor en un puerto disponible
    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        const actualPort = server.address()
            ? typeof server.address() === 'string'
                ? parseInt(server.address() as string)
                : (server.address() as any).port
            : port;

        console.log(`Servidor iniciado en http://localhost:${actualPort}`);
        resolve(actualPort);
      });

      // Manejar cierre del servidor
      process.on('SIGINT', async () => {
        await dataSource.destroy();
        server.close();
        console.log('Servidor detenido');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Middleware para manejar errores
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Error interno del servidor'
  });
};

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint para buscar notas
app.get('/api/notes', async (req, res, next) => {
  try {
    const searchText = req.query.search as string || '';
    const tagsParam = req.query.tags as string || '';
    const scopeParam = req.query.scope as string || 'title';

    // Convertir tags a array
    const tagIds = tagsParam ? tagsParam.split(',') : [];

    // Determinar el scope de búsqueda
    let searchScope = SearchScope.TITLE_ONLY;
    if (scopeParam === 'content') {
      searchScope = SearchScope.CONTENT_ONLY;
    } else if (scopeParam === 'both') {
      searchScope = SearchScope.BOTH;
    }

    // Ejecutar caso de uso
    const notes = await searchNotesUseCase.execute({
      searchText,
      tagIds,
      searchScope
    });

    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
});

// Endpoint para crear una nota
app.post('/api/notes', async (req, res, next) => {
  try {
    const { title, content, tagIds } = req.body;

    // Ejecutar caso de uso
    const newNote = await createNoteUseCase.execute({
      title,
      content,
      tagIds: tagIds || []
    });

    res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
});

// Endpoint para exportar notas
app.get('/api/notes/export', async (req, res, next) => {
  try {
    // Obtener IDs de notas de query params (opcional)
    const idsParam = req.query.ids as string;
    let noteIds: string[] | undefined = undefined;

    if (idsParam) {
      // Filtrar IDs vacíos que puedan resultar de comas consecutivas
      noteIds = idsParam.split(',').filter(id => id.trim() !== '');
    }

    // Ejecutar caso de uso para exportar
    const jsonData = await exportNotesUseCase.execute(noteIds);

    // Devolver los datos como JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(jsonData);
  } catch (error) {
    next(error);
  }
});

// Endpoint para importar notas
app.post('/api/notes/import', async (req, res, next) => {
  try {
    // Obtener datos JSON del cuerpo de la petición
    const { jsonData, mode } = req.body;

    if (!jsonData || typeof jsonData !== 'string') {
      throw new Error('Se requiere el campo jsonData con datos JSON válidos');
    }

    // Determinar el modo de importación
    const importMode: ImportMode = mode === 'UPDATE' ? 'UPDATE' : 'SKIP';

    // Ejecutar caso de uso para importar
    const result = await importNotesUseCase.execute(jsonData, importMode);

    // Devolver el resultado de la importación
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Registrar middleware de errores
app.use(errorHandler);

// Si se ejecuta directamente este archivo, iniciar el servidor
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  startServer(port).catch(err => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
  });
}