"""
Script to restore and elevate mockup_dashboard_klien.html to match the approved Wireframe structure:
1. Hero Search Bar (Universal Search)
2. 3 Service Pillar Cards (Sehatifiqa, Justifiqa, Qualifa)
3. Active Consultation & Pro Bono Status (Bottom Left)
4. Quick Actions & Document History (Bottom Right)
"""

import os
import subprocess

TOOLS_DIR = r'd:\justificadll\Tools'
MOCKUP_DIR = r'd:\justificadll\Mockups'

# Read gen_dashboards.py
with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'r', encoding='utf-8') as f:
    code = f.read()

# Locate where HTML_KLIEN starts
start_idx = code.find("HTML_KLIEN = f\"\"\"<!DOCTYPE html>")
if start_idx == -1:
    start_idx = code.find("HTML_KLIEN = f'''<!DOCTYPE html>")

NEW_HTML_KLIEN = '''HTML_KLIEN = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Klien — Dashboard Pasien & Pencari Keadilan (LifeQ)</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
    <style>
        .grid-2col {{ display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 2rem; }}
        @media (max-width: 1024px) {{ .grid-2col {{ grid-template-columns: 1fr; }} }}
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="brand">LIFEQ <span style="color: #34d399; font-size: 0.75rem; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.4);">KLIEN</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_klien.html" class="active">📊 Dashboard Klien</a></li>
            <li class="nav-item"><a href="mockup_chat_room.html">💬 Ruang Konsultasi (E2EE)</a></li>
            <li class="nav-item"><a href="mockup_payment_gateway.html">💳 Pembayaran Escrow & Klaim</a></li>
            <li class="nav-item"><a href="mockup_modul_psikologi.html">🌱 Mood Tracker & DASS-21</a></li>
        </ul>
    </div>
    <div class="main">
        <!-- Top Bar -->
        <div class="topbar">
            <div>
                <h1>Selamat Datang di LifeQ SuperApp, Ahmad Subarjo</h1>
                <p>Portal Terintegrasi untuk Layanan Kesehatan (Sehatifiqa), Bantuan Hukum Pro Bono (Justifiqa), & Kesehatan Mental (Qualifa)</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; background: rgba(16,185,129,0.15); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(16,185,129,0.4);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 700;">AS</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">Ahmad Subarjo</div>
                    <div style="font-size: 0.75rem; color: #34d399;">✔ SKTM Pro Bono Verified</div>
                </div>
            </div>
        </div>

        <!-- Hero Search Section (Universal Search Bar) -->
        <div class="card" style="background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(15,23,42,0.9)); border-color: #38bdf8; padding: 2rem; margin-bottom: 2.5rem; text-align: center;">
            <h2 style="font-size: 1.6rem; color: #fff; margin-bottom: 8px;">Apa yang ingin Anda konsultasikan hari ini?</h2>
            <p style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 1.5rem;">Cari gejala penyakit, masalah hukum perdata/pidana, atau asesmen stres klinis dalam satu portal.</p>
            <div style="max-width: 700px; margin: 0 auto; display: flex; gap: 10px;">
                <input type="text" class="input-control" placeholder="🔍 Contoh: 'Demam anak berhari-hari', 'Contoh somasi wanprestasi', 'Tes DASS-21'..." style="border-radius: 30px; padding: 14px 24px; font-size: 1rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(56,189,248,0.5);">
                <button class="btn btn-primary" style="border-radius: 30px; padding: 0 24px; font-weight: 700;" onclick="alert('🔍 Mencarikan dokter spesialis, advokat pro bono, atau konselor yang relevan...')">Cari</button>
            </div>
        </div>

        <!-- 3 Main Service Pillars (Sehatifiqa, Justifiqa, Qualifa) -->
        <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;"><span>⚡</span> Layanan Terintegrasi LifeQ SuperApp</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem;">
            <!-- Modul Medis -->
            <div class="card" style="margin: 0; border-color: rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-success">MODUL MEDIS</span>
                    <span style="font-size: 1.5rem;">🩺</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Sehatifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Konsultasi dokter spesialis, e-Resep digital dengan DDI Checker, dan tele-medisin Kemenkes.</p>
                <a href="mockup_chat_room.html" class="btn btn-success" style="width: 100%; justify-content: center; font-size: 0.85rem;">🩺 Konsultasi Dokter</a>
            </div>
            <!-- Modul Hukum -->
            <div class="card" style="margin: 0; border-color: rgba(234,179,8,0.4); background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-warning" style="background: rgba(234,179,8,0.2); color: #facc15; border-color: rgba(234,179,8,0.4);">MODUL HUKUM</span>
                    <span style="font-size: 1.5rem;">⚖️</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Justifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Konsultasi advokat Peradi, pembuatan somasi/kuasa hukum (IRAC), e-Meterai, dan Pro Bono Rp 0.</p>
                <a href="mockup_modul_hukum.html" class="btn btn-gold" style="width: 100%; justify-content: center; font-size: 0.85rem;">⚖️ Konsultasi Hukum</a>
            </div>
            <!-- Modul Psikologi -->
            <div class="card" style="margin: 0; border-color: rgba(168,85,247,0.4); background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-purple">MODUL PSIKOLOGI</span>
                    <span style="font-size: 1.5rem;">🧠</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Qualifa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Konseling psikolog klinis SIPP, asesmen DASS-21, DAP Note, dan tombol darurat Crisis 119.</p>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; width: 100%; justify-content: center; font-size: 0.85rem;">🧠 Asesmen Mental</a>
            </div>
        </div>

        <!-- Bottom Layout (Schedule & Quick Actions) -->
        <div class="grid-2col">
            <!-- Left: Active Consultation & Pro Bono Banner -->
            <div>
                <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;"><span>💬</span> Sesi Aktif & Status Bantuan</h3>
                
                <!-- Pro Bono Banner -->
                <div style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3)); border: 1px solid #10b981; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.8rem;">🛡️</span>
                        <div>
                            <div style="font-weight: 700; color: #34d399; font-size: 0.95rem;">BANTUAN HUKUM PRO BONO RP 0 DISETUJUI</div>
                            <div style="color: #d1fae5; font-size: 0.8rem; margin-top: 2px;">NIK terverifikasi DTKS Desil 1. Biaya advokat 100% disubsidi.</div>
                        </div>
                    </div>
                    <span class="badge badge-success">AKTIF</span>
                </div>

                <!-- Active Consultation Card -->
                <div class="card" style="border-color: #0ea5e9; margin-bottom: 0;">
                    <div class="card-title">
                        <span>Konsultasi Sedang Berlangsung</span>
                        <span class="badge badge-info">E2EE Encrypted</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 45px; height: 45px; border-radius: 50%; background: #0ea5e9; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">DR</div>
                            <div>
                                <div style="font-size: 1rem; font-weight: 700; color: #fff;">dr. Andi Saputra, Sp.A</div>
                                <div style="color: #38bdf8; font-size: 0.8rem;">Spesialis Anak — RS Siloam</div>
                                <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 2px;">Topik: Demam & infeksi pernapasan anak</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.75rem; color: #94a3b8;">DURASI TERSISA:</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #34d399; font-family: 'Roboto Mono', monospace; margin: 4px 0 8px;">18:45</div>
                            <a href="mockup_chat_room.html" class="btn btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">💬 Masuk Room</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Quick Actions & Document History -->
            <div>
                <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;"><span>📑</span> Riwayat & Aksi Cepat</h3>
                <div class="card" style="margin-bottom: 0; padding: 1.5rem;">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <!-- Item 1 -->
                        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div>
                                <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">e-Resep Digital (Amoxicillin)</div>
                                <div style="color: #64748b; font-size: 0.75rem;">Oleh: dr. Andi Saputra, Sp.A (02 Jul 2026)</div>
                            </div>
                            <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.75rem;" onclick="alert('📥 Mengunduh e-Resep PDF...')">📥 Unduh Resep</button>
                        </div>
                        <!-- Item 2 -->
                        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div>
                                <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">Surat Kuasa Litigasi Pro Bono</div>
                                <div style="color: #64748b; font-size: 0.75rem;">Oleh: Budi Santoso, S.H., M.H. (01 Jul 2026)</div>
                            </div>
                            <button class="btn btn-gold" style="padding: 6px 10px; font-size: 0.75rem;" onclick="alert('📥 Mengunduh Akta Hukum PDF...')">📥 Unduh Akta</button>
                        </div>
                        <!-- Item 3 -->
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">Jurnal Mood Tracker Harian</div>
                                <div style="color: #c084fc; font-size: 0.75rem;">Status: Stabil / Normal (Qualifa DASS-21)</div>
                            </div>
                            <a href="mockup_modul_psikologi.html" class="btn" style="background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); padding: 6px 10px; font-size: 0.75rem;">🌱 Buka Jurnal</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_klien.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_KLIEN.strip() + "\\n")

print("Successfully generated 3 Unified Main Dashboards (Admin, Mitra, Klien)!")
'''

# Replace from start_idx onwards
new_code = code[:start_idx] + NEW_HTML_KLIEN

with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Updated gen_dashboards.py with restored wireframe layout for Klien!")
subprocess.run(["python", "gen_dashboards.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "rebuild_gabungan_mockup.py"], cwd=TOOLS_DIR, check=True)
print("Rebuilt gabungan_semua_mockup.html successfully!")
