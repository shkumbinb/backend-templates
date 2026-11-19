# Backend Template

A starter backend for Wayland Platform services. Clone it, adjust `.env`, and you have a NestJS API connected to PostgreSQL through Prisma, with shared libraries for errors, querying, logging, email and file storage.

## Tech stack

| What | Used for |
|------|----------|
| [NestJS 11](https://nestjs.com/) | Backend framework (TypeScript), set up as a monorepo: apps in `apps/`, shared libraries in `libs/` |
| [PostgreSQL 17](https://www.postgresql.org/) | Database, run locally with Docker |
| [Prisma 7](https://www.prisma.io/) + [`@prisma/adapter-pg`](https://www.prisma.io/docs/orm/overview/databases/postgresql) | ORM: database schema, migrations and a type-safe client |
| [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration) | Loads settings from `.env` |
| [`class-validator`](https://github.com/typestack/class-validator) + [`class-transformer`](https://github.com/typestack/class-transformer) | Validates request bodies and query params |
| [`nestjs-pino`](https://github.com/iamolegga/nestjs-pino) | Structured logging |
| [`nodemailer`](https://nodemailer.com/) | Sending email over SMTP |
| [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/) | File storage in S3 |
| Docker Compose | Starts the local Postgres container |
| Jest, ESLint, Prettier | Tests, linting and formatting |

## Project structure

```
backend-template/
├── apps/
│   └── user-management/                # the Nest app
│       ├── prisma/
│       │   ├── schema.prisma           # database models
│       │   └── migrations/             # generated SQL migrations
│       ├── prisma.config.ts            # where the schema/migrations are; reads DATABASE_URL
│       ├── src/
│       │   ├── main.ts                 # app entry point
│       │   ├── user-management.module.ts
│       │   ├── prisma/                 # PrismaService + PrismaModule (global)
│       │   └── users/                  # example CRUD resource
│       └── test/                       # e2e tests
├── libs/                               # shared libraries, imported as @wayland/<name>
│   ├── error/                          # global error handling
│   ├── query/                          # pagination + filter helpers
│   ├── logger/                         # structured logging
│   ├── email/                          # sending email
│   └── storage/                        # S3 file storage
├── docker-compose.yml                  # local Postgres
├── .env.example                        # template for .env
└── nest-cli.json
```

## Requirements

- [Node.js](https://nodejs.org/) 20.19 or newer (tested with Node 24)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac, Windows) or Docker Engine with the Compose plugin (Linux)

## Getting started

1. **Install dependencies.** This also generates the Prisma client.

   ```bash
   npm install
   ```

2. **Create your `.env`** from the example and adjust the values if needed.

   ```bash
   cp .env.example .env          # Windows PowerShell: copy .env.example .env
   ```

3. **Start Docker Desktop**, then start Postgres and create the tables:

   ```bash
   npm run setup
   ```

   This runs `docker compose up -d --wait` and then the Prisma migrations.

4. **Start the app** in watch mode:

   ```bash
   npm run start:dev
   ```

   The logs should show `Database connected`. Open [http://localhost:3000/users](http://localhost:3000/users) and you should get `[]`.

Next time you only need `npm run db:up` (if the database isn't running) and `npm run start:dev`.

## Environment variables

All settings live in `.env` (ignored by git). `.env.example` is the committed template, with placeholder values only.

**App and database**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the API listens on | `3000` |
| `POSTGRES_USER` | Postgres user created in the Docker container | `postgres` |
| `POSTGRES_PASSWORD` | Password for that user | `postgres` |
| `POSTGRES_DB` | Database created in the container | `user_management` |
| `POSTGRES_PORT` | Port on your machine that maps to the container | `5440` |
| `DATABASE_URL` | Connection string used by Prisma and the app | `postgresql://postgres:postgres@localhost:5440/user_management?schema=public` |

`DATABASE_URL` must match the `POSTGRES_*` values. Its format is `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`. To use a Postgres that is not in Docker, point `DATABASE_URL` at it and skip `npm run db:up`.

**Logger** (`@wayland/logger`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` gives readable logs; anything else gives JSON for log collectors | — |
| `LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error` or `fatal` | `info` |

**Email** (`@wayland/email`, needed only by apps that import `EmailModule`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server | yes |
| `SMTP_PORT` | `465` uses TLS directly; other ports (e.g. `587`) upgrade with STARTTLS | yes |
| `SMTP_FROM` | Sender, e.g. `"Wayland <no-reply@example.com>"` | yes |
| `SMTP_USER`, `SMTP_PASS` | Login; leave empty for servers without auth | no |

**Storage** (`@wayland/storage`, needed only by apps that import `StorageModule`)

| Variable | Description | Required |
|----------|-------------|----------|
| `S3_BUCKET` | Bucket name | yes |
| `AWS_REGION` | Bucket region, e.g. `eu-north-1` | yes |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Leave empty to use the AWS default credentials (e.g. an IAM role in production) | no |
| `S3_ENDPOINT` | Custom endpoint for MinIO/LocalStack, e.g. `http://localhost:9000` | no |

A missing required variable stops the app at startup with an error naming the variable.

## Shared libraries

Everything that more than one app needs lives in `libs/` and is imported as `@wayland/<name>`. Every library has the same small structure:

```
libs/<name>/src/
├── index.ts            # public exports only: import from '@wayland/<name>', never from inner files
├── <name>.module.ts    # Nest module
├── <name>.config.ts    # reads and checks env vars
├── <name>.service.ts   # the API apps use
└── *.spec.ts           # tests
```

| Library | What it gives you | How to use it in an app |
|---------|-------------------|-------------------------|
| `@wayland/error` | Same JSON response for every error | `ErrorModule` in the root module (done in `user-management`) |
| `@wayland/query` | Pagination, filter helpers, query param transforms | Import the helpers where needed (no module) |
| `@wayland/logger` | Structured logs with request IDs | `LoggerModule` in the root module + 2 lines in `main.ts` (done in `user-management`) |
| `@wayland/email` | `EmailService.send()` | `EmailModule` in the feature module that sends email |
| `@wayland/storage` | Upload, delete and pre-signed URLs for S3 | `StorageModule` in the feature module that stores files |

### Errors (`@wayland/error`)

A global filter catches every error thrown anywhere (controllers, services, Prisma, unexpected crashes) and returns the same shape:

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "User not found",
  "details": {},
  "path": "/users/6f1c2c1e-7a4c-4a8e-9a43-0c2f4b9e1a11",
  "timestamp": "2026-11-17T17:32:53.075Z"
}
```

- `error` is a machine-readable code the frontend can rely on. `message` is safe to show to users.
- `details` is only present when there is extra information, e.g. the list of validation problems.

**What gets mapped to what**

| Thrown | Response |
|--------|----------|
| `AppException` | Its own status, `code`, message and details |
| Nest exceptions (`NotFoundException`, `BadRequestException`, ...) | Their status; `error` is the status name, e.g. `NOT_FOUND` |
| Validation errors (from the `ValidationPipe`) | `400 VALIDATION_FAILED`, with one entry per problem in `details` |
| Prisma `P2002` (unique field already used) | `409 CONFLICT` |
| Prisma `P2025` (record not found, e.g. update/delete of a missing id) | `404 NOT_FOUND` |
| Prisma `P2003`, `P2014` (foreign key / relation problem) | `409 CONFLICT` |
| Prisma `P2000`, `P2006`, `P2007`, `P2023` (invalid or too long value) | `400 BAD_REQUEST` |
| Anything else | `500 INTERNAL_SERVER_ERROR` with message `Internal server error` |

Unknown errors never leak details to the client: the real error and stack trace go to the logs only. 4xx errors are logged as warnings, 5xx as errors.

**Throwing your own errors** — one class for everything, no new class per case:

```ts
import { HttpStatus } from '@nestjs/common';
import { AppException } from '@wayland/error';

throw new AppException(HttpStatus.NOT_FOUND, 'User not found');
// → { "statusCode": 404, "error": "NOT_FOUND", "message": "User not found", ... }

throw new AppException(HttpStatus.FORBIDDEN, 'Only admins can do this', {
  code: 'ADMIN_ONLY',          // optional custom code, defaults to the status name
  details: { role: 'member' }, // optional extra data for the client
});
```

### Validation

A global `ValidationPipe` (registered in `user-management.module.ts`) checks every request body and query against its DTO:

- `transform: true` converts query strings to the DTO's types (numbers, arrays, booleans) and applies default values.
- `whitelist: true` + `forbidNonWhitelisted: true`: fields that are not declared in the DTO are rejected with a 400 instead of silently ignored, so a typo like `?stauts=` is caught.

### Querying lists (`@wayland/query`)

Filters are written as plain, typed Prisma `where` objects, so field names autocomplete and typos fail at compile time. The library only provides the parts that would otherwise be repeated in every service.

| Export                   | What it does |
|--------------------------|----------------------------------------------------------------------------------------------------|
| `PaginationQueryDto`     | Base class for query DTOs: `page` (optional) and `limit` (default 20, max 100)                     |
| `paginate(query, fetch)` | Runs the query with `skip`/`take` and returns `{ data, meta: { total, page, limit, totalPages } }` |
| `inList(values)`         | `{ in: [...] }` for list filters like `?status=ACTIVE,PENDING`                                     |
| `contains(value)`        | Case-insensitive partial text match                                                                |
| `searchIn(term, fields)` | Searches one term across several fields; use it on `OR`                                            |
| `@ToArray()`             | Turns `?status=A,B` or `?status=A&status=B` into `['A', 'B']`                                      |
| `@ToBoolean()`           | Turns `?active=true` into `true`; combine with `@IsBoolean()` so values like `yes` are rejected    |

Every helper returns `undefined` when the client didn't send that param, and Prisma ignores `undefined` fields, so no `if` checks are needed.

**Adding a filter means one line in the DTO and one line in the service:**

```ts
// dto/query-user.dto.ts — what the API accepts
export class QueryUserDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @ToArray() @IsEmail({}, { each: true }) email?: string[];
}
```

```ts
// users.service.ts — how it filters
async findAll(query: QueryUserDto) {
  const where: Prisma.UserWhereInput = {
    email: inList(query.email),
    name: contains(query.name),
    OR: searchIn(query.search, ['email', 'name']),
  };

  // No `page` → the full list
  if (query.page === undefined) {
    return this.prisma.user.findMany({ where });
  }

  // With `page` → paginated response
  return paginate(query, ({ skip, take }) =>
    this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take }),
      this.prisma.user.count({ where }),
    ]),
  );
}
```

Without `page` the endpoint returns a plain array, with `page` it returns `{ data, meta }`. Keep in mind that the full list has no size limit.

### Logging (`@wayland/logger`)

- Every request gets an ID: an incoming `x-request-id` header is reused (so one request can be followed across services), otherwise one is generated. It is sent back in the response's `x-request-id` header and added to every log line of that request.
- `authorization` headers and cookies are logged as `[redacted]`. Request bodies are not logged.
- Each request produces one `request completed` line with status code and response time.
- Nest's built-in `Logger` goes through pino too, so existing `new Logger(...)` calls (e.g. in `PrismaService` and the error filter) need no changes.

To add it to a new app:

```ts
// app.module.ts
imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, ...]

// main.ts
import { Logger } from '@wayland/logger';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

### Email (`@wayland/email`)

```ts
// users.module.ts
imports: [EmailModule]

// users.service.ts
constructor(private readonly email: EmailService) {}

await this.email.send({
  to: 'ann@example.com',
  subject: 'Welcome',
  html: '<p>Hello Ann</p>', // `text`, `html` or both
});
```

- Only the message ID is logged, never recipients or content (personal data).
- `await this.email.verify()` checks the SMTP connection and login without sending anything, e.g. for a health check.

### File storage (`@wayland/storage`)

```ts
// files.module.ts
imports: [StorageModule]

// files.service.ts
constructor(private readonly storage: StorageService) {}

await this.storage.upload('avatars/1.png', buffer, 'image/png');      // small files through the API
const url = await this.storage.getDownloadUrl('avatars/1.png');        // temporary GET link
const uploadUrl = await this.storage.getUploadUrl('videos/1.mp4', 'video/mp4'); // temporary PUT link
await this.storage.delete('avatars/1.png');
```

- Pre-signed URLs expire after 15 minutes by default; pass the seconds as the last argument to change it.
- For large files, give the browser a `getUploadUrl` link and let it `PUT` the file straight to S3 with the same `Content-Type`. The file never passes through your API.

### Adding a new library

Generate it with the official Nest library generator, so `nest-cli.json`, `tsconfig.json` and the Jest config are updated for you:

```bash
npx nest g library <name>        # answer the prefix prompt with @wayland
```

The prompt needs an interactive terminal. In scripts, run the same generator directly:

```bash
node node_modules/@angular-devkit/schematics-cli/bin/schematics.js @nestjs/schematics:library --name=<name> --prefix=@wayland --no-dry-run
```

Then follow the same file structure as the other libraries and delete the generated placeholder service.

## Users API (example resource)

`apps/user-management/src/users` is a full CRUD example using all of the above. A user is returned as:

```json
{ "id": "uuid", "email": "ann@example.com", "name": "Ann", "createdAt": "...", "updatedAt": "..." }
```

Only the columns listed in `userSelect` (`entities/user.entity.ts`) are returned, so a new sensitive column stays hidden unless you add it there.

| Endpoint | Accepts | Returns |
|----------|---------|---------|
| `POST /users`       | Body: `email` (required, trimmed and lowercased), `name` (optional, 1–100 chars) | `201` + user |
| `GET /users`        | Query: `search`, `name`, `email`, `sortBy` (`createdAt`/`email`/`name`), `sortOrder` (`asc`/`desc`), `page`, `limit` | `200` + array, or `{ data, meta }` when `page` is sent |
| `GET /users/:id`    | `id` must be a UUID | `200` + user |
| `PATCH /users/:id`  | Same fields as create, all optional | `200` + updated user |
| `DELETE /users/:id` | `id` must be a UUID | `204` (no body) |

Examples:

```
GET /users?search=ann&sortBy=email&sortOrder=asc
GET /users?email=a@x.io,b@x.io
GET /users?page=2&limit=10
```

## Working with the database

Models are defined in `apps/user-management/prisma/schema.prisma`. After changing it, create and apply a migration:

```bash
npm run prisma:migrate -- --name describe_your_change
```

This also regenerates the Prisma client, so the new types are available right away. Import models and types from `@prisma/client`, and inject `PrismaService` anywhere (it's global):

```ts
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

constructor(private readonly prisma: PrismaService) {}
```

To browse and edit data in the browser, run `npm run prisma:studio`.

## Scripts

| Command                 | What it does                                                           |
|-------------------------|------------------------------------------------------------------------|
| `npm run setup`         | Start Postgres and apply migrations (first-time setup)                 |
| `npm run start:dev`     | Run the app with auto-restart on changes                               |
| `npm run start:debug`   | Same, with the Node debugger attached                                  |
| `npm run build`         | Compile to `dist/` (webpack bundles the app and the libraries it uses) |
| `npm run start:prod`    | Run the compiled app                                                   |
| `npm run db:up`         | Start the Postgres container                                           |
| `npm run db:down`       | Stop the Postgres container (data is kept)                             |
| `npm run prisma:migrate`| Create and apply a migration (development)                             |
| `npm run prisma:deploy` | Apply existing migrations (production/CI)                              |
| `npm run prisma:generate`| Regenerate the Prisma client                                          |
| `npm run prisma:studio` | Open Prisma Studio                                                     |
| `npm run lint`          | Lint and auto-fix                                                      |
| `npm run format`        | Format with Prettier                                                   |
| `npm test`              | Unit tests (apps and libraries)                                        |
| `npm run test:e2e`      | End-to-end tests                                                       |
| `npm run test:cov`      | Test coverage                                                          |

## Troubleshooting

- **App connects to the wrong database.** A `DATABASE_URL` set in your terminal overrides `.env`. Run `unset DATABASE_URL` or open a new terminal.
- **`Can't reach database server`.** Make sure Docker Desktop is running and `npm run db:up` succeeded. Check with `docker compose ps`.
- **Port already in use.** Change `POSTGRES_PORT` (and the port in `DATABASE_URL`) or `PORT` in `.env`.
- **Reset the local database completely.** `docker compose down -v` deletes the data volume, then run `npm run setup` again.
- **Logs are JSON instead of readable lines.** Set `NODE_ENV=development` in `.env`.
- **Jest fails with `Must use import to load ES Module`.** A package was installed in a version built for Nest 12. Keep every `@nestjs/*` package on Nest 11 by installing with a version, e.g. `npm i @nestjs/swagger@^11`, not just `npm i @nestjs/swagger`.
- **App stops at startup naming an env variable** (e.g. `SMTP_HOST`). An app imports a library whose required variable is missing in `.env`. See [Environment variables](#environment-variables).
