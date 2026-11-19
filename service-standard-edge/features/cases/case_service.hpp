#pragma once

#include <json/json.h>
#include <QJsonArray>
#include <QJsonObject>
#include <QList>
#include <QString>

#include <cstdint>
#include <string>

struct CreateCaseResult {
    bool ok = false;
    bool procedure_found = true;
    QJsonObject case_record;
    std::string error;
};

struct GetCasesResult {
    bool ok = false;
    QJsonArray cases;
    std::int64_t page = 1;
    std::int64_t limit = 10;
    std::int64_t total = 0;
    std::string error;
};

struct GetCasesQuery {
    std::int64_t page = 1;
    std::int64_t limit = 10;
    std::string search;
    QList<QString> includes;
};

class CaseService final {
public:
    CreateCaseResult create(const Json::Value &payload) const;
    GetCasesResult all(const GetCasesQuery &query) const;
};
