"""
Script to apply LifeQ SuperApp Branding across all mockups and generator scripts:
- SuperApp Master Brand: LifeQ
- Modul Hukum: Justifiqa
- Modul Psikologi: Qualifa
- Modul Medis: Sehatifiqa
"""

import os
import re
import subprocess

TOOLS_DIR = r'd:\justificadll\Tools'
MOCKUP_DIR = r'd:\justificadll\Mockups'

# 1. Update gen_dashboards.py
with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("JUSTIFICA <span class=\"badge-admin\">COMPLIANCE</span>", "LIFEQ <span class=\"badge-admin\">SUPERAPP</span>")
content = content.replace("JUSTIFICA <span style=\"color: #38bdf8;", "LIFEQ <span style=\"color: #38bdf8;")
content = content.replace("JUSTIFICA <span style=\"color: #34d399;", "LIFEQ <span style=\"color: #34d399;")
content = content.replace("Admin Justifica", "Admin LifeQ")
content = content.replace("Justifica 3-in-1", "LifeQ 3-in-1 SuperApp")
content = content.replace("Title: Admin Portal — Dashboard Utama Super Admin", "Title: LifeQ Admin — Dashboard Utama SuperApp")
content = content.replace("Title: Portal Mitra — Dashboard Dokter, Advokat, & Psikolog", "Title: LifeQ Mitra — Dashboard Profesional (Sehatifiqa, Justifiqa, Qualifa)")
content = content.replace("Title: Portal Klien — Dashboard Pasien & Pencari Keadilan", "Title: LifeQ Klien — Portal Terintegrasi (Sehatifiqa, Justifiqa, Qualifa)")
content = content.replace("Medis — Spesialis Anak", "Sehatifiqa (Medis) — Spesialis Anak")
content = content.replace("Hukum", "Justifiqa (Hukum)")
content = content.replace("Psikologi", "Qualifa (Psikologi)")

with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update gen_admin_mockups.py
with open(os.path.join(TOOLS_DIR, 'gen_admin_mockups.py'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("JUSTIFICA <span class=\"badge-admin\">COMPLIANCE</span>", "LIFEQ <span class=\"badge-admin\">SUPERAPP</span>")
content = content.replace("Justifica", "LifeQ")
content = content.replace("Medis (STR)", "Sehatifiqa / Medis (STR)")
content = content.replace("Hukum (Peradi)", "Justifiqa / Hukum (Peradi)")
content = content.replace("Psikologi (SIPP)", "Qualifa / Psikologi (SIPP)")

with open(os.path.join(TOOLS_DIR, 'gen_admin_mockups.py'), 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Update gen_domain_mockups.py
with open(os.path.join(TOOLS_DIR, 'gen_domain_mockups.py'), 'r', encoding='utf-8') as f:
    content = f.read()

# Replace brand logos in domain mockups
content = content.replace("JUSTIFICA <span style=\"color: #34d399; font-size: 0.75rem; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.4);\">MEDIS</span>", "SEHATIFIQA <span style=\"color: #34d399; font-size: 0.75rem; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.4);\">BY LIFEQ</span>")
content = content.replace("JUSTIFICA <span style=\"color: #facc15; font-size: 0.75rem; background: rgba(234,179,8,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.4);\">HUKUM</span>", "JUSTIFIQA <span style=\"color: #facc15; font-size: 0.75rem; background: rgba(234,179,8,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.4);\">BY LIFEQ</span>")
content = content.replace("JUSTIFICA <span style=\"color: #c084fc; font-size: 0.75rem; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.4);\">PSIKOLOGI</span>", "QUALIFA <span style=\"color: #c084fc; font-size: 0.75rem; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.4);\">BY LIFEQ</span>")

content = content.replace("Justifica - Modul Medis & e-Resep", "Sehatifiqa — Modul Medis & e-Resep (LifeQ SuperApp)")
content = content.replace("Justifica - Modul Hukum & IRAC Drafting", "Justifiqa — Modul Hukum & IRAC Drafting (LifeQ SuperApp)")
content = content.replace("Justifica - Modul Psikologi & DASS-21", "Qualifa — Modul Psikologi & DASS-21 (LifeQ SuperApp)")
content = content.replace("Stasiun Kerja Medis & Tele-Konsultasi", "Sehatifiqa Clinical Workstation & SOAP Notes")
content = content.replace("Stasiun Kerja Advokat & e-Meterai Engine", "Justifiqa Legal Workstation & e-Meterai Engine")
content = content.replace("Stasiun Kerja Klinis Psikologi & Crisis 119", "Qualifa Mental Health Workstation & Crisis 119")

with open(os.path.join(TOOLS_DIR, 'gen_domain_mockups.py'), 'w', encoding='utf-8') as f:
    f.write(content)

# 4. Update rebuild_gabungan_mockup.py
with open(os.path.join(TOOLS_DIR, 'rebuild_gabungan_mockup.py'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Justifica 3-in-1 — Gabungan Semua Mockup High-Fidelity", "LifeQ SuperApp — Gabungan Semua Mockup (Sehatifiqa, Justifiqa, Qualifa)")
content = content.replace("JUSTIFICA 3-IN-1 — MASTER MOCKUP BUNDLE", "LIFEQ SUPERAPP — MASTER MOCKUP BUNDLE")
content = content.replace("Justifica 3-in-1 — Semua 12 Mockup High-Fidelity", "LifeQ SuperApp — Semua 12 Mockup High-Fidelity (Sehatifiqa, Justifiqa, Qualifa)")

with open(os.path.join(TOOLS_DIR, 'rebuild_gabungan_mockup.py'), 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated generators with LifeQ branding!")

# Run all generators
subprocess.run(["python", "gen_dashboards.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "gen_admin_mockups.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "gen_domain_mockups.py"], cwd=TOOLS_DIR, check=True)

# Also patch standalone HTML files in Mockups dir
for fname in os.listdir(MOCKUP_DIR):
    if fname.endswith(".html") and fname != "gabungan_semua_mockup.html":
        fpath = os.path.join(MOCKUP_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            html = f.read()
        
        orig = html
        html = re.sub(r'Justifica(?!\s*-\s*Modul|\s*3-in-1)', 'LifeQ', html, flags=re.IGNORECASE)
        html = html.replace("JUSTIFICA", "LIFEQ")
        html = html.replace("Justifica", "LifeQ")
        
        if html != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(html)

# Now rebuild gabungan
subprocess.run(["python", "rebuild_gabungan_mockup.py"], cwd=TOOLS_DIR, check=True)
print("Rebuilt gabungan_semua_mockup.html successfully!")
