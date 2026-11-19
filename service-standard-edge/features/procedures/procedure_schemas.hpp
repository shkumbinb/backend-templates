#pragma once

#include <string_view>

namespace Features::Procedures::Schemas {

inline constexpr std::string_view CreateRequest = R"json({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
        }
    },
    "required": ["name"],
    "additionalProperties": false
})json";

inline constexpr std::string_view UpdateRequest = R"json({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
        }
    },
    "required": ["name"],
    "additionalProperties": false
})json";

}  // namespace Features::Procedures::Schemas
