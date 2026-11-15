# TaskFlow API Challenge

API REST para gestionar tareas. Hecha con NestJS y PostgreSQL.

## Requisitos

- Node 22+ y pnpm
- PostgreSQL
- [golang-migrate](https://github.com/golang-migrate/migrate) (`migrate`) o Docker

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Crear la base y configurar `.env`

Crear `.env` en la raíz (ajusta usuario y contraseña):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
PORT=3000
```

## 3. Aplicar migraciones

`migrate` no lee el `.env`, así que pasale la URL por variable:

```bash
# Linux / macOS
export DATABASE_URL="postgresql://user:password@localhost:5432/taskflow?sslmode=disable"
migrate -path database/migrations -database "$DATABASE_URL" up
```

```powershell
# Windows (PowerShell)
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/taskflow?sslmode=disable"
migrate -path database/migrations -database "$env:DATABASE_URL" up
```

Sin instalar `migrate`, con Docker:

```bash
docker run --rm --network host \
  -v "$(pwd)/database/migrations:/migrations" \
  migrate/migrate -path=/migrations -database "$DATABASE_URL" up
```

En Docker Desktop, reemplazá `localhost` por `host.docker.internal` y usá `-v "${PWD}/database/migrations:/migrations"` en PowerShell.

Revertir la última migración: cambiá `up` por `down 1`.

## 4. Correr la API

```bash
pnpm start:dev
```

| Recurso | URL                                   |
| ------- | ------------------------------------- |
| API     | `http://localhost:3000/api/v1`        |
| Swagger | `http://localhost:3000/api/v1/docs`   |
| Health  | `http://localhost:3000/api/v1/health` |

Para producción: `pnpm build && pnpm start:prod`.

## Endpoints

| Método | Ruta         | Qué hace                        |
| ------ | ------------ | ------------------------------- |
| POST   | `/tasks`     | Crear tarea                     |
| GET    | `/tasks`     | Listar con filtros y paginación |
| GET    | `/tasks/:id` | Obtener una tarea               |
| PATCH  | `/tasks/:id` | Actualizar parcialmente         |
| DELETE | `/tasks/:id` | Eliminar (`204`)                |

`GET /tasks` acepta `status` (`pending`, `in_progress`, `done`), `responsible`, `page` (default 1) y `limit` (1–100, default 10).

## Tests

```bash
pnpm test      # unitarios, sin base de datos
pnpm test:cov  # con cobertura
pnpm lint      # oxlint
```

## Estructura

```
src/tasks/           controller, service, repository, DTOs
src/database/        conexión a Postgres
database/migrations/ esquema SQL
```


## Uso de IA
Qué le pedí: el andamiaje (ConfigModule, pool, ValidationPipe), la migración, el CRUD con DTOs, pero lo trabajé por capas primero cree module, le pedi DTOS, repository, service y controller y revisando cada etapa si cumplia con las especificaciones, no en un solo prompt.

Pedi analisis de lo impl y que aspecto debian ser cubierto por los tests, Swagger y el README tambien.


## Decisiones
- NestJS + pg directo, sin ORM. Es una tabla y cinco queries; el SQL explícito pesa menos que una capa de abstracción. 
- Las migraciones son SQL versionado (golang-migrate, up/down), no parte del runtime.
- Repository separado del Service.
- Validación usando las ventajas de Nestjs, ValidationPipe global (whitelist, forbidNonWhitelisted, transform) y DTOs; el controller no valida nada. 
- PATCH exige al menos un campo (ValidateIf + IsDefined).

## Qué haría con más tiempo
- e2e reales
- CI con lint + tests + build.
- API key (X-API-Key)/Jwt