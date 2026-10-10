-- ============================================================
-- 0014 — Company logos in Supabase Storage
-- Public bucket so logo <img> tags work everywhere (print documents,
-- customer portal, settings preview) with no signed URLs and no extra
-- S3 env vars. Run after 0013.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read company logos" on storage.objects;
create policy "Public read company logos"
  on storage.objects for select
  using (bucket_id = 'company-logos');

-- Server actions upload via the service-role client (bypassing RLS), but
-- allow authenticated uploads/deletes too so the user-scoped client works
-- as a fallback when no service-role key is configured.
drop policy if exists "Authenticated upload company logos" on storage.objects;
create policy "Authenticated upload company logos"
  on storage.objects for insert
  with check (bucket_id = 'company-logos' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete company logos" on storage.objects;
create policy "Authenticated delete company logos"
  on storage.objects for delete
  using (bucket_id = 'company-logos' and auth.role() = 'authenticated');
