import os
import sys

try:
    from markdown import markdown
    from xhtml2pdf import pisa
except ImportError:
    print("Dependencies missing. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown", "xhtml2pdf"])
    from markdown import markdown
    from xhtml2pdf import pisa

def convert_md_to_pdf(input_md_path, output_pdf_path):
    if not os.path.exists(input_md_path):
        print(f"Error: {input_md_path} not found.")
        return False
        
    print(f"Reading {input_md_path}...")
    with open(input_md_path, "r", encoding="utf-8") as f:
        md_content = f.read()
        
    print("Converting Markdown to HTML...")
    # Convert Markdown to HTML with tables support
    html_body = markdown(md_content, extensions=['fenced_code', 'tables'])
    
    # CSS for presentation notes
    css = """
    @page {
        size: a4;
        margin: 2.5cm 2cm 2.5cm 2cm;
    }
    body {
        font-family: Arial, Helvetica, sans-serif;
        color: #1e293b;
        line-height: 1.6;
        font-size: 10.5pt;
    }
    h1 {
        font-size: 20pt;
        color: #0f172a;
        text-align: center;
        margin-bottom: 25px;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 10px;
    }
    h2 {
        font-size: 13.5pt;
        color: #1e3a8a;
        margin-top: 25px;
        margin-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 5px;
        page-break-after: avoid;
    }
    p {
        margin-bottom: 8px;
    }
    ul {
        margin-top: 5px;
        margin-bottom: 15px;
        padding-left: 20px;
    }
    li {
        margin-bottom: 4px;
    }
    strong {
        color: #0f172a;
        font-weight: bold;
    }
    blockquote {
        margin: 10px 0;
        padding: 8px 15px;
        background-color: #f8fafc;
        border-left: 4px solid #3b82f6;
        color: #475569;
    }
    hr {
        border: 0;
        border-top: 1px solid #e2e8f0;
        margin: 20px 0;
    }
    """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
        {css}
        </style>
    </head>
    <body>
        {html_body}
    </body>
    </html>
    """
    
    print("Generating PDF...")
    with open(output_pdf_path, "wb") as pdf_file:
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)
        
    if not pisa_status.err:
        print(f"Success: PDF generated at {output_pdf_path}")
        return True
    else:
        print("Error generating PDF")
        return False

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    input_path = "C:/Users/chloud/.gemini/antigravity/brain/cf05faa9-a8bf-4068-9f70-ea9f41d92f48/key_notes_diagram.md"
    output_path = os.path.join(project_root, "PDF", "key_notes_diagram.pdf")
    convert_md_to_pdf(input_path, output_path)
