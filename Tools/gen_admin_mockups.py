"""
Script to generate 3 High-Fidelity Admin Mockup HTML files:
1. mockup_admin_verifikasi.html (Verifikasi Kredensial & SKTM Pro Bono)
2. mockup_admin_pelanggaran.html (Manajemen Akun & Laporan Pelanggaran)
3. mockup_admin_keuangan.html (Laporan Keuangan & Rekonsiliasi Transaksi)
"""

import os

MOCKUP_DIR = r'd:\justificadll\Mockups'
os.makedirs(MOCKUP_DIR, exist_ok=True)

# Shared CSS for Admin pages
SHARED_CSS = """
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
    body { background: #080c14; color: #f8fafc; min-height: 100vh; display: flex; }
    
    /* Sidebar */
    .sidebar { width: 260px; background: #0d1322; border-right: 1px solid rgba(255,255,255,0.08); padding: 1.8rem 1.2rem; display: flex; flex-direction: column; gap: 1.5rem; flex-shrink: 0; }
    .brand { font-size: 1.4rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .brand span { color: #0ea5e9; }
    .badge-admin { background: rgba(14,165,233,0.15); color: #38bdf8; font-size: 0.7rem; padding: 3px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; border: 1px solid rgba(14,165,233,0.3); }
    .nav-menu { display: flex; flex-direction: column; gap: 0.4rem; list-style: none; }
    .nav-item a { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1rem; color: #94a3b8; text-decoration: none; border-radius: 10px; font-weight: 500; font-size: 0.95rem; transition: all 0.2s; }
    .nav-item a:hover, .nav-item a.active { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.25); }
    
    /* Main Content */
    .main { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; max-height: 100vh; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .topbar h1 { font-size: 1.8rem; font-weight: 700; color: #fff; }
    .topbar p { color: #64748b; font-size: 0.95rem; margin-top: 4px; }
    .user-profile { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.08); }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #3b82f6); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; }
    
    /* Cards & Glassmorphism */
    .card { background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.8rem; backdrop-filter: blur(12px); margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .card-title { font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: space-between; }
    
    /* Tables */
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; }
    td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; vertical-align: middle; }
    tr:hover { background: rgba(255,255,255,0.02); }
    
    /* Badges */
    .badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .badge-success { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .badge-warning { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .badge-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-info { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); }
    .badge-purple { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
    
    /* Buttons */
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; }
    .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.3); }
    
    /* Tabs */
    .tabs { display: flex; gap: 10px; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
    .tab-btn { padding: 0.8rem 1.5rem; background: transparent; border: none; color: #64748b; font-weight: 600; font-size: 1rem; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
    .tab-btn.active { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); }
    
    /* Modals */
    .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; }
    .modal-content { background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; width: 650px; max-width: 90%; padding: 2.5rem; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
    .modal-close { position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
</style>
"""

# 1. VERIFIKASI KREDENSIAL & SKTM PRO BONO
HTML_VERIFIKASI = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal — Verifikasi Kredensial & SKTM Pro Bono</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">LIFEQ <span class="badge-admin">SUPERAPP</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_admin.html">📊 Dashboard Utama</a></li>
            <li class="nav-item"><a href="mockup_admin_verifikasi.html" class="active">🛡️ Verifikasi Lisensi & SKTM</a></li>
            <li class="nav-item"><a href="mockup_admin_pelanggaran.html">⚖️ Manajemen Akun & Etik</a></li>
            <li class="nav-item"><a href="mockup_admin_keuangan.html">💰 Keuangan & PPh 21</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Verifikasi Kredensial & SKTM Pro Bono</h1>
                <p>Cross-check nasional real-time via API KKI/KTKI, HIMPSI, Peradi, Dukcapil, & DTKS Kemensos</p>
            </div>
            <div class="user-profile">
                <div class="avatar">AC</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">Lead Legal Officer</div>
                    <div style="font-size: 0.75rem; color: #34d399;">● WORM Audit Active</div>
                </div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('mitra')">👨‍⚕️ Lisensi Mitra Profesional (12 Antrean)</button>
            <button class="tab-btn" onclick="switchTab('sktm')">📜 SKTM Pro Bono Klien (5 Antrean)</button>
        </div>

        <!-- Tab 1: Mitra -->
        <div id="tab-mitra" class="card">
            <div class="card-title">
                <span>Daftar Antrean Verifikasi Lisensi Profesional</span>
                <span class="badge badge-info">WORM SHA-256 Storage</span>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Nama & Gelar</th>
                            <th>Domain / Spesialisasi</th>
                            <th>No. Registrasi / STR</th>
                            <th>Status API Nasional</th>
                            <th>WORM Checksum</th>
                            <th>Aksi Verifikasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>dr. Andi Saputra, Sp.A</strong></td>
                            <td><span class="badge badge-info">Medis (Spesialis Anak)</span></td>
                            <td><code style="color: #38bdf8;">STR-889102-2026</code></td>
                            <td><span class="badge badge-success">✔ VALID - KKI API MATCH</span></td>
                            <td><code style="font-size: 0.75rem; color: #10b981;">8f9a2b...e190</code></td>
                            <td><button class="btn btn-primary" onclick="openReviewModal('dr. Andi Saputra, Sp.A', 'Medis (Spesialis Anak)', 'STR-889102-2026', 'Konsil Kedokteran Indonesia (KKI)', 'MATCH 100% - AKTIF', '3171029910290001 (Dukcapil OK)')">🔍 Tinjau Dokumen</button></td>
                        </tr>
                        <tr>
                            <td><strong>Siti Aminah, M.Psi, Psikolog</strong></td>
                            <td><span class="badge badge-purple">Psikologi Klinis</span></td>
                            <td><code style="color: #c084fc;">SIPP-00219-HIMPSI</code></td>
                            <td><span class="badge badge-success">✔ VALID - HIMPSI MATCH</span></td>
                            <td><code style="font-size: 0.75rem; color: #10b981;">4c21aa...718b</code></td>
                            <td><button class="btn btn-primary" onclick="openReviewModal('Siti Aminah, M.Psi', 'Psikologi Klinis', 'SIPP-00219-HIMPSI', 'HIMPSI National DB', 'MATCH 100% - AKTIF', '3271048810290004 (Dukcapil OK)')">🔍 Tinjau Dokumen</button></td>
                        </tr>
                        <tr>
                            <td><strong>Budi Santoso, S.H., M.H.</strong></td>
                            <td><span class="badge badge-warning">Hukum (Litigasi)</span></td>
                            <td><code style="color: #fbbf24;">PERADI-99102-2025</code></td>
                            <td><span class="badge badge-warning">⏳ PENDING CROSS-CHECK</span></td>
                            <td><code style="font-size: 0.75rem; color: #fbbf24;">1a90bc...4421</code></td>
                            <td><button class="btn btn-outline" onclick="openReviewModal('Budi Santoso, S.H.', 'Hukum (Advokat)', 'PERADI-99102-2025', 'Peradi National Registry', 'PENDING CROSS-CHECK', '3174028810290002 (Dukcapil OK)')">⚡ Cross-Check API</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab 2: SKTM Pro Bono -->
        <div id="tab-sktm" class="card" style="display: none;">
            <div class="card-title">
                <span>Daftar Antrean Verifikasi SKTM (Bantuan Hukum Pro Bono Rp 0)</span>
                <span class="badge badge-warning">Replikasi Arsitektur Tanpa Gabung Diagram</span>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Nama Klien</th>
                            <th>NIK (Dukcapil Check)</th>
                            <th>Nomor SKTM / Kelurahan</th>
                            <th>Cross-Check DTKS Kemensos</th>
                            <th>Alokasi Anggaran Pro Bono</th>
                            <th>Aksi Verifikasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Ahmad Subarjo</strong></td>
                            <td><code>3172019901820001</code></td>
                            <td>SKTM-0912/Kel-Menteng/2026</td>
                            <td><span class="badge badge-success">✔ TERDAFTAR DTKS (Desil 1)</span></td>
                            <td><span class="badge badge-success">Reimbursement BPHN / SKTM</span></td>
                            <td><button class="btn btn-success" onclick="alert('✔ SKTM DIVERIFIKASI! Tiket Pro Bono terbit otomatis. Dana escrow dikunci.')">✔ Setujui Pro Bono</button></td>
                        </tr>
                        <tr>
                            <td><strong>Rina Wati</strong></td>
                            <td><code>3201028801920005</code></td>
                            <td>SKTM-4412/Kel-Bogor/2026</td>
                            <td><span class="badge badge-danger">✖ TIDAK DITEMUKAN DI DTKS</span></td>
                            <td><span class="badge badge-warning">Review Manual Required</span></td>
                            <td><button class="btn btn-danger" onclick="alert('✖ SKTM DITOLAK: NIK tidak terdaftar dalam Data Terpadu Kesejahteraan Sosial (DTKS).')">✖ Tolak Pengajuan</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Review Modal -->
    <div id="reviewModal" class="modal">
        <div class="modal-content" style="width: 850px;">
            <button class="modal-close" onclick="closeModal('reviewModal')">×</button>
            <h2 style="margin-bottom: 1.5rem; color: #fff; display: flex; align-items: center; gap: 10px;">
                <span>🛡️ Audit Tinjauan Kredensial WORM</span>
                <span class="badge badge-info">SHA-256 Verified</span>
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.8rem;">
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.2rem; text-align: center;">
                    <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 10px;">WORM PDF ENCRYPTED PREVIEW</div>
                    <div style="background: #1e293b; height: 220px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #475569;">
                        <span style="font-size: 3rem;">📄</span>
                        <strong id="mod-name" style="color: #38bdf8; margin-top: 10px;">-</strong>
                        <code id="mod-str" style="color: #cbd5e1; font-size: 0.85rem; margin-top: 5px;">-</code>
                        <div style="margin-top: 15px; background: rgba(16,185,129,0.2); color: #34d399; font-size: 0.75rem; padding: 4px 10px; border-radius: 4px;">✔ Immutability Lock Active</div>
                    </div>
                </div>
                <div>
                    <h4 style="color: #fff; margin-bottom: 1rem;">Hasil Cross-Check API Nasional</h4>
                    <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                        <div><span style="color: #64748b;">Instansi API:</span> <strong id="mod-instansi" style="color: #fff; float: right;">-</strong></div>
                        <div><span style="color: #64748b;">Status Lisensi:</span> <span id="mod-status" class="badge badge-success" style="float: right;">-</span></div>
                        <div><span style="color: #64748b;">Validasi Dukcapil:</span> <strong id="mod-nik" style="color: #34d399; float: right;">-</strong></div>
                        <div><span style="color: #64748b;">BPJS Provider Flag:</span> <strong style="color: #38bdf8; float: right;">Terverifikasi</strong></div>
                    </div>
                    <div style="margin-top: 1.2rem;">
                        <label style="color: #94a3b8; font-size: 0.85rem; display: block; margin-bottom: 6px;">Catatan Compliance (WORM Log):</label>
                        <textarea style="width: 100%; background: #080c14; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 10px; font-size: 0.85rem; height: 70px;" placeholder="Masukkan catatan persetujuan atau penolakan..."></textarea>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.2rem;">
                <button class="btn btn-danger" onclick="alert('✖ Kredensial DITOLAK. Log penolakan tersimpan di WORM.'); closeModal('reviewModal');">✖ Tolak & Minta Unggah Ulang</button>
                <button class="btn btn-success" onclick="alert('✔ Kredensial DISETUJUI! Akun mitra diaktifkan. Log WORM SHA-256 terbit.'); closeModal('reviewModal');">✔ Setujui & Aktifkan Akun</button>
            </div>
        </div>
    </div>

    <script>
        function switchTab(tab) {{
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            if(tab === 'mitra') {{
                document.getElementById('tab-mitra').style.display = 'block';
                document.getElementById('tab-sktm').style.display = 'none';
                event.target.classList.add('active');
            }} else {{
                document.getElementById('tab-mitra').style.display = 'none';
                document.getElementById('tab-sktm').style.display = 'block';
                event.target.classList.add('active');
            }}
        }}
        function openReviewModal(name, domain, str, instansi, status, nik) {{
            document.getElementById('mod-name').innerText = name;
            document.getElementById('mod-str').innerText = str;
            document.getElementById('mod-instansi').innerText = instansi;
            document.getElementById('mod-status').innerText = status;
            document.getElementById('mod-nik').innerText = nik;
            document.getElementById('reviewModal').style.display = 'flex';
        }}
        function closeModal(id) {{
            document.getElementById(id).style.display = 'none';
        }}
    </script>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_admin_verifikasi.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_VERIFIKASI.strip() + "\n")

# 2. MANAJEMEN AKUN & LAPORAN PELANGGARAN
HTML_PELANGGARAN = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal — Manajemen Akun & Laporan Pelanggaran</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">LIFEQ <span class="badge-admin">SUPERAPP</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_admin.html">📊 Dashboard Utama</a></li>
            <li class="nav-item"><a href="mockup_admin_verifikasi.html">🛡️ Verifikasi Lisensi & SKTM</a></li>
            <li class="nav-item"><a href="mockup_admin_pelanggaran.html" class="active">⚖️ Manajemen Akun & Etik</a></li>
            <li class="nav-item"><a href="mockup_admin_keuangan.html">💰 Keuangan & PPh 21</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Manajemen Akun & Penegakan Etik</h1>
                <p>Due Process of Law (Warning 1/2/3, Banding 14 Hari) & Sidang Etik Multidisiplin (4 Panel Ahli)</p>
            </div>
            <div class="user-profile">
                <div class="avatar" style="background: linear-gradient(135deg, #ef4444, #f97316);">ET</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">Ethics Committee Lead</div>
                    <div style="font-size: 0.75rem; color: #f87171;">● 2 Active Hearings</div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
            <div style="display: flex; gap: 15px; align-items: center; justify-content: space-between;">
                <div style="display: flex; gap: 10px; flex: 1;">
                    <input type="text" placeholder="🔍 Cari NIK, Nama, atau ID Akun..." style="background: #080c14; border: 1px solid rgba(255,255,255,0.15); padding: 10px 16px; border-radius: 8px; color: #fff; width: 300px;">
                    <select style="background: #080c14; border: 1px solid rgba(255,255,255,0.15); padding: 10px 16px; border-radius: 8px; color: #fff;">
                        <option>Semua Domain</option>
                        <option>Kesehatan Medis</option>
                        <option>Hukum</option>
                        <option>Psikologi</option>
                    </select>
                </div>
                <button class="btn btn-primary">⚡ Filter Laporan Aktif</button>
            </div>
        </div>

        <!-- Tabel Pengguna & Warning Count -->
        <div class="card">
            <div class="card-title">
                <span>Daftar Pemantauan Akun & Warning Count</span>
                <span class="badge badge-warning">Due Process Rule Active</span>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID Akun</th>
                            <th>Nama Pengguna</th>
                            <th>Peran & Domain</th>
                            <th>Warning Count</th>
                            <th>Laporan Pelanggaran / Adverse Event</th>
                            <th>Status Akun</th>
                            <th>Aksi Hukum / Etik</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>CL-99102</code></td>
                            <td><strong>Ahmad Subroto</strong></td>
                            <td>Klien</td>
                            <td><span class="badge badge-warning">⚠️ WARNING: 2 / 3</span></td>
                            <td>Kata kasar & pelecehan verbal di chat hukum</td>
                            <td><span class="badge badge-success">ACTIVE</span></td>
                            <td>
                                <button class="btn btn-warning" style="background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4);" onclick="openSuspendModal('CL-99102', 'Ahmad Subroto', '2 / 3', 'Pelecehan verbal di ruang chat')">⚠️ Kirim Warning Ke-3 / Suspend</button>
                            </td>
                        </tr>
                        <tr>
                            <td><code>DR-11029</code></td>
                            <td><strong>dr. Budi Gunawan, Sp.PD</strong></td>
                            <td>Mitra — Medis</td>
                            <td><span class="badge badge-warning">⚠️ WARNING: 1 / 3</span></td>
                            <td>Rating 1⭐ (Alergi berat pasca resep tanpa DDI check)</td>
                            <td><span class="badge badge-danger">UNDER INVESTIGATION</span></td>
                            <td>
                                <button class="btn btn-danger" onclick="openEthicsModal('DR-11029', 'dr. Budi Gunawan, Sp.PD', 'Medis', 'Dugaan kelalaian DDI Checker memicu reaksi alergi')">🏛️ Sidang Etik Multidisiplin</button>
                            </td>
                        </tr>
                        <tr>
                            <td><code>PS-44120</code></td>
                            <td><strong>Rina Wulandari, M.Psi</strong></td>
                            <td>Mitra — Psikologi</td>
                            <td><span class="badge badge-success">✔ WARNING: 0 / 3</span></td>
                            <td>- (Kinerja Sangat Baik)</td>
                            <td><span class="badge badge-success">ACTIVE</span></td>
                            <td>
                                <button class="btn btn-outline" onclick="alert('Akun dalam kondisi bersih dan patuh kode etik HIMPSI.')">👁️ Pantau Profil</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal Suspend (Due Process 14 Days) -->
    <div id="suspendModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('suspendModal')">×</button>
            <h2 style="color: #f87171; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">
                <span>⚠️ Penjatuhan Suspend & Due Process</span>
            </h2>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">
                Sesuai UU PDP dan aturan perlindungan konsumen, pengguna berhak mendapatkan surat resmi dan masa banding 14 hari kerja.
            </p>
            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); padding: 1.2rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <div><strong>Target Akun:</strong> <span id="susp-name" style="color: #fff;">-</span> (<code id="susp-id">-</code>)</div>
                <div style="margin-top: 6px;"><strong>Status Peringatan Saat Ini:</strong> <span id="susp-warn" style="color: #fbbf24;">-</span></div>
                <div style="margin-top: 6px;"><strong>Alasan Pelanggaran:</strong> <span id="susp-reason" style="color: #f87171;">-</span></div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="color: #cbd5e1; font-size: 0.85rem; display: block; margin-bottom: 6px;">Surat Resmi Penangguhan (WORM SHA-256 Hash):</label>
                <textarea style="width: 100%; background: #080c14; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 10px; font-size: 0.85rem; height: 80px;">Dengan ini akun Anda dijatuhi SUSPEND SEMENTARA karena melanggar Ketentuan Layanan Pasal 14. Anda memiliki HAK BANDING selama 14 HARI KERJA (s/d 16 Juli 2026) sebelum pembekuan permanen.</textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-outline" onclick="closeModal('suspendModal')">Batal</button>
                <button class="btn btn-danger" onclick="alert('🔒 AKUN DI-SUSPEND! Token sesi JWT dikunci. Argo banding 14 hari dimulai.'); closeModal('suspendModal');">🔒 Eksekusi Suspend (14-Day Appeal Window)</button>
            </div>
        </div>
    </div>

    <!-- Modal Sidang Etik Multidisiplin -->
    <div id="ethicsModal" class="modal">
        <div class="modal-content" style="width: 800px;">
            <button class="modal-close" onclick="closeModal('ethicsModal')">×</button>
            <h2 style="color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">
                <span>🏛️ Sidang Etik Multidisiplin (4 Panel Ahli Wajib)</span>
                <span class="badge badge-danger">High Priority Case</span>
            </h2>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <strong>Mitra Terperiksa:</strong> <span id="eth-name" style="color: #38bdf8;">-</span> (<code id="eth-id">-</code>)<br>
                <strong>Pokok Perkara:</strong> <span id="eth-case" style="color: #f87171;">-</span>
            </div>
            <h4 style="color: #fff; margin-bottom: 0.8rem;">Komposisi Tim Etik (Mandatory 4 Ahli):</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem;">
                <div style="background: rgba(14,165,233,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(14,165,233,0.3); font-size: 0.85rem;">👨‍⚕️ <strong>Dokter Senior:</strong> dr. Hendra, Sp.PD (KKI)</div>
                <div style="background: rgba(168,85,247,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(168,85,247,0.3); font-size: 0.85rem;">🧠 <strong>Psikolog Senior:</strong> Dra. Maya, M.Psi (HIMPSI)</div>
                <div style="background: rgba(245,158,11,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.3); font-size: 0.85rem;">⚖️ <strong>Advokat Senior:</strong> Bambang, S.H., M.H. (Peradi)</div>
                <div style="background: rgba(16,185,129,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(16,185,129,0.3); font-size: 0.85rem;">🛡️ <strong>Admin Compliance:</strong> Legal Officer JUSTIFICA</div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: #fff; margin-bottom: 0.8rem;">Putusan Akhir Sidang Etik (WORM Locked):</h4>
                <div style="display: flex; gap: 15px;">
                    <label style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); padding: 10px 15px; border-radius: 8px; cursor: pointer; flex: 1; text-align: center;">
                        <input type="radio" name="verdict" checked> <strong>TERBUKTI MELANGGAR ETIK BERAT</strong><br><span style="font-size: 0.75rem; color: #f87171;">Cabut Lisensi & Lapor ke KKI/HIMPSI/Peradi</span>
                    </label>
                    <label style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); padding: 10px 15px; border-radius: 8px; cursor: pointer; flex: 1; text-align: center;">
                        <input type="radio" name="verdict"> <strong>TIDAK TERBUKTI / BEBASKAN</strong><br><span style="font-size: 0.75rem; color: #34d399;">Rehabilitasi Nama Baik & Buka Suspend</span>
                    </label>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.2rem;">
                <button class="btn btn-outline" onclick="closeModal('ethicsModal')">Batal</button>
                <button class="btn btn-danger" onclick="alert('✔ PUTUSAN ETIK DI-FINALISASI! Laporan dikirim ke API Konsil Kedokteran Indonesia (KKI) & akun di-suspend permanen. WORM SHA-256 seal created.'); closeModal('ethicsModal');">🏛️ Finalisasi Putusan & Lapor ke Badan Nasional</button>
            </div>
        </div>
    </div>

    <script>
        function openSuspendModal(id, name, warn, reason) {{
            document.getElementById('susp-id').innerText = id;
            document.getElementById('susp-name').innerText = name;
            document.getElementById('susp-warn').innerText = warn;
            document.getElementById('susp-reason').innerText = reason;
            document.getElementById('suspendModal').style.display = 'flex';
        }}
        function openEthicsModal(id, name, domain, caseDesc) {{
            document.getElementById('eth-id').innerText = id;
            document.getElementById('eth-name').innerText = name;
            document.getElementById('eth-case').innerText = caseDesc;
            document.getElementById('ethicsModal').style.display = 'flex';
        }}
        function closeModal(id) {{ document.getElementById(id).style.display = 'none'; }}
    </script>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_admin_pelanggaran.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_PELANGGARAN.strip() + "\n")

# 3. LAPORAN KEUANGAN & REKONSILIASI TRANSAKSI
HTML_KEUANGAN = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal — Laporan Keuangan & Rekonsiliasi Transaksi</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">LIFEQ <span class="badge-admin">SUPERAPP</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_admin.html">📊 Dashboard Utama</a></li>
            <li class="nav-item"><a href="mockup_admin_verifikasi.html">🛡️ Verifikasi Lisensi & SKTM</a></li>
            <li class="nav-item"><a href="mockup_admin_pelanggaran.html">⚖️ Manajemen Akun & Etik</a></li>
            <li class="nav-item"><a href="mockup_admin_keuangan.html" class="active">💰 Keuangan & PPh 21</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Laporan Keuangan & PPh 21 Automated</h1>
                <p>Proporsi Bagi Hasil (Medis 15% / Psi 20% / Huk 25%), Threshold Control >= Rp 5M, & Ekspor WORM SHA-256</p>
            </div>
            <div class="user-profile">
                <div class="avatar" style="background: linear-gradient(135deg, #10b981, #059669);">FIN</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">VP of Finance</div>
                    <div style="font-size: 0.75rem; color: #34d399;">● AML Watchdog OK</div>
                </div>
            </div>
        </div>

        <!-- Metric Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9));">
                <div style="color: #94a3b8; font-size: 0.85rem;">TOTAL GMV TRANSAKSI</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">Rp 1.450.000.000</div>
                <div style="color: #34d399; font-size: 0.75rem; margin-top: 6px;">▲ +18.5% dari bulan lalu</div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(15,23,42,0.9)); border-color: rgba(14,165,233,0.3);">
                <div style="color: #38bdf8; font-size: 0.85rem;">PENDAPATAN BERSIH PLATFORM</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">Rp 282.500.000</div>
                <div style="color: #cbd5e1; font-size: 0.75rem; margin-top: 6px;">Bagi hasil SAK proporsional</div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9)); border-color: rgba(16,185,129,0.3);">
                <div style="color: #34d399; font-size: 0.85rem;">TOTAL PAYOUT MITRA (80%)</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">Rp 1.167.500.000</div>
                <div style="color: #cbd5e1; font-size: 0.75rem; margin-top: 6px;">Sudah dipotong PPh 21</div>
            </div>
            <div class="card" style="margin: 0; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(15,23,42,0.9)); border-color: rgba(245,158,11,0.3);">
                <div style="color: #fbbf24; font-size: 0.85rem;">ESCROW PRO BONO (LOCKED)</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #fff; margin-top: 8px;">Rp 65.000.000</div>
                <div style="color: #fbbf24; font-size: 0.75rem; margin-top: 6px;">🔒 Alokasi Anggaran Bantuan Hukum (BPHN)</div>
            </div>
        </div>

        <!-- Proporsi Bagi Hasil -->
        <div class="card" style="background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.2);">
            <div class="card-title" style="margin-bottom: 1rem;">
                <span>⚖️ Kebijakan Bagi Hasil Proporsional (Automated Revenue Share Engine)</span>
                <span class="badge badge-info">SAK Compliant</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border-left: 4px solid #38bdf8;">
                    <div style="color: #94a3b8;">DOMAIN KESEHATAN MEDIS</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-top: 5px;">Platform 15% / Dokter 85%</div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Insentif tinggi untuk spesialis klinis</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border-left: 4px solid #c084fc;">
                    <div style="color: #94a3b8;">DOMAIN PSIKOLOGI</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-top: 5px;">Platform 20% / Psikolog 80%</div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Dukungan fitur asesmen DASS-21 & Crisis 119</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border-left: 4px solid #fbbf24;">
                    <div style="color: #94a3b8;">DOMAIN HUKUM LITIGASI</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-top: 5px;">Platform 25% / Advokat 75%</div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">Mendukung enkripsi ZK & e-Meterai</div>
                </div>
            </div>
        </div>

        <!-- Tabel Antrean Pencairan Dana (Threshold Control) -->
        <div class="card">
            <div class="card-title">
                <span>Antrean Pencairan Dana Mitra (Threshold Control ≥ Rp 5.000.000)</span>
                <span class="badge badge-warning">AML Bank Check Active</span>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID Tiket</th>
                            <th>Nama Mitra & Domain</th>
                            <th>Nominal Penarikan</th>
                            <th>Potongan PPh 21 (5%)</th>
                            <th>Rekening Tujuan (AML Match)</th>
                            <th>Status Pencairan</th>
                            <th>Aksi Approval</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>WD-99101</code></td>
                            <td><strong>dr. Andi Saputra, Sp.A</strong><br><span style="font-size: 0.75rem; color: #38bdf8;">Medis</span></td>
                            <td><strong style="color: #fff;">Rp 12.500.000</strong></td>
                            <td><span style="color: #f87171;">Rp 625.000</span></td>
                            <td><code>BCA - 091283199</code><br><span style="color: #34d399; font-size: 0.75rem;">✔ MATCH STR DOKTER</span></td>
                            <td><span class="badge badge-warning">⏳ PENDING MANUAL APPROVAL</span></td>
                            <td><button class="btn btn-success" onclick="alert('✔ TRANSFER DISETUJUI! API Bank Payout dieksekusi sebesar Rp 11.875.000 (net). WORM audit terbit.')">✔ Approve & Transfer API</button></td>
                        </tr>
                        <tr>
                            <td><code>WD-99102</code></td>
                            <td><strong>Budi Santoso, S.H.</strong><br><span style="font-size: 0.75rem; color: #fbbf24;">Hukum</span></td>
                            <td><strong style="color: #fff;">Rp 25.000.000</strong></td>
                            <td><span style="color: #f87171;">Rp 1.250.000</span></td>
                            <td><code>BNI - 091283001</code><br><span style="color: #34d399; font-size: 0.75rem;">✔ MATCH KTA PERADI</span></td>
                            <td><span class="badge badge-warning">⏳ PENDING MANUAL APPROVAL</span></td>
                            <td><button class="btn btn-success" onclick="alert('✔ TRANSFER DISETUJUI! API Bank Payout dieksekusi sebesar Rp 23.750.000 (net). WORM audit terbit.')">✔ Approve & Transfer API</button></td>
                        </tr>
                        <tr>
                            <td><code>WD-99103</code></td>
                            <td><strong>Siti Aminah, M.Psi</strong><br><span style="font-size: 0.75rem; color: #c084fc;">Psikologi</span></td>
                            <td><strong style="color: #fff;">Rp 3.200.000</strong></td>
                            <td><span style="color: #f87171;">Rp 160.000</span></td>
                            <td><code>Mandiri - 1029381</code><br><span style="color: #34d399; font-size: 0.75rem;">✔ MATCH SIPP</span></td>
                            <td><span class="badge badge-success">⚡ AUTO-DISBURSED (< 5M)</span></td>
                            <td><button class="btn btn-outline" onclick="alert('Pencairan di bawah Rp 5 Juta telah diproses otomatis oleh sistem Payout Bank pada 02 Juli 2026 08:00 WIB.')">📄 Lihat Bukti Transfer</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- WORM SHA-256 Hashed Export Tool -->
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9)); border-color: rgba(16,185,129,0.3);">
            <div>
                <h3 style="color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                    <span>📄 Ekspor Laporan Akuntansi Audit-Ready</span>
                    <span class="badge badge-success">WORM SHA-256 Checksum Signed</span>
                </h3>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 4px;">Seluruh baris transaksi akan diverifikasi dengan kriptografi hash SHA-256 untuk pembuktian perpajakan & audit forensik.</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <select style="background: #080c14; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px; border-radius: 8px;">
                    <option>Periode: 1 - 30 Juni 2026</option>
                    <option>Periode: Q2 (April - Juni 2026)</option>
                </select>
                <button class="btn btn-success" onclick="alert('📥 MENGUNDUH LAPORAN... File XLSX & PDF telah ditandatangani dengan SHA-256 checksum: 9f8a2b1c3d4e5f6a7b8c9d0e1f2a3b4c')">📥 Ekspor WORM Hashed Package</button>
            </div>
        </div>
    </div>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_admin_keuangan.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_KEUANGAN.strip() + "\n")

print("Successfully generated 3 Admin Mockup HTML files!")
