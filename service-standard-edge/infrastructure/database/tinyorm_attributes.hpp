#pragma once

#include <json/json.h>

#include <orm/tiny/tinytypes.hpp>

#include <initializer_list>
#include <string_view>

namespace Infrastructure::Database {

QList<Orm::Tiny::AttributeItem> attributes_from_json(
    const Json::Value &payload,
    std::initializer_list<std::string_view> allowed_fields);

}  // namespace Infrastructure::Database
