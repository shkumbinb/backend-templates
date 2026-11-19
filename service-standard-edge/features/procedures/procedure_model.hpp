#pragma once

#include <orm/tiny/model.hpp>

#include <QString>
#include <QStringList>

#include <set>

class CaseModel;

class ProcedureModel final : public Orm::Tiny::Model<ProcedureModel> {
    friend Model;

    using Model::Model;

public:
    /*! Query the cases associated with this procedure. */
    std::unique_ptr<Orm::Tiny::TinyBuilder<CaseModel>> cases() const;

private:
    QString u_table{"procedures"};

    inline static QStringList u_fillable{
        "name",
    };

    inline static std::set<QString> u_visible{
        "id",
        "name",
        "created_at",
        "updated_at",
    };
};
