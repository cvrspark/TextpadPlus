#include "../commands.hxx"
#include "../utils/utils.hxx"
#include <filesystem>
#include <sstream>
#include <cctype>

namespace fs = std::filesystem;

namespace textpad {

    std::string list_directory_json(const fs::path& current_path) {
        std::stringstream json;
        json << "[";

        try {
            if (!fs::exists(current_path) || !fs::is_directory(current_path))
                return "[]";

            bool first = true;
            for (const auto& entry : fs::directory_iterator(current_path)) {
                std::string name = entry.path().filename().string();

                if (name.rfind(".", 0) == 0 && name != ".txt") continue;

                if (!first) json << ",";
                first = false;

                json << "{\"name\":\"" << Utils::escape_json(name) << "\",";
                std::string abs_path = fs::absolute(entry.path()).string();
                json << "\"path\":\"" << Utils::escape_json(abs_path) << "\",";

                if (entry.is_directory()) {
                    json << "\"type\":\"folder\",";
                    json << "\"children\":[]";
                } else {
                    json << "\"type\":\"file\"";
                }

                json << "}";
            }
        } catch (const std::exception&) {
            return "[]";
        }

        json << "]";
        return json.str();
    }

    std::string scan_dir(const std::string& path) {
        try {
            fs::path root_path(path);
            if (!fs::exists(root_path) || !fs::is_directory(root_path)) {
                return "{\"error\":\"Invalid or non‑existent path specified\"}";
            }

            std::stringstream response;
            response << "{\"entries\":" << list_directory_json(root_path) << "}";
            return response.str();

        } catch (const std::exception&) {
            return "{\"error\":\"Could not read directory contents\"}";
        }
    }

} // namespace textpad