#pragma once

#include <json/json.h>
#include <QJsonArray>
#include <QJsonObject>

#include <cstdint>
#include <string>

struct CreateProcedureResult {
    bool ok = false;
    QJsonObject procedure;
    std::string error;
};

struct UpdateProcedureResult {
    bool ok = false;
    bool found = false;
    QJsonObject procedure;
    std::string error;
};

struct DeleteProcedureResult {
    bool ok = false;
    bool found = false;
    QJsonObject procedure;
    std::string error;
};

struct GetProceduresResult {
    bool ok = false;
    QJsonArray procedures;
    std::int64_t page = 1;
    std::int64_t limit = 10;
    std::int64_t total = 0;
    std::string error;
};

struct GetProceduresQuery {
    std::int64_t page = 1;
    std::int64_t limit = 10;
    std::string search;
};

class ProcedureService final {
public:
    CreateProcedureResult create(const Json::Value &payload) const;
    UpdateProcedureResult update(
        std::int64_t id,
        const Json::Value &payload) const;
    DeleteProcedureResult remove(std::int64_t id) const;
    GetProceduresResult all(const GetProceduresQuery &query) const;
};
