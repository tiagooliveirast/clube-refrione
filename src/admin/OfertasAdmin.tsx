import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { data, mensagemErro, reais } from '../lib/formato';
import type { Categoria, Oferta } from '../lib/tipos';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, Campo, Interruptor, Modal, lerNumero, numeroParaCampo } from './ui';

type OfertaAdm = Oferta & { ativa: boolean };
const categorias: Categoria[] = ['Refrigeração', 'Ar-condicionado', 'Linha branca', 'Ferramentas', 'Outros'];

const vazio = {
  id: '',
  titulo: '',
  descricao: '',
  categoria: 'Refrigeração' as Categoria,
  preco_normal: '',
  preco_membro: '',
  valida_ate: '',
  destaque: false,
  ativa: true,
  imagem_url: '' as string,
};

export function OfertasAdmin() {
  const [ofertas, setOfertas] = useState<OfertaAdm[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState(vazio);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(() => {
    supabase
      .from('ofertas')
      .select('*')
      .order('ativa', { ascending: false })
      .order('destaque', { ascending: false })
      .order('criado_em', { ascending: false })
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        setOfertas((d as OfertaAdm[]) ?? []);
      });
  }, []);

  useEffect(carregar, [carregar]);

  function nova() {
    setF(vazio);
    setArquivo(null);
    setErroForm('');
    setAberto(true);
  }

  function editar(o: OfertaAdm) {
    setF({
      id: o.id,
      titulo: o.titulo,
      descricao: o.descricao ?? '',
      categoria: o.categoria,
      preco_normal: numeroParaCampo(o.preco_normal),
      preco_membro: numeroParaCampo(o.preco_membro),
      valida_ate: o.valida_ate ?? '',
      destaque: o.destaque,
      ativa: o.ativa,
      imagem_url: o.imagem_url ?? '',
    });
    setArquivo(null);
    setErroForm('');
    setAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroForm('');
    if (!f.titulo.trim()) return setErroForm('Dê um nome para a oferta.');
    const normal = lerNumero(f.preco_normal);
    const membro = lerNumero(f.preco_membro);
    if ((normal != null && isNaN(normal)) || (membro != null && isNaN(membro))) return setErroForm('Digite os preços só com números, ex.: 49,90');
    setSalvando(true);

    let imagem = f.imagem_url || null;
    if (arquivo) {
      if (arquivo.size > 3 * 1024 * 1024) {
        setSalvando(false);
        return setErroForm('A imagem precisa ter no máximo 3 MB.');
      }
      const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
      const caminho = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from('ofertas').upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (up.error) {
        setSalvando(false);
        return setErroForm('Não foi possível enviar a imagem: ' + mensagemErro(up.error));
      }
      imagem = supabase.storage.from('ofertas').getPublicUrl(caminho).data.publicUrl;
    }

    const registro = {
      titulo: f.titulo.trim(),
      descricao: f.descricao.trim() || null,
      categoria: f.categoria,
      preco_normal: normal,
      preco_membro: membro,
      valida_ate: f.valida_ate || null,
      destaque: f.destaque,
      ativa: f.ativa,
      imagem_url: imagem,
    };

    // Só uma oferta em destaque por vez na tela inicial
    if (f.destaque) {
      await supabase.from('ofertas').update({ destaque: false }).eq('destaque', true).neq('id', f.id || '00000000-0000-0000-0000-000000000000');
    }

    const { error } = f.id ? await supabase.from('ofertas').update(registro).eq('id', f.id) : await supabase.from('ofertas').insert(registro);
    setSalvando(false);
    if (error) return setErroForm(mensagemErro(error));
    setAberto(false);
    carregar();
  }

  async function alternarAtiva(o: OfertaAdm) {
    const { error } = await supabase.from('ofertas').update({ ativa: !o.ativa }).eq('id', o.id);
    if (error) return setErro(mensagemErro(error));
    carregar();
  }

  const vencida = (o: OfertaAdm) => o.valida_ate != null && new Date(o.valida_ate + 'T23:59:59') < new Date();

  return (
    <>
      <Cabecalho titulo="Ofertas" subtitulo="O que os associados veem no app e usam para gerar cupom" acoes={<button className="btn primary sm" onClick={nova}><Icon name="plus" size={18} /> Nova oferta</button>} />
      {erro && <Erro>{erro}</Erro>}
      {ofertas === null ? (
        <Carregando />
      ) : ofertas.length === 0 ? (
        <Vazio icone="tag" titulo="Nenhuma oferta cadastrada" texto='Clique em "Nova oferta" para publicar a primeira.' />
      ) : (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Categoria</th>
                <th className="num">Preço normal</th>
                <th className="num">Preço membro</th>
                <th>Validade</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ofertas.map((o) => (
                <tr key={o.id} className={!o.ativa || vencida(o) ? 'apagada' : ''}>
                  <td>
                    <div className="row gap-10">
                      {o.imagem_url ? <img src={o.imagem_url} alt="" className="adm-mini" /> : <span className="adm-mini vazio"><Icon name="box" size={18} /></span>}
                      <div className="col">
                        <strong className="text-14">{o.titulo}</strong>
                        {o.destaque && <span className="pill yellow mini">DESTAQUE</span>}
                      </div>
                    </div>
                  </td>
                  <td>{o.categoria}</td>
                  <td className="num">{reais(o.preco_normal)}</td>
                  <td className="num strong">{reais(o.preco_membro)}</td>
                  <td>{o.valida_ate ? data(o.valida_ate) : 'Sem prazo'}</td>
                  <td>{!o.ativa ? <span className="pill neutral">Desativada</span> : vencida(o) ? <span className="pill warn">Vencida</span> : <span className="pill ok">No ar</span>}</td>
                  <td>
                    <div className="row gap-8 fim">
                      <button className="btn outline sm" onClick={() => editar(o)}>Editar</button>
                      <button className="btn ghost sm" onClick={() => alternarAtiva(o)}>{o.ativa ? 'Desativar' : 'Ativar'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={f.id ? 'Editar oferta' : 'Nova oferta'} aberto={aberto} fechar={() => setAberto(false)} largo>
        <form className="col gap-12" onSubmit={salvar}>
          <Campo id="titulo" rotulo="Nome do produto ou kit">
            <input id="titulo" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          </Campo>
          <Campo id="descricao" rotulo="Descrição (opcional)">
            <textarea id="descricao" rows={2} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          </Campo>
          <div className="grid-2 gap-10">
            <Campo id="categoria" rotulo="Categoria">
              <select id="categoria" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo id="validade" rotulo="Válida até (opcional)">
              <input id="validade" type="date" value={f.valida_ate} onChange={(e) => setF({ ...f, valida_ate: e.target.value })} />
            </Campo>
            <Campo id="normal" rotulo="Preço normal (R$)">
              <input id="normal" inputMode="decimal" value={f.preco_normal} onChange={(e) => setF({ ...f, preco_normal: e.target.value })} />
            </Campo>
            <Campo id="membro" rotulo="Preço para membro (R$)">
              <input id="membro" inputMode="decimal" value={f.preco_membro} onChange={(e) => setF({ ...f, preco_membro: e.target.value })} />
            </Campo>
          </div>
          <Campo id="imagem" rotulo="Foto do produto (opcional, até 3 MB)">
            <input id="imagem" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </Campo>
          {f.imagem_url && !arquivo && (
            <div className="row gap-10">
              <img src={f.imagem_url} alt="Foto atual" className="adm-mini grande" />
              <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, imagem_url: '' })}>Remover foto</button>
            </div>
          )}
          <Interruptor id="destaque" rotulo="Destacar na tela inicial do app (só uma por vez)" valor={f.destaque} mudar={(v) => setF({ ...f, destaque: v })} />
          <Interruptor id="ativa" rotulo="Oferta no ar" valor={f.ativa} mudar={(v) => setF({ ...f, ativa: v })} />
          {erroForm && <Erro>{erroForm}</Erro>}
          <button className="btn primary block" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar oferta'}
          </button>
        </form>
      </Modal>
    </>
  );
}
