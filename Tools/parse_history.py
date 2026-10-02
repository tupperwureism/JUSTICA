import os
from bs4 import BeautifulSoup

def extract_text_from_html(html_path, txt_path):
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found.")
        return
        
    print(f"Reading {html_path}...")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    print("Parsing HTML...")
    soup = BeautifulSoup(content, "lxml")
    
    # We want to extract chat messages. 
    # Usually in Google Search / Gemini, chat bubbles are in divs. 
    # Let's extract all text content in a structured way.
    # We can clean up script and style tags first.
    for element in soup(["script", "style", "meta", "link"]):
        element.decompose()
        
    text = soup.get_text(separator="\n")
    
    # Clean up empty lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_text = "\n".join(lines)
    
    print(f"Writing text to {txt_path}...")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(cleaned_text)
        
    print("Extraction complete!")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    html_file = os.path.join(project_root, "HALODOC", "AIHistory", "brainstorming awal + usecase activity.html")
    txt_file = os.path.join(base_dir, "chat_text.txt")
    extract_text_from_html(html_file, txt_file)
