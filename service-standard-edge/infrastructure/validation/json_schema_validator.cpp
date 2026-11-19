#include "json_schema_validator.hpp"

#include <valijson/adapters/jsoncpp_adapter.hpp>
#include <valijson/schema_parser.hpp>
#include <valijson/validation_results.hpp>
#include <valijson/validator.hpp>

#include <sstream>
#include <stdexcept>
#include <string>

namespace Infrastructure::Validation {

JsonSchemaValidator::JsonSchemaValidator(const std::string_view schema_text)
{
    Json::CharReaderBuilder reader_builder;
    reader_builder["collectComments"] = false;

    Json::Value schema_document;
    std::string parse_errors;
    std::istringstream schema_stream{std::string(schema_text)};

    if (!Json::parseFromStream(
            reader_builder,
            schema_stream,
            &schema_document,
            &parse_errors)) {
        throw std::runtime_error("Could not parse JSON Schema: " + parse_errors);
    }

    valijson::SchemaParser parser;
    valijson::adapters::JsonCppAdapter schema_adapter(schema_document);
    parser.populateSchema(schema_adapter, schema_);
}

bool JsonSchemaValidator::validate(
    const Json::Value &payload,
    Json::Value &errors) const
{
    thread_local valijson::Validator validator;

    valijson::ValidationResults results;
    valijson::adapters::JsonCppAdapter payload_adapter(payload);

    if (validator.validate(schema_, payload_adapter, &results)) {
        return true;
    }

    errors = Json::Value(Json::arrayValue);
    for (const auto &error : results) {
        Json::Value item;
        item["path"] = error.jsonPointer;
        item["message"] = error.description;
        errors.append(item);
    }

    return false;
}

}  // namespace Infrastructure::Validation
