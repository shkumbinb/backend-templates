#pragma once

#include <tom/migration.hpp>

namespace Migrations {

struct CreateCasesTable final : Migration {
    T_MIGRATION

    void up() const override {
        Schema::create("cases", [](Blueprint &table) {
            table.id();
            table.string("name", 200);
            table.text("description").nullable();
            table.foreignId("procedure_id")
                .constrained("procedures")
                .restrictOnDelete()
                .restrictOnUpdate();
            table.timestampsTz();
        });
    }

    void down() const override {
        Schema::dropIfExists("cases");
    }
};

}  // namespace Migrations
