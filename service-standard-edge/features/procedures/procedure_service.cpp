#include "procedure_service.hpp"

#include "procedure_model.hpp"
#include "../../infrastructure/database/tinyorm_attributes.hpp"

#include <exception>

#include <QVariant>

CreateProcedureResult ProcedureService::create(const Json::Value &payload) const
{
    try
    {
        auto procedure = ProcedureModel::create(
            Infrastructure::Database::attributes_from_json(
                payload,
                {"name"}));

        if (!procedure.getAttribute("id").isValid())
        {
            return {false, {}, "Procedure could not be saved"};
        }
        return {true, procedure.toJsonObject(), {}};
    }
    catch (const std::exception &exception)
    {
        return {false, {}, exception.what()};
    }
}

UpdateProcedureResult ProcedureService::update(
    const std::int64_t id,
    const Json::Value &payload) const
{
    try
    {
        auto procedure = ProcedureModel::find(
            QVariant::fromValue<qlonglong>(static_cast<qlonglong>(id)));

        if (!procedure)
        {
            return {true, false, {}, {}};
        }

        if (!procedure->update(
                Infrastructure::Database::attributes_from_json(
                    payload,
                    {"name"})))
        {
            return {false, true, {}, "Procedure could not be updated"};
        }

        return {true, true, procedure->toJsonObject(), {}};
    }
    catch (const std::exception &exception)
    {
        return {false, false, {}, exception.what()};
    }
}

DeleteProcedureResult ProcedureService::remove(const std::int64_t id) const
{
    try
    {
        auto procedure = ProcedureModel::find(
            QVariant::fromValue<qlonglong>(static_cast<qlonglong>(id)));

        if (!procedure)
        {
            return {true, false, {}, {}};
        }

        const auto deleted_procedure = procedure->toJsonObject();
        if (!procedure->remove())
        {
            return {false, true, {}, "Procedure could not be deleted"};
        }

        return {true, true, deleted_procedure, {}};
    }
    catch (const std::exception &exception)
    {
        return {false, false, {}, exception.what()};
    }
}

GetProceduresResult ProcedureService::all(const GetProceduresQuery &query) const
{
    try
    {
        if (query.page < 1 || query.limit < 1) {
            return {false, {}, query.page, query.limit, 0,
                    "Page and limit must be positive"};
        }

        const auto add_search_filter = [&query](auto &builder) {
            if (!query.search.empty()) {
                const auto search =
                    QStringLiteral("%") +
                    QString::fromStdString(query.search) +
                    QStringLiteral("%");

                builder.where("name", "ilike", search);
            }
        };

        auto count_query = ProcedureModel::query();
        add_search_filter(*count_query);
        const auto total = count_query->count();

        auto data_query = ProcedureModel::query();
        add_search_filter(*data_query);

        const auto procedures = data_query
            ->orderByDesc("id")
            .forPage(query.page, query.limit)
            .get();

        return {true,
                procedures.toJsonArray(),
                query.page,
                query.limit,
                static_cast<std::int64_t>(total),
                {}};
    }
    catch (const std::exception &exception)
    {
        return {false, {}, query.page, query.limit, 0, exception.what()};
    }
}
