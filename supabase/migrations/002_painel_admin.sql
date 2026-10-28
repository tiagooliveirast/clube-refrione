-- =====================================================================
-- Clube RefriOne — 002: suporte ao painel administrativo
-- - datas automáticas ao mudar o status do associado
-- - view de associados para listagem/busca no painel (respeita RLS)
-- - registro manual de pagamento (enquanto não há gateway)
-- - bucket público de imagens das ofertas (upload só do admin)
-- Não apaga nem altera dados existentes.
-- =====================================================================

-- ---------- Datas automáticas por status ----------
create or replace function public.datas_por_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'ativo' and new.membro_desde is null then
      new.membro_desde := current_date;
    end if;
    if new.status = 'cancelado' then
      new.cancelado_em := coalesce(new.cancelado_em, now());
    elsif old.status = 'cancelado' then
      new.cancelado_em := null;
    end if;
  end if;
  return new;
end $$;

create trigger associados_datas_status before update on public.associados
  for each row execute function public.datas_por_status();

-- ---------- View para o painel ----------
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
  p.papel
from public.associados a
join public.perfis p on p.id = a.perfil_id
left join public.planos pl on pl.id = a.plano_id;

grant select on public.vw_associados to authenticated;

-- ---------- Pagamento manual (Pix/dinheiro no balcão) ----------
create or replace function public.registrar_pagamento_manual(
  p_associado_id uuid,
  p_valor numeric,
  p_metodo text default 'Pix'
) returns public.pagamentos language plpgsql security definer set search_path = public as $$
declare
  v_assoc public.associados;
  v_pag public.pagamentos;
  v_base date;
begin
  if not public.eh_admin() then raise exception 'Acesso restrito ao administrador'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Informe um valor maior que zero'; end if;

  select * into v_assoc from public.associados where id = p_associado_id for update;
  if v_assoc.id is null then raise exception 'Associado não encontrado'; end if;

  insert into public.pagamentos (associado_id, valor, status, vencimento, pago_em, metodo)
  values (p_associado_id, p_valor, 'pago', current_date, now(), coalesce(nullif(trim(p_metodo), ''), 'Manual'))
  returning * into v_pag;

  -- Próxima cobrança: 1 mês após a data atual ou após a próxima cobrança já prevista (o que for maior)
  v_base := greatest(coalesce(v_assoc.proxima_cobranca, current_date), current_date);
  update public.associados
     set status = 'ativo',
         proxima_cobranca = (v_base + interval '1 month')::date
   where id = p_associado_id;

  return v_pag;
end $$;

revoke execute on function public.registrar_pagamento_manual(uuid, numeric, text) from public, anon;
grant execute on function public.registrar_pagamento_manual(uuid, numeric, text) to authenticated;

-- ---------- Indicadores: incluir receita prevista ----------
create or replace function public.indicadores_admin()
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.eh_admin() then raise exception 'Acesso restrito ao administrador'; end if;
  select json_build_object(
    'ativos',         (select count(*) from associados where status = 'ativo'),
    'pendentes',      (select count(*) from associados where status = 'pendente'),
    'inadimplentes',  (select count(*) from associados where status = 'inadimplente'),
    'cancelados_mes', (select count(*) from associados where status = 'cancelado'
                         and cancelado_em >= date_trunc('month', now())),
    'novos_mes',      (select count(*) from associados where membro_desde >= date_trunc('month', now())),
    'receita_mes',    (select coalesce(sum(valor), 0) from pagamentos where status = 'pago'
                         and pago_em >= date_trunc('month', now())),
    'receita_prevista', (select coalesce(sum(pl.preco_mensal), 0) from associados a
                           join planos pl on pl.id = a.plano_id where a.status = 'ativo'),
    'usos_mes',       (select count(*) from usos_beneficio where criado_em >= date_trunc('month', now())),
    'desconto_mes',   (select coalesce(sum(valor_desconto), 0) from usos_beneficio
                         where criado_em >= date_trunc('month', now())),
    'compras_mes',    (select coalesce(sum(valor_compra), 0) from usos_beneficio
                         where criado_em >= date_trunc('month', now())),
    'cupons_mes',     (select count(*) from cupons where gerado_em >= date_trunc('month', now())),
    'refriclube_ativos', (select count(*) from associados where refriclube_ativo)
  ) into r;
  return r;
end $$;

-- ---------- Imagens das ofertas (Supabase Storage) ----------
insert into storage.buckets (id, name, public)
values ('ofertas', 'ofertas', true)
on conflict (id) do nothing;

create policy "ofertas_imagens_ler" on storage.objects for select
  using (bucket_id = 'ofertas');

create policy "ofertas_imagens_admin_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'ofertas' and public.eh_admin());

create policy "ofertas_imagens_admin_alterar" on storage.objects for update to authenticated
  using (bucket_id = 'ofertas' and public.eh_admin());

create policy "ofertas_imagens_admin_remover" on storage.objects for delete to authenticated
  using (bucket_id = 'ofertas' and public.eh_admin());
