import express, { Request, Response, NextFunction } from 'express';
import { DataSource, Repository } from 'typeorm';
import { initializeDatabase } from '@infrastructure/orm/config/database';
import { NoteModel } from '@infrastructure/orm/models/NoteModel';
import { TagModel } from '@infrastructure/orm/models/TagModel';
import { NoteRepositoryImpl } from '@infrastructure/orm/repositories/NoteRepositoryImpl';
import { TagRepositoryImpl } from '@infrastructure/orm/repositories/TagRepositoryImpl';
import { SearchNotesUseCase, SearchScope } from '@application/use-cases/notes/SearchNotesUseCase';
import { CreateNoteUseCase } from '@application/use-cases/notes/CreateNoteUseCase';

// Instancia de Express
export const app = express();

// Variables para almacenar las instancias
let dataSource: DataSource;
let noteRepository: NoteRepositoryImpl;
let tagRepository: TagRepositoryImpl;
let searchNotesUseCase: SearchNotesUseCase;
let createNoteUseCase: CreateNoteUseCase;

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