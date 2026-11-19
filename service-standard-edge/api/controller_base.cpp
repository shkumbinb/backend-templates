#include "controller_base.hpp"

#include <QJsonDocument>

#include <limits>

bool ControllerBase::validate_json_object(
    const drogon::HttpRequestPtr &request,
    ResponseCallback &callback,
    const Infrastructure::Validation::JsonSchemaValidator &validator,
    Json::Value &payload)
{
    const auto json = request->getJsonObject();
    if (!json || !json->isObject()) {
        callback(error_response(
            drogon::k400BadRequest,
            "INVALID_JSON",
            "Request body must be a JSON object"));
        return false;
    }

    Json::Value validation_errors;
    if (!validator.validate(*json, validation_errors)) {
        callback(error_response(
            drogon::k422UnprocessableEntity,
            "VALIDATION_ERROR",
            "Request payload is invalid",
            validation_errors));
        return false;
    }

    payload = *json;
    return true;
}

drogon::HttpResponsePtr ControllerBase::error_response(
    drogon::HttpStatusCode status,
    const std::string &code,
    const std::string &message,
    const Json::Value &details)
{
    Json::Value body;
    body["error"]["code"] = code;
    body["error"]["message"] = message;
    if (!details.isNull()) {
        body["error"]["details"] = details;
    }

    auto response = drogon::HttpResponse::newHttpJsonResponse(body);
    response->setStatusCode(status);
    return response;
}

drogon::HttpResponsePtr ControllerBase::json_response(
    const QJsonObject &body,
    drogon::HttpStatusCode status)
{
    auto response = drogon::HttpResponse::newHttpResponse();
    response->setContentTypeCode(drogon::CT_APPLICATION_JSON);
    response->setStatusCode(status);
    response->setBody(
        QJsonDocument(body)
            .toJson(QJsonDocument::Compact)
            .toStdString());
    return response;
}

drogon::HttpResponsePtr ControllerBase::paginated_json_response(
    const QJsonArray &data,
    const std::int64_t total,
    const std::int64_t page,
    const std::int64_t limit,
    drogon::HttpStatusCode status)
{
    QJsonObject body;
    body["data"] = data;
    body["total"] = total;
    body["totalPages"] =
        total == 0
            ? 0
            : (total + limit - 1) / limit;
    body["page"] = page;
    body["limit"] = limit;

    return json_response(body, status);
}

bool ControllerBase::parse_positive_query_parameter(
    const drogon::HttpRequestPtr &request,
    const char *name,
    const std::int64_t default_value,
    const std::int64_t maximum,
    std::int64_t &value,
    std::string &error)
{
    const auto &raw_value = request->getParameter(name);
    if (raw_value.empty()) {
        value = default_value;
        return true;
    }

    if (!parse_positive_path_parameter(
            raw_value, name, value, error) || value > maximum) {
        error = std::string(name) + " must be an integer between 1 and " +
                std::to_string(maximum);
        return false;
    }

    return true;
}

bool ControllerBase::parse_positive_path_parameter(
    const std::string &raw_value,
    const char *name,
    std::int64_t &value,
    std::string &error)
{
    if (raw_value.empty())
    {
        error = std::string(name) + " is required";
        return false;
    }

    std::int64_t parsed = 0;
    const auto [end, code] = std::from_chars(
        raw_value.data(),
        raw_value.data() + raw_value.size(),
        parsed);

    if (code != std::errc{} ||
        end != raw_value.data() + raw_value.size() ||
        parsed < 1 ||
        parsed > std::numeric_limits<std::int64_t>::max())
    {
        error = std::string(name) + " must be a positive integer";
        return false;
    }

    value = parsed;
    return true;
}

bool ControllerBase::parse_include_query_parameter(
    const drogon::HttpRequestPtr &request,
    const std::initializer_list<std::string_view> allowed_includes,
    QList<QString> &includes,
    std::string &error)
{
    includes.clear();

    const auto raw_value = request->getParameter("include");
    if (raw_value.empty())
    {
        return true;
    }

    const auto values = QString::fromStdString(raw_value)
                            .split(',', Qt::KeepEmptyParts);

    for (const auto &value : values)
    {
        const auto include = value.trimmed();
        if (include.isEmpty())
        {
            error = "include must contain comma-separated relation names";
            return false;
        }

        bool supported = false;
        for (const auto allowed_include : allowed_includes)
        {
            if (include.toStdString() == allowed_include)
            {
                supported = true;
                break;
            }
        }

        if (!supported)
        {
            error = "Unsupported include: " + include.toStdString();
            return false;
        }

        if (!includes.contains(include))
        {
            includes.append(include);
        }
    }

    return true;
}
