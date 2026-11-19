#include "case_service.hpp"

#include "case_model.hpp"

#include "../procedures/procedure_model.hpp"

#include "../../infrastructure/database/tinyorm_attributes.hpp"

#include <exception>

#include <QVariant>

CreateCaseResult CaseService::create(const Json::Value &payload) const
{
    try
    {
        const auto procedure_id = payload["procedure_id"].asInt64();
        const auto procedure = ProcedureModel::find(
            QVariant::fromValue<qlonglong>(static_cast<qlonglong>(procedure_id)));

        if (!procedure)
        {
            return {false, false, {}, "Procedure not found"};
        }

        auto case_model = CaseModel::create(
            Infrastructure::Database::attributes_from_json(
                payload,
                {"name", "description", "procedure_id"}));

        if (!case_model.getAttribute("id").isValid())
        {
            return {false, true, {}, "Case could not be saved"};
        }

        return {true, true, case_model.toJsonObject(), {}};
    }
    catch (const std::exception &exception)
    {
        return {false, true, {}, exception.what()};
    }
}

GetCasesResult CaseService::all(const GetCasesQuery &query) const
{
    try
    {
        if (query.page < 1 || query.limit < 1)
        {
            return {false, {}, query.page, query.limit, 0, "Page and limit must be positive"};
        }

        const auto add_search_filter = [&query](auto &builder)
        {
            if (!query.search.empty())
            {
                const auto search =
                    QStringLiteral("%") +
                    QString::fromStdString(query.search) +
                    QStringLiteral("%");

                builder.where("name", "ilike", search);
            }
        };

        auto count_query = CaseModel::query();
        add_search_filter(*count_query);
        const auto total = count_query->count();

        auto data_query = CaseModel::query();
        add_search_filter(*data_query);

        QList<QString> relations;
        for (const auto &include : query.includes)
        {
            if (include == "procedure")
            {
                relations.append("procedure:id,name");
            }
        }

        if (!relations.isEmpty())
        {
            data_query->with(relations);
        }

        const auto cases = data_query
                               ->orderByDesc("id")
                               .forPage(query.page, query.limit)
                               .get();

        return {true,
                cases.toJsonArray(),
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
