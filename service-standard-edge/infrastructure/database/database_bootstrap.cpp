#include "database_bootstrap.hpp"

#include <orm/configurations/configurationparser.hpp>
#include <orm/constants.hpp>
#include <orm/db.hpp>
#include <orm/utils/configuration.hpp>

#include <QString>
#include <QThread>

#include <stdexcept>

namespace Infrastructure::Database {
namespace {

constexpr auto k_connection_name = "case_manager";

QVariantHash g_connection_config;
bool g_database_manager_created = false;

QString connection_name_for_current_thread()
{
    return QStringLiteral("case_manager_%1")
        .arg(reinterpret_cast<quintptr>(QThread::currentThreadId()), 0, 16);
}

QString environment_or(const char *name, const QString &fallback)
{
    return qEnvironmentVariableIsSet(name)
        ? qEnvironmentVariable(name)
        : fallback;
}

int positive_integer_environment_or(const char *name, int fallback)
{
    bool ok = false;
    const auto value = environment_or(name, QString::number(fallback)).toInt(&ok);
    return ok && value > 0 ? value : fallback;
}

}  // namespace

std::shared_ptr<Orm::DatabaseManager> create_database_manager()
{
    using namespace Orm::Constants;

    const auto host = environment_or("CASE_MANAGER_DB_HOST", H127001);
    const auto port = positive_integer_environment_or("CASE_MANAGER_DB_PORT", 5432);
    const auto database = environment_or("CASE_MANAGER_DB_NAME", QStringLiteral("case_manager"));
    const auto username = environment_or("CASE_MANAGER_DB_USER", QStringLiteral("case_manager"));
    const auto password = environment_or("CASE_MANAGER_DB_PASSWORD", {});
    const auto schema = environment_or("CASE_MANAGER_DB_SCHEMA", PUBLIC);

    g_connection_config = QVariantHash{
            {driver_, QPSQL},
            {application_name, QStringLiteral("case-manager")},
            {host_, host},
            {port_, port},
            {database_, database},
            {username_, username},
            {password_, password},
            {search_path, schema},
            {timezone_, UTC},
            {prefix_, QString()},
            {prefix_indexes, false},
            {options_, Orm::Utils::Configuration::postgresSslOptions()},
        };

    auto database_manager = Orm::DB::create(
        g_connection_config,
        QString::fromUtf8(k_connection_name));

    Orm::DB::setDefaultConnection(QString::fromUtf8(k_connection_name));
    Orm::DB::connectEagerly(QString::fromUtf8(k_connection_name));

    const auto ping = Orm::DB::selectOne(
        QStringLiteral("SELECT 1"),
        {},
        QString::fromUtf8(k_connection_name));

    if (!ping.isValid()) {
        throw std::runtime_error("Database health check returned an invalid result");
    }

    g_database_manager_created = true;
    return database_manager;
}

void ensure_database_connection_for_current_thread()
{
    if (!g_database_manager_created) {
        throw std::runtime_error("Database manager has not been initialized");
    }

    const auto connection_name = connection_name_for_current_thread();
    if (!Orm::DB::containsConnection(connection_name)) {
        Orm::DB::addConnection(g_connection_config, connection_name);
    }

    Orm::DB::setDefaultConnection(connection_name);
    Orm::DB::connectEagerly(connection_name);
}

}  // namespace Infrastructure::Database
