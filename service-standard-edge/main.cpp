#include <drogon/drogon.h>

#include "api/routes.hpp"
#include "infrastructure/database/database_bootstrap.hpp"
#include "features/cases/case_service.hpp"
#include "features/cases/case_controller.hpp"
#include "features/procedures/procedure_service.hpp"

#include <QCoreApplication>

#include <cstdlib>
#include <iostream>
#include <string>

namespace
{

    std::string environment_or(const char *name, std::string fallback)
    {
        if (const char *value = std::getenv(name); value != nullptr && *value != '\0')
        {
            return value;
        }

        return fallback;
    }

    unsigned int positive_integer_environment_or(const char *name, unsigned int fallback)
    {
        const auto value = environment_or(name, std::to_string(fallback));

        try
        {
            const auto parsed = std::stoul(value);
            return parsed > 0 ? static_cast<unsigned int>(parsed) : fallback;
        }
        catch (const std::exception &)
        {
            return fallback;
        }
    }

} // namespace

int main(int argc, char *argv[])
{
    QCoreApplication qt_application(argc, argv);

    try {
        const auto database_manager = Infrastructure::Database::create_database_manager();

        drogon::app().registerPreHandlingAdvice(
            [](const drogon::HttpRequestPtr &,
               drogon::AdviceCallback &&callback,
               drogon::AdviceChainCallback &&chain_callback) {
                try {
                    Infrastructure::Database::ensure_database_connection_for_current_thread();
                    chain_callback();
                }
                catch (const std::exception &exception) {
                    std::cerr << "database worker connection failed: "
                              << exception.what() << '\n';
                    Json::Value body;
                    body["error"]["code"] = "DATABASE_UNAVAILABLE";
                    body["error"]["message"] = "Database connection is unavailable";

                    auto response = drogon::HttpResponse::newHttpJsonResponse(body);
                    response->setStatusCode(drogon::k503ServiceUnavailable);
                    callback(response);
                }
            });

        ProcedureService procedure_service;
        ProceduresController procedures_controller(procedure_service);
        CaseService case_service;
        CasesController cases_controller(case_service);
        Api::register_routes(procedures_controller, cases_controller);

        const auto host = environment_or("CASE_MANAGER_HOST", "127.0.0.1");
        const auto port = positive_integer_environment_or("CASE_MANAGER_PORT", 8081);
        const auto worker_count = positive_integer_environment_or("CASE_MANAGER_WORKERS", 1);

        drogon::app()
            .setThreadNum(worker_count)
            .addListener(host, port)
            .registerBeginningAdvice([host, port, worker_count]
                                     { std::cout << "case-manager starting"
                                                 << " host=" << host
                                                 << " port=" << port
                                                 << " workers=" << worker_count
                                                 << " database=connected\n"; })
            .run();

        return 0;
    }
    catch (const std::exception &exception) {
        std::cerr << "case-manager failed to start: " << exception.what() << '\n';
        return EXIT_FAILURE;
    }
}
