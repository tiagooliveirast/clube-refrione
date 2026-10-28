import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { mensagemErro, reais } from '../lib/formato';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, Campo, Interruptor, Modal, lerNumero, numeroParaCampo } from './ui';

interface PlanoAdm {
  id: string;
  nome: string;
  descricao: string | null;
  preco_mensal: number;
  desconto_padrao: number;
  inclui_refriclube: boolean;
  ativo: boolean;
  ordem: number;
}
const vazio = { id: '', nome: '', descricao: '', preco_mensal: '', desconto_padrao: '', inclui_refriclube: true, ativo: true, ordem: '1' };

export function PlanosAdmin() {
  const [planos, setPlanos] = useState<PlanoAdm[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(() => {
    supabase
      .from('planos')
      .select('*')
      .order('ordem')
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        setPlanos((d as PlanoAdm[]) ?? []);
      });
  }, []);
  useEffect(carregar, [carregar]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroForm('');
    const preco = lerNumero(f.preco_mensal);
    const desconto = lerNumero(f.desconto_padrao) ?? 0;
    if (!f.nome.trim()) return setErroForm('Dê um nome ao plano.');
    if (preco == null || isNaN(preco) || preco < 0) return setErroForm('Digite a mensalidade, ex.: 89,00');
    if (isNaN(desconto) || desconto < 0 || desconto > 100) return setErroForm('O desconto padrão precisa ser entre 0 e 100%.');
    setSalvando(true);
    const registro = {
      nome: f.nome.trim(),
      descricao: f.descricao.trim() || null,
      preco_mensal: preco,
      desconto_padrao: desconto,
      inclui_refriclube: f.inclui_refriclube,
      ativo: f.ativo,
      ordem: parseInt(f.ordem, 10) || 1,
    };
    const { error } = f.id ? await supabase.from('planos').update(registro).eq('id', f.id) : await supabase.from('planos').insert(registro);
    setSalvando(false);
    if (error) return setErroForm(mensagemErro(error));
    setAberto(false);
    carregar();
  }

  return (
    <>
      <Cabecalho
        titulo="Planos"
        subtitulo="O primeiro plano ativo é o que os novos cadastros recebem"
        acoes={<button className="btn primary sm" onClick={() => { setF(vazio); setErroForm(''); setAberto(true); }}><Icon name="plus" size={18} /> Novo plano</button>}
      />
      {erro && <Erro>{erro}</Erro>}
      {planos === null ? (
        <Carregando />
      ) : planos.length === 0 ? (
        <Vazio icone="creditCard" titulo="Nenhum plano" />
      ) : (
        <div className="kpis">
          {planos.map((p) => (
            <div key={p.id} className={p.ativo ? 'adm-bloco' : 'adm-bloco apagada'}>
              <div className="row-between">
                <strong className="text-17">{p.nome}</strong>
                {p.ativo ? <span className="pill ok">Ativo</span> : <span className="pill neutral">Inativo</span>}
              </div>
              <strong className="kpi-valor">{reais(p.preco_mensal)}<span className="muted small"> /mês</span></strong>
              <span className="small muted">{p.descricao || 'Sem descrição'}</span>
              <span className="small">Desconto padrão no balcão: <strong>{Number(p.desconto_padrao)}%</strong></span>
              <span className="small">{p.inclui_refriclube ? 'Inclui o Refriclube' : 'Não inclui o Refriclube'}</span>
              <button
                className="btn outline sm"
                onClick={() => {
                  setF({ id: p.id, nome: p.nome, descricao: p.descricao ?? '', preco_mensal: numeroParaCampo(p.preco_mensal), desconto_padrao: numeroParaCampo(p.desconto_padrao), inclui_refriclube: p.inclui_refriclube, ativo: p.ativo, ordem: String(p.ordem) });
                  setErroForm('');
                  setAberto(true);
                }}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal titulo={f.id ? 'Editar plano' : 'Novo plano'} aberto={aberto} fechar={() => setAberto(false)}>
        <form className="col gap-12" onSubmit={salvar}>
          <Campo id="p-nome" rotulo="Nome do plano">
            <input id="p-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Campo>
          <Campo id="p-desc" rotulo="Descrição">
            <textarea id="p-desc" rows={2} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          </Campo>
          <div className="grid-2 gap-10">
            <Campo id="p-preco" rotulo="Mensalidade (R$)">
              <input id="p-preco" inputMode="decimal" value={f.preco_mensal} onChange={(e) => setF({ ...f, preco_mensal: e.target.value })} />
            </Campo>
            <Campo id="p-desc-pad" rotulo="Desconto padrão (%)">
              <input id="p-desc-pad" inputMode="decimal" value={f.desconto_padrao} onChange={(e) => setF({ ...f, desconto_padrao: e.target.value })} />
            </Campo>
            <Campo id="p-ordem" rotulo="Ordem de exibição">
              <input id="p-ordem" inputMode="numeric" value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value })} />
            </Campo>
          </div>
          <Interruptor id="p-refri" rotulo="Inclui acesso ao Refriclube" valor={f.inclui_refriclube} mudar={(v) => setF({ ...f, inclui_refriclube: v })} />
          <Interruptor id="p-ativo" rotulo="Plano ativo" valor={f.ativo} mudar={(v) => setF({ ...f, ativo: v })} />
          {f.id && <div className="alerta aviso">Mudar o preço vale para as próximas cobranças. Pagamentos já registrados não mudam.</div>}
          {erroForm && <Erro>{erroForm}</Erro>}
          <button className="btn primary block" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar plano'}</button>
        </form>
      </Modal>
    </>
  );
}
