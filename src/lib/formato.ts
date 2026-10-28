const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function reais(valor: number | null | undefined) {
  return valor == null ? '—' : moeda.format(Number(valor));
}

// Datas "AAAA-MM-DD" do banco: tratar como data local para não voltar um dia
function paraData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(valor + 'T12:00:00') : new Date(valor);
}

export function data(valor: string | null | undefined) {
  return valor ? paraData(valor).toLocaleDateString('pt-BR') : '—';
}

export function mesAno(valor: string | null | undefined) {
  return valor ? paraData(valor).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '—';
}

export function diaMes(valor: string | null | undefined) {
  return valor ? paraData(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';
}

export function hora(valor: string | Date) {
  return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  return ((partes[0][0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] || 'associado';
}

export const rotuloStatus: Record<string, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  inadimplente: 'Em atraso',
  cancelado: 'Cancelado',
};

export const rotuloPagamento: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  recusado: 'Recusado',
  reembolsado: 'Reembolsado',
  cancelado: 'Cancelado',
};

// Traduz mensagens de erro do Supabase para português simples
export function mensagemErro(erro: unknown): string {
  const msg = (erro as { message?: string })?.message ?? String(erro ?? '');
  const mapa: [RegExp, string][] = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/email not confirmed/i, 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada (e no spam).'],
    [/user already registered|already been registered/i, 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.'],
    [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/unable to validate email|invalid email/i, 'E-mail inválido. Confira se digitou certo.'],
    [/rate limit|too many requests|for security purposes/i, 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'],
    [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'],
    [/new password should be different/i, 'A nova senha precisa ser diferente da anterior.'],
    [/jwt expired|session.*(missing|expired)/i, 'Sua sessão expirou. Entre de novo.'],
  ];
  for (const [re, texto] of mapa) if (re.test(msg)) return texto;
  return msg || 'Algo deu errado. Tente de novo.';
}
