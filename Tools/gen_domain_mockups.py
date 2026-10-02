"""
Script to generate 3 High-Fidelity Domain-Specific Mockup HTML files:
1. mockup_modul_medis.html (e-Resep DDI Checker, SOAP ICD-10, Controlled Drugs 3-Rangkap)
2. mockup_modul_hukum.html (Privileged Gold Banner, IRAC Drafting, Version Control, e-Meterai Peruri)
3. mockup_modul_psikologi.html (DAP Note, DASS-21 Mandatory Crisis Protocol 119 ext 8 with 10s lock, Mood Tracker Banner)
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
    .nav-menu { display: flex; flex-direction: column; gap: 0.4rem; list-style: none; }
    .nav-item a { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1rem; color: #94a3b8; text-decoration: none; border-radius: 10px; font-weight: 500; font-size: 0.95rem; transition: all 0.2s; }
    .nav-item a:hover, .nav-item a.active { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.25); }
    
    .main { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; max-height: 100vh; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .topbar h1 { font-size: 1.8rem; font-weight: 700; color: #fff; }
    .topbar p { color: #64748b; font-size: 0.95rem; margin-top: 4px; }
    
    .card { background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.8rem; backdrop-filter: blur(12px); margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .card-title { font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: space-between; }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; font-size: 0.85rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; }
    td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; vertical-align: middle; }
    
    .badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .badge-success { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .badge-warning { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .badge-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-info { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); }
    .badge-purple { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
    .badge-gold { background: rgba(234,179,8,0.15); color: #facc15; border: 1px solid rgba(234,179,8,0.3); }
    
    .btn { padding: 0.7rem 1.4rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
    .btn-gold { background: linear-gradient(135deg, #eab308, #ca8a04); color: #000; font-weight: 700; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; }
    
    .input-group { margin-bottom: 1.2rem; }
    .input-group label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
    .input-control { width: 100%; background: #080c14; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 12px; font-size: 0.9rem; transition: border 0.2s; }
    .input-control:focus { outline: none; border-color: #38bdf8; }
    
    .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(10px); z-index: 1000; align-items: center; justify-content: center; }
    .modal-content { background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; width: 680px; max-width: 90%; padding: 2.5rem; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
</style>
"""

# 1. MODUL KESEHATAN MEDIS
HTML_MEDIS = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modul Medis — e-Resep DDI Checker & SOAP Note</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">Sehatifiqa <span style="color: #34d399; font-size: 0.7rem; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.4);">BY LIFEQ</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_mitra.html">📊 Dashboard Dokter</a></li>
            <li class="nav-item"><a href="mockup_modul_medis.html" class="active">🩺 e-Resep & SOAP Note</a></li>
            <li class="nav-item"><a href="mockup_chat_room.html">💬 Tele-Konsultasi</a></li>
            <li class="nav-item"><a href="mockup_dashboard_klien.html">👤 Portal Pasien</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Stasiun Kerja Klinis & e-Resep Digital</h1>
                <p>Dilengkapi Drug-Drug Interaction (DDI) Checker, ICD-10 Autocomplete, & Resep Narkotika 3-Rangkap</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; background: rgba(56,189,248,0.1); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(56,189,248,0.3);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #0ea5e9; display: flex; align-items: center; justify-content: center; font-weight: 700;">DR</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">dr. Andi Saputra, Sp.A</div>
                    <div style="font-size: 0.75rem; color: #38bdf8;">STR: 88910299 / KKI Valid</div>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <!-- SOAP Note Panel -->
            <div class="card">
                <div class="card-title">
                    <span>📋 Rekam Medis Elektronik — SOAP Note</span>
                    <span class="badge badge-info">Permenkes 24/2022</span>
                </div>
                <div class="input-group">
                    <label>Subjective (Keluhan Utama Pasien):</label>
                    <textarea class="input-control" style="height: 70px;">Demam tinggi 38.8°C sudah 3 hari, disertai batuk berdahak kuning dan lemas. Pasien memiliki riwayat alergi obat penisilin ringan.</textarea>
                </div>
                <div class="input-group">
                    <label>Objective (Pemeriksaan Fisik & Tanda Vital):</label>
                    <textarea class="input-control" style="height: 60px;">Suhu: 38.8°C, Nadi: 110x/mnt, RR: 28x/mnt. Ronki positif basah di paru kanan bawah.</textarea>
                </div>
                <div class="input-group">
                    <label>Assessment (Diagnosis ICD-10 Autocomplete):</label>
                    <select class="input-control" style="border-color: #38bdf8; background: #0c1424; font-weight: 600;">
                        <option>🔍 J18.9 - Pneumonia, unspecified (MATCH 98%)</option>
                        <option>A09 - Infectious gastroenteritis and colitis</option>
                        <option>J00 - Acute nasopharyngitis [common cold]</option>
                        <option>J06.9 - Acute upper respiratory infection, unspecified</option>
                    </select>
                    <div style="font-size: 0.75rem; color: #34d399; margin-top: 5px;">✔ Kode ICD-10 tersinkronisasi dengan SatuSehat Kemenkes</div>
                </div>
                <div class="input-group">
                    <label>Plan (Tindakan & Terapi klinis):</label>
                    <textarea class="input-control" style="height: 60px;">Terapi antibiotik empiris ber-DDI check, antipiretik untuk demam, dan istirahat total 5 hari. Kontrol ulang jika napas sesak.</textarea>
                </div>
                <button class="btn btn-outline" style="width: 100%; justify-content: center;" onclick="alert('✔ SOAP Note dienkripsi AES-256 dan disimpan ke WORM storage rekam medis!')">💾 Simpan SOAP Note (WORM Hashed)</button>
            </div>

            <!-- e-Resep & DDI Checker -->
            <div class="card">
                <div class="card-title">
                    <span>💊 Peresepan Elektronik (e-Resep) & DDI Checker</span>
                    <span class="badge badge-warning">SIA Apotek Sync</span>
                </div>
                
                <!-- Drug Table -->
                <div class="table-responsive" style="margin-bottom: 1.5rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Obat</th>
                                <th>Dosis & Frekuensi</th>
                                <th>Controlled Drug Flag</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Amoxicillin</strong></td>
                                <td>500mg — 3x1 hari</td>
                                <td><span class="badge badge-success">Normal Drug</span></td>
                                <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">Hapus</button></td>
                            </tr>
                            <tr style="background: rgba(239,68,68,0.08);">
                                <td><strong style="color: #f87171;">Allopurinol</strong></td>
                                <td>100mg — 1x1 hari</td>
                                <td><span class="badge badge-danger">⚠️ DDI MAJOR RISK</span></td>
                                <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">Hapus</button></td>
                            </tr>
                            <tr>
                                <td><strong style="color: #c084fc;">Codeine (Narkotika)</strong></td>
                                <td>15mg — 2x1 hari</td>
                                <td><span class="badge badge-purple">🔒 3-RANGKAP DIGITAL</span></td>
                                <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">Hapus</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- DDI Alert Box -->
                <div style="background: rgba(239,68,68,0.12); border: 2px solid #ef4444; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #f87171; font-weight: 700; font-size: 1rem; margin-bottom: 6px;">
                        <span>🚨 PERINGATAN INTERAKSI OBAT (MAJOR DDI DETECTED)</span>
                    </div>
                    <p style="color: #fca5a5; font-size: 0.85rem; line-height: 1.4;">
                        Kombinasi <strong>Amoxicillin</strong> dan <strong>Allopurinol</strong> secara klinis memicu peningkatan frekuensi ruam kulit makulopapular purulen dan reaksi hipersensitivitas silang berat.
                    </p>
                    <div style="margin-top: 12px;">
                        <label style="color: #fff; font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 5px;">Mandatory Clinical Override Rationale (WORM Log Required):</label>
                        <input id="override-text" type="text" class="input-control" placeholder="Tuliskan alasan klinis mengapa terapi kombinasi ini tetap diberikan..." value="Pasien telah dalam pengawasan histamin ekstra, rasio manfaat klinis melebihi risiko ringan." style="border-color: #ef4444;">
                    </div>
                </div>

                <!-- 3 Rangkap Checkbox -->
                <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: #a855f7;">
                    <div>
                        <strong style="color: #c084fc;">Aktifkan Cetak Resep Narkotika 3-Rangkap Digital (Controlled Drugs)</strong><br>
                        <span style="color: #94a3b8; font-size: 0.78rem;">Kurir medis Apotek Mitra SIA wajib meminta verifikasi KTP fisik penerima saat pengantaran obat.</span>
                    </div>
                </div>

                <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 1rem; padding: 1rem;" onclick="verifyResep()">
                    🔏 Terbitkan e-Resep Tersertifikasi & Kirim ke SIA Apotek
                </button>
            </div>
        </div>
    </div>
    <script>
        function verifyResep() {{
            const val = document.getElementById('override-text').value;
            if(!val || val.length < 10) {{
                alert('✖ ERROR COMPLIANCE: Anda wajib mengisi Clinical Override Rationale sebelum menerbitkan resep dengan risiko Major DDI!');
            }} else {{
                alert('✔ e-RESEP BERHASIL DITERBITKAN! Resep digital 3-rangkap dikirim ke SIA Apotek Mitra terdekat. Log override SHA-256 tersimpan di WORM.');
            }}
        }}
    </script>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_modul_medis.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_MEDIS.strip() + "\n")

# 2. MODUL HUKUM LITIGASI & LEGAL DRAFTING
HTML_HUKUM = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modul Hukum — IRAC Legal Drafting & e-Meterai Peruri</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">JUSTIFIQA <span style="color: #facc15; font-size: 0.75rem; background: rgba(234,179,8,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.4);">BY LIFEQ</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_mitra.html">📊 Dashboard Advokat</a></li>
            <li class="nav-item"><a href="mockup_modul_hukum.html" class="active">⚖️ IRAC Drafting & e-Meterai</a></li>
            <li class="nav-item"><a href="mockup_chat_room.html">💬 Chat Privileged (E2EE)</a></li>
            <li class="nav-item"><a href="mockup_dashboard_klien.html">👤 Portal Klien</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Stasiun Kerja Legal Drafting & Akta Hukum</h1>
                <p>Arsitektur Zero-Knowledge, Metode IRAC, Version Control 10-Tahun, & e-Meterai Peruri Rp 10.000</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; background: rgba(234,179,8,0.15); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(234,179,8,0.4);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #eab308; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 700;">SH</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem; color: #facc15;">Budi Santoso, S.H., M.H.</div>
                    <div style="font-size: 0.75rem; color: #cbd5e1;">Peradi ID: 99102 / Active</div>
                </div>
            </div>
        </div>

        <!-- Privileged Gold Banner -->
        <div style="background: linear-gradient(135deg, rgba(234,179,8,0.2), rgba(161,98,7,0.3)); border: 2px solid #eab308; border-radius: 12px; padding: 1.2rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 25px rgba(234,179,8,0.15);">
            <div style="font-size: 2.5rem;">🛡️</div>
            <div>
                <div style="font-weight: 700; font-size: 1.1rem; color: #facc15; letter-spacing: 0.5px;">PRIVILEGED AND CONFIDENTIAL — ADVOCATE-CLIENT PRIVILEGE</div>
                <p style="color: #fef08a; font-size: 0.88rem; margin-top: 4px;">
                    Dilindungi oleh Pasal 19 UU No. 18 Tahun 2003 tentang Advokat. Seluruh transkrip, draf akta, dan bukti perkara dienkripsi secara <strong>Zero-Knowledge E2EE</strong>. Admin Sistem tidak memiliki akses dekripsi ke ruang kerja ini.
                </p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem;">
            <!-- IRAC Drafting Panel -->
            <div class="card">
                <div class="card-title">
                    <span>📜 Mesin Penyusunan Draf Hukum (Metode IRAC)</span>
                    <span class="badge badge-gold">Template Engine Ready</span>
                </div>
                <div class="input-group">
                    <label>Pilih Template Dokumen Hukum Baku:</label>
                    <select class="input-control" style="border-color: #eab308; background: #0c1424; font-weight: 600;">
                        <option>🏛️ Surat Kuasa Khusus Litigasi Perdata (e-Meterai Peruri Stamp Ready)</option>
                        <option>📄 Somasi Terbuka Wanprestasi Kontrak</option>
                        <option>🤝 Perjanjian Perdamaian (Dading) di Luar Pengadilan</option>
                        <option>📋 Legal Opinion Pengecekan Sertifikat Hak Milik Tanah</option>
                    </select>
                </div>

                <div class="input-group">
                    <label>Issue (Pokok Permasalahan Hukum / Gugatan):</label>
                    <textarea class="input-control" style="height: 65px;">Pihak Kedua terbukti melakukan wanprestasi atas perjanjian kerja sama pengadaan barang No. 88/SPK/2025 dengan tunggakan pembayaran termin ke-3 sebesar Rp 500.000.000.</textarea>
                </div>
                <div class="input-group">
                    <label>Rule (Dasar Hukum / Pasal Regulasi):</label>
                    <textarea class="input-control" style="height: 65px;">Pasal 1243 & Pasal 1338 KUHPerdata tentang kebebasan berkontrak dan ganti rugi wanprestasi, serta UU No. 10 Tahun 2020 tentang Bea Meterai.</textarea>
                </div>
                <div class="input-group">
                    <label>Application (Analisis Penerapan Hukum pada Fakta):</label>
                    <textarea class="input-control" style="height: 65px;">Surat peringatan (somasi) 1 dan 2 telah diabaikan oleh Pihak Kedua selama lebih dari 30 hari kalender tanpa iktikad baik penyelesaian.</textarea>
                </div>
                <div class="input-group">
                    <label>Conclusion (Tuntutan & Kesimpulan Hukum):</label>
                    <textarea class="input-control" style="height: 65px;">Meminta Pihak Kedua segera melunasi pokok hutang beserta bunga moratoir 6% per tahun selambat-lambatnya 7 hari sejak akta ini diterbitkan.</textarea>
                </div>
            </div>

            <!-- Version Control & e-Meterai Peruri -->
            <div>
                <div class="card" style="margin-bottom: 2rem;">
                    <div class="card-title">
                        <span>🗂️ Version Control System</span>
                        <span class="badge badge-info">WORM 10-Yr Legal Hold</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                        <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div><strong>v1.0</strong> — Draft Awal Internal</div>
                            <span style="font-size: 0.75rem; color: #64748b;">01 Juli 10:00 WIB</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div><strong>v2.0</strong> — Koreksi Nama Klien</div>
                            <span style="font-size: 0.75rem; color: #38bdf8;">02 Juli 08:30 WIB</span>
                        </div>
                        <div style="background: rgba(234,179,8,0.15); padding: 12px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(234,179,8,0.4);">
                            <div><strong style="color: #facc15;">vFinal (v3.0)</strong> — Ready for Stamping</div>
                            <span class="badge badge-gold" style="font-size: 0.7rem;">LOCKED</span>
                        </div>
                    </div>
                </div>

                <!-- e-Meterai Tool -->
                <div class="card" style="background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9)); border-color: #eab308;">
                    <div class="card-title" style="color: #facc15;">
                        <span>🏛️ Pembubuhan e-Meterai Peruri</span>
                        <span class="badge badge-gold">Rp 10.000</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.2rem;">
                        Integrasi langsung dengan API Perum Peruri. Stempel meterai digital ber-hash kriptografi akan dilampirkan pada koordinat blok tanda tangan.
                    </p>
                    <div style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.8rem; color: #64748b;">SALDO TOKEN PERURI MITRA</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-top: 4px;">18 Meterai Ready</div>
                        </div>
                        <span style="font-size: 2rem;">🇮🇩</span>
                    </div>
                    <button class="btn btn-gold" style="width: 100%; justify-content: center; padding: 1rem; font-size: 0.95rem;" onclick="stampMeterai()">
                        ⚡ Bubuhkan e-Meterai Rp 10.000 & Cap Privilege
                    </button>
                    
                    <!-- Download Gate Alert -->
                    <div style="margin-top: 1.2rem; background: rgba(14,165,233,0.1); border: 1px dashed #0ea5e9; padding: 10px; border-radius: 8px; font-size: 0.78rem; color: #38bdf8; text-align: center;">
                        🔒 <strong>Download Gate Active:</strong> Klien baru dapat mengunduh PDF akta ini setelah tagihan draf berstatus <code>PAID</code> di escrow.
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        function stampMeterai() {{
            alert('✔ e-METERAI PERUM PERURI Rp 10.000 BERHASIL DIBUBUHKAN!\n\nDokumen akta hukum telah ditandatangani secara digital dengan cryptographic seal SHA-256: 7a8b9c...e12f.\nRetensi WORM 10 tahun aktif.');
        }}
    </script>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_modul_hukum.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_HUKUM.strip() + "\n")

# 3. MODUL PSIKOLOGI & ASESMEN KLINIS (DASS-21 MANDATORY CRISIS PROTOCOL 119 EXT 8)
HTML_PSIKOLOGI = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modul Psikologi — DASS-21 Mandatory Crisis Protocol & Mood Tracker</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
    {SHARED_CSS}
</head>
<body>
    <div class="sidebar">
        <div class="brand">Qualifa <span style="color: #c084fc; font-size: 0.7rem; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.4);">BY LIFEQ</span></div>
        <ul class="nav-menu">
            <li class="nav-item"><a href="mockup_dashboard_mitra.html">📊 Dashboard Konselor</a></li>
            <li class="nav-item"><a href="mockup_modul_psikologi.html" class="active">🧠 Asesmen DASS-21 & DAP</a></li>
            <li class="nav-item"><a href="mockup_chat_room.html">💬 Ruang Konseling</a></li>
            <li class="nav-item"><a href="mockup_dashboard_klien.html">👤 Portal Pasien</a></li>
        </ul>
    </div>
    <div class="main">
        <div class="topbar">
            <div>
                <h1>Stasiun Kerja Psikoedukasi & Asesmen Klinis</h1>
                <p>Dilengkapi DASS-21 Mandatory Crisis Protocol (Hotline 119 Ext 8), Mood Tracker 7-Hari, & DAP Note</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; background: rgba(16,185,129,0.15); padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(16,185,129,0.4);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">SA</div>
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem; color: #34d399;">Siti Aminah, M.Psi, Psikolog</div>
                    <div style="font-size: 0.75rem; color: #cbd5e1;">SIPP HIMPSI: 00219 / Active</div>
                </div>
            </div>
        </div>

        <!-- Proactive Wellness Banner (Triggered by 7 days sadness trend) -->
        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3)); border: 2px solid #10b981; border-radius: 12px; padding: 1.2rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 10px 25px rgba(16,185,129,0.15);">
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 2.5rem;">🌱</span>
                <div>
                    <div style="font-weight: 700; font-size: 1.1rem; color: #34d399;">PROACTIVE MENTAL HEALTH WELLNESS BANNER</div>
                    <p style="color: #d1fae5; font-size: 0.88rem; margin-top: 4px;">
                        Sistem mendeteksi grafik Mood Tracker Anda menunjukkan intensitas cemas/sedih selama <strong>7 hari beruntun</strong>. Anda tidak sendirian. Kami menyediakan akses langsung ke psikolog klinis untuk mendampingi Anda.
                    </p>
                </div>
            </div>
            <button class="btn btn-success" style="white-space: nowrap; padding: 0.8rem 1.4rem;">💬 Hubungkan dengan Psikolog</button>
        </div>

        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2rem;">
            <!-- DASS-21 Assessment Engine -->
            <div class="card">
                <div class="card-title">
                    <span>📋 Asesmen Psikometri DASS-21 (Depression, Anxiety, Stress)</span>
                    <span class="badge badge-info">HIMPSI Validated</span>
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem;">
                    Kuesioner evaluasi kuantitatif sebelum sesi konseling dimulai. Pilih tingkat kesesuaian pernyataan dengan kondisi Anda selama 7 hari terakhir.
                </p>
                
                <!-- Sample Questions -->
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.8rem; font-size: 0.9rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="margin-bottom: 8px; font-weight: 500;">1. Saya merasa sulit untuk menenangkan diri dan rileks.</div>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #cbd5e1;">
                            <label><input type="radio" name="q1"> (0) Tidak pernah</label>
                            <label><input type="radio" name="q1"> (1) Kadang-kadang</label>
                            <label><input type="radio" name="q1"> (2) Sering</label>
                            <label><input type="radio" name="q1" checked> (3) Sangat Sering</label>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="margin-bottom: 8px; font-weight: 500;">2. Saya merasa pesimis dan tidak ada harapan untuk masa depan.</div>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #cbd5e1;">
                            <label><input type="radio" name="q2"> (0) Tidak pernah</label>
                            <label><input type="radio" name="q2"> (1) Kadang-kadang</label>
                            <label><input type="radio" name="q2"> (2) Sering</label>
                            <label><input type="radio" name="q2" checked> (3) Sangat Sering</label>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="margin-bottom: 8px; font-weight: 500;">3. Saya mengalami jantung berdebar kencang tanpa alasan fisik yang jelas.</div>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #cbd5e1;">
                            <label><input type="radio" name="q3"> (0) Tidak pernah</label>
                            <label><input type="radio" name="q3"> (1) Kadang-kadang</label>
                            <label><input type="radio" name="q3" checked> (2) Sering</label>
                            <label><input type="radio" name="q3"> (3) Sangat Sering</label>
                        </div>
                    </div>
                </div>

                <!-- Simulated Scores -->
                <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem;">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px;">SIMULASI HASIL KALKULASI SKOR KLINIS:</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                        <div style="background: rgba(239,68,68,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.4);">
                            <div style="font-size: 0.75rem; color: #fca5a5;">DEPRESSION</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #f87171; margin-top: 4px;">28 (Severe)</div>
                        </div>
                        <div style="background: rgba(239,68,68,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.6);">
                            <div style="font-size: 0.75rem; color: #fca5a5;">ANXIETY</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #f87171; margin-top: 4px;">22 (Extreme)</div>
                        </div>
                        <div style="background: rgba(245,158,11,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.4);">
                            <div style="font-size: 0.75rem; color: #fef08a;">STRESS</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #fbbf24; margin-top: 4px;">18 (Moderate)</div>
                        </div>
                    </div>
                </div>

                <button class="btn btn-danger" style="width: 100%; justify-content: center; padding: 1rem; font-size: 1rem;" onclick="triggerCrisisProtocol()">
                    🚨 Hitung Skor & Analisis (Simulasi Trigger Crisis Protocol)
                </button>
            </div>

            <!-- DAP Note & Meditation Audio -->
            <div>
                <!-- DAP Note Card -->
                <div class="card" style="margin-bottom: 2rem;">
                    <div class="card-title">
                        <span>📝 Rekam Psikologi — DAP Note</span>
                        <span class="badge badge-purple">Field-Level Enc</span>
                    </div>
                    <div class="input-group">
                        <label>Data (Observasi perilaku & ucapan klien):</label>
                        <textarea class="input-control" style="height: 55px;">Klien tampak menangis, kontak mata minim, menyatakan merasa terbebani oleh tekanan pekerjaan berat.</textarea>
                    </div>
                    <div class="input-group">
                        <label>Assessment (Analisis klinis & tingkat risiko):</label>
                        <select class="input-control" style="border-color: #ef4444; color: #f87171; font-weight: 600;">
                            <option>⚠️ RISIKO HIGH — Indikasi kecemasan akut & burn out</option>
                            <option>RISIKO MODERATE — Stres situasional</option>
                            <option>RISIKO LOW — Kondisi stabil</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Plan (Intervensi & psikoedukasi):</label>
                        <textarea class="input-control" style="height: 55px;">Latihan teknik pernapasan grounding 5-4-3-2-1, penjadwalan konseling lanjutan H+3, dan pemberian tugas audio meditasi.</textarea>
                    </div>
                    <button class="btn btn-success" style="width: 100%; justify-content: center;" onclick="alert('✔ DAP Note berhasil dienkripsi dan disimpan ke profil rahasia klien!')">💾 Simpan DAP Note (WORM Locked)</button>
                </div>

                <!-- Meditation Audio Player -->
                <div class="card" style="background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9)); border-color: rgba(16,185,129,0.3);">
                    <div class="card-title" style="color: #34d399;">
                        <span>🎧 Psikoedukasi — Audio Grounding</span>
                        <span class="badge badge-success">Adaptive Bitrate</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem;">
                        Trek audio dikurasi oleh dewan ahli HIMPSI untuk membantu menurunkan detak jantung dan kecemasan secara mandiri.
                    </p>
                    <div style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button style="width: 40px; height: 40px; border-radius: 50%; background: #10b981; color: #fff; border: none; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">▶</button>
                            <div>
                                <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">Grounding 5-4-3-2-1 (Mindfulness)</div>
                                <div style="font-size: 0.75rem; color: #34d399;">Stream: 320kbps HLS (Optimal Network)</div>
                            </div>
                        </div>
                        <span style="font-size: 0.85rem; color: #cbd5e1;">10:00</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- MANDATORY CRISIS PROTOCOL MODAL (119 EXT 8 WITH 10S LOCK) -->
    <div id="crisisModal" class="modal" style="background: rgba(185,28,28,0.92);">
        <div class="modal-content" style="border: 3px solid #f87171; background: #0f172a; width: 750px; text-align: center; padding: 3rem 2.5rem;">
            <div style="font-size: 4rem; animation: pulse 1s infinite; margin-bottom: 10px;">🚨</div>
            <h1 style="color: #ef4444; font-size: 1.8rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 1rem;">
                PERINGATAN DARURAT KRISIS KESEHATAN MENTAL
            </h1>
            <p style="color: #f8fafc; font-size: 1rem; line-height: 1.6; margin-bottom: 1.8rem;">
                Skor asesmen DASS-21 Anda berada pada tingkat <strong>SEVERE / EXTREMELY SEVERE</strong>. Demi keselamatan jiwa Anda, sistem telah memicu <strong>Mandatory Crisis Protocol (Sesuai Aturan HIMPSI & Kemenkes RI)</strong>:
            </p>
            
            <div style="background: rgba(239,68,68,0.15); border: 2px dashed #ef4444; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="color: #fca5a5; font-size: 0.9rem; font-weight: 600;">HOTLINE KRISIS NASIONAL 24 JAM / 7 HARI (BEBAS PULSA):</div>
                <div style="font-size: 2.2rem; font-weight: 800; color: #fff; margin: 10px 0; letter-spacing: 2px;">
                    📞 119 Ekstensi 8
                </div>
                <div style="color: #cbd5e1; font-size: 0.85rem;">Atau hubungi LBH Mental Health / RS Jiwa terdekat: (021) 500-454</div>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; font-size: 0.85rem; color: #94a3b8; margin-bottom: 2rem; text-align: left; display: flex; flex-direction: column; gap: 6px;">
                <div>✔ <strong>Alert Otomatis:</strong> Sinyal darurat telah dikirim ke Dasbor Supervisor Klinis JUSTIFICA.</div>
                <div>✔ <strong>Prioritas Antrean:</strong> Tiket Anda langsung dialihkan ke Psikolog Klinis Spesialis Intervensi Trauma.</div>
            </div>

            <!-- Countdown Lock -->
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
                <button id="closeCrisisBtn" class="btn" style="background: #334155; color: #94a3b8; cursor: not-allowed; font-size: 1rem; padding: 1rem 2rem; width: 100%; justify-content: center;" disabled>
                    🔒 Tombol Tutup Dinonaktifkan Demi Keselamatan: Hitung Mundur <span id="timerSpan" style="color: #f87171; font-weight: 700; margin-left: 5px;">10</span> Detik
                </button>
            </div>
        </div>
    </div>

    <script>
        function triggerCrisisProtocol() {{
            document.getElementById('crisisModal').style.display = 'flex';
            let sec = 10;
            const btn = document.getElementById('closeCrisisBtn');
            const span = document.getElementById('timerSpan');
            const interval = setInterval(() => {{
                sec--;
                span.innerText = sec;
                if(sec <= 0) {{
                    clearInterval(interval);
                    btn.disabled = false;
                    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    btn.style.color = '#fff';
                    btn.style.cursor = 'pointer';
                    btn.innerHTML = '✔ Saya Mengerti & Telah Mencatat Nomor Darurat 119 Ext 8 (Lanjutkan Konseling)';
                    btn.onclick = () => {{ document.getElementById('crisisModal').style.display = 'none'; }};
                }}
            }}, 1000);
        }}
    </script>
</body>
</html>
"""

with open(os.path.join(MOCKUP_DIR, 'mockup_modul_psikologi.html'), 'w', encoding='utf-8') as f:
    f.write(HTML_PSIKOLOGI.strip() + "\n")

print("Successfully generated 3 Domain-Specific Mockup HTML files!")
