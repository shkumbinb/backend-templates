#include "case_controller.hpp"

#include "case_schemas.hpp"

#include "../../infrastructure/validation/json_schema_validator.hpp"

#include <QJsonObject>

CasesController::CasesController(CaseService &service)
    : service_(service)
{
}

void CasesController::create(
    const drogon::HttpRequestPtr &request,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    static const Infrastructure::Validation::JsonSchemaValidator validator{
        Features::Cases::Schemas::CreateRequest};

    Json::Value payload;
    if (!validate_json_object(request, callback, validator, payload))
    {
        return;
    }

    const auto result = service_.create(payload);
    if (!result.procedure_found)
    {
        callback(error_response(
            drogon::k404NotFound,
            "PROCEDURE_NOT_FOUND",
            result.error));
        return;
    }

    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "CREATE_CASE_FAILED",
            result.error));
        return;
    }

    QJsonObject body;
    body["data"] = result.case_record;

    callback(json_response(body, drogon::k201Created));
}

void CasesController::all(
    const drogon::HttpRequestPtr &request,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    GetCasesQuery query;
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

    if (!parse_include_query_parameter(
            request, {"procedure"}, query.includes, query_error))
    {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_QUERY_PARAMETER",
            query_error));
        return;
    }

    const auto result = service_.all(query);
    if (!result.ok)
    {
        callback(error_response(
            drogon::k500InternalServerError,
            "GET_CASES_FAILED",
            result.error));
        return;
    }

    callback(paginated_json_response(
        result.cases,
        result.total,
        result.page,
        result.limit,
        drogon::k200OK));
}
