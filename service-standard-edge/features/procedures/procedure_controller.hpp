#pragma once

#include "../../api/controller_base.hpp"
#include "procedure_service.hpp"

#include <drogon/drogon.h>

class ProceduresController final : protected ControllerBase {
public:
    explicit ProceduresController(ProcedureService &service);

    void create(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void update(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
        const std::string &procedure_id);

    void remove(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
        const std::string &procedure_id);

    void all(
        const drogon::HttpRequestPtr &request,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);

private:
    ProcedureService &service_;
};
