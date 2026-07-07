#include "./utils.hxx"

#include <fstream>
#include <sstream>

std::string Utils::escape_json(const std::string& s){
    std::stringstream out;
    for (unsigned char c : s) {
        if (c == '"')  out << "\\\"";
        else if (c == '\\') out << "\\\\";
        else if (c == '\b') out << "\\b";
        else if (c == '\f') out << "\\f";
        else if (c == '\n') out << "\\n";
        else if (c == '\r') out << "\\r";
        else if (c == '\t') out << "\\t";
        else if (c < 0x20) {
            out << "\\u00" << std::hex << (int)c;
        }
        else out << c;
    }
    return out.str();
}