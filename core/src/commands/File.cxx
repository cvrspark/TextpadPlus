#include "commands.hxx"
#include <utility>

File::File(std::string name, std::string path) 
    : name(std::move(name)), path(std::move(path)), content("") {}

void File::setName(const std::string& newname) { 
    name = newname; 
}

void File::setPath(const std::string& newpath) { 
    path = newpath; 
}

void File::setContent(const std::string& newcontent) { 
    content = newcontent; 
}

// Getters
std::string File::getName() const { 
    return name; 
}

std::string File::getPath() const { 
    return path; 
}

std::string File::getContent() const { 
    return content; 
}