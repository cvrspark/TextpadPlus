cmake_minimum_required(VERSION 3.16)
project(Textpad++ VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")

set(SOURCES
    src/commands/File.cxx
    src/commands/functions/create_file.cxx
    src/commands/functions/delete_item.cxx
    src/commands/functions/get_stats.cxx
    src/commands/functions/open_file.cxx
    src/commands/functions/find_all.cxx
    src/commands/functions/scan_dir.cxx
    src/commands/functions/save_file.cxx
    src/commands/utils/utils.cxx
    src/main.cxx
)

add_executable(textpad_core ${SOURCES})

target_include_directories(textpad_core PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

if(WIN32)
    # Uncommeznt the line below if you want to hide the terminal window in production
    # set_target_properties(textpad_backend PROPERTIES WIN32_EXECUTABLE TRUE)
endif()