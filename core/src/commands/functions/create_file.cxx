#include "../commands.hxx"
#include <fstream>
#include <filesystem>

namespace textpad {
    void create_file(const std::string& full_path) {
        std::ofstream file(full_path);
    }

    void create_folder(const std::string& full_path) {
        std::filesystem::create_directories(full_path);
    }
}