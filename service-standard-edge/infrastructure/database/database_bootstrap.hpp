#pragma once

#include <orm/databasemanager.hpp>

#include <memory>

namespace Infrastructure::Database {

/**
 * Creates the service database manager and verifies the default connection.
 * Throws std::exception-derived errors when configuration or connectivity fails.
 */
std::shared_ptr<Orm::DatabaseManager> create_database_manager();

/**
 * Registers and opens the configured connection for the calling thread.
 * TinyORM keeps connection configuration thread-local.
 */
void ensure_database_connection_for_current_thread();

}  // namespace Infrastructure::Database
