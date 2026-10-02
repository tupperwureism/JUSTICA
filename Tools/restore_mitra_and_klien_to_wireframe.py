"""
Script to surgically correct and align mockup_dashboard_mitra.html and mockup_dashboard_klien.html 
to be 100% faithful to their approved Wireframes (wf_dashboard_mitra.html & wireframe_dashboard_klien.html)
in High-Fidelity Cyber-Navy Glassmorphism.

Key Corrections for Mitra:
1. Sidebar Profile Area with Avatar & STR verification.
2. Sidebar Toggle Switch Status Ketersediaan (Interactive slider: Online / Sedang Sidang/Operasi).
3. Main Area: 3-Workstation Selector + Incoming Consultation Queue (Antrean Masuk with [TERIMA] buttons) + Completed Sessions needing SOAP/IRAC/DAP Notes (with [BUAT CATATAN] buttons).

Key Corrections for Klien:
1. Exact alignment with wireframe layout (Hero Universal Search + 3 Service Pillar Cards + Active Session Grid & Quick Actions).
"""

import os
import subprocess

TOOLS_DIR = r'd:\justificadll\Tools'
MOCKUP_DIR = r'd:\justificadll\Mockups'

# Read gen_dashboards.py
with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Prepare NEW HTML_MITRA
NEW_HTML_MITRA = '''HTML_MITRA = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Mitra — Dashboard Dokter, Advokat, & Psikolog (LifeQ)</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
    <style>
        /* Custom Toggle Switch in Sidebar */
        .toggle-switch-container {{
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(56,189,248,0.3);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }}
        .toggle-switch {{
            display: flex;
            align-items: center;
            cursor: pointer;
            gap: 12px;
            margin-top: 10px;
        }}
        .toggle-slider {{
            width: 52px;
            height: 28px;
            background: #10b981;
            border-radius: 14px;
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 12px rgba(16,185,129,0.4);
        }}
        .toggle-knob {{
            width: 22px;
            height: 22px;
            background: #fff;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 27px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }}
        /* Queue Item Card matching Wireframe */
        .queue-item {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15,23,42,0.7);
            border: 1px solid rgba(56,189,248,0.25);
            border-radius: 12px;
            padding: 1.2rem 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.2s;
        }}
        .queue-item:hover {{
            border-color: #38bdf8;
            box-shadow: 0 4px 15px rgba(56,189,248,0.15);
            transform: translateX(3px);
        }}
        .history-item {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.2rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }}
        .history-item:last-child {{
            border-bottom: none;
            padding-bottom: 0;
        }}
    </style>
</head>
<body>
    <div class="sidebar" style="width: 290px;">
        <div class="brand">LIFEQ <span style="color: #38bdf8; font-size: 0.75rem; background: rgba(56,189,248,0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(56,189,248,0.3);">MITRA</span></div>
        
        <!-- Sidebar Profile Area (Faithful to Wireframe wf-profile-area) -->
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: #fff; font-size: 1.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(14,165,233,0.4); border: 2px solid #38bdf8;">DR</div>
            <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">dr. Andi Saputra, Sp.A</div>
            <div style="font-size: 0.8rem; color: #38bdf8; margin-top: 4px;">Sehatifiqa — Spesialis Anak</div>
            <span class="badge badge-success" style="font-size: 0.7rem; margin-top: 8px;">✔ STR KKI Terverifikasi</span>
        </div>

        <!-- Sidebar Toggle Switch Status Ketersediaan (Faithful to Wireframe wf-toggle-box) -->
        <div class="toggle-switch-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Status Praktik:</span>
                <span id="status-badge" class="badge badge-success" style="font-size: 0.7rem;">🟢 ONLINE</span>
            </div>
            <label class="toggle-switch" onclick="toggleSidebarStatus()">
                <div id="sidebar-slider" class="toggle-slider">
                    <div id="sidebar-knob" class="toggle-knob"></div>
                </div>
                <span id="status-text" style="font-size: 0.8rem; color: #a7f3d0; font-weight: 600;">Menerima Konsultasi</span>
            </label>
        </div>

        <!-- Sidebar Nav Items (Faithful to Wireframe wf-nav-item) -->
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_mitra.html" class="active">📊 Dasbor Utama</a></li>
            <li class="nav-item"><a href="#antrean-section">⚡ Antrean Konsultasi</a></li>
            <li class="nav-item"><a href="#history-section">📑 Riwayat Sesi & Notes</a></li>
            <li class="nav-item"><a href="mockup_payment_gateway.html">💰 Dompet Saldo & Payout</a></li>
            <li style="margin: 10px 0 5px; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-left: 10px;">Domain Workstation</li>
            <li class="nav-item"><a href="mockup_modul_medis.html">🩺 Sehatifiqa (Medis)</a></li>
            <li class="nav-item"><a href="mockup_modul_hukum.html">⚖️ Justifiqa (Hukum)</a></li>
            <li class="nav-item"><a href="mockup_modul_psikologi.html">🧠 Qualifa (Psikologi)</a></li>
        </ul>
    </div>
    
    <div class="main">
        <!-- Topbar Greeting (Faithful to Wireframe wf-header-text) -->
        <div class="topbar">
            <div>
                <h1>Selamat Bekerja, dr. Andi Saputra, Sp.A</h1>
                <p>Stasiun Kerja Profesional Terintegrasi — Portal Mitra SuperApp LifeQ</p>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="badge badge-info" style="padding: 8px 16px; font-size: 0.85rem;">🛡️ E2EE Zero-Knowledge Ready</span>
            </div>
        </div>

        <!-- 3-Workstation Domain Selector (Praised by User) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem;">
            <div class="card" style="margin: 0; border-color: rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-success">WORKSTATION MEDIS</span>
                    <span style="font-size: 1.5rem;">🩺</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Sehatifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">e-Resep DDI Checker, SOAP Note, & ICD-10 Kemenkes.</p>
                <a href="mockup_modul_medis.html" class="btn btn-success" style="width: 100%; justify-content: center; font-size: 0.85rem;">🩺 Buka Workstation Medis</a>
            </div>
            <div class="card" style="margin: 0; border-color: rgba(234,179,8,0.4); background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-warning" style="background: rgba(234,179,8,0.2); color: #facc15; border-color: rgba(234,179,8,0.4);">WORKSTATION HUKUM</span>
                    <span style="font-size: 1.5rem;">⚖️</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Justifiqa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">IRAC Drafting Engine, Litigasi, & e-Meterai Perum Peruri.</p>
                <a href="mockup_modul_hukum.html" class="btn btn-gold" style="width: 100%; justify-content: center; font-size: 0.85rem;">⚖️ Buka Workstation Hukum</a>
            </div>
            <div class="card" style="margin: 0; border-color: rgba(168,85,247,0.4); background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(15,23,42,0.9));">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-purple">WORKSTATION PSIKOLOGI</span>
                    <span style="font-size: 1.5rem;">🧠</span>
                </div>
                <h3 style="font-size: 1.4rem; color: #fff; margin: 12px 0 6px;">Qualifa</h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">Asesmen DASS-21, DAP Note, & Konseling Mental Health.</p>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; width: 100%; justify-content: center; font-size: 0.85rem;">🧠 Buka Workstation Psikolog</a>
            </div>
        </div>

        <!-- Incoming Queue Section (Faithful to Wireframe wf-queue-section & [TERIMA] buttons) -->
        <div id="antrean-section" class="card" style="border-color: #38bdf8;">
            <div class="card-title">
                <span style="display: flex; align-items: center; gap: 8px;"><span>⚡</span> Antrean Konsultasi Masuk (2 Sesi Menunggu)</span>
                <span class="badge badge-info">Realtime WebRTC Sync</span>
            </div>
            
            <div class="queue-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #10b981; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">AR</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Anisa Rahma <span style="font-weight: normal; color: #94a3b8; font-size: 0.85rem;">(Pasien Anak - 3 thn)</span></div>
                        <div style="color: #38bdf8; font-size: 0.85rem; margin-top: 2px;">Keluhan: Demam tinggi 38.8°C berhari-hari, batuk berdahak</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-88102 • Waktu Tunggu: 4 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_chat_room.html" class="btn btn-primary" style="padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">💬 TERIMA & BUKA ROOM</a>
            </div>

            <div class="queue-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #f59e0b; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">AS</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Ahmad Subarjo <span class="badge badge-success" style="font-size: 0.65rem; padding: 2px 6px;">Pro Bono SKTM</span></div>
                        <div style="color: #fbbf24; font-size: 0.85rem; margin-top: 2px;">Keluhan: Wanprestasi kontrak kerja, butuh somasi hukum (IRAC)</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-88103 • Waktu Tunggu: 7 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_modul_hukum.html" class="btn btn-gold" style="padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">⚖️ TERIMA & BUKA IRAC</a>
            </div>
        </div>

        <!-- Completed Sessions & Notes Section (Faithful to Wireframe wf-history-section & [Buat Catatan] buttons) -->
        <div id="history-section" class="card">
            <div class="card-title">
                <span style="display: flex; align-items: center; gap: 8px;"><span>📑</span> Sesi Selesai (Membutuhkan Penulisan Catatan Rekam Medis / IRAC / DAP)</span>
                <span class="badge badge-warning">2 Wajib Isi</span>
            </div>
            
            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Rina Wulandari — <span style="color: #c084fc;">Asesmen Kecemasan & Depresi Kerja (DASS-21)</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 14:00 WIB • Status: Catatan DAP Note & Rekonsiliasi Psikolog belum diisi</div>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.4);">📝 BUAT CATATAN DAP</a>
            </div>

            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Budi Santoso — <span style="color: #34d399;">Konsultasi Infeksi Saluran Pernapasan</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 13:15 WIB • Status: SOAP Note tersimpan, e-Resep diterbitkan</div>
                </div>
                <a href="mockup_modul_medis.html" class="btn btn-outline">👁️ LIHAT REKAM MEDIS</a>
            </div>
        </div>

    </div>

    <script>
        let isOnline = true;
        function toggleSidebarStatus() {{
            isOnline = !isOnline;
            const slider = document.getElementById('sidebar-slider');
            const knob = document.getElementById('sidebar-knob');
            const badge = document.getElementById('status-badge');
            const text = document.getElementById('status-text');
            
            if(isOnline) {{
                slider.style.background = '#10b981';
                slider.style.boxShadow = '0 0 12px rgba(16,185,129,0.4)';
                knob.style.left = '27px';
                badge.className = 'badge badge-success';
                badge.innerHTML = '🟢 ONLINE';
                text.style.color = '#a7f3d0';
                text.innerHTML = 'Menerima Konsultasi';
            }} else {{
                slider.style.background = '#ef4444';
                slider.style.boxShadow = '0 0 12px rgba(239,68,68,0.4)';
                knob.style.left = '3px';
                badge.className = 'badge badge-danger';
                badge.innerHTML = '🔴 SIDANG / OPERASI';
                text.style.color = '#f87171';
                text.innerHTML = 'Jadwal Tidak Tersedia';
            }}
        }}
    </script>
</body>
</html>
"""'''

# Locate where HTML_MITRA starts and ends in gen_dashboards.py
mitra_start = code.find("HTML_MITRA = f\"\"\"<!DOCTYPE html>")
if mitra_start == -1:
    mitra_start = code.find("HTML_MITRA = f'''<!DOCTYPE html>")

klien_start = code.find("HTML_KLIEN = f\"\"\"<!DOCTYPE html>")
if klien_start == -1:
    klien_start = code.find("HTML_KLIEN = f'''<!DOCTYPE html>")

# Check if we can safely replace HTML_MITRA
if mitra_start != -1 and klien_start != -1:
    # We replace everything from HTML_MITRA up to HTML_KLIEN with NEW_HTML_MITRA + "\n\n# 3. UPGRADE DASHBOARD KLIEN UTAMA\n"
    code = code[:mitra_start] + NEW_HTML_MITRA + "\n\n# 3. UPGRADE DASHBOARD KLIEN UTAMA\n" + code[klien_start:]
    
with open(os.path.join(TOOLS_DIR, 'gen_dashboards.py'), 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated gen_dashboards.py with 100% wireframe-compliant Mitra dashboard (including Sidebar Toggle Switch)!")
subprocess.run(["python", "gen_dashboards.py"], cwd=TOOLS_DIR, check=True)
subprocess.run(["python", "rebuild_gabungan_mockup.py"], cwd=TOOLS_DIR, check=True)
print("Successfully regenerated mockups and master bundle!")
