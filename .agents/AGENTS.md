# Rules for `.agents/`

File ini hanya menambahkan aturan untuk isi `.agents/`. Aturan universal berada di root `AGENTS.md`, sedangkan kontrak peran berada di `.agents/ROLE.md`; keduanya tetap berlaku.

## Skill packages

- Saat membuat atau mengubah skill, gunakan `skill-creator` atau `writing-great-skills` bila relevan dan baca instruksinya secara lengkap.
- Setiap skill harus memiliki `SKILL.md` dengan nama, deskripsi pemicu, scope, workflow, safety boundary, dan output yang jelas.
- Letakkan detail besar pada `references/`, script pada `scripts/`, dan aset pada `assets/`; muat semuanya secara progresif melalui rujukan eksplisit dari `SKILL.md`.
- Jangan menanam secret, API key, path mesin pribadi, instruksi destruktif, permission escalation tersembunyi, atau perilaku yang lebih luas daripada deskripsi skill.
- Gunakan path relatif terhadap direktori skill bila memungkinkan. Script harus fail-closed, memvalidasi input/target, dan aman dijalankan berulang.
- Uji script atau skill yang memiliki perilaku executable/mutating pada fixture atau direktori sementara sebelum dipakai pada data proyek. Untuk skill deklaratif/router, lakukan validasi struktur, referensi, dan review instruksi. Verifikasi file yang benar-benar berubah dan jangan menyentuh skill lain tanpa scope.
- Jangan menduplikasi seluruh aturan root/ROLE ke setiap skill; tuliskan hanya aturan domain yang benar-benar menambah perilaku.

## Perubahan konfigurasi agen

- Perubahan pada `AGENTS.md`, `ROLE.md`, atau skill adalah batch konfigurasi terpisah dari batch produk.
- Audit konflik dan redundansi terhadap root sebelum commit. Pertahankan backward compatibility untuk nama skill yang masih direferensikan atau dokumentasikan migrasinya.
- Stage/commit hanya file konfigurasi yang diotorisasi; jangan ikutkan source produk atau perubahan pengguna lain.
