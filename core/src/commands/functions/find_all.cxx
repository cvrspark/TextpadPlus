#include "../commands.hxx"
#include <algorithm>
#include <cctype>

namespace textpad {
    std::vector<size_t> find_all(const std::string& text, const std::string& search_term) {
        std::vector<size_t> positions;
        if (search_term.empty()) return positions;

        size_t pos = text.find(search_term, 0);
        while (pos != std::string::npos) {
            positions.push_back(pos);
            pos = text.find(search_term, pos + search_term.size());
        }
        return positions;
    }
}