# Configuración de Secrets para GitHub Actions

Para que el flujo de CI/CD funcione correctamente, debes configurar los siguientes secrets en tu repositorio de GitHub:

## Secretos requeridos

1. **SSH_PRIVATE_KEY**: Clave SSH privada para conectar al servidor VPS.
2. **SSH_KNOWN_HOSTS**: Contenido del archivo known_hosts que incluye la huella digital del servidor.
3. **VPS_USER**: Nombre de usuario para conectarse al VPS (generalmente "node" si seguiste el script de configuración).
4. **VPS_HOST**: Dirección IP o nombre de dominio del VPS.

## Instrucciones paso a paso

### 1. Generar un par de claves SSH específico para despliegue

```bash
# Genera una clave SSH específica para el despliegue (sin passphrase)
ssh-keygen -t ed25519 -C "deploy-key-notafacil" -f ~/.ssh/notafacil_deploy_key -N ""
```

### 2. Agregar la clave pública al servidor

Copia la clave pública generada al servidor:

```bash
# Reemplaza USER y VPS_IP con tus valores
cat ~/.ssh/notafacil_deploy_key.pub | ssh USER@VPS_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Obtener el contenido para SSH_KNOWN_HOSTS

```bash
# Reemplaza VPS_IP con la dirección de tu servidor
ssh-keyscan -H VPS_IP >> ~/.ssh/known_hosts
cat ~/.ssh/known_hosts
```

### 4. Configurar los secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Navega a "Settings" > "Secrets and variables" > "Actions"
3. Haz clic en "New repository secret"
4. Agrega los siguientes secrets:

    - **SSH_PRIVATE_KEY**: El contenido completo del archivo `~/.ssh/notafacil_deploy_key`
    - **SSH_KNOWN_HOSTS**: El contenido relacionado con tu VPS del archivo `~/.ssh/known_hosts`
    - **VPS_USER**: El nombre de usuario en el VPS (como "node")
    - **VPS_HOST**: La dirección IP o nombre de dominio del VPS

### 5. Verificar los permisos en el servidor

Asegúrate de que el usuario en el VPS tiene permisos para escribir en el directorio `/opt/notafacil`:

```bash
# Reemplaza USER con el valor de VPS_USER
ssh USER@VPS_IP "sudo chown -R USER:USER /opt/notafacil"
```

## Solución de problemas

Si el despliegue falla, verifica:

1. Los logs de GitHub Actions para ver el error específico
2. Que los secretos estén correctamente configurados
3. Los permisos en el servidor
4. La conectividad SSH al servidor

Para probar la conexión SSH manualmente:

```bash
ssh -i ~/.ssh/notafacil_deploy_key VPS_USER@VPS_HOST
```