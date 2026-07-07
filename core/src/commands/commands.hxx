#pragma once

#include <string>
#include <vector>

class File {
private:
    std::string name;
    std::string path;
    std::string content;

public:
    File();
    File(std::string name, std::string path);
    void setName(const std::string& newname);
    void setPath(const std::string& newpath);
    void setContent(const std::string& newcontent);

    std::string getName() const;
    std::string getPath() const;
    std::string getContent() const;
};

struct Token {
    int line;
    int start_col;
    int end_col;
    std::string type; // "keyword", "string", "comment"
};

namespace textpad
{
    std::string scan_dir(const std::string& path);
    void create_file(const std::string& full_path);
    void create_folder(const std::string& full_path);
    File open_file(const std::string& path);
    bool save_file(const std::string& path, const std::string& content);
    std::string delete_item(const std::string& path);


    std::string get_text_stats(const std::string& text);
    std::vector<size_t> find_all(const std::string& text, const std::string& search_term);

    //std::vector<Token> get_tokens(const File& file); 
    
} // namespace textpad

