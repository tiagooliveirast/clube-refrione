// =====================================================
// sincronizar-refriclube — libera/revoga o Refriclube dos associados
// =====================================================
// Chamada pelo banco (trigger ao mudar status/plano e cron diário)
// e pelo botão "Sincronizar" do painel.
//
// Regra: associado com status 'ativo' em plano que inclui o Refriclube
// → acesso liberado. Qualquer outro caso → acesso revogado.
//
// Corpo opcional: { associado_id } para sincronizar só um.
// Sem corpo: confere todos e corrige o que estiver diferente.
//
// Secrets necessários:
//   REFRICLUBE_PARCEIRO_TOKEN  (o mesmo token cadastrado no Refriclube)
//   REFRICLUBE_API_URL         (opcional; padrão abaixo)
// =====================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TOKEN = Deno.env.get("REFRICLUBE_PARCEIRO_TOKEN") || "";
const API_URL = Deno.env.get("REFRICLUBE_API_URL") || "https://hyxxkkpirdeijfjvfrpk.supabase.co/functions/v1/parceiro-acesso";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface Linha {
  id: string;
  numero: string;
  status: string;
  refriclube_ativo: boolean;
  refriclube_erro: string | null;
  perfil: { nome: string; email: string } | null;
  plano: { inclui_refriclube: boolean } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!TOKEN) return json({ error: "REFRICLUBE_PARCEIRO_TOKEN não configurado" }, 500);

  const body = await req.json().catch(() => ({}));
  const associadoId: string | null = typeof body.associado_id === "string" ? body.associado_id : null;

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let q = db
    .from("associados")
    .select("id, numero, status, refriclube_ativo, refriclube_erro, perfil:perfis(nome, email), plano:planos(inclui_refriclube)");
  if (associadoId) q = q.eq("id", associadoId);
  const { data, error } = await q;
  if (error) return json({ error: error.message }, 500);

  const linhas = (data ?? []) as unknown as Linha[];
  const resultado = { verificados: 0, liberados: 0, revogados: 0, erros: 0, avisos: 0 };

  for (const a of linhas) {
    const deveTer = a.status === "ativo" && (a.plano?.inclui_refriclube ?? false);
    // Na conferência geral, só chama o Refriclube quando há diferença ou erro pendente
    if (!associadoId && deveTer === a.refriclube_ativo && !a.refriclube_erro) continue;
    if (!a.perfil?.email) continue;
    resultado.verificados++;

    const agora = new Date().toISOString();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ acao: deveTer ? "ativar" : "desativar", email: a.perfil.email, nome: a.perfil.nome, ref: a.numero }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || `Refriclube respondeu ${res.status}`);

      let aviso: string | null = null;
      if (r.motivo === "bloqueado_pelo_admin") aviso = "Conta bloqueada no Refriclube pelo administrador. Desbloqueie lá para liberar.";
      if (r.cobranca_mp_ativa) aviso = "Este técnico já pagava o Refriclube pelo Mercado Pago. Cancele a cobrança dele no Mercado Pago para não cobrar duas vezes.";
      if (aviso) resultado.avisos++;

      await db
        .from("associados")
        .update({
          refriclube_ativo: Boolean(r.liberado),
          refriclube_sincronizado_em: agora,
          refriclube_tentativa_em: agora,
          refriclube_erro: null,
          refriclube_aviso: aviso,
        })
        .eq("id", a.id);

      if (r.liberado) resultado.liberados++;
      else resultado.revogados++;
    } catch (e) {
      resultado.erros++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[sincronizar-refriclube] associado ${a.numero}:`, msg);
      await db.from("associados").update({ refriclube_erro: msg.slice(0, 300), refriclube_tentativa_em: agora }).eq("id", a.id);
    }
  }

  return json(resultado);
});
