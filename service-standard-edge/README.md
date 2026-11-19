# case-manager

Small Drogon + TinyORM backend service example for the WP-MVP project.

## Build

```sh
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DTINYORM_ROOT=/Users/gzimwayland/.local

cmake --build build --parallel
```

This produces two executables:

- `build/case-manager` — Drogon HTTP service
- `build/case-manager-tom` — project-specific TinyORM migration CLI

## Database configuration

Copy `.env.example` values into the shell or your local environment manager. The
application does not load `.env` automatically.

```sh
export CASE_MANAGER_DB_HOST=127.0.0.1
export CASE_MANAGER_DB_PORT=5432
export CASE_MANAGER_DB_NAME=case_manager
export CASE_MANAGER_DB_USER=case_manager
export CASE_MANAGER_DB_PASSWORD='your-local-password'
export CASE_MANAGER_DB_SCHEMA=public
```

## Migrations

Run these commands from the `case-manager` directory:

```sh
./build/case-manager-tom migrate:status
./build/case-manager-tom migrate
```

The migration classes are compiled into `case-manager-tom`:

1. `procedures` is created first.
2. `cases` is created with a foreign key to `procedures`.

Migration filenames use TinyORM's required format:
`YYYY_MM_DD_HHMMSS_description.hpp`.

## Run the service

```sh
export CASE_MANAGER_HOST=127.0.0.1
export CASE_MANAGER_PORT=8081
export CASE_MANAGER_WORKERS=1

./build/case-manager
```
