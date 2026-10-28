import { useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { Erro } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { hora, mensagemErro, rotuloStatus } from '../lib/formato';
import type { StatusAssociado } from '../lib/tipos';

interface Resultado {
  encontrado: boolean;
  associado_id?: string;
  numero?: string;
  nome?: string;
  status?: StatusAssociado;
  plano?: string | null;
  desconto_padrao?: number | null;
  cupom?: { id: string; codigo: string; status: string; valido: boolean; oferta: string | null } | null;
  consultado_em?: string;
}

// Tela do vendedor. Leitor de QR pela câmera entra na próxima etapa;
// por enquanto o vendedor digita o número do associado, o código do cupom
// ou cola o código lido do QR.
export function Balcao() {
  const { perfil, sair } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [res, setRes] = useState<Resultado | null>(null);
  const [erro, setErro] = useState('');

  const [abrirUso, setAbrirUso] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valorCompra, setValorCompra] = useState('');
  const [valorDesconto, setValorDesconto] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  function limpar() {
    setCodigo('');
    setRes(null);
    setErro('');
    setAbrirUso(false);
    setDescricao('');
    setValorCompra('');
    setValorDesconto('');
    setRegistrado(false);
  }

  async function consultar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setErro('');
    setRegistrado(false);
    setAbrirUso(false);
    setConsultando(true);
    const { data, error } = await supabase.rpc('validar_associado', { p_codigo: codigo.trim() });
    setConsultando(false);
    if (error) return setErro(mensagemErro(error));
    setRes(data as Resultado);
  }

  const numero = (v: string) => (v.trim() === '' ? null : Number(v.replace(/\./g, '').replace(',', '.')));

  async function registrar(e: FormEvent) {
    e.preventDefault();
    if (!res?.associado_id) return;
    setErro('');
    const compra = numero(valorCompra);
    const desconto = numero(valorDesconto);
    if ((compra != null && isNaN(compra)) || (desconto != null && isNaN(desconto))) return setErro('Digite os valores só com números, ex.: 150,00');
    setRegistrando(true);
    const usarCupom = res.cupom?.valido ? res.cupom.id : null;
    const { error } = await supabase.rpc('registrar_uso', {
      p_associado_id: res.associado_id,
      p_cupom_id: usarCupom,
      p_descricao: descricao.trim() || res.cupom?.oferta || null,
      p_valor_compra: compra,
      p_valor_desconto: desconto,
    });
    setRegistrando(false);
    if (error) return setErro(mensagemErro(error));
    setRegistrado(true);
    setAbrirUso(false);
  }

  const ativo = res?.status === 'ativo';

  return (
    <div className="balcao">
      <header className="row-between pad-x-20 pt-28 pb-18">
        <div className="row gap-10">
          <Icon name="snow" size={26} stroke={1.8} />
          <div className="col">
            <strong className="text-17">RefriOne Balcão</strong>
            <span className="xsmall on-dark-muted">{perfil?.nome}</span>
          </div>
        </div>
        <button className="btn ghost light" onClick={sair}>Sair</button>
      </header>

      <main className="content">
        <form className="col gap-10" onSubmit={consultar}>
          <label htmlFor="codigo" className="small on-dark-muted">
            Número do associado, código do cupom ou código do QR
          </label>
          <div className="row gap-10">
            <input id="codigo" className="input-dark grow min-0" autoComplete="off" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <button className="btn primary" type="submit" disabled={consultando}>
              {consultando ? '…' : 'Consultar'}
            </button>
          </div>
        </form>

        {erro && <Erro>{erro}</Erro>}

        {res && !res.encontrado && (
          <div className="card col gap-8">
            <strong className="text-16 bad-text">Não encontrado</strong>
            <span className="muted small">Confira o número ou o código e tente de novo. Códigos de QR valem só 5 minutos.</span>
          </div>
        )}

        {res?.encontrado && (
          <div className="card col gap-12">
            <div className="row gap-10">
              <span className={ativo ? 'ok-circle' : 'bad-circle'}>
                <Icon name={ativo ? 'check' : 'shield'} size={22} stroke={2.6} />
              </span>
              <div className="col">
                <strong className={ativo ? 'text-16 ok-text' : 'text-16 bad-text'}>
                  {ativo ? 'Associado ativo' : `Associado ${rotuloStatus[res.status ?? 'pendente'].toLowerCase()}`}
                </strong>
                <span className="muted small">Consultado às {hora(res.consultado_em ?? new Date())}</span>
              </div>
            </div>
            <div className="grid-2 gap-10 divider-top">
              <Info label="Nome" valor={res.nome || '—'} />
              <Info label="Nº" valor={res.numero || '—'} />
              <Info label="Plano" valor={res.plano || '—'} />
              <Info label="Desconto padrão" valor={res.desconto_padrao ? `${Number(res.desconto_padrao)}%` : '—'} />
            </div>

            {res.cupom && (
              <div className={res.cupom.valido ? 'alerta aviso' : 'alerta erro'}>
                Cupom <strong>{res.cupom.codigo}</strong>
                {res.cupom.oferta ? ` · ${res.cupom.oferta}` : ''} —{' '}
                {res.cupom.valido ? 'válido' : res.cupom.status === 'usado' ? 'já utilizado' : 'expirado'}
              </div>
            )}

            {!ativo && <span className="muted small">Benefícios não podem ser aplicados enquanto a assinatura não estiver ativa.</span>}

            {registrado ? (
              <>
                <div className="alerta sucesso">Uso do benefício registrado.</div>
                <button className="btn primary block" onClick={limpar}>Próximo cliente</button>
              </>
            ) : ativo && !abrirUso ? (
              <button className="btn primary block" onClick={() => setAbrirUso(true)}>
                Registrar uso do benefício
              </button>
            ) : null}

            {abrirUso && (
              <form className="col gap-10" onSubmit={registrar}>
                <div className="campo">
                  <label htmlFor="descricao">O que foi comprado</label>
                  <input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
                <div className="grid-2 gap-10">
                  <div className="campo">
                    <label htmlFor="compra">Valor da compra (R$)</label>
                    <input id="compra" inputMode="decimal" value={valorCompra} onChange={(e) => setValorCompra(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label htmlFor="desconto">Desconto dado (R$)</label>
                    <input id="desconto" inputMode="decimal" value={valorDesconto} onChange={(e) => setValorDesconto(e.target.value)} />
                  </div>
                </div>
                <button className="btn primary block" type="submit" disabled={registrando}>
                  {registrando ? 'Registrando…' : res.cupom?.valido ? 'Registrar e dar baixa no cupom' : 'Registrar'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="col gap-2">
      <span className="muted xsmall">{label}</span>
      <strong className="text-14">{valor}</strong>
    </div>
  );
}
