# Testing de Infraestructura para NotaFácil TDD

Este módulo contiene pruebas específicas para la capa de infraestructura del proyecto NotaFácil, que incluye la configuración de la base de datos, los modelos ORM y el servidor Express.

## Enfoque de Pruebas

Hemos seguido un enfoque metódico para probar la capa de infraestructura:

1. **Pruebas de Repositorios**: Verificando que los repositorios mapean correctamente entre entidades de dominio y modelos ORM.
2. **Pruebas de Configuración de Base de Datos**: Asegurando que la configuración de conexión funciona correctamente.
3. **Pruebas de API**: Validando que los endpoints del servidor Express funcionan como se espera.

## Migración a PostgreSQL

Como parte de las mejoras al proyecto, hemos migrado completamente a PostgreSQL:

- **Desarrollo**: Base de datos PostgreSQL completa para desarrollo local.
- **Pruebas**: Base de datos PostgreSQL dedicada para pruebas, que se limpia entre ejecuciones.
- **Producción**: Configuración optimizada para entorno de producción con migraciones en lugar de sincronización automática.

## Estructura de Pruebas

### 1. Pruebas de Repositorios
- `NoteRepositoryImpl.test.ts`: Pruebas para el repositorio de notas.
- `TagRepositoryImpl.test.ts`: Pruebas para el repositorio de etiquetas.

Estas pruebas validan:
- Operaciones CRUD: crear, leer, actualizar y eliminar.
- Búsquedas específicas: por título, etiqueta, etc.
- Mapeo correcto entre entidades y modelos.

### 2. Pruebas de Configuración de BD
- `database.test.ts`: Pruebas para la configuración y conexión a la base de datos.

Estas pruebas validan:
- Selección correcta de la configuración según el entorno.
- Inicialización y cierre de conexiones.
- Manejo de errores de conexión.

### 3. Pruebas de API
- `server.test.ts`: Pruebas para los endpoints de la API REST.

Estas pruebas validan:
- Respuestas correctas de los endpoints.
- Filtrado de notas basado en parámetros de consulta.
- Manejo de errores en las solicitudes.

## Técnicas de Mock Utilizadas

Para aislar los componentes durante las pruebas, utilizamos varias técnicas de mocking:

1. **Mocks Manuales**: Implementaciones simuladas de repositorios para pruebas unitarias.
2. **Jest Mocks**: Para módulos completos como TypeORM.
3. **Supertest**: Para probar endpoints HTTP sin necesidad de un servidor real.

## Cómo Ejecutar las Pruebas

Hemos configurado varios scripts de prueba en `package.json`:

```bash
# Pruebas de repositorios (Kata 1)
npm run test:kata

# Pruebas de configuración de base de datos
npm run test:db

# Pruebas del servidor Express
npm run test:server

# Todas las pruebas de infraestructura
npm run test:infrastructure

# Todas las pruebas con cobertura
npm run test:coverage
```

## Beneficios Obtenidos

1. **Mayor Confiabilidad**: Ahora podemos tener confianza en que la capa de infraestructura funciona correctamente.
2. **Mejor Diseño**: Las pruebas nos han llevado a mejorar el diseño, especialmente en la configuración de la base de datos.
3. **Documentación Viva**: Las pruebas sirven como documentación del comportamiento esperado.
4. **Mantenibilidad**: Los fallos se detectan temprano, facilitando la evolución y mantenimiento del código.

## Desafíos y Soluciones

1. **Aislamiento de Dependencias**: Usamos mocks para simular TypeORM y evitar dependencias externas.
2. **Pruebas de API**: Utilizamos Supertest para probar endpoints HTTP sin levantar un servidor real.
3. **Configuración para Diferentes Entornos**: Implementamos una función factory para seleccionar la configuración adecuada.
