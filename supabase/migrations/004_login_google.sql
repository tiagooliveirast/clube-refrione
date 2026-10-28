-- =====================================================================
-- Login com Google (OAuth)
-- O trigger de cadastro passa a aceitar o nome vindo do metadata do
-- provedor OAuth (full_name / name), além do 'nome' do cadastro manual.
-- =====================================================================

create or replace function public.ao_criar_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, telefone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nome',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    new.email,
    new.raw_user_meta_data ->> 'telefone'
  );
  insert into public.associados (perfil_id, plano_id)
  values (new.id, (select id from public.planos where ativo order by ordem limit 1));
  return new;
end $$;
