#include "../commands.hxx"
#include <fstream>

namespace textpad {
    bool save_file(const std::string& path, const std::string& content) {
        std::ofstream file_stream(path, std::ios::trunc);
        if (!file_stream.is_open()) {
            return false;
        }
        
        file_stream << content;
        return true;
    }
}