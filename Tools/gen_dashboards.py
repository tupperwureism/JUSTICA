"""
Script to generate 3 Unified Main Dashboards matching the Cyber-Navy Glassmorphism Design:
1. mockup_dashboard_admin.html (Super Admin Control Tower & WORM Health Monitor)
2. mockup_dashboard_mitra.html (Portal Mitra Utama — Medis, Justifiqa (Hukum), Qualifa (Psikologi))
3. mockup_dashboard_klien.html (Portal Klien & Pasien Terintegrasi)
"""

import os

MOCKUP_DIR = r'd:\justificadll\Mockups'
os.makedirs(MOCKUP_DIR, exist_ok=True)

SHARED_CSS = """
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
    body { background: #080c14; color: #f8fafc; min-height: 100vh; display: flex; }
    
    .sidebar { width: 260px; background: #0d1322; border-right: 1px solid rgba(255,255,255,0.08); padding: 1.8rem 1.2rem; display: flex; flex-direction: column; gap: 1.5rem; flex-shrink: 0; }
    .brand { font-size: 1.4rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .brand span { color: #0ea5e9; }
    .badge-admin { background: rgba(14,165,233,0.15); color: #38bdf8; font-size: 0.7rem; padding: 3px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; border: 1px solid rgba(14,165,233,0.3); }
    .nav-menu { display: flex; flex-direction: column; gap: 0.4rem; list-style: none; }
    .nav-item a { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1rem; color: #94a3b8; text-decoration: none; border-radius: 10px; font-weight: 500; font-size: 0.95rem; transition: all 0.2s; }
    .nav-item a:hover, .nav-item a.active { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.25); }
    
    .main { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; max-height: 100vh; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .topbar h1 { font-size: 1.8rem; font-weight: 700; color: #fff; }
    .topbar p { color: #64748b; font-size: 0.95rem; margin-top: 4px; }
    .user-profile { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.08); }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #3b82f6); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; }
    
    .card { background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.8rem; backdrop-filter: blur(12px); margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .card-title { font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: space-between; }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; }
    td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; vertical-align: middle; }
    tr:hover { background: rgba(255,255,255,0.02); }
    
    .badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .badge-success { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .badge-warning { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .badge-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-info { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); }
    .badge-purple { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
    
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; }
    .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.3); }
</style>
"""

# 1. UPGRADE DASHBOARD ADMIN UTAMA
HTML_ADMIN = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal — Dashboard Utama Super Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">LIFEQ <span class="badge-admin">SUPERAPP</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_admin.html" class="active">📊 Dashboard Utama</a></li>
            <li class="nav-item"><a href="mockup_admin_verifikasi.html">🛡️ Verifikasi Lisensi & SKTM</a></li>
            <li class="nav-item"><a href="mockup_admin_pelanggaran.html">⚖️ Manajemen Akun & Etik</a></li>
            <li class="nav-item"><a href="mockup_admin_keuangan.html">💰 Keuangan & PPh 21</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Super Admin Control Tower & Sistem Audit WORM</h1>
                <p>Pemantauan Kesehatan Infrastruktur, Metrik Real-Time 3 Domain, & Zero-Knowledge E2EE Gateway</p>
            </div>
            <div class="user-profile">
                <div class="avatar">SA</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">Super Admin</div>
                    <div style="font-size: 0.75rem; color: #34d399;">● WORM Audit Active</div>
                </div>
            </div>
        </div>

        
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

        <!-- Metric Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9)); border-color: rgba(14,165,233,0.3);">
                <div style="color: #94a3b8; font-size: 0.85rem;">TOTAL MITRA TERVERIFIKASI</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">1.420 <span style="font-size: 1rem; font-weight: normal; color: #38bdf8;">Profesional</span></div>
                <div style="color: #34d399; font-size: 0.75rem; margin-top: 6px;">✔ STR, SIPP, Peradi Valid</div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9)); border-color: rgba(16,185,129,0.3);">
                <div style="color: #34d399; font-size: 0.85rem;">TOTAL KLIEN & PASIEN</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">18.500 <span style="font-size: 1rem; font-weight: normal; color: #a7f3d0;">Akun</span></div>
                <div style="color: #cbd5e1; font-size: 0.75rem; margin-top: 6px;">+120 Klien Pro Bono / Bersubsidi</div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(15,23,42,0.9)); border-color: rgba(245,158,11,0.3);">
                <div style="color: #fbbf24; font-size: 0.85rem;">ANTREAN VERIFIKASI</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">17 <span style="font-size: 1rem; font-weight: normal; color: #fde68a;">Tiket</span></div>
                <div style="margin-top: 8px;"><a href="mockup_admin_verifikasi.html" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem; width: 100%; justify-content: center; border-color: #fbbf24; color: #fbbf24;">⚡ Verifikasi Sekarang</a></div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(15,23,42,0.9)); border-color: rgba(239,68,68,0.3);">
                <div style="color: #f87171; font-size: 0.85rem;">SIDANG ETIK AKTIF</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">2 <span style="font-size: 1rem; font-weight: normal; color: #fca5a5;">Kasus</span></div>
                <div style="margin-top: 8px;"><a href="mockup_admin_pelanggaran.html" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem; width: 100%; justify-content: center;">🏛️ Buka Sidang Etik</a></div>
            </div>
        </div>

        <!-- API Health & Infrastructure -->
        <div class="card">
            <div class="card-title">
                <span>⚡ Status Kesehatan Integrasi API Nasional & Kriptografi</span>
                <span class="badge badge-success">Sistem 99.99% Uptime</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">SATUSEHAT KEMENKES (MEDIS)</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">ICD-10 & e-Resep Node</strong>
                    </div>
                    <span class="badge badge-success">✔ ONLINE (12ms)</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">HIMPSI NATIONAL REGISTRY</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">SIPP Check & Crisis 119</strong>
                    </div>
                    <span class="badge badge-success">✔ ONLINE (18ms)</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">PERADI REGISTRY & PERURI</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">e-Meterai Rp 10.000 API</strong>
                    </div>
                    <span class="badge badge-success">✔ ONLINE (24ms)</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">DUKCAPIL & DTKS KEMENSOS</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">NIK & Desil 1 DTKS / SKTM</strong>
                    </div>
                    <span class="badge badge-success">✔ ONLINE (15ms)</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">WORM STORAGE ENGINE</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">SHA-256 Immutable Vault</strong>
                    </div>
                    <span class="badge badge-info">🔒 ACTIVE SEAL</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #94a3b8; font-size: 0.8rem;">PAYOUT BANK GATEWAY</div>
                        <strong style="color: #fff; margin-top: 4px; display: block;">Escrow & PPh 21 Auto</strong>
                    </div>
                    <span class="badge badge-success">✔ ONLINE (30ms)</span>
                </div>
            </div>
        </div>

        <!-- Recent Audit Log Table -->
        <div class="card">
            <div class="card-title">
                <span>🛡️ Log Jejak Audit Sistem Terbaru (WORM SHA-256 Checksum)</span>
                <a href="mockup_admin_keuangan.html" class="btn btn-outline" style="font-size: 0.8rem;">📥 Ekspor Laporan Lengkap</a>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Waktu (WIB)</th>
                            <th>Aktor / Modul</th>
                            <th>Aktivitas Sistem & Compliance</th>
                            <th>Domain</th>
                            <th>SHA-256 Checksum Seal</th>
                            <th>Status Audit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>02 Juli 2026, 14:30:12</td>
                            <td><code>dr. Andi Saputra, Sp.A</code></td>
                            <td>Menerbitkan e-Resep dengan Clinical Override Rationale (DDI Amoxicillin+Allopurinol)</td>
                            <td><span class="badge badge-info">Medis</span></td>
                            <td><code style="font-size: 0.75rem; color: #34d399;">8f9a...e190</code></td>
                            <td><span class="badge badge-success">✔ WORM LOCKED</span></td>
                        </tr>
                        <tr>
                            <td>02 Juli 2026, 14:15:00</td>
                            <td><code>Budi Santoso, S.H.</code></td>
                            <td>Membubuhkan stempel e-Meterai Perum Peruri Rp 10.000 pada Surat Kuasa Litigasi</td>
                            <td><span class="badge badge-warning" style="background: rgba(234,179,8,0.15); color: #facc15; border-color: rgba(234,179,8,0.3);">Justifiqa (Hukum)</span></td>
                            <td><code style="font-size: 0.75rem; color: #34d399;">1a90...4421</code></td>
                            <td><span class="badge badge-success">✔ WORM LOCKED</span></td>
                        </tr>
                        <tr>
                            <td>02 Juli 2026, 13:50:45</td>
                            <td><code>Sistem DASS-21</code></td>
                            <td>Memicu Mandatory Crisis Protocol 119 Ext 8 (Skor Severe atas nama Klien CL-8819)</td>
                            <td><span class="badge badge-purple">Qualifa (Psikologi)</span></td>
                            <td><code style="font-size: 0.75rem; color: #34d399;">4c21...718b</code></td>
                            <td><span class="badge badge-danger">🚨 CRISIS ALERT</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_admin.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_ADMIN.strip() + "\n")

# 2. UPGRADE DASHBOARD MITRA UTAMA (REVISI BEDAH LAYOUT & LOGIKA BISNIS KEUANGAN SD-18 & 3 DOMAIN PERSPEKTIF)
def gen_mitra_html(domain_key):
    if domain_key == 'medis':
        initials = "DR"
        name = "dr. Andi Saputra, Sp.A"
        spec_title = "Sehatifiqa — Spesialis Anak"
        reg_badge = "✔ STR KKI Terverifikasi"
        reg_color = "#38bdf8"
        border_color = "#38bdf8"
        workstation_title = "Stasiun Kerja Dokter Spesialis Anak — Portal Mitra SuperApp LifeQ (Domain Medis)"
        queue_html = """
            <div class="queue-item" style="border-color: rgba(56,189,248,0.3);">
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

            <div class="queue-item" style="border-color: rgba(56,189,248,0.3);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #0ea5e9; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">BK</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Budi Kurniawan <span class="badge badge-success" style="font-size: 0.65rem; padding: 2px 6px;">Telemedisin Bersubsidi</span> <span style="font-weight: normal; color: #94a3b8; font-size: 0.85rem;">(Pasien Anak - 7 thn)</span></div>
                        <div style="color: #38bdf8; font-size: 0.85rem; margin-top: 2px;">Keluhan: Infeksi saluran pernapasan akut (ISPA), sesak napas ringan</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-88103 • Waktu Tunggu: 7 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_chat_room.html" class="btn btn-primary" style="padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">💬 TERIMA & BUKA ROOM</a>
            </div>"""
        history_html = """
            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Cindy Aurelia — <span style="color: #38bdf8;">Pemeriksaan DDI Checker & SOAP Note</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 14:00 WIB • Status: SOAP Note & e-Resep DDI Checker belum diisi</div>
                </div>
                <a href="mockup_modul_medis.html" class="btn btn-success" style="padding: 0.6rem 1.2rem; font-weight: 700;">📝 BUAT SOAP NOTE</a>
            </div>

            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Doni Saputra — <span style="color: #34d399;">Konsultasi Infeksi Saluran Pernapasan</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 13:15 WIB • Status: SOAP Note tersimpan, e-Resep diterbitkan</div>
                </div>
                <a href="mockup_modul_medis.html" class="btn btn-outline" style="font-weight: 600;">👁️ LIHAT REKAM MEDIS</a>
            </div>"""
        history_title = "Sesi Selesai / Rekam Medis (Wajib Isi SOAP Note & e-Resep)"
        balance_active = "Rp 14.850.000"
        probono_claim = "Rp 45.500.000"
        probono_label = "Total Penghasilan (Total Earned)"
        probono_sub = "Akumulasi Pendapatan Bersih Telemedisin"
        waiting_reconcile = "Rp 2.150.000"
        mod_url = "mockup_modul_medis.html"
        mod_text = "🩺 Buka Workstation Sehatifiqa"
        finance_desc = "Pengelolaan penghasilan konsultasi profesional medis, pemantauan saldo tertahan escrow (SD-18), dan pencairan dana otomatis dengan pemotongan PPh 21."
    elif domain_key == 'hukum':
        initials = "BS"
        name = "Budi Santoso, S.H., M.H."
        spec_title = "Justifiqa — Advokat Litigasi & Perdata"
        reg_badge = "✔ NIA PERADI Terverifikasi"
        reg_color = "#fbbf24"
        border_color = "#fbbf24"
        workstation_title = "Stasiun Kerja Advokat Profesional — Portal Mitra SuperApp LifeQ (Domain Hukum)"
        queue_html = """
            <div class="queue-item" style="border-color: rgba(245,158,11,0.3);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #f59e0b; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">AS</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Ahmad Subarjo <span class="badge badge-success" style="font-size: 0.65rem; padding: 2px 6px;">Pro Bono SKTM</span></div>
                        <div style="color: #fbbf24; font-size: 0.85rem; margin-top: 2px;">Keluhan: Wanprestasi kontrak kerja sepihak, butuh somasi hukum (IRAC)</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-99201 • Waktu Tunggu: 3 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_modul_hukum.html" class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">⚖️ TERIMA & BUKA IRAC</a>
            </div>

            <div class="queue-item" style="border-color: rgba(245,158,11,0.3);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #0ea5e9; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">PT</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">PT Harapan Maju <span class="badge badge-info" style="font-size: 0.65rem; padding: 2px 6px;">Komersial Retainer</span></div>
                        <div style="color: #fbbf24; font-size: 0.85rem; margin-top: 2px;">Keluhan: Sengketa hak cipta perangkat lunak & tinjauan NDA perusahaan</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-99202 • Waktu Tunggu: 8 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_modul_hukum.html" class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">⚖️ TERIMA & BUKA IRAC</a>
            </div>"""
        history_html = """
            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Hendra Wijaya — <span style="color: #fbbf24;">Akta Perjanjian Damai e-Meterai</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 14:30 WIB • Status: Draf IRAC selesai, menunggu pembubuhan e-Meterai Perum Peruri</div>
                </div>
                <a href="mockup_modul_hukum.html" class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 0.6rem 1.2rem; font-weight: 700;">📜 BUBUI E-METERAI</a>
            </div>

            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Siti Aminah — <span style="color: #34d399;">Gugatan Hak Asuh Anak (Pro Bono)</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 11:00 WIB • Status: Berkas gugatan pengadilan resmi diterbitkan</div>
                </div>
                <a href="mockup_modul_hukum.html" class="btn btn-outline" style="font-weight: 600;">👁️ LIHAT BERKAS HUKUM</a>
            </div>"""
        history_title = "Sesi Selesai / Arsip Litigasi (Wajib Drafting IRAC & e-Meterai)"
        balance_active = "Rp 22.400.000"
        probono_claim = "Rp 6.000.000"
        probono_label = "Escrow Pro Bono (Pending BPHN)"
        probono_sub = "8 Sesi Bantuan Litigasi Bersubsidi BPHN (AD-Huk-05)"
        waiting_reconcile = "Rp 3.500.000"
        mod_url = "mockup_modul_hukum.html"
        mod_text = "⚖️ Buka Workstation Justifiqa"
        finance_desc = "Pengelolaan penghasilan konsultasi profesional advokat, riwayat klaim bantuan hukum Pro Bono negara (SD-18 & BPHN), dan pencairan dana otomatis dengan pemotongan PPh 21."
    elif domain_key == 'psikologi':
        initials = "RW"
        name = "Rina Wulandari, M.Psi., Psikolog"
        spec_title = "Qualifa — Psikolog Klinis & Kerja"
        reg_badge = "✔ SIPP IPK Terverifikasi"
        reg_color = "#c084fc"
        border_color = "#c084fc"
        workstation_title = "Stasiun Kerja Psikolog Klinis — Portal Mitra SuperApp LifeQ (Domain Psikologi)"
        queue_html = """
            <div class="queue-item" style="border-color: rgba(192,132,252,0.3);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #a855f7; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">DL</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Dewi Lestari <span class="badge badge-purple" style="font-size: 0.65rem; padding: 2px 6px;">DASS-21 Severe</span></div>
                        <div style="color: #c084fc; font-size: 0.85rem; margin-top: 2px;">Keluhan: Stres kerja berat, kecemasan akut, gejala burnout berat</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-77301 • Waktu Tunggu: 2 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">🧠 TERIMA & KONSELING</a>
            </div>

            <div class="queue-item" style="border-color: rgba(192,132,252,0.3);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #ef4444; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">RP</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">Rama Pratama <span class="badge badge-danger" style="font-size: 0.65rem; padding: 2px 6px;">Crisis 119 Bersubsidi</span></div>
                        <div style="color: #f87171; font-size: 0.85rem; margin-top: 2px;">Keluhan: Serangan panik akut (Panic Attack), butuh intervensi stabilisasi emosi</div>
                        <div style="color: #64748b; font-size: 0.75rem; margin-top: 4px;">ID Sesi: SES-77302 • Waktu Tunggu: 5 menit lalu</div>
                    </div>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; padding: 0.8rem 1.6rem; font-size: 0.95rem; font-weight: 700;">🚨 TERIMA KRISIS 119</a>
            </div>"""
        history_html = """
            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Maya Sari — <span style="color: #c084fc;">Evaluasi Gangguan Tidur & DAP Note</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 15:00 WIB • Status: DAP Note (Data, Assessment, Plan) belum dilengkapi</div>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; padding: 0.6rem 1.2rem; font-weight: 700;">📝 BUAT DAP NOTE</a>
            </div>

            <div class="history-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Kevin Jonathan — <span style="color: #34d399;">Konseling Pemulihan Trauma Relasional</span></div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Sesi selesai 10:30 WIB • Status: DAP Note tersimpan, Rekonsiliasi Jadwal Sesi 2 aktif</div>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn btn-outline" style="font-weight: 600;">👁️ LIHAT DAP NOTE</a>
            </div>"""
        history_title = "Sesi Selesai / Arsip Konseling (Wajib Isi DAP Note & Rekonsiliasi)"
        balance_active = "Rp 11.250.000"
        probono_claim = "Rp 38.200.000"
        probono_label = "Total Penghasilan (Total Earned)"
        probono_sub = "Akumulasi Pendapatan Bersih Konseling"
        waiting_reconcile = "Rp 1.800.000"
        mod_url = "mockup_modul_psikologi.html"
        mod_text = "🧠 Buka Workstation Qualifa"
        finance_desc = "Pengelolaan penghasilan konsultasi profesional psikologi, pemantauan saldo tertahan escrow (SD-18), dan pencairan dana otomatis dengan pemotongan PPh 21."

    return f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Mitra ({domain_key.upper()}) — Workstation Profesional (LifeQ)</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
    <style>
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
        .queue-item {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15,23,42,0.7);
            border: 1px solid {border_color};
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
        .payout-card {{
            background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(15,23,42,0.95));
            border: 1px solid {border_color};
            border-radius: 16px;
            padding: 1.8rem;
            margin-top: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
    </style>
</head>
<body>
    <div class="sidebar" style="width: 290px;">
        <div class="brand">LIFEQ <span style="color: {reg_color}; font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; border: 1px solid {reg_color};">MITRA</span></div>
        
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, {reg_color}, #3b82f6); color: #fff; font-size: 1.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(14,165,233,0.4); border: 2px solid {reg_color};">{initials}</div>
            <div style="font-weight: 700; font-size: 1.05rem; color: #fff;">{name}</div>
            <div style="font-size: 0.8rem; color: {reg_color}; margin-top: 4px;">{spec_title}</div>
            <span class="badge badge-success" style="font-size: 0.7rem; margin-top: 8px;">{reg_badge}</span>
        </div>

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

        <ul class="nav-menu">
            <li class="nav-item"><a href="javascript:void(0)" class="active" onclick="window.scrollTo({{top:0, behavior:'smooth'}}); return false;">📊 Dasbor Utama</a></li>
            <li style="margin: 12px 0 5px; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-left: 10px;">Domain Workstation</li>
            <li class="nav-item"><a href="{mod_url}" style="color: {reg_color}; font-weight: 600;">{mod_text}</a></li>
        </ul>
    </div>
    
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Selamat Bekerja, {name}</h1>
                <p>{workstation_title}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="badge badge-info" style="padding: 8px 16px; font-size: 0.85rem;">🛡️ E2EE Zero-Knowledge Ready</span>
            </div>
        </div>

        <div id="antrean-section" class="card" style="border-color: {border_color};">
            <div class="card-title">
                <span style="display: flex; align-items: center; gap: 8px;"><span>⚡</span> Antrean Konsultasi Masuk (2 Sesi Menunggu)</span>
                <span class="badge badge-info">Realtime WebRTC Sync</span>
            </div>
            {queue_html}
        </div>

        <div id="history-section" class="card">
            <div class="card-title">
                <span style="display: flex; align-items: center; gap: 8px;"><span>📑</span> {history_title}</span>
                <span class="badge badge-warning">1 Butuh Tindakan</span>
            </div>
            {history_html}
        </div>

        <div id="dompet-section" class="payout-card">
            <div class="card-title">
                <span style="display: flex; align-items: center; gap: 8px;"><span>💰</span> Stasiun Kerja Keuangan Mitra & Penarikan Dana (SD-18)</span>
                <span class="badge badge-success">Beneficiary Account: Bank BCA 8810-xxxx-xxxx</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">{finance_desc}</p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1.8rem;">
                <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Saldo Aktif Siap Tarik</div>
                    <div style="font-size: 1.6rem; font-weight: 700; color: #34d399; margin-top: 6px;">{balance_active}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">Sudah dipotong PPh 21 & Bagi Hasil Platform</div>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(56,189,248,0.3);">
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase;">{probono_label}</div>
                    <div style="font-size: 1.6rem; font-weight: 700; color: #38bdf8; margin-top: 6px;">{probono_claim}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">{probono_sub}</div>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(245,158,11,0.3);">
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Saldo Dibekukan (Frozen)</div>
                    <div style="font-size: 1.6rem; font-weight: 700; color: #fbbf24; margin-top: 6px;">{waiting_reconcile}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">Antrean Transfer / Approval Admin (SD-18)</div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.2rem;">
                <div style="font-size: 0.85rem; color: #cbd5e1;">⚡ Payout via Escrow Bank Gateway — Diproses Real-Time ke Rekening BCA</div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline" onclick="alert('📑 Mengunduh Bukti Potong PPh 21 & Laporan Audit WORM SHA-256...')">📑 Unduh Bukti Potong PPh 21</button>
                    <button class="btn btn-success" style="padding: 0.7rem 1.5rem; font-weight: 700;" onclick="alert('✅ Permintaan Payout {balance_active} ke BCA berhasil dikirim! Diproses secara otomatis.')">💸 Tarik Dana Sekarang (Payout)</button>
                </div>
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
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_mitra.html'), 'w', encoding='utf-8') as f:
    f.write(gen_mitra_html('medis').strip() + "\n")
with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_mitra_medis.html'), 'w', encoding='utf-8') as f:
    f.write(gen_mitra_html('medis').strip() + "\n")
with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_mitra_hukum.html'), 'w', encoding='utf-8') as f:
    f.write(gen_mitra_html('hukum').strip() + "\n")
with open(os.path.join(MOCKUP_DIR, 'mockup_dashboard_mitra_psikologi.html'), 'w', encoding='utf-8') as f:
    f.write(gen_mitra_html('psikologi').strip() + "\n")

# 3. UPGRADE DASHBOARD KLIEN UTAMA (REVISI MUTLAK: FULL-WIDTH, NO LEFT SIDEBAR, HERO SEARCH, 3 PILAR, 2-COL BOTTOM)
HTML_KLIEN = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Klien — LifeQ SuperApp (Full-Width Landing Portal)</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
    <style>
        /* Override body & main untuk layout Full-Width tanpa sidebar kiri */
        body {{
            background: #080c14;
            color: #f8fafc;
            min-height: 100vh;
            display: block; /* Bukan flex sidebar */
        }}
        .main-fullwidth {{
            max-width: 1380px;
            margin: 0 auto;
            padding: 2.5rem 3.5rem;
            width: 100%;
        }}
        .topbar-fullwidth {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }}
        .logo-superapp {{
            font-size: 1.6rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }}
        .logo-superapp span {{
            color: #0ea5e9;
        }}
        .notif-profile-group {{
            display: flex;
            align-items: center;
            gap: 18px;
        }}
        .btn-notif {{
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            color: #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            position: relative;
            transition: all 0.2s;
        }}
        .btn-notif:hover {{
            background: rgba(14,165,233,0.15);
            border-color: #38bdf8;
            color: #38bdf8;
        }}
        .notif-badge {{
            position: absolute;
            top: 6px;
            right: 6px;
            width: 10px;
            height: 10px;
            background: #ef4444;
            border-radius: 50%;
            box-shadow: 0 0 8px #ef4444;
        }}
        .hero-search-box {{
            background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(15,23,42,0.95));
            border: 1px solid #38bdf8;
            border-radius: 20px;
            padding: 3rem 2rem;
            margin-bottom: 3rem;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            position: relative;
            overflow: hidden;
        }}
        .hero-search-box::before {{
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 60%);
            z-index: 0;
            pointer-events: none;
        }}
        .hero-content {{
            position: relative;
            z-index: 1;
        }}
        .hero-title {{
            font-size: 2.2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }}
        .hero-subtitle {{
            color: #cbd5e1;
            font-size: 1.05rem;
            margin-bottom: 2rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.5;
        }}
        .search-bar-wrapper {{
            max-width: 780px;
            margin: 0 auto;
            display: flex;
            gap: 12px;
            background: rgba(8,12,20,0.8);
            padding: 8px;
            border-radius: 40px;
            border: 1px solid rgba(56,189,248,0.4);
            box-shadow: 0 8px 25px rgba(0,0,0,0.5);
        }}
        .search-input {{
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 24px;
            font-size: 1.05rem;
            color: #fff;
            outline: none;
        }}
        .search-input::placeholder {{
            color: #64748b;
        }}
        .btn-search {{
            background: linear-gradient(135deg, #0ea5e9, #2563eb);
            color: #fff;
            border: none;
            padding: 0 32px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(14,165,233,0.4);
        }}
        .btn-search:hover {{
            opacity: 0.92;
            transform: scale(1.02);
        }}
        .grid-3pillars {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.8rem;
            margin-bottom: 3rem;
        }}
        .grid-2col-bottom {{
            display: grid;
            grid-template-columns: 1.8fr 1.2fr;
            gap: 2rem;
        }}
        @media (max-width: 1024px) {{
            .grid-3pillars, .grid-2col-bottom {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <!-- Full-Width Control Landing Tanpa Sidebar Kiri (Sesuai Wireframe) -->
    <div class="main-fullwidth">
        <!-- Topbar: Logo, Ikon Bel Notifikasi, & Profil Klien -->
        <div class="topbar-fullwidth">
            <a href="mockup_dashboard_klien.html" class="logo-superapp">
                LIFEQ <span>SUPERAPP</span>
            </a>
            <div class="notif-profile-group">
                <button class="btn-notif" onclick="alert('🔔 Tidak ada notifikasi baru. Sesi E2EE Anda aktif.')" title="Notifikasi Sistem">
                    <span>🔔</span>
                    <span class="notif-badge"></span>
                </button>
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(16,185,129,0.15); padding: 8px 18px; border-radius: 30px; border: 1px solid rgba(16,185,129,0.4);">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; box-shadow: 0 2px 8px rgba(16,185,129,0.4);">AS</div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: #fff;">Ahmad Subarjo</div>
                        <div style="font-size: 0.75rem; color: #34d399; font-weight: 600;">✔ SKTM Pro Bono Verified</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hero Section: Universal Search Bar -->
        <div class="hero-search-box">
            <div class="hero-content">
                <h1 class="hero-title">Selamat Datang di LifeQ SuperApp, Ahmad Subarjo</h1>
                <p class="hero-subtitle">Portal Terintegrasi untuk Layanan Kesehatan (Sehatifiqa), Bantuan Hukum Pro Bono (Justifiqa), & Kesehatan Mental (Qualifa)</p>
                
                <div class="search-bar-wrapper">
                    <input type="text" class="search-input" placeholder="🔍 Cari gejala penyakit, masalah hukum perdata, atau tes DASS-21...">
                    <button class="btn-search" onclick="alert('🔍 Menghubungkan ke AI Triage & mencarikan spesialis terbaik di ekosistem LifeQ...')">Cari</button>
                </div>
            </div>
        </div>

        <!-- 3 Pilar Layanan SuperApp (Grid 3 Kolom) -->
        <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 10px;"><span>⚡</span> 3 Pilar Layanan Utama SuperApp</h3>
        <div class="grid-3pillars">
            <!-- Kartu 1: Sehatifiqa (Medis) -->
            <div class="card" style="margin: 0; border-color: rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(15,23,42,0.9)); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge badge-success">MODUL MEDIS</span>
                        <span style="font-size: 1.8rem;">🩺</span>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Sehatifiqa</h3>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.8rem;">Tele-medisin dokter spesialis, e-Resep digital dengan DDI Checker terintegrasi, dan diagnosis standar ICD-10 Kemenkes.</p>
                </div>
                <a href="mockup_chat_room.html" class="btn btn-success" style="width: 100%; justify-content: center; padding: 0.8rem; font-size: 0.95rem; font-weight: 700;">🩺 Konsultasi Dokter</a>
            </div>

            <!-- Kartu 2: Justifiqa (Hukum) -->
            <div class="card" style="margin: 0; border-color: rgba(234,179,8,0.4); background: linear-gradient(135deg, rgba(234,179,8,0.12), rgba(15,23,42,0.9)); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge badge-warning" style="background: rgba(234,179,8,0.2); color: #facc15; border-color: rgba(234,179,8,0.4);">MODUL HUKUM</span>
                        <span style="font-size: 1.8rem;">⚖️</span>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Justifiqa</h3>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.8rem;">Konsultasi advokat Peradi, pembuatan somasi/kuasa hukum (IRAC Engine), e-Meterai Peruri, dan Bantuan Hukum Pro Bono Rp 0.</p>
                </div>
                <a href="mockup_modul_hukum.html" class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; width: 100%; justify-content: center; padding: 0.8rem; font-size: 0.95rem; font-weight: 700;">⚖️ Konsultasi Hukum</a>
            </div>

            <!-- Kartu 3: Qualifa (Psikologi) -->
            <div class="card" style="margin: 0; border-color: rgba(168,85,247,0.4); background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(15,23,42,0.9)); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge badge-purple">MODUL PSIKOLOGI</span>
                        <span style="font-size: 1.8rem;">🧠</span>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Qualifa</h3>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.8rem;">Konseling psikolog klinis SIPP, asesmen kecemasan & depresi DASS-21, DAP Note rekam psikologis, serta Crisis Button 119.</p>
                </div>
                <a href="mockup_modul_psikologi.html" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; width: 100%; justify-content: center; padding: 0.8rem; font-size: 0.95rem; font-weight: 700;">🧠 Asesmen Mental</a>
            </div>
        </div>

        <!-- Bottom Section (Grid 2 Kolom: Sesi Aktif & Status Bantuan vs Riwayat & Aksi Cepat) -->
        <div class="grid-2col-bottom">
            <!-- Kolom Kiri: Sesi Aktif & Status Bantuan -->
            <div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 8px;"><span>💬</span> Sesi Aktif & Status Bantuan</h3>
                
                <!-- Spanduk Persetujuan Bantuan Hukum Pro Bono Rp 0 -->
                <div style="background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.35)); border: 1px solid #10b981; border-radius: 16px; padding: 1.4rem; margin-bottom: 1.8rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 20px rgba(16,185,129,0.15);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2.2rem;">🛡️</span>
                        <div>
                            <div style="font-weight: 700; color: #34d399; font-size: 1.05rem; letter-spacing: 0.3px;">BANTUAN HUKUM PRO BONO RP 0 DISETUJUI</div>
                            <div style="color: #d1fae5; font-size: 0.85rem; margin-top: 4px;">NIK terverifikasi Desil 1 DTKS Kemensos. Biaya advokat & litigasi 100% disubsidi.</div>
                        </div>
                    </div>
                    <span class="badge badge-success" style="padding: 6px 14px; font-size: 0.8rem;">✔ AKTIF</span>
                </div>

                <!-- Kartu Konsultasi Aktif -->
                <div class="card" style="border-color: #0ea5e9; margin-bottom: 0; background: linear-gradient(135deg, rgba(14,165,233,0.12), rgba(15,23,42,0.95));">
                    <div class="card-title" style="margin-bottom: 1rem;">
                        <span style="display: flex; align-items: center; gap: 8px;"><span>🩺</span> Konsultasi Sedang Berlangsung</span>
                        <span class="badge badge-info">🔒 E2EE Encrypted Room E2EE</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.45); padding: 1.4rem; border-radius: 14px; border: 1px solid rgba(56,189,248,0.25);">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(14,165,233,0.4);">DR</div>
                            <div>
                                <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">dr. Andi Saputra, Sp.A</div>
                                <div style="color: #38bdf8; font-size: 0.85rem; margin-top: 2px;">Spesialis Anak — Ruang E2EE #88102</div>
                                <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 4px;">Keluhan: Demam tinggi & infeksi saluran pernapasan</div>
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 140px;">
                            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Durasi Sesi Tersisa:</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #34d399; font-family: 'Roboto Mono', monospace; margin: 4px 0 10px;">18:45</div>
                            <a href="mockup_chat_room.html" class="btn btn-primary" style="padding: 0.7rem 1.4rem; font-size: 0.9rem; width: 100%; justify-content: center; font-weight: 700;">💬 Masuk Room</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kolom Kanan: Riwayat & Aksi Cepat -->
            <div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 8px;"><span>📑</span> Riwayat Dokumen & Aksi Cepat</h3>
                <div class="card" style="margin-bottom: 0; padding: 1.8rem; background: rgba(15,23,42,0.85);">
                    <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                        <!-- Unduhan e-Resep Digital -->
                        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">💊</div>
                                <div>
                                    <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">e-Resep Digital (Amoxicillin 500mg)</div>
                                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">Oleh: dr. Andi Saputra, Sp.A • 02 Jul 2026</div>
                                </div>
                            </div>
                            <button class="btn btn-outline" style="padding: 8px 14px; font-size: 0.8rem; font-weight: 600;" onclick="alert('📥 Mengunduh e-Resep Digital dengan Tanda Tangan Elektronik Kemenkes...')">📥 Unduh Resep</button>
                        </div>

                        <!-- Akta Hukum ber-e-Meterai asli -->
                        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">📜</div>
                                <div>
                                    <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Akta Hukum ber-e-Meterai Asli (Peruri)</div>
                                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">Surat Kuasa Litigasi Pro Bono • WORM SHA-256</div>
                                </div>
                            </div>
                            <button class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 8px 14px; font-size: 0.8rem; font-weight: 600;" onclick="alert('📥 Mengunduh Akta Hukum ber-e-Meterai Perum Peruri asli...')">📥 Unduh Akta</button>
                        </div>

                        <!-- Akses Jurnal Mood Tracker -->
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🌱</div>
                                <div>
                                    <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Akses Jurnal Mood Tracker Harian</div>
                                    <div style="color: #c084fc; font-size: 0.8rem; margin-top: 2px;">Status Terkini: Stabil / Normal (Qualifa DASS-21)</div>
                                </div>
                            </div>
                            <a href="mockup_modul_psikologi.html" class="btn" style="background: rgba(168,85,247,0.25); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); padding: 8px 14px; font-size: 0.8rem; font-weight: 700;">🌱 Buka Jurnal</a>
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
    f.write(HTML_KLIEN.strip() + "\n")

print("Successfully generated 3 Unified Main Dashboards (Admin, Mitra, Klien)!")
