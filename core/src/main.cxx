#include "src/commands/commands.hxx"
#include "src/commands/utils/utils.hxx"
#include <iostream>
#include <string>
#include <vector>
#include <sstream>

#ifdef _WIN32
#include <windows.h>
#endif

using std::string;
using std::vector;
using std::getline;

enum class Command {
    Create,
    Open,
    Save,
    Delete,
    ScanDir,
    GetStats,
    FindAll,
    //GetTokens,
    Unknown
};



Command hash_command(const string& cmd_str) {
    if (cmd_str == "CREATE")   return Command::Create;
    if (cmd_str == "OPEN")     return Command::Open;
    if (cmd_str == "SAVE")     return Command::Save;
    if (cmd_str == "DELETE")   return Command::Delete;
    if (cmd_str == "SCAN")     return Command::ScanDir;
    if (cmd_str == "STATS")    return Command::GetStats;
    if (cmd_str == "FIND")     return Command::FindAll;
    //if (cmd_str == "TOKENS")   return Command::GetTokens;
    return Command::Unknown;
}

void send_output(const string& cmd_context, const string& json_payload) {
    std::cout << "OUTPUT:" << cmd_context << ":" << json_payload << std::endl;
}

void listen() {
    string line;
    
    while (getline(std::cin, line)) {
        if (line == "EXIT") break;
        if (line.empty()) continue;

        size_t delimiter = line.find(':');
        if (delimiter == string::npos) {
            send_output("ERROR", "{\"error\":\"Malformed IPC string\"}");
            continue;
        }

        string cmd_part = line.substr(0, delimiter);
        string payload = line.substr(delimiter + 1);

        Command cmd = hash_command(cmd_part);

        switch (cmd) {
            case Command::Create: {
                size_t firstPipe = payload.find('|');
                if (firstPipe == string::npos) {
                    send_output("CREATE", "{\"error\":\"Invalid payload format\"}");
                    break;
                }
                size_t secondPipe = payload.find('|', firstPipe + 1);
                if (secondPipe == string::npos) {
                    send_output("CREATE", "{\"error\":\"Invalid payload format\"}");
                    break;
                }

                string path = payload.substr(0, firstPipe);
                string name = payload.substr(firstPipe + 1, secondPipe - firstPipe - 1);
                string type = payload.substr(secondPipe + 1);

                string full_path = path;
                if (!full_path.empty() && full_path.back() != '\\' && full_path.back() != '/') {
                    full_path += '/';
                }
                full_path += name;

                if (type == "file") {
                    textpad::create_file(full_path);
                    send_output("CREATE", "{\"status\":\"success\"}");
                } else if (type == "folder") {
                    textpad::create_folder(full_path);
                    send_output("CREATE", "{\"status\":\"success\"}");
                } else {
                    send_output("CREATE", "{\"error\":\"Unknown type\"}");
                }
                break;
            }

            case Command::Open: {
                File f = textpad::open_file(payload);
                std::string escaped = Utils::escape_json(f.getContent());
                send_output("OPEN", "{\"status\":\"opened\",\"content\":\"" + escaped + "\"}");
                break;
            }

            case Command::Save: {
                size_t pipe = payload.find('|');
                if (pipe != string::npos) {
                    string path = payload.substr(0, pipe);
                    string content = payload.substr(pipe + 1);

                    size_t pos = 0;
                    while ((pos = content.find("\\\\", pos)) != string::npos) {
                        content.replace(pos, 2, "\\");
                        pos += 1;
                    }
                    pos = 0;
                    while ((pos = content.find("\\n", pos)) != string::npos) {
                        content.replace(pos, 2, "\n");
                        pos += 1;
                    }
                    pos = 0;
                    while ((pos = content.find("\\|", pos)) != string::npos) {
                        content.replace(pos, 2, "|");
                        pos += 1;
                    }

                    if (textpad::save_file(path, content)) {
                        send_output("SAVE", "{\"status\":\"saved\"}");
                    } else {
                        send_output("SAVE", "{\"error\":\"Failed to write file to disk\"}");
                    }
                } else {
                    send_output("SAVE", "{\"error\":\"Invalid save payload format\"}");
                }
                break;
            }

            case Command::Delete: {
                send_output("DELETE", textpad::delete_item(payload));
                break;
            }

            case Command::ScanDir: {
                send_output("SCAN", textpad::scan_dir(payload));
                break;
            }

            case Command::GetStats: {
                send_output("STATS", textpad::get_text_stats(payload));
                break;
            }

            case Command::FindAll: {
                size_t pipe = payload.find('|');
                if (pipe != string::npos) {
                    string term = payload.substr(0, pipe);
                    string text = payload.substr(pipe + 1);
                    auto positions = textpad::find_all(text, term);
                    
                    string response = "{\"positions\":[";
                    for (size_t i = 0; i < positions.size(); ++i) {
                        response += std::to_string(positions[i]) + (i + 1 < positions.size() ? "," : "");
                    }
                    response += "]}";
                    
                    send_output("FIND", response);
                }
                break;
            }

            // case Command::GetTokens: {
            //     send_output("STATS", "{\"status\":\"tokens_stub\"}");
            //     break;
            // }

            case Command::Unknown:
            default:
                send_output("ERROR", "{\"error\":\"Unknown namespace operation\"}");
                break;
        }
    }
}

int run_backend() {
    listen();
    return 0;
}

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    return run_backend();
}
#else
int main() {
    return run_backend();
}
#endif