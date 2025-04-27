import express, { Request, Response, NextFunction } from 'express';
import { initializeDatabase } from './orm/config/database';
import { NoteModel } from './orm/models/NoteModel';
import { TagModel } from './orm/models/TagModel';
import { NoteRepositoryImpl } from './orm/repositories/NoteRepositoryImpl';
import { TagRepositoryImpl } from './orm/repositories/TagRepositoryImpl';
import { CreateNoteUseCase } from '../application/use-cases/notes/CreateNoteUseCase';
import { SearchNotesUseCase } from '../application/use-cases/notes/SearchNotesUseCase';

// Inicializar Express
const app = express();
app.use(express.json());

// Inicializar base de datos
let noteRepository: NoteRepositoryImpl;
let tagRepository: TagRepositoryImpl;

async function startServer() {
  try {
    // Conectar a la base de datos
    const dataSource = await initializeDatabase();
    
    // Crear repositorios
    noteRepository = new NoteRepositoryImpl(dataSource.getRepository(NoteModel));
    tagRepository = new TagRepositoryImpl(dataSource.getRepository(TagModel));

    // Definir puerto
    const port = process.env.PORT || 3000;
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor iniciado en puerto ${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Middleware para manejar errores
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Error interno del servidor'
  });
};

// Rutas de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas para notas
app.get('/api/notes', async (req, res, next) => {
  try {
    const searchText = req.query.search as string || '';
    const tagIds = req.query.tags ? (req.query.tags as string).split(',') : [];
    
    const searchUseCase = new SearchNotesUseCase(noteRepository);
    const notes = await searchUseCase.execute({ searchText, tagIds });
    
    res.json(notes.map(note => note.toJSON()));
  } catch (error) {
    next(error);
  }
});

app.post('/api/notes', async (req, res, next) => {
  try {
    const { title, content, tagIds } = req.body;
    
    const createUseCase = new CreateNoteUseCase(noteRepository);
    const note = await createUseCase.execute({ title, content, tagIds });
    
    res.status(201).json(note.toJSON());
  } catch (error) {
    next(error);
  }
});

// Aplicar middleware de errores
app.use(errorHandler);

// Iniciar servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };