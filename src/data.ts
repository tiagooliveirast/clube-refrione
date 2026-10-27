// Dados de exemplo. Na fase 2, tudo isto vem do Supabase (associado logado, ofertas, eventos).
// Os valores entre colchetes são para a RefriOne preencher.

export type Status = 'ativo' | 'inadimplente' | 'cancelado';

export const associado = {
  nome: '[NOME DO ASSOCIADO]',
  iniciais: 'AB',
  email: '[email@associado.com]',
  numero: '[000123]',
  plano: 'Start',
  status: 'ativo' as Status,
  membroDesde: '[MM/AAAA]',
  mensalidade: '[R$ 0,00]',
  proximaCobranca: '[DD/MM]',
  cartaoFinal: '[0000]',
};

export type Categoria = 'Refrigeração' | 'Ar-condicionado' | 'Linha branca';

export interface Oferta {
  id: string;
  categoria: Categoria;
  nome: string;
  precoMembro: string;
  detalhe: string;
}

export const ofertaDoMes = {
  nome: '[PRODUTO OU KIT EM DESTAQUE]',
  precoMembro: '[R$ 0,00]',
  validade: '[DATA]',
};

export const ofertas: Oferta[] = [
  { id: 'o1', categoria: 'Refrigeração', nome: 'Gás refrigerante R-600a', precoMembro: '[R$ 0,00]', detalhe: 'até [DATA]' },
  { id: 'o2', categoria: 'Ar-condicionado', nome: 'Kit instalação split 9.000 a 12.000 BTUs', precoMembro: '[R$ 0,00]', detalhe: 'kit' },
  { id: 'o3', categoria: 'Linha branca', nome: 'Placa similar para máquina de lavar', precoMembro: '[R$ 0,00]', detalhe: 'estoque limitado' },
  { id: 'o4', categoria: 'Refrigeração', nome: 'Capacitor de partida', precoMembro: '[R$ 0,00]', detalhe: 'até [DATA]' },
];

export const proximoEvento = {
  titulo: 'Café com o Profissional',
  dia: '[DD]',
  mes: '[MÊS]',
  local: 'Loja RefriOne',
  horario: '[HORÁRIO]',
};

// Link de acesso ao Refriclube (mesmo e-mail do associado)
export const REFRICLUBE_URL = 'https://refriclube.app.br';

// WhatsApp de atendimento do clube — trocar pelo número real (só dígitos, com DDI e DDD)
export const WHATSAPP_CLUBE = '5571000000000';
