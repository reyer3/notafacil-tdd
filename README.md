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

## Tecnologías utilizadas

- TypeScript
- Node.js y Express
- TypeORM (Mapeo Objeto-Relacional)
- Jest (Testing)
- Arquitectura Hexagonal
- PostgreSQL

## Estructura del proyecto

El proyecto sigue una estructura basada en arquitectura hexagonal (también conocida como Ports and Adapters):

```
src/
├── domain/         # Entidades y reglas de negocio
├── application/    # Casos de uso y servicios de aplicación
└── infrastructure/ # Adaptadores, frameworks y drivers
```