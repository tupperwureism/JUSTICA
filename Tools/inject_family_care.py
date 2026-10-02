content = open('d:/justificadll/Mockups/mockup_modul_medis.html', 'r', encoding='utf-8').read()

family_care_section = """

    <!-- Rekam Medis & Family Care (Kes-UC03) -->
    <div style="max-width: 1200px; margin: 2rem auto 0;">
        <div class="glass-panel">
            <div class="panel-title"><i class="ph-fill ph-heart-pulse"></i> Rekam Medis &amp; Family Care (Kes-UC03)</div>
            <div style="display: grid; grid-template-columns: 220px 1fr; gap: 2rem;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Profil Pasien</div>
                    <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                        <div style="background: rgba(13,148,136,0.15); border: 1px solid rgba(13,148,136,0.4); border-radius: 12px; padding: 0.9rem 1rem; cursor:pointer;"><div style="font-weight:600;font-size:0.9rem;">Anda Sendiri</div><div style="font-size:0.75rem;color:#94a3b8;">Pasien Utama</div></div>
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.9rem 1rem; cursor:pointer;"><div style="font-weight:600;font-size:0.9rem;">Ibu Sari</div><div style="font-size:0.75rem;color:#94a3b8;">Istri</div></div>
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.9rem 1rem; cursor:pointer;"><div style="font-weight:600;font-size:0.9rem;">Budi Jr.</div><div style="font-size:0.75rem;color:#94a3b8;">Anak</div></div>
                    </div>
                    <button style="margin-top:1rem;width:100%;padding:0.7rem;background:transparent;border:1px dashed rgba(255,255,255,0.08);border-radius:12px;color:#94a3b8;cursor:pointer;font-size:0.85rem;">+ Tambah Anggota</button>
                </div>
                <div>
                    <div style="font-size:0.8rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem;">Riwayat Konsultasi - <span style="color:#0d9488;">Anda Sendiri</span></div>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead><tr>
                            <th style="text-align:left;padding:0.7rem 1rem;font-size:0.78rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);">Tanggal</th>
                            <th style="text-align:left;padding:0.7rem 1rem;font-size:0.78rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);">Dokter</th>
                            <th style="text-align:left;padding:0.7rem 1rem;font-size:0.78rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);">Diagnosis</th>
                            <th style="text-align:left;padding:0.7rem 1rem;font-size:0.78rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);">Resep</th>
                        </tr></thead>
                        <tbody>
                            <tr><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">28 Jun 2026</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">dr. Andi Pratama</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">ISPA Ringan</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.8rem;background:rgba(13,148,136,0.15);color:#0d9488;padding:3px 10px;border-radius:20px;">2 Obat</span></td></tr>
                            <tr><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">10 Mei 2026</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">dr. Rina Susanti</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.88rem;">Hipertensi Ringan</td><td style="padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.8rem;background:rgba(13,148,136,0.15);color:#0d9488;padding:3px 10px;border-radius:20px;">1 Obat</span></td></tr>
                            <tr><td style="padding:0.9rem 1rem;font-size:0.88rem;">02 Apr 2026</td><td style="padding:0.9rem 1rem;font-size:0.88rem;">dr. Andi Pratama</td><td style="padding:0.9rem 1rem;font-size:0.88rem;">Flu Biasa</td><td style="padding:0.9rem 1rem;"><span style="font-size:0.8rem;background:rgba(13,148,136,0.15);color:#0d9488;padding:3px 10px;border-radius:20px;">3 Obat</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

"""

marker = '<!-- [TAMBAHAN: Card Peringatan'
content = content.replace(marker, family_care_section + marker, 1)
open('d:/justificadll/Mockups/mockup_modul_medis.html', 'w', encoding='utf-8').write(content)
print('DONE')
