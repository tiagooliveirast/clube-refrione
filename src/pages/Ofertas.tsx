import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { data, mensagemErro, reais } from '../lib/formato';
import type { Categoria, Cupom, Oferta } from '../lib/tipos';

const filtros: ('Todas' | Categoria)[] = ['Todas', 'Refrigeração', 'Ar-condicionado', 'Linha branca', 'Ferramentas', 'Outros'];

export function Ofertas() {
  const { associado } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>('Todas');
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [cupom, setCupom] = useState<{ oferta: Oferta; cupom: Cupom } | null>(null);
  const [erroCupom, setErroCupom] = useState('');

  useEffect(() => {
    supabase
      .from('ofertas')
      .select('*')
      .eq('ativa', true)
      .order('destaque', { ascending: false })
      .order('criado_em', { ascending: false })
      .then(({ data: lista, error }) => {
        if (error) setErroLista(mensagemErro(error));
        setOfertas((lista as Oferta[]) ?? []);
        setCarregando(false);
      });
  }, []);

  const categoriasComOferta = new Set(ofertas.map((o) => o.categoria));
  const filtrosVisiveis = filtros.filter((f) => f === 'Todas' || categoriasComOferta.has(f));
  const lista = filtro === 'Todas' ? ofertas : ofertas.filter((o) => o.categoria === filtro);

  async function gerar(oferta: Oferta) {
    setErroCupom('');
    setGerandoId(oferta.id);
    const { data: c, error } = await supabase.rpc('gerar_cupom', { p_oferta_id: oferta.id });
    setGerandoId(null);
    if (error) {
      setErroCupom(mensagemErro(error));
      return;
    }
    setCupom({ oferta, cupom: c as Cupom });
  }

  return (
    <>
      <header className="page-header col start gap-14">
        <div className="col gap-2">
          <h1 className="h-lg">Ofertas para membros</h1>
          <span className="muted small">Gere o cupom e apresente no balcão</span>
        </div>
        {filtrosVisiveis.length > 2 && (
          <div className="chips" role="group" aria-label="Filtrar por categoria">
            {filtrosVisiveis.map((f) => (
              <button key={f} className={f === filtro ? 'chip active' : 'chip'} aria-pressed={f === filtro} onClick={() => setFiltro(f)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="content">
        {associado && associado.status !== 'ativo' && (
          <div className="alerta aviso">Você pode ver as ofertas, mas os cupons são liberados quando sua assinatura estiver ativa.</div>
        )}
        {erroCupom && <Erro>{erroCupom}</Erro>}
        {erroLista && <Erro>{erroLista}</Erro>}

        {carregando ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <Vazio icone="tag" titulo="Nenhuma oferta no momento" texto="A RefriOne publica ofertas novas para membros com frequência. Volte em breve." />
        ) : (
          lista.map((o) => (
            <div key={o.id} className="card row gap-14">
              {o.imagem_url ? (
                <img src={o.imagem_url} alt="" className="thumb img" />
              ) : (
                <span className="thumb">
                  <Icon name="box" size={30} stroke={1.8} />
                </span>
              )}
              <div className="col gap-2 grow min-0">
                <span className="cat">{o.categoria.toUpperCase()}</span>
                <strong className="text-14">{o.titulo}</strong>
                <span className="muted small">
                  {o.preco_normal != null && o.preco_membro != null && o.preco_normal > o.preco_membro && (
                    <s className="faint">{reais(o.preco_normal)}</s>
                  )}{' '}
                  Membro: <strong className="ink">{reais(o.preco_membro)}</strong>
                  {o.valida_ate ? ` · até ${data(o.valida_ate)}` : ''}
                </span>
              </div>
              <button className="icon-btn primary" aria-label={`Gerar cupom: ${o.titulo}`} onClick={() => gerar(o)} disabled={gerandoId === o.id}>
                {gerandoId === o.id ? <span className="spinner sm light" aria-hidden="true" /> : <Icon name="plus" size={20} stroke={2.2} />}
              </button>
            </div>
          ))
        )}
      </main>

      {cupom && (
        <div className="sheet-backdrop" onClick={() => setCupom(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Cupom gerado" onClick={(e) => e.stopPropagation()}>
            <span className="pill ok lg">
              <Icon name="check" size={16} stroke={2.6} /> Cupom gerado
            </span>
            <strong className="text-17 text-center">{cupom.oferta.titulo}</strong>
            <div className="coupon-code">{cupom.cupom.codigo}</div>
            <span className="muted small text-center">
              Mostre este código ao vendedor. Vale para uma compra até {data(cupom.cupom.valido_ate)}.
            </span>
            <button className="btn primary block" onClick={() => setCupom(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
