#pragma once

#include <orm/tiny/model.hpp>

#include <QHash>
#include <QString>
#include <QStringList>

#include <set>

#include "../procedures/procedure_model.hpp"

class CaseModel final : public Orm::Tiny::Model<CaseModel, ProcedureModel> {
    friend Model;

    using Model::Model;

public:
    /*! The procedure associated with this case. */
    std::unique_ptr<BelongsTo<CaseModel, ProcedureModel>> procedure() {
        return belongsTo<ProcedureModel>(
            "procedure_id",
            {},
            QString::fromUtf8(__func__));
    }

private:
    QString u_table{"cases"};

    inline static QStringList u_fillable{
        "name",
        "description",
        "procedure_id",
    };

    inline static std::set<QString> u_visible{
        "id",
        "name",
        "description",
        "procedure_id",
        "created_at",
        "updated_at",
        "procedure",
    };

    QHash<QString, RelationVisitor> u_relations{
        {"procedure", [](auto &visitor) { visitor(&CaseModel::procedure); }},
    };
};

inline std::unique_ptr<Orm::Tiny::TinyBuilder<CaseModel>>
ProcedureModel::cases() const
{
    auto query = CaseModel::query();
    query->where(
        "procedure_id",
        "=",
        getAttribute("id"));
    return query;
}
