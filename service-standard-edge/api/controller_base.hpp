#pragma once

#include "../infrastructure/validation/json_schema_validator.hpp"

#include <drogon/drogon.h>
#include <json/json.h>
#include <QJsonArray>
#include <QJsonObject>

#include <charconv>
#include <cstdint>
#include <functional>
#include <initializer_list>
#include <string>
#include <string_view>

class ControllerBase {
protected:
    using ResponseCallback =
        std::function<void(const drogon::HttpResponsePtr &)>;

    static bool validate_json_object(
        const drogon::HttpRequestPtr &request,
        ResponseCallback &callback,
        const Infrastructure::Validation::JsonSchemaValidator &validator,
        Json::Value &payload);

    static drogon::HttpResponsePtr error_response(
        drogon::HttpStatusCode status,
        const std::string &code,
        const std::string &message,
        const Json::Value &details = Json::Value());

    static drogon::HttpResponsePtr json_response(
        const QJsonObject &body,
        drogon::HttpStatusCode status);

    static drogon::HttpResponsePtr paginated_json_response(
        const QJsonArray &data,
        std::int64_t total,
        std::int64_t page,
        std::int64_t limit,
        drogon::HttpStatusCode status);

    static bool parse_positive_query_parameter(
        const drogon::HttpRequestPtr &request,
        const char *name,
        std::int64_t default_value,
        std::int64_t maximum,
        std::int64_t &value,
        std::string &error);

    static bool parse_positive_path_parameter(
        const std::string &raw_value,
        const char *name,
        std::int64_t &value,
        std::string &error);

    static bool parse_include_query_parameter(
        const drogon::HttpRequestPtr &request,
        std::initializer_list<std::string_view> allowed_includes,
        QList<QString> &includes,
        std::string &error);
};
