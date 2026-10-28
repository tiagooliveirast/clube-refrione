// Tipos espelhando as tabelas de supabase/migrations/001_estrutura_inicial.sql

export type Papel = 'associado' | 'vendedor' | 'admin';
export type StatusAssociado = 'pendente' | 'ativo' | 'inadimplente' | 'cancelado';
export type StatusPagamento = 'pendente' | 'pago' | 'recusado' | 'reembolsado' | 'cancelado';
export type Categoria = 'Refrigeração' | 'Ar-condicionado' | 'Linha branca' | 'Ferramentas' | 'Outros';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: Papel;
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  preco_mensal: number;
  desconto_padrao: number;
}

export interface Associado {
  id: string;
  perfil_id: string;
  numero: string;
  status: StatusAssociado;
  membro_desde: string | null;
  proxima_cobranca: string | null;
  refriclube_ativo: boolean;
  plano: Plano | null;
}

export interface Oferta {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: Categoria;
  preco_normal: number | null;
  preco_membro: number | null;
  imagem_url: string | null;
  destaque: boolean;
  valida_ate: string | null;
}

export interface Cupom {
  id: string;
  codigo: string;
  status: 'gerado' | 'usado' | 'expirado';
  valido_ate: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  local: string | null;
}

export interface Pagamento {
  id: string;
  valor: number;
  status: StatusPagamento;
  vencimento: string | null;
  pago_em: string | null;
  metodo: string | null;
}

export interface UsoBeneficio {
  id: string;
  descricao: string | null;
  valor_compra: number | null;
  valor_desconto: number | null;
  criado_em: string;
}

export interface Comunicado {
  id: string;
  titulo: string;
  mensagem: string;
  criado_em: string;
}

export interface Configuracoes {
  nome_clube: string;
  whatsapp: string | null;
  regulamento_url: string | null;
  refriclube_url: string;
  validade_cupom_dias: number;
}
