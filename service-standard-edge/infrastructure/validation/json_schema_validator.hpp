#pragma once

#include <json/json.h>

#include <valijson/schema.hpp>

#include <string_view>

namespace Infrastructure::Validation {

class JsonSchemaValidator final {
public:
    explicit JsonSchemaValidator(std::string_view schema_text);

    bool validate(const Json::Value &payload, Json::Value &errors) const;

private:
    valijson::Schema schema_;
};

}  // namespace Infrastructure::Validation
