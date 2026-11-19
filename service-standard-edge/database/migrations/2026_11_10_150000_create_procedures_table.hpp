#pragma once

#include <tom/migration.hpp>

namespace Migrations {

struct CreateProceduresTable final : Migration {
    T_MIGRATION

    void up() const override {
        Schema::create("procedures", [](Blueprint &table) {
            table.id();
            table.string("name", 200);
            table.timestampsTz();
        });
    }

    void down() const override {
        Schema::dropIfExists("procedures");
    }
};

}  // namespace Migrations
