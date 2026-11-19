cmake_minimum_required(VERSION 3.25)

project(case-manager VERSION 0.1.0 LANGUAGES CXX)

include(FetchContent)

set(valijson_BUILD_TESTS OFF CACHE BOOL "Disable Valijson tests" FORCE)
set(valijson_BUILD_EXAMPLES OFF CACHE BOOL "Disable Valijson examples" FORCE)

FetchContent_Declare(
    valijson
    GIT_REPOSITORY https://github.com/tristanpenman/valijson.git
    GIT_TAG v1.1.2
    GIT_SHALLOW TRUE
    GIT_SUBMODULES ""
)

FetchContent_MakeAvailable(valijson)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(TINYORM_ROOT "" CACHE PATH "TinyORM installation prefix")

if(TINYORM_ROOT)
    list(APPEND CMAKE_PREFIX_PATH "${TINYORM_ROOT}")
    list(APPEND CMAKE_BUILD_RPATH "${TINYORM_ROOT}/lib")
    set(CMAKE_INSTALL_RPATH "${TINYORM_ROOT}/lib")
endif()

find_package(Drogon CONFIG REQUIRED)

if(TINYORM_ROOT)
    # The TinyORM 0.38.1 package's version helper does not recognize the
    # installed Release target correctly with CMake 4.2. Load its exported
    # targets directly after resolving their public dependencies.
    find_package(Qt6 6.2 CONFIG REQUIRED COMPONENTS Core Sql)
    find_package(range-v3 CONFIG REQUIRED)
    find_package(tabulate CONFIG REQUIRED)
    include("${TINYORM_ROOT}/lib/cmake/TinyOrm/TinyOrmTargets.cmake")
else()
    find_package(TinyOrm CONFIG REQUIRED)
endif()

add_executable(case-manager
    main.cpp
    api/controller_base.cpp
    api/controller_base.hpp
    api/routes.cpp
    api/routes.hpp
    features/cases/case_controller.cpp
    features/cases/case_controller.hpp
    features/cases/case_model.hpp
    features/cases/case_schemas.hpp
    features/cases/case_service.cpp
    features/cases/case_service.hpp
    features/procedures/procedure_controller.cpp
    features/procedures/procedure_controller.hpp
    features/procedures/procedure_service.cpp
    features/procedures/procedure_service.hpp
    features/procedures/procedure_model.hpp
    features/procedures/procedure_schemas.hpp
    infrastructure/database/database_bootstrap.cpp
    infrastructure/database/database_bootstrap.hpp
    infrastructure/database/tinyorm_attributes.cpp
    infrastructure/database/tinyorm_attributes.hpp
    infrastructure/validation/json_schema_validator.cpp
    infrastructure/validation/json_schema_validator.hpp
)

target_compile_features(case-manager PRIVATE cxx_std_20)
target_link_libraries(case-manager PRIVATE Drogon::Drogon TinyOrm::TinyOrm ValiJSON::valijson)
target_include_directories(case-manager PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/infrastructure")

if(APPLE)
    # TinyORM's thread-local model statics produce duplicate TLS symbols when
    # several translation units include related models under Apple Clang.
    target_compile_definitions(case-manager PRIVATE TINYORM_DISABLE_THREAD_LOCAL)
endif()

add_executable(case-manager-tom
    tom_main.cpp
    database/migrations/2026_11_10_150000_create_procedures_table.hpp
    database/migrations/2026_11_10_150100_create_cases_table.hpp
)

target_compile_features(case-manager-tom PRIVATE cxx_std_20)
target_include_directories(case-manager-tom PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}")
target_link_libraries(case-manager-tom PRIVATE TinyOrm::TinyOrm)

set_target_properties(case-manager case-manager-tom PROPERTIES
    CXX_VISIBILITY_PRESET hidden
    VISIBILITY_INLINES_HIDDEN YES
)
