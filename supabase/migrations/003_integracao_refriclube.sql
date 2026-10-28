-- =====================================================================
-- Clube RefriOne — 003: integração com o Refriclube
-- Quando o associado muda de status (ou de plano), o banco chama a
-- Edge Function `sincronizar-refriclube`, que libera ou revoga o acesso
-- no Refriclube. Uma conferência diária corrige qualquer falha.
-- Não apaga nem altera dados existentes.
-- Requer as extensões pg_net e pg_cron (disponíveis no Supabase).
-- =====================================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

alter table public.associados
  add column if not exists refriclube_erro text,
  add column if not exists refriclube_aviso text,
  add column if not exists refriclube_tentativa_em timestamptz;

-- View do painel: mesmas colunas de antes + as novas no final
create or replace view public.vw_associados
with (security_invoker = true) as
select
  a.id,
  a.numero,
  a.status,
  a.membro_desde,
  a.proxima_cobranca,
  a.cancelado_em,
  a.refriclube_ativo,
  a.cpf_cnpj,
  a.area_atuacao,
  a.cidade,
  a.observacoes,
  a.criado_em,
  a.plano_id,
  pl.nome  as plano_nome,
  pl.preco_mensal,
  p.id     as perfil_id,
  p.nome,
  p.email,
  p.telefone,
  p.papel,
  a.refriclube_sincronizado_em,
  a.refriclube_erro,
  a.refriclube_aviso,
  coalesce(pl.inclui_refriclube, false) as plano_inclui_refriclube
from public.associados a
join public.perfis p on p.id = a.perfil_id
left join public.planos pl on pl.id = a.plano_id;

-- Endereço da função e chave pública (anon) do próprio projeto do clube
create or replace function public.chamar_sincronizacao_refriclube(p_associado_id uuid default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://lrcwurytmqzoyedxdljo.supabase.co/functions/v1/sincronizar-refriclube',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyY3d1cnl0bXF6b3llZHhkbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODk3MTEsImV4cCI6MjEwODY2NTcxMX0.7PwMoaxTea-Xw51yizK1LJkaWiD44y50w0590eh7U7w'
    ),
    body := case when p_associado_id is null then '{}'::jsonb
                 else jsonb_build_object('associado_id', p_associado_id) end
  );
exception when others then
  -- Nunca impedir a alteração do associado por falha de rede; a conferência diária corrige
  raise warning 'sincronizacao refriclube nao enviada: %', sqlerrm;
end $$;

revoke execute on function public.chamar_sincronizacao_refriclube(uuid) from public, anon, authenticated;

-- Dispara quando muda algo que afeta o acesso
create or replace function public.ao_mudar_acesso_refriclube()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.plano_id is distinct from old.plano_id then
    perform public.chamar_sincronizacao_refriclube(new.id);
  end if;
  return new;
end $$;

create trigger associados_sincronizar_refriclube
  after update of status, plano_id on public.associados
  for each row execute function public.ao_mudar_acesso_refriclube();

-- Conferência diária às 06:15 (horário de Brasília = 09:15 UTC)
select cron.schedule(
  'clube-sincronizar-refriclube-diario',
  '15 9 * * *',
  $$ select public.chamar_sincronizacao_refriclube(null); $$
);

-- Relatório de cobrança (base: associados com Refriclube liberado agora)
create or replace function public.relatorio_refriclube()
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.eh_admin() then raise exception 'Acesso restrito ao administrador'; end if;
  select json_build_object(
    'liberados', (select count(*) from associados where refriclube_ativo),
    'com_erro',  (select count(*) from associados where refriclube_erro is not null),
    'com_aviso', (select count(*) from associados where refriclube_aviso is not null)
  ) into r;
  return r;
end $$;

revoke execute on function public.relatorio_refriclube() from public, anon;
grant execute on function public.relatorio_refriclube() to authenticated;
