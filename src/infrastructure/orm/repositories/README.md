# Kata TDD: Testing de Repositorios ORM

## Descripción
Esta Kata TDD se enfoca en probar los repositorios ORM aislando la dependencia de TypeORM. El objetivo es garantizar que el mapeo entre las entidades del dominio y los modelos ORM funcione correctamente y que los métodos del repositorio realicen las operaciones esperadas.

## Enfoque

Seguimos los siguientes pasos de la kata:

1. **Crear mocks adecuados** para `Repository<Model>` de TypeORM
2. **Escribir pruebas** para cada método del repositorio (findById, findAll, create, update, delete)
3. **Verificar el mapeo correcto** entre entidades del dominio y modelos ORM

## Ciclo Red-Green-Refactor

El enfoque TDD (Test Driven Development) se basa en el ciclo Red-Green-Refactor:

1. **Red**: Escribir una prueba que falle
2. **Green**: Implementar el código mínimo para que la prueba pase
3. **Refactor**: Mejorar el código manteniendo la prueba en verde

## Patrones y técnicas utilizados

### Mocking
Creamos una clase `MockRepository<T>` que simula el comportamiento del `Repository<T>` de TypeORM, lo que nos permite probar los repositorios sin necesidad de una conexión real a la base de datos.

### Fixtures
Utilizamos datos de prueba estáticos (fixtures) para poblar el repositorio mock y así poder realizar diferentes escenarios de prueba.

### Test doubles
Implementamos los siguientes tipos de test doubles:
- **Stubs**: Para proporcionar respuestas predefinidas a llamadas
- **Mocks**: Para verificar interacciones específicas con dependencias

## Qué probamos

1. **Comportamiento funcional**:
   - Búsqueda por ID, título, etiqueta
   - Creación, actualización y eliminación de entidades
   - Búsqueda de todos los elementos

2. **Mapeo objeto-relacional**:
   - Conversión de modelos ORM a entidades de dominio
   - Conversión de entidades de dominio a modelos ORM

3. **Manejo de errores**:
   - Actualización de entidades inexistentes
   - Búsqueda de entidades inexistentes

## Beneficios

1. **Mayor confianza**: Las pruebas nos dan la confianza de que los repositorios funcionan como se espera.
2. **Detección temprana de errores**: Podemos detectar problemas en el mapeo entre entidades y modelos antes de probar con una base de datos real.
3. **Documentación viva**: Las pruebas sirven como documentación del comportamiento esperado de los repositorios.
4. **Guía de diseño**: El enfoque TDD nos ayuda a diseñar mejor los repositorios, centrándose en su interfaz y comportamiento esperado.

## Resultado

Hemos creado un conjunto completo de pruebas para `NoteRepositoryImpl` y `TagRepositoryImpl` que verifica que:

- Las operaciones CRUD funcionan correctamente
- El mapeo entre entidades del dominio y modelos ORM es correcto
- Los casos de error se manejan adecuadamente

Con estas pruebas, podemos estar seguros de que la capa de infraestructura funciona correctamente y se integra bien con la capa de dominio, siguiendo los principios de la arquitectura hexagonal.
