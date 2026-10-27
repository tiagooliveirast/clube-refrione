# Clube RefriOne

App (PWA) do Clube de Benefícios RefriOne, com acesso ao Refriclube incluso.

Stack: React + Vite + TypeScript, publicado na Vercel.

## Telas

| Rota | Tela |
|---|---|
| `/` | Início: assinatura, atalhos, oferta do mês, próximo evento |
| `/carteirinha` | Carteirinha digital com QR de validação |
| `/ofertas` | Ofertas para membros, filtro por categoria e cupom |
| `/refriclube` | Acesso ao Refriclube com o mesmo e-mail |
| `/conta` | Minha assinatura, pagamentos, suporte, cancelamento |
| `/balcao` | Tela do vendedor: validar associado e registrar uso do benefício |

## Rodar no computador

```bash
npm install
npm run dev
```

## Publicar na Vercel

1. Na Vercel: Add New → Project → importar este repositório.
2. Framework: Vite (detectado sozinho). Build: `npm run build`. Saída: `dist`.
3. Deploy. A partir daí, cada push no GitHub publica automaticamente.

## Estado atual (fase 1 — protótipo funcional)

- Todos os dados estão em `src/data.ts`, com valores entre colchetes para a RefriOne preencher.
- O QR da carteirinha é ilustrativo.
- Não há login, pagamento nem banco de dados ainda.
- Logo provisório em `src/components/Logo.tsx` e `public/icon.svg`. Trocar pelo oficial.
- Gerar `public/icon-192.png` e `public/icon-512.png` a partir do logo oficial (ícone do app instalado).

## Fase 2 (próximos passos)

1. Supabase: tabelas `associados`, `ofertas`, `cupons`, `eventos`, `usos_beneficio`; login por e-mail.
2. Assinatura recorrente no gateway escolhido pela RefriOne, com webhook atualizando `associados.status`.
3. Carteirinha: QR com token temporário assinado pelo servidor; `/balcao` consulta o status em tempo real.
4. `/balcao` protegido por login de funcionário.
5. Integração Refriclube: ao confirmar pagamento, chamar a Edge Function do Refriclube (`/parceiro/ativar`) com o e-mail; ao cancelar, `/parceiro/desativar`. Reconciliação diária dos ativos.
6. Painel da loja: associados, ofertas, eventos e indicadores.
