#include "routes.hpp"

#include <drogon/drogon.h>

namespace Api {

void register_routes(
    ProceduresController &procedures_controller,
    CasesController &cases_controller)
{
    drogon::app().registerHandler(
        "/procedures",
        [&procedures_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            procedures_controller.all(request, std::move(callback));
        },
        {drogon::Get});

    drogon::app().registerHandler(
        "/procedures",
        [&procedures_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            procedures_controller.create(request, std::move(callback));
        },
        {drogon::Post});

    drogon::app().registerHandler(
        "/procedures/{1}",
        [&procedures_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback,
            const std::string &procedure_id) {
            procedures_controller.update(
                request, std::move(callback), procedure_id);
        },
        {drogon::Put});

    drogon::app().registerHandler(
        "/procedures/{1}",
        [&procedures_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback,
            const std::string &procedure_id) {
            procedures_controller.remove(
                request, std::move(callback), procedure_id);
        },
        {drogon::Delete});

    drogon::app().registerHandler(
        "/cases",
        [&cases_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            cases_controller.all(request, std::move(callback));
        },
        {drogon::Get});

    drogon::app().registerHandler(
        "/cases",
        [&cases_controller](
            const drogon::HttpRequestPtr &request,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            cases_controller.create(request, std::move(callback));
        },
        {drogon::Post});
}

}  // namespace Api
