#include "../commands.hxx"
#include <fstream>
#include <sstream>
#include <filesystem>
#include <cctype>

namespace textpad {

    File open_file(const std::string& path) {
        std::ifstream file_stream(path);
        if (!file_stream.is_open()) {
            return File("Error", "");
        }

        std::stringstream buffer;
        buffer << file_stream.rdbuf();
        
        std::string name = std::filesystem::path(path).filename().string();

        File loaded_file(name, path);
        loaded_file.setContent(buffer.str());
        return loaded_file;
    }

} // namespace textpad