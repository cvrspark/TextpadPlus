#include "../commands.hxx"
#include <sstream>
#include <algorithm>

namespace textpad {
    std::vector<Token> get_tokens(const File& file) {
        std::vector<Token> tokens;
        std::string content = file.getContent();
        std::istringstream stream(content);
        std::string line;
        int current_line = 0;

        while (std::getline(stream, line)) {
            std::istringstream line_stream(line);
            std::string word;
            int col = 0;

            while (line_stream >> word) {
                size_t start_pos = line.find(word, col);
                size_t end_pos = start_pos + word.length();
                
                std::string token_type = "identifier";
                if (std::all_of(word.begin(), word.end(), ::isdigit)) {
                    token_type = "number";
                }

                tokens.push_back({current_line, static_cast<int>(start_pos), static_cast<int>(end_pos), token_type});
                col = end_pos;
            }
            current_line++;
        }
        return tokens;
    }
}