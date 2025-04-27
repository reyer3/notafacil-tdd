# Guía de Despliegue Manual para NotaFácil

Esta guía proporciona instrucciones para desplegar manualmente la aplicación NotaFácil en un servidor VPS.

## Requisitos previos

- Acceso SSH al servidor
- Node.js 20.x instalado
- PostgreSQL 15 instalado
- PM2 (Process Manager para Node.js) instalado globalmente
- Git instalado

## Pasos para el despliegue manual

### 1. Preparación del servidor

Si aún no has configurado el servidor, puedes utilizar el script de configuración:

```bash
# Clona el repositorio temporalmente para obtener el script
git clone https://github.com/tu-usuario/notafacil-tdd.git /tmp/notafacil
sudo bash /tmp/notafacil/scripts/server-setup.sh
```

### 2. Clonar el repositorio

```bash
# Accede al directorio de la aplicación
cd /opt/notafacil

# Clona el repositorio
git clone https://github.com/tu-usuario/notafacil-tdd.git .
```

### 3. Configurar el entorno

Crea un archivo `.env` en el directorio del proyecto:

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita el archivo con los valores correctos
nano .env
```

Contenido recomendado para el archivo `.env` en producción:

```
# Configuración de base de datos
# Full PostgreSQL Connection String
DATABASE_URL=postgresql://notafacil_db_user:TU_PASSWORD_SEGURA@localhost:5432/notafacil_prod?sslmode=require

# Production Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=notafacil_db_user
DB_PASSWORD=TU_PASSWORD_SEGURA
DB_NAME=notafacil_prod

# SSL Configuration
SSLMODE=require

# Puerto del servidor
PORT=3000

# Entorno
NODE_ENV=production
```

### 4. Instalar dependencias y compilar

```bash
# Instala las dependencias
npm ci

# Compila el código TypeScript
npm run build
```

### 5. Configurar la base de datos

Si aún no has creado la base de datos:

```bash
# Accede a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de PostgreSQL, ejecuta:
CREATE USER notafacil_db_user WITH PASSWORD 'TU_PASSWORD_SEGURA';
CREATE DATABASE notafacil_prod OWNER notafacil_db_user;
ALTER USER notafacil_db_user WITH SUPERUSER;
\q
```

### 6. Iniciar la aplicación con PM2

```bash
# Inicia la aplicación
pm2 start dist/infrastructure/server.js --name notafacil

# Configura PM2 para iniciar automáticamente
pm2 save
pm2 startup
```

### 7. Configurar Nginx como proxy inverso

Crea un archivo de configuración para Nginx:

```