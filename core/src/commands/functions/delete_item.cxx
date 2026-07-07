#include "../commands.hxx"
#include "../utils/utils.hxx"
#include <filesystem>
#include <sstream>
#include <string>

namespace fs = std::filesystem;

namespace textpad {

    bool remove_dir(const fs::path& dir_path) {
        bool success = true;
        try {
            if (fs::exists(dir_path) && fs::is_directory(dir_path)) {
                for (const auto& entry : fs::directory_iterator(dir_path)) {
                    if (fs::is_directory(entry.path())) {
                        if (!remove_dir(entry.path())) {
                            success = false;
                        }
                    } else {
                        fs::remove(entry.path());
                    }
                }
                fs::remove(dir_path);
            }
        } catch (const std::exception& e) {
            return false;
        }
        return success;
    }

    std::string delete_item(const std::string& path) {
        try {
            fs::path target(path);
            if (!fs::exists(target)) {
                return R"({"status":"error","message":"Path does not exist"})";
            }

            bool deleted = false;
            if (fs::is_directory(target)) {
                deleted = remove_dir(target);
            } else {
                fs::remove(target);
                deleted = true;
            }

            if (deleted) {
                return R"({"status":"success"})";
            } else {
                return R"({"status":"error","message":"Failed to delete"})";
            }
        } catch (const std::exception& e) {
            std::string msg = e.what();
            return "{\"status\":\"error\",\"message\":\"" + Utils::escape_json(msg) + "\"}";
        }
    }

} // namespace textpad