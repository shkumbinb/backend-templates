#include "tinyorm_attributes.hpp"

#include <QString>
#include <QVariant>

#include <stdexcept>
#include <string>

namespace Infrastructure::Database {
namespace {

QVariant variant_from_json(
    const Json::Value &value,
    const std::string_view field)
{
    if (value.isNull()) {
        return {};
    }

    if (value.isString()) {
        return QString::fromUtf8(value.asCString());
    }

    if (value.isBool()) {
        return value.asBool();
    }

    if (value.isInt64()) {
        return QVariant::fromValue(value.asInt64());
    }

    if (value.isUInt64()) {
        return QVariant::fromValue(value.asUInt64());
    }

    if (value.isInt()) {
        return value.asInt();
    }

    if (value.isUInt()) {
        return value.asUInt();
    }

    if (value.isDouble()) {
        return value.asDouble();
    }

    throw std::invalid_argument(
        "Unsupported JSON value for TinyORM field: " + std::string(field));
}

}  // namespace

QList<Orm::Tiny::AttributeItem> attributes_from_json(
    const Json::Value &payload,
    const std::initializer_list<std::string_view> allowed_fields)
{
    if (!payload.isObject()) {
        throw std::invalid_argument(
            "TinyORM attributes require a JSON object payload");
    }

    QList<Orm::Tiny::AttributeItem> attributes;

    for (const auto field : allowed_fields) {
        const auto field_name = std::string(field);
        if (!payload.isMember(field_name)) {
            continue;
        }

        attributes.append({
            QString::fromStdString(field_name),
            variant_from_json(payload[field_name], field),
        });
    }

    return attributes;
}

}  // namespace Infrastructure::Database
