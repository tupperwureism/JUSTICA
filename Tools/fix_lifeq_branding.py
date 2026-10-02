"""
Script to cleanly fix LifeQ SuperApp, Sehatifiqa, Justifiqa, and Qualifa branding across generators and mockups.
"""

import os
import re
import subprocess

TOOLS_DIR = r'd:\justificadll\Tools'
MOCKUP_DIR = r'd:\justificadll\Mockups'

# 1. FIX GEN_DOMAIN_MOCKUPS.PY
with open(os.path.join(TOOLS_DIR, 'gen_domain_mockups.py'), 'r', encoding='utf-8') as f:
    code = f.read()

# Fix brand logos in gen_domain_mockups
code = re.sub(r'<div class="brand">.*?MEDIS.*?</div>', '<div class="brand">Sehatifiqa <span style="color: #34d399; font-size: 0.7rem; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.4);">BY LIFEQ</span></div>', code)
code = re.sub(r'<div class="brand">.*?HUKUM.*?</div>', '<div class="brand">Justifiqa <span style="color: #facc15; font-size: 0.7rem; background: rgba(234,179,8,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.4);">BY LIFEQ</span></div>', code)
code = re.sub(r'<div class="brand">.*?PSIKOLOGI.*?</div>', '<div class="brand">Qualifa <span style="color: #c084fc; font-size: 0.7rem; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.4);">BY LIFEQ</span></div>', code)

with open(os.path.join(TOOLS_DIR, 'gen_domain_mockups.py'), 'w', encoding='utf-8') as f:
    f.write(code)

# 2. FIX GEN_DASHBOARDS.PY
with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'r', encoding='utf-8') as f:
    code = f.read()

# Fix Klien Portal wording
code = code.replace("Konsultasi Medis, Bantuan Justifiqa (Hukum) Pro Bono Rp 0, & Psikoedukasi Mental Health", "Konsultasi Kesehatan (Sehatifiqa), Bantuan Hukum Pro Bono Rp 0 (Justifiqa), & Psikoedukasi Mental Health (Qualifa)")
code = code.replace("Konsultasi Medis, Bantuan Hukum Pro Bono Rp 0, & Psikoedukasi Mental Health", "Konsultasi Kesehatan (Sehatifiqa), Bantuan Hukum Pro Bono Rp 0 (Justifiqa), & Psikoedukasi Mental Health (Qualifa)")
code = code.replace("Akta Justifiqa (Hukum)", "Akta Hukum")
code = code.replace("Akta Hukum Justifiqa (Hukum)", "Akta Hukum")

# Fix Mitra Portal 3-choice selector right before Metric Cards
mitra_selector = """
        <!-- 3-Workstation Domain Selector -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem;">
            <div class="card" style="margin: 0; border-color: rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-success">MODUL KESEHATAN</span>
                    <span style="font-size: 1.5rem;">🩺</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Sehatifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Workstation Medis, e-Resep DDI Checker, SOAP Note, & ICD-10 Kemenkes.</p>
                <a href="mockup_modul_medis.html" class="btn btn-success" style="width: 100%; justify-content: center; font-size: 0.85rem;">🩺 Buka Sehatifiqa</a>
            </div>
            <div class="card" style="margin: 0; border-color: rgba(234,179,8,0.4); background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-warning" style="background: rgba(234,179,8,0.2); color: #facc15; border-color: rgba(234,179,8,0.4);">MODUL HUKUM</span>
                    <span style="font-size: 1.5rem;">⚖️</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Justifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Workstation Litigasi, IRAC Drafting Engine, & e-Meterai Perum Peruri.</p>
                <a href="mockup_modul_hukum.html" class="btn btn-gold" style="width: 100%; justify-content: center; font-size: 0.85rem;">⚖️ Buka Justifiqa</a>
            </div>
            <div class="card" style="margin: 0; border-color: rgba(168,85,247,0.4); background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-purple">MODUL PSIKOLOGI</span>
                    <span style="font-size: 1.5rem;">🧠</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Qualifa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Workstation Mental Health, Asesmen DASS-21, DAP Note, & Crisis 119.</p>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; width: 100%; justify-content: center; font-size: 0.85rem;">🧠 Buka Qualifa</a>
            </div>
        </div>

        <!-- Metric Cards -->"""

if "<!-- 3-Workstation Domain Selector -->" not in code:
    code = code.replace("<!-- Metric Cards -->", mitra_selector)

with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed scripts. Running generators...")
subprocess.run(["python", "gen_dashboards.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "gen_admin_mockups.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "gen_domain_mockups.py"], cwd=TOOLS_DIR, check=True)

# Also fix any remaining clunkiness in individual files
for fname in os.listdir(MOCKUP_DIR):
    if fname.endswith(".html") and fname != "gabungan_semua_mockup.html":
        fpath = os.path.join(MOCKUP_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            html = f.read()
        
        orig = html
        html = html.replace("LifeQ MEDIS", "Sehatifiqa")
        html = html.replace("LifeQ HUKUM", "Justifiqa")
        html = html.replace("LifeQ PSIKOLOGI", "Qualifa")
        html = html.replace("Akta Justifiqa (Hukum)", "Akta Hukum")
        html = html.replace("Bantuan Justifiqa (Hukum)", "Bantuan Hukum")
        
        if html != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(html)

subprocess.run(["python", "rebuild_gabungan_mockup.py"], cwd=TOOLS_DIR, check=True)
print("Rebuilt gabungan successfully!")
