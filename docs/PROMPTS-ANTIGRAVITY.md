# Prompts para o Antigravity — Clube RefriOne

Use um prompt por vez, na ordem. Só passe para o próximo depois de testar o anterior e fazer commit.

Regras para todos os prompts (cole junto se o Antigravity esquecer):
- Nunca rodar SQL destrutivo (DROP, DELETE, TRUNCATE, ALTER que apague dados) sem me pedir aprovação.
- Nunca colocar a service_role key no frontend nem no GitHub. No frontend só a anon key.
- Manter o visual atual (azul #1D4BC4, Poppins, layout mobile) e o código em português.
- Erros sempre mostram ao usuário o motivo, em português simples.

---

## Prompt 1 — Supabase e banco

Leia o README.md e o arquivo supabase/migrations/001_estrutura_inicial.sql deste projeto.

1. Me guie para criar um projeto NOVO no Supabase chamado "clube-refrione" (separado do Refriclube), região São Paulo (sa-east-1). Se você tiver acesso à Supabase CLI ou MCP, crie você mesmo; se não, me diga exatamente onde clicar.
2. Aplique a migração 001_estrutura_inicial.sql nesse projeto novo (SQL Editor ou `supabase db push`). Não altere o conteúdo dela.
3. Crie o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do projeto novo (o .env.example mostra o formato). Confirme que .env.local está no .gitignore.
4. Rode `npm install` (o @supabase/supabase-js já está no package.json) e `npm run build`.
5. No Supabase, em Authentication → URL Configuration, coloque a URL da Vercel do projeto como Site URL e adicione http://localhost:5173 nos Redirect URLs.
6. Me diga quais variáveis eu preciso cadastrar na Vercel (Settings → Environment Variables) e depois faça um redeploy.

Ao terminar, me mostre um resumo do que foi feito e como verificar no painel do Supabase que as 12 tabelas existem.

---

## Prompt 2 — Login e app do associado ligado ao banco

O app hoje usa dados de exemplo em src/data.ts. Vamos ligá-lo ao Supabase (src/lib/supabase.ts já existe).

1. Crie um AuthProvider (contexto React) com sessão do Supabase, perfil (tabela perfis) e associado (tabela associados com o plano).
2. Telas de autenticação: /entrar (e-mail + senha), /cadastro (nome, WhatsApp, e-mail, senha; mandar nome e telefone em options.data, que o trigger ao_criar_usuario usa) e /recuperar-senha. Avisar no cadastro: "Use o mesmo e-mail do Refriclube".
3. Proteger as rotas do associado: sem login vai para /entrar.
4. Se o associado estiver com status "pendente", mostrar na Início um aviso "Assinatura aguardando pagamento" no lugar do card de status, e bloquear geração de cupom (a função já bloqueia, mostre a mensagem de erro).
5. Trocar os dados de exemplo pelos reais:
   - Início: nome, plano, status, número; oferta com destaque=true; próximo evento ativo com data futura; botão Confirmar cria/remove inscrição em eventos_inscricoes.
   - Carteirinha: dados reais; o QR deve ser um QR Code de verdade (biblioteca qrcode.react) com o token de supabase.rpc('gerar_token_carteirinha'), renovado a cada 4 minutos e no botão "Atualizar status".
   - Ofertas: lista da tabela ofertas com filtro por categoria; o botão chama supabase.rpc('gerar_cupom', { p_oferta_id }) e mostra o código retornado.
   - Refriclube: e-mail real e refriclube_url da tabela configuracoes; mostrar "Liberado" só se associados.refriclube_ativo = true, senão "Em liberação".
   - Conta: dados reais, histórico de pagamentos (tabela pagamentos), benefícios utilizados (usos_beneficio), botão de WhatsApp com configuracoes.whatsapp e botão Sair.
6. Remover src/data.ts quando nada mais usar.
7. Estados de carregando e vazio em todas as telas.

---

## Prompt 3 — Painel administrativo

Crie o painel do dono da loja em /admin, acessível só para perfis com papel = 'admin' (as regras RLS já garantem isso no banco; no frontend, redirecione quem não for admin). O painel é para computador e celular: menu lateral no computador, menu que abre no celular. Mesmo visual do app.

Seções:
1. Visão geral: cartões com os números de supabase.rpc('indicadores_admin') — ativos, pendentes, inadimplentes, novos no mês, cancelados no mês, receita do mês, benefícios usados, desconto concedido, cupons gerados, ativos no Refriclube.
2. Associados: tabela com busca (nome, e-mail, número), filtro por status e paginação. Detalhe do associado: dados, plano, status (admin pode alterar: pendente/ativo/inadimplente/cancelado; ao ativar pela primeira vez preencher membro_desde; ao cancelar preencher cancelado_em), observações, pagamentos, cupons e usos. Exportar lista em CSV.
3. Planos: criar/editar nome, descrição, preço mensal, desconto padrão (%), ativo, ordem.
4. Ofertas: criar/editar/desativar, com categoria, preço normal, preço de membro, validade, destaque e upload de imagem (criar bucket público "ofertas" no Supabase Storage com política de upload só para admin).
5. Cupons: lista com filtro por status e oferta.
6. Eventos: criar/editar, ver lista de inscritos e exportar.
7. Equipe: lista de usuários com papel vendedor/admin; promover um usuário existente (por e-mail) a vendedor ou admin, ou rebaixar a associado.
8. Comunicados: criar, publicar/despublicar. Mostrar comunicados publicados na Início do associado.
9. Configurações: nome do clube, WhatsApp, link do regulamento, link do Refriclube, validade do cupom em dias.

Depois me diga o SQL exato para eu tornar o meu usuário admin no SQL Editor:
update perfis set papel = 'admin' where email = 'MEU-EMAIL';

---

## Prompt 4 — Balcão (tela do vendedor) de verdade

A rota /balcao hoje é estática. Ligue ao banco:
1. Só entra quem tem papel vendedor ou admin.
2. Leitor de QR pela câmera do celular (biblioteca html5-qrcode), com fallback para digitar número do associado ou código do cupom.
3. Ao ler/digitar, chamar supabase.rpc('validar_associado', { p_codigo }) e mostrar: verde se ativo, vermelho se pendente/inadimplente/cancelado, aviso se não encontrado. Se veio cupom, mostrar a oferta e se o cupom ainda é válido.
4. Botão "Registrar uso do benefício" abre um formulário (descrição, valor da compra, valor do desconto) e chama supabase.rpc('registrar_uso', ...). Mostrar confirmação e limpar a tela para o próximo cliente.
5. Lista dos últimos 10 usos registrados por esse vendedor hoje.

---

## Prompt 5 — Assinatura e pagamento

Gateway escolhido pela RefriOne: [ASAAS / MERCADO PAGO / PAGAR.ME]. A conta é da loja.

1. Supabase Edge Function "criar-assinatura": recebe o usuário logado, cria o cliente e a assinatura mensal no gateway com o preço do plano, salva gateway_cliente_id e gateway_assinatura_id em associados e devolve o link de pagamento.
2. Edge Function "webhook-pagamento" (pública, validando a assinatura/token do gateway): para cada evento, grava/atualiza a tabela pagamentos (gateway_pagamento_id único) e atualiza associados.status: pago → ativo (preencher membro_desde na primeira vez e proxima_cobranca); atrasado → inadimplente; assinatura cancelada → cancelado com cancelado_em. Usar a service role só dentro da Edge Function.
3. No app: tela "Assinar o clube" para associados pendentes, com o plano e o botão que abre o link de pagamento. Em Conta: "Trocar forma de pagamento" e "Cancelar assinatura" (cancela no gateway e marca cancelado).
4. Reconciliação: Edge Function agendada (diária) que confere no gateway o status de todas as assinaturas ativas/inadimplentes e corrige divergências.
5. Me liste as chaves que preciso cadastrar como secrets no Supabase (nunca no código).

---

## Prompt 6 — Integração com o Refriclube

Quando o associado ficar ativo, o Refriclube precisa ser liberado para o mesmo e-mail; quando cancelar ou ficar inadimplente, bloqueado.

1. No projeto do CLUBE: Edge Function "sincronizar-refriclube" chamada sempre que associados.status mudar (database webhook ou trigger com pg_net). Ela chama a API do Refriclube: POST {REFRICLUBE_API_URL}/parceiro/ativar ou /parceiro/desativar com { email, nome, parceiro: "refrione", associado_numero }, header Authorization: Bearer {REFRICLUBE_PARCEIRO_TOKEN}. Em caso de sucesso, gravar refriclube_ativo e refriclube_sincronizado_em; em caso de erro, tentar de novo na reconciliação diária.
2. Secrets: REFRICLUBE_API_URL e REFRICLUBE_PARCEIRO_TOKEN.
3. Relatório mensal no painel admin: quantidade de associados com refriclube_ativo no mês (base da cobrança do Refriclube), com exportação em CSV.

(No projeto do REFRICLUBE, separado, criar a Edge Function /parceiro/ativar e /parceiro/desativar: valida o token do parceiro, cria a conta se o e-mail não existir e envia link de definir senha, ou libera o plano existente; assinatura marcada com origem = 'parceiro' e parceiro_id = 'refrione', sem cobrança no Mercado Pago.)
