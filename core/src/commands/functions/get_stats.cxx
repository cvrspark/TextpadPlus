#include "../commands.hxx"
#include <sstream>

namespace textpad {
    std::string get_text_stats(const std::string& text) {
        int chars = text.length();
        int lines = 0;
        int words = 0;

        for (char c : text) {
            if (c == '\n') lines++;
        }
        if (!text.empty() && text.back() != '\n') lines++;

        std::stringstream ss(text);
        std::string word;
        while (ss >> word) {
            words++;
        }

        return "{\"chars\":" + std::to_string(chars) + 
               ",\"words\":" + std::to_string(words) + 
               ",\"lines\":" + std::to_string(lines) + "}";
    }
}