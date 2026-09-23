import sys
import subprocess

try:
    import markdown
except ImportError:
    print("Installing markdown...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'markdown'])
    import markdown

with open(r'c:\Users\DELL\Downloads\ZeroKost\Pharmacy_project\Genquantaa_Pharmacy_Billing\Pharma_project\azure-deployment-guide.md', 'r', encoding='utf-8') as f:
    md_text = f.read()
    
html = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])

doc_html = f"""<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Deployment Guide</title></head>
<body>{html}</body></html>"""

out_file = r'c:\Users\DELL\Downloads\ZeroKost\Pharmacy_project\Genquantaa_Pharmacy_Billing\Pharma_project\azure-deployment-guide.doc'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write(doc_html)
print('Created .doc file successfully.')
