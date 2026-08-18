-- Bucket Storage untuk gambar dan berkas yang diunggah lewat admin.
--
-- Dibuat lewat migrasi, bukan lewat dashboard, supaya ia ada di repo dan bisa
-- direproduksi — bukan langkah manual yang catatannya hilang begitu orangnya
-- lupa.
--
-- GERBANG TULISNYA `public.adalah_pemilik()`, BUKAN `authenticated`.
--
-- Ini bukan kehati-hatian berlebihan. Di proyek ini pernah terjadi persis
-- kesalahan itu: seluruh kebijakan tulis tabel konten bergerbang
-- `to authenticated with check (true)` sementara pendaftaran publik masih
-- terbuka, sehingga siapa pun bisa mendaftar lewat endpoint publik dan
-- mengubah isi portofolio. Menutup pendaftaran memperbaiki hari itu, tapi
-- gerbang yang benar tidak boleh bersandar pada satu sakelar dashboard yang
-- bisa berubah tanpa jejak di repo.
--
-- Untuk Storage taruhannya sama: bucket ini publik untuk DIBACA, jadi tulisan
-- yang bocor berarti siapa pun bisa menaruh berkas di domain portofolio.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Baca: siapa pun, termasuk pengunjung anonim. Bucket ini memang untuk
-- gambar yang tayang di halaman publik.
drop policy if exists "media dibaca siapa pun" on storage.objects;
create policy "media dibaca siapa pun" on storage.objects
  for select
  using (bucket_id = 'media');

-- Tulis, ubah, hapus: hanya pemilik. Gerbangnya identik dengan tabel konten.
drop policy if exists "media ditulis pemilik" on storage.objects;
create policy "media ditulis pemilik" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.adalah_pemilik());

drop policy if exists "media diubah pemilik" on storage.objects;
create policy "media diubah pemilik" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.adalah_pemilik())
  with check (bucket_id = 'media' and public.adalah_pemilik());

drop policy if exists "media dihapus pemilik" on storage.objects;
create policy "media dihapus pemilik" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.adalah_pemilik());
