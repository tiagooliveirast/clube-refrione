-- =====================================================================
-- Clube de Benefícios RefriOne — 001: estrutura inicial
-- Perfis (associado / vendedor / admin), associados, planos, pagamentos,
-- ofertas, cupons, eventos, usos de benefício, comunicados e configurações.
-- Todas as tabelas com RLS. Mudanças de status do associado só pelo admin
-- ou pelo servidor (webhook de pagamento, usando a service role).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
create type papel_usuario as enum ('associado', 'vendedor', 'admin');
create type status_associado as enum ('pendente', 'ativo', 'inadimplente', 'cancelado');
create type status_pagamento as enum ('pendente', 'pago', 'recusado', 'reembolsado', 'cancelado');
create type status_cupom as enum ('gerado', 'usado', 'expirado');

-- ---------- Função utilitária: atualizado_em ----------
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

-- =====================================================================
-- Tabelas
-- =====================================================================

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null,
  telefone text,
  papel papel_usuario not null default 'associado',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco_mensal numeric(10,2) not null default 0,
  desconto_padrao numeric(5,2) not null default 0 check (desconto_padrao between 0 and 100),
  inclui_refriclube boolean not null default true,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create sequence public.associados_numero_seq start 1;

create table public.associados (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfis (id) on delete cascade,
  numero text not null unique default lpad(nextval('public.associados_numero_seq')::text, 6, '0'),
  plano_id uuid references public.planos (id),
  status status_associado not null default 'pendente',
  cpf_cnpj text,
  area_atuacao text,
  cidade text,
  membro_desde date,
  proxima_cobranca date,
  cancelado_em timestamptz,
  gateway_cliente_id text,
  gateway_assinatura_id text,
  refriclube_ativo boolean not null default false,
  refriclube_sincronizado_em timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index associados_status_idx on public.associados (status);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  associado_id uuid not null references public.associados (id) on delete cascade,
  valor numeric(10,2) not null,
  status status_pagamento not null default 'pendente',
  vencimento date,
  pago_em timestamptz,
  metodo text,
  gateway_pagamento_id text unique,
  criado_em timestamptz not null default now()
);
create index pagamentos_associado_idx on public.pagamentos (associado_id);

create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria text not null default 'Refrigeração'
    check (categoria in ('Refrigeração', 'Ar-condicionado', 'Linha branca', 'Ferramentas', 'Outros')),
  preco_normal numeric(10,2),
  preco_membro numeric(10,2),
  imagem_url text,
  destaque boolean not null default false,
  valida_ate date,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  associado_id uuid not null references public.associados (id) on delete cascade,
  oferta_id uuid references public.ofertas (id) on delete set null,
  status status_cupom not null default 'gerado',
  valido_ate timestamptz not null default (now() + interval '7 days'),
  gerado_em timestamptz not null default now(),
  usado_em timestamptz,
  usado_por uuid references public.perfis (id)
);
create index cupons_associado_idx on public.cupons (associado_id);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data_hora timestamptz not null,
  local text,
  vagas int check (vagas is null or vagas > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.eventos_inscricoes (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  associado_id uuid not null references public.associados (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (evento_id, associado_id)
);

create table public.usos_beneficio (
  id uuid primary key default gen_random_uuid(),
  associado_id uuid not null references public.associados (id) on delete cascade,
  vendedor_id uuid references public.perfis (id),
  cupom_id uuid references public.cupons (id),
  descricao text,
  valor_compra numeric(10,2),
  valor_desconto numeric(10,2),
  criado_em timestamptz not null default now()
);
create index usos_associado_idx on public.usos_beneficio (associado_id);
create index usos_data_idx on public.usos_beneficio (criado_em);

create table public.comunicados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.configuracoes (
  id int primary key default 1 check (id = 1),
  nome_clube text not null default 'Clube de Benefícios RefriOne',
  whatsapp text,
  regulamento_url text,
  refriclube_url text not null default 'https://refriclube.app.br',
  validade_cupom_dias int not null default 7 check (validade_cupom_dias > 0),
  atualizado_em timestamptz not null default now()
);
insert into public.configuracoes (id) values (1);

-- Tokens temporários do QR da carteirinha (expiram em minutos)
create table public.tokens_carteirinha (
  token text primary key,
  associado_id uuid not null references public.associados (id) on delete cascade,
  expira_em timestamptz not null
);

-- Triggers de atualizado_em
create trigger perfis_atualizado before update on public.perfis for each row execute function public.tocar_atualizado_em();
create trigger associados_atualizado before update on public.associados for each row execute function public.tocar_atualizado_em();
create trigger ofertas_atualizado before update on public.ofertas for each row execute function public.tocar_atualizado_em();
create trigger configuracoes_atualizado before update on public.configuracoes for each row execute function public.tocar_atualizado_em();

-- =====================================================================
-- Funções de papel (security definer evita recursão nas políticas)
-- =====================================================================

create or replace function public.meu_papel()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select papel from public.perfis where id = auth.uid()
$$;

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.perfis where id = auth.uid()), false)
$$;

create or replace function public.eh_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel in ('admin', 'vendedor') from public.perfis where id = auth.uid()), false)
$$;

create or replace function public.meu_associado_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.associados where perfil_id = auth.uid()
$$;

-- =====================================================================
-- Cadastro automático: novo usuário → perfil + associado (pendente)
-- =====================================================================

create or replace function public.ao_criar_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    new.email,
    new.raw_user_meta_data ->> 'telefone'
  );
  insert into public.associados (perfil_id, plano_id)
  values (new.id, (select id from public.planos where ativo order by ordem limit 1));
  return new;
end $$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.ao_criar_usuario();

-- Impede que um usuário comum mude o próprio papel
create or replace function public.proteger_papel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.papel is distinct from old.papel and auth.uid() is not null and not public.eh_admin() then
    raise exception 'Somente o administrador pode alterar o papel do usuário';
  end if;
  return new;
end $$;

create trigger perfis_proteger_papel before update on public.perfis
  for each row execute function public.proteger_papel();

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.perfis enable row level security;
alter table public.planos enable row level security;
alter table public.associados enable row level security;
alter table public.pagamentos enable row level security;
alter table public.ofertas enable row level security;
alter table public.cupons enable row level security;
alter table public.eventos enable row level security;
alter table public.eventos_inscricoes enable row level security;
alter table public.usos_beneficio enable row level security;
alter table public.comunicados enable row level security;
alter table public.configuracoes enable row level security;
alter table public.tokens_carteirinha enable row level security; -- sem políticas: só via funções

-- perfis
create policy perfis_ver on public.perfis for select to authenticated
  using (id = auth.uid() or public.eh_equipe());
create policy perfis_editar_proprio on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy perfis_admin on public.perfis for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- planos
create policy planos_ver on public.planos for select to authenticated using (ativo or public.eh_admin());
create policy planos_admin on public.planos for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- associados (o associado só lê; status é do admin/servidor)
create policy associados_ver on public.associados for select to authenticated
  using (perfil_id = auth.uid() or public.eh_equipe());
create policy associados_admin on public.associados for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- pagamentos
create policy pagamentos_ver on public.pagamentos for select to authenticated
  using (associado_id = public.meu_associado_id() or public.eh_admin());
create policy pagamentos_admin on public.pagamentos for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ofertas
create policy ofertas_ver on public.ofertas for select to authenticated
  using ((ativa and (valida_ate is null or valida_ate >= current_date)) or public.eh_equipe());
create policy ofertas_admin on public.ofertas for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- cupons (criação e uso apenas pelas funções abaixo)
create policy cupons_ver on public.cupons for select to authenticated
  using (associado_id = public.meu_associado_id() or public.eh_equipe());
create policy cupons_admin on public.cupons for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- eventos
create policy eventos_ver on public.eventos for select to authenticated using (ativo or public.eh_admin());
create policy eventos_admin on public.eventos for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- inscrições em eventos
create policy inscricoes_ver on public.eventos_inscricoes for select to authenticated
  using (associado_id = public.meu_associado_id() or public.eh_equipe());
create policy inscricoes_criar on public.eventos_inscricoes for insert to authenticated
  with check (
    associado_id = public.meu_associado_id()
    and exists (select 1 from public.associados a where a.id = associado_id and a.status = 'ativo')
  );
create policy inscricoes_remover on public.eventos_inscricoes for delete to authenticated
  using (associado_id = public.meu_associado_id() or public.eh_admin());

-- usos de benefício
create policy usos_ver on public.usos_beneficio for select to authenticated
  using (associado_id = public.meu_associado_id() or public.eh_equipe());
create policy usos_registrar on public.usos_beneficio for insert to authenticated
  with check (public.eh_equipe() and vendedor_id = auth.uid());
create policy usos_admin on public.usos_beneficio for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- comunicados
create policy comunicados_ver on public.comunicados for select to authenticated using (publicado or public.eh_admin());
create policy comunicados_admin on public.comunicados for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- configurações (leitura pública: nome, WhatsApp, links)
create policy configuracoes_ver on public.configuracoes for select to anon, authenticated using (true);
create policy configuracoes_admin on public.configuracoes for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- =====================================================================
-- Funções de negócio (chamadas pelo app via supabase.rpc)
-- =====================================================================

-- Associado gera cupom para uma oferta
create or replace function public.gerar_cupom(p_oferta_id uuid)
returns public.cupons language plpgsql security definer set search_path = public as $$
declare
  v_assoc public.associados;
  v_cupom public.cupons;
  v_dias int;
begin
  select * into v_assoc from public.associados where perfil_id = auth.uid();
  if v_assoc.id is null then raise exception 'Associado não encontrado'; end if;
  if v_assoc.status <> 'ativo' then raise exception 'Sua assinatura não está ativa'; end if;
  if not exists (select 1 from public.ofertas o where o.id = p_oferta_id and o.ativa
                 and (o.valida_ate is null or o.valida_ate >= current_date)) then
    raise exception 'Oferta indisponível';
  end if;

  -- reaproveita cupom ainda válido da mesma oferta
  select * into v_cupom from public.cupons
   where associado_id = v_assoc.id and oferta_id = p_oferta_id
     and status = 'gerado' and valido_ate > now()
   limit 1;
  if v_cupom.id is not null then return v_cupom; end if;

  select validade_cupom_dias into v_dias from public.configuracoes where id = 1;
  insert into public.cupons (codigo, associado_id, oferta_id, valido_ate)
  values ('R1-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
          v_assoc.id, p_oferta_id, now() + make_interval(days => coalesce(v_dias, 7)))
  returning * into v_cupom;
  return v_cupom;
end $$;

-- Associado gera token do QR da carteirinha (vale 5 minutos)
create or replace function public.gerar_token_carteirinha()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public.meu_associado_id();
  v_token text;
begin
  if v_id is null then raise exception 'Associado não encontrado'; end if;
  delete from public.tokens_carteirinha where associado_id = v_id or expira_em < now();
  v_token := encode(gen_random_bytes(16), 'hex');
  insert into public.tokens_carteirinha (token, associado_id, expira_em)
  values (v_token, v_id, now() + interval '5 minutes');
  return v_token;
end $$;

-- Vendedor/admin consulta associado por token do QR, número ou código de cupom
create or replace function public.validar_associado(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_assoc_id uuid;
  v_cupom public.cupons;
  r json;
begin
  if not public.eh_equipe() then raise exception 'Acesso restrito à equipe da loja'; end if;
  p_codigo := trim(p_codigo);

  select associado_id into v_assoc_id from public.tokens_carteirinha
   where token = p_codigo and expira_em > now();

  if v_assoc_id is null then
    select id into v_assoc_id from public.associados
     where numero = lpad(regexp_replace(p_codigo, '\D', '', 'g'), 6, '0')
       and regexp_replace(p_codigo, '\D', '', 'g') <> '';
  end if;

  if v_assoc_id is null then
    select * into v_cupom from public.cupons where upper(codigo) = upper(p_codigo);
    v_assoc_id := v_cupom.associado_id;
  end if;

  if v_assoc_id is null then
    return json_build_object('encontrado', false);
  end if;

  select json_build_object(
    'encontrado', true,
    'associado_id', a.id,
    'numero', a.numero,
    'nome', p.nome,
    'status', a.status,
    'plano', pl.nome,
    'desconto_padrao', pl.desconto_padrao,
    'cupom', case when v_cupom.id is null then null else json_build_object(
        'id', v_cupom.id, 'codigo', v_cupom.codigo, 'status', v_cupom.status,
        'valido', v_cupom.status = 'gerado' and v_cupom.valido_ate > now(),
        'oferta', (select titulo from public.ofertas where id = v_cupom.oferta_id)) end,
    'consultado_em', now()
  ) into r
  from public.associados a
  join public.perfis p on p.id = a.perfil_id
  left join public.planos pl on pl.id = a.plano_id
  where a.id = v_assoc_id;

  return r;
end $$;

-- Vendedor registra uso do benefício (e baixa o cupom, se houver)
create or replace function public.registrar_uso(
  p_associado_id uuid,
  p_cupom_id uuid default null,
  p_descricao text default null,
  p_valor_compra numeric default null,
  p_valor_desconto numeric default null
) returns public.usos_beneficio language plpgsql security definer set search_path = public as $$
declare
  v_uso public.usos_beneficio;
begin
  if not public.eh_equipe() then raise exception 'Acesso restrito à equipe da loja'; end if;
  if not exists (select 1 from public.associados where id = p_associado_id and status = 'ativo') then
    raise exception 'Associado não está ativo';
  end if;

  if p_cupom_id is not null then
    update public.cupons set status = 'usado', usado_em = now(), usado_por = auth.uid()
     where id = p_cupom_id and associado_id = p_associado_id
       and status = 'gerado' and valido_ate > now();
    if not found then raise exception 'Cupom inválido, expirado ou já utilizado'; end if;
  end if;

  insert into public.usos_beneficio (associado_id, vendedor_id, cupom_id, descricao, valor_compra, valor_desconto)
  values (p_associado_id, auth.uid(), p_cupom_id, p_descricao, p_valor_compra, p_valor_desconto)
  returning * into v_uso;
  return v_uso;
end $$;

-- Indicadores do painel do admin
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
    'usos_mes',       (select count(*) from usos_beneficio where criado_em >= date_trunc('month', now())),
    'desconto_mes',   (select coalesce(sum(valor_desconto), 0) from usos_beneficio
                         where criado_em >= date_trunc('month', now())),
    'cupons_mes',     (select count(*) from cupons where gerado_em >= date_trunc('month', now())),
    'refriclube_ativos', (select count(*) from associados where refriclube_ativo)
  ) into r;
  return r;
end $$;

-- Permissões das funções: só usuários logados
revoke execute on function public.gerar_cupom(uuid), public.gerar_token_carteirinha(),
  public.validar_associado(text), public.registrar_uso(uuid, uuid, text, numeric, numeric),
  public.indicadores_admin() from public, anon;
grant execute on function public.gerar_cupom(uuid), public.gerar_token_carteirinha(),
  public.validar_associado(text), public.registrar_uso(uuid, uuid, text, numeric, numeric),
  public.indicadores_admin() to authenticated;

-- =====================================================================
-- Dados iniciais (editáveis pelo painel)
-- =====================================================================
insert into public.planos (nome, descricao, preco_mensal, desconto_padrao, ordem)
values ('Start', 'Plano inicial do clube, com acesso ao Refriclube incluso', 0, 0, 1);
