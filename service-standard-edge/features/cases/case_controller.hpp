#pragma once

#include "../../api/controller_base.hpp"
#include "case_service.hpp"

#include <drogon/drogon.h>

class CasesController final : protected ControllerBase {
public:
    explicit CasesController(CaseService &service);

    void create(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void all(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);

private:
    CaseService &service_;
};
