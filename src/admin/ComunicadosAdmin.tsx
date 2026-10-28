import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { data, mensagemErro } from '../lib/formato';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, Campo, Interruptor, Modal } from './ui';

interface ComunicadoAdm {
  id: string;
  titulo: string;
  mensagem: string;
  publicado: boolean;
  criado_em: string;
}
const vazio = { id: '', titulo: '', mensagem: '', publicado: true };

export function ComunicadosAdmin() {
  const [lista, setLista] = useState<ComunicadoAdm[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(() => {
    supabase
      .from('comunicados')
      .select('*')
      .order('criado_em', { ascending: false })
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        setLista((d as ComunicadoAdm[]) ?? []);
      });
  }, []);
  useEffect(carregar, [carregar]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroForm('');
    if (!f.titulo.trim() || !f.mensagem.trim()) return setErroForm('Preencha o título e a mensagem.');
    setSalvando(true);
    const registro = { titulo: f.titulo.trim(), mensagem: f.mensagem.trim(), publicado: f.publicado };
    const { error } = f.id ? await supabase.from('comunicados').update(registro).eq('id', f.id) : await supabase.from('comunicados').insert(registro);
    setSalvando(false);
    if (error) return setErroForm(mensagemErro(error));
    setAberto(false);
    carregar();
  }

  async function alternar(c: ComunicadoAdm) {
    const { error } = await supabase.from('comunicados').update({ publicado: !c.publicado }).eq('id', c.id);
    if (error) return setErro(mensagemErro(error));
    carregar();
  }

  return (
    <>
      <Cabecalho
        titulo="Comunicados"
        subtitulo="Avisos que aparecem na tela inicial do app (os 3 mais recentes publicados)"
        acoes={
          <button className="btn primary sm" onClick={() => { setF(vazio); setErroForm(''); setAberto(true); }}>
            <Icon name="plus" size={18} /> Novo comunicado
          </button>
        }
      />
      {erro && <Erro>{erro}</Erro>}
      {lista === null ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <Vazio icone="bell" titulo="Nenhum comunicado" texto="Use para avisar sobre promoções, horários especiais ou novidades do clube." />
      ) : (
        <div className="col gap-10">
          {lista.map((c) => (
            <div key={c.id} className={c.publicado ? 'adm-bloco' : 'adm-bloco apagada'}>
              <div className="row-between gap-10">
                <div className="col gap-2 min-0">
                  <strong className="text-15">{c.titulo}</strong>
                  <span className="muted xsmall">{data(c.criado_em)} · {c.publicado ? 'Publicado' : 'Rascunho'}</span>
                </div>
                <div className="row gap-8">
                  <button className="btn ghost sm" onClick={() => alternar(c)}>{c.publicado ? 'Despublicar' : 'Publicar'}</button>
                  <button className="btn outline sm" onClick={() => { setF({ id: c.id, titulo: c.titulo, mensagem: c.mensagem, publicado: c.publicado }); setErroForm(''); setAberto(true); }}>Editar</button>
                </div>
              </div>
              <p className="small pre">{c.mensagem}</p>
            </div>
          ))}
        </div>
      )}

      <Modal titulo={f.id ? 'Editar comunicado' : 'Novo comunicado'} aberto={aberto} fechar={() => setAberto(false)}>
        <form className="col gap-12" onSubmit={salvar}>
          <Campo id="c-titulo" rotulo="Título">
            <input id="c-titulo" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          </Campo>
          <Campo id="c-msg" rotulo="Mensagem">
            <textarea id="c-msg" rows={5} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} />
          </Campo>
          <Interruptor id="c-pub" rotulo="Publicar no app" valor={f.publicado} mudar={(v) => setF({ ...f, publicado: v })} />
          {erroForm && <Erro>{erroForm}</Erro>}
          <button className="btn primary block" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </form>
      </Modal>
    </>
  );
}
