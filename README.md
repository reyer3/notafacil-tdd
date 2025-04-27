# NotaFácil TDD

Sistema de gestión de notas desarrollado con TypeScript, arquitectura hexagonal y TDD. Incluye implementación de ORM y principios SOLID.

## Descripción

NotaFácil es un sistema que permite a los usuarios crear, categorizar y gestionar notas personales, similar a Google Keep. El proyecto está desarrollado aplicando Test-Driven Development (TDD), siguiendo los principios SOLID, DRY y KISS, y utilizando una arquitectura hexagonal (también conocida como Ports and Adapters).

## Características principales

- Creación, edición y eliminación de notas
- Creación y gestión de etiquetas para categorizar notas
- Asignación de etiquetas a notas
- Búsqueda de notas por texto o etiquetas
- Ordenamiento de notas por diversos criterios
- Exportación e importación de notas

## Tecnologías utilizadas

- TypeScript
- Node.js y Express
- TypeORM (Mapeo Objeto-Relacional)
- Jest (Testing)
- Arquitectura Hexagonal
- PostgreSQL
- CI/CD con GitHub Actions

## Estructura del proyecto

El proyecto sigue una estructura basada en arquitectura hexagonal (también conocida como Ports and Adapters):

```
src/
├── domain/         # Entidades y reglas de negocio
├── application/    # Casos de uso y servicios de aplicación
└── infrastructure/ # Adaptadores, frameworks y drivers
```

## Despliegue y CI/CD

NotaFácil utiliza GitHub Actions para CI/CD, con un flujo automatizado que incluye:

1. **Tests**: Ejecuta pruebas unitarias y de integración
2. **Build**: Compila el código TypeScript
3. **Deploy**: Despliega la aplicación en el servidor VPS mediante SSH

### Requisitos para el despliegue

- Un servidor VPS con Ubuntu (recomendado 20.04 LTS o superior)
- PostgreSQL instalado en el servidor
- Node.js 20.x en el servidor
- PM2 para gestionar el proceso de la aplicación

### Preparación del servidor

Puedes utilizar el script `server-setup.sh` para preparar un nuevo servidor:

```bash
# Ejecutar como root o con sudo
sudo ./server-setup.sh
```

### Configuración de GitHub Actions

Para que el flujo de CI/CD funcione correctamente, debes configurar los siguientes secrets en tu repositorio de GitHub:

- `SSH_PRIVATE_KEY`: Clave SSH privada para conectar al servidor VPS
- `SSH_KNOWN_HOSTS`: Contenido del archivo known_hosts que incluye la huella digital del servidor
- `VPS_USER`: Nombre de usuario para conectarse al VPS
- `VPS_HOST`: Dirección IP o nombre de dominio del VPS

Consulta la documentación en `docs/github-secrets-setup.md` para instrucciones detalladas.

## Instalación para desarrollo

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/notafacil-tdd.git
cd notafacil-tdd
```

2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
# Edita el archivo .env con tus configuraciones
```

4. Ejecuta las pruebas:

```bash
npm test
```

5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Despliegue con Docker

También puedes ejecutar NotaFácil usando Docker:

```bash
# Construir y levantar los contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

## Ejecutar pruebas

```bash
# Todas las pruebas
npm test

# Pruebas con cobertura
npm run test:coverage

# Pruebas de un módulo específico
npm run test:kata        # Pruebas de repositorios
npm run test:infrastructure  # Pruebas de infraestructura
```

## Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu funcionalidad: `git checkout -b feature/mi-funcionalidad`
3. Haz commit de tus cambios: `git commit -am 'feat: agregar mi funcionalidad'`
4. Haz push a la rama: `git push origin feature/mi-funcionalidad`
5. Envía un pull request

## Licencia

Este proyecto está bajo la licencia MIT.