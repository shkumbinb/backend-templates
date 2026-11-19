#pragma once

#include "../features/cases/case_controller.hpp"
#include "../features/procedures/procedure_controller.hpp"

namespace Api {

void register_routes(
    ProceduresController &procedures_controller,
    CasesController &cases_controller);

}  // namespace Api
