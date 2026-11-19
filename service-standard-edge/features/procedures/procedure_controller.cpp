#include "procedure_controller.hpp"

#include "procedure_schemas.hpp"

#include "../../infrastructure/validation/json_schema_validator.hpp"

#include <QJsonObject>

#include <string>

ProceduresController::ProceduresController(ProcedureService &service)
    : service_(service)
{
}

void ProceduresController::create(
    const drogon::HttpRequestPtr &request,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    static const Infrastructure::Validation::JsonSchemaValidator validator{
        Features::Procedures::Schemas::CreateRequest};

    Json::Value payload;
    if (!validate_json_object(request, callback, validator, payload))
    {
        return;
    }

    auto result = service_.create(payload);
    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "CREATE_PROCEDURE_FAILED",
            result.error));
        return;
    }

    QJsonObject body;
    body["data"] = result.procedure;

    callback(json_response(body, drogon::k201Created));
}

void ProceduresController::update(
    const drogon::HttpRequestPtr &request,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    const std::string &procedure_id)
{
    static const Infrastructure::Validation::JsonSchemaValidator validator{
        Features::Procedures::Schemas::UpdateRequest};

    std::int64_t id = 0;
    std::string id_error;
    if (!parse_positive_path_parameter(procedure_id, "procedure_id", id, id_error))
    {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_PATH_PARAMETER",
            id_error));
        return;
    }

    Json::Value payload;
    if (!validate_json_object(request, callback, validator, payload))
    {
        return;
    }

    const auto result = service_.update(id, payload);
    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "UPDATE_PROCEDURE_FAILED",
            result.error));
        return;
    }

    if (!result.found)
    {
        callback(error_response(
            drogon::k404NotFound,
            "PROCEDURE_NOT_FOUND",
            "Procedure not found"));
        return;
    }

    QJsonObject body;
    body["data"] = result.procedure;
    callback(json_response(body, drogon::k200OK));
}

void ProceduresController::remove(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    const std::string &procedure_id)
{
    std::int64_t id = 0;
    std::string id_error;
    if (!parse_positive_path_parameter(procedure_id, "procedure_id", id, id_error))
    {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_PATH_PARAMETER",
            id_error));
        return;
    }

    const auto result = service_.remove(id);
    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "DELETE_PROCEDURE_FAILED",
            result.error));
        return;
    }

    if (!result.found)
    {
        callback(error_response(
            drogon::k404NotFound,
            "PROCEDURE_NOT_FOUND",
            "Procedure not found"));
        return;
    }

    QJsonObject body;
    body["data"] = result.procedure;
    callback(json_response(body, drogon::k200OK));
}

void ProceduresController::all(
    const drogon::HttpRequestPtr &request,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    GetProceduresQuery query;
    std::string query_error;

    if (!parse_positive_query_parameter(
            request, "page", 1, 1'000'000, query.page, query_error) ||
        !parse_positive_query_parameter(
            request, "limit", 10, 1'000'000, query.limit, query_error))
    {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_QUERY_PARAMETER",
            query_error));
        return;
    }

    query.search = request->getParameter("search");
    if (query.search.size() > 200)
    {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_QUERY_PARAMETER",
            "search must be at most 200 characters"));
        return;
    }

    const auto result = service_.all(query);
    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "GET_PROCEDURES_FAILED",
            result.error));
        return;
    }

    callback(paginated_json_response(
        result.procedures,
        result.total,
        result.page,
        result.limit,
        drogon::k200OK));
}
