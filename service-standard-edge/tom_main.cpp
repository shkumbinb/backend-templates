#include <orm/configurations/configurationparser.hpp>
#include <orm/db.hpp>
#include <orm/utils/configuration.hpp>

#include <tom/application.hpp>

#include "database/migrations/2026_11_10_150000_create_procedures_table.hpp"
#include "database/migrations/2026_11_10_150100_create_cases_table.hpp"

#include <cstdlib>
#include <filesystem>
#include <memory>

namespace
{

    std::shared_ptr<Orm::DatabaseManager> setup_database_manager()
    {
        using namespace Orm::Constants;

        return Orm::DB::create(
            {{QStringLiteral("case_manager"),
              {{driver_, QPSQL},
               {application_name, QStringLiteral("case-manager-tom")},
               {host_, qEnvironmentVariable("CASE_MANAGER_DB_HOST", H127001)},
               {port_, qEnvironmentVariable("CASE_MANAGER_DB_PORT", P5432)},
               {database_, qEnvironmentVariable("CASE_MANAGER_DB_NAME", QStringLiteral("case_manager"))},
               {username_, qEnvironmentVariable("CASE_MANAGER_DB_USER", postgres_)},
               {password_, qEnvironmentVariable("CASE_MANAGER_DB_PASSWORD", EMPTY)},
               {search_path, qEnvironmentVariable("CASE_MANAGER_DB_SCHEMA", PUBLIC)},
               {timezone_, UTC},
               {prefix_, EMPTY},
               {prefix_indexes, false},
               {options_, Orm::Utils::Configuration::postgresSslOptions()}}}},
            QStringLiteral("case_manager"));
    }

} // namespace

int main(int argc, char *argv[])
{
    try {
        auto database_manager = setup_database_manager();

        return Tom::Application(argc,
                                argv,
                                std::move(database_manager),
                                "CASE_MANAGER_ENV",
                                QStringLiteral("case_manager_migrations"))
            .migrationsPath(std::filesystem::current_path() / "database" / "migrations")
            .migrations<Migrations::CreateProceduresTable,
                        Migrations::CreateCasesTable>()
            .run();
    }
    catch (const std::exception &exception) {
        Tom::Application::logException(exception);
    }

    return EXIT_FAILURE;
}
