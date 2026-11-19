#pragma once

#include <string_view>

namespace Features::Cases::Schemas {

inline constexpr std::string_view CreateRequest = R"json({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
        },
        "description": {
            "type": ["string", "null"]
        },
        "procedure_id": {
            "type": "integer",
            "minimum": 1
        }
    },
    "required": ["name", "procedure_id"],
    "additionalProperties": false
})json";

}  // namespace Features::Cases::Schemas
