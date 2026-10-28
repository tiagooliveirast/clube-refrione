import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { mensagemErro } from '../lib/formato';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, Campo, Interruptor, Modal, baixarCsv, dataHora, paraDatetimeLocal } from './ui';

interface EventoAdm {
  id: string;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  local: string | null;
  vagas: number | null;
  ativo: boolean;
  eventos_inscricoes: { count: number }[];
}
interface Inscrito {
  criado_em: string;
  associado: { numero: string; perfil: { nome: string; telefone: string | null; email: string } | null } | null;
}

const vazio = { id: '', titulo: '', descricao: '', data_hora: '', local: '', vagas: '', ativo: true };

export function EventosAdmin() {
  const [eventos, setEventos] = useState<EventoAdm[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [inscritosDe, setInscritosDe] = useState<EventoAdm | null>(null);
  const [inscritos, setInscritos] = useState<Inscrito[] | null>(null);

  const carregar = useCallback(() => {
    supabase
      .from('eventos')
      .select('id, titulo, descricao, data_hora, local, vagas, ativo, eventos_inscricoes(count)')
      .order('data_hora', { ascending: false })
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        setEventos((d as unknown as EventoAdm[]) ?? []);
      });
  }, []);
  useEffect(carregar, [carregar]);

  function novo() {
    setF(vazio);
    setErroForm('');
    setAberto(true);
  }
  function editar(ev: EventoAdm) {
    setF({ id: ev.id, titulo: ev.titulo, descricao: ev.descricao ?? '', data_hora: paraDatetimeLocal(ev.data_hora), local: ev.local ?? '', vagas: ev.vagas ? String(ev.vagas) : '', ativo: ev.ativo });
    setErroForm('');
    setAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroForm('');
    if (!f.titulo.trim()) return setErroForm('Dê um nome para o evento.');
    if (!f.data_hora) return setErroForm('Escolha a data e o horário.');
    const vagas = f.vagas.trim() ? parseInt(f.vagas, 10) : null;
    if (vagas != null && (isNaN(vagas) || vagas <= 0)) return setErroForm('Vagas precisa ser um número maior que zero, ou deixe em branco.');
    setSalvando(true);
    const registro = {
      titulo: f.titulo.trim(),
      descricao: f.descricao.trim() || null,
      data_hora: new Date(f.data_hora).toISOString(),
      local: f.local.trim() || null,
      vagas,
      ativo: f.ativo,
    };
    const { error } = f.id ? await supabase.from('eventos').update(registro).eq('id', f.id) : await supabase.from('eventos').insert(registro);
    setSalvando(false);
    if (error) return setErroForm(mensagemErro(error));
    setAberto(false);
    carregar();
  }

  async function verInscritos(ev: EventoAdm) {
    setInscritosDe(ev);
    setInscritos(null);
    const { data: d, error } = await supabase
      .from('eventos_inscricoes')
      .select('criado_em, associado:associados(numero, perfil:perfis(nome, telefone, email))')
      .eq('evento_id', ev.id)
      .order('criado_em');
    if (error) setErro(mensagemErro(error));
    setInscritos((d as unknown as Inscrito[]) ?? []);
  }

  function exportarInscritos() {
    if (!inscritosDe || !inscritos) return;
    baixarCsv(`inscritos-${inscritosDe.titulo.toLowerCase().replace(/\W+/g, '-')}.csv`, [
      ['Nome', 'Nº', 'WhatsApp', 'E-mail', 'Confirmou em'],
      ...inscritos.map((i) => [i.associado?.perfil?.nome, i.associado?.numero, i.associado?.perfil?.telefone, i.associado?.perfil?.email, dataHora(i.criado_em)]),
    ]);
  }

  const passado = (ev: EventoAdm) => new Date(ev.data_hora) < new Date();

  return (
    <>
      <Cabecalho titulo="Eventos" subtitulo="Café com o Profissional, treinamentos e encontros" acoes={<button className="btn primary sm" onClick={novo}><Icon name="plus" size={18} /> Novo evento</button>} />
      {erro && <Erro>{erro}</Erro>}
      {eventos === null ? (
        <Carregando />
      ) : eventos.length === 0 ? (
        <Vazio icone="calendar" titulo="Nenhum evento cadastrado" texto="O próximo evento aparece na tela inicial do app e o associado confirma presença." />
      ) : (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead>
              <tr><th>Evento</th><th>Data</th><th>Local</th><th className="num">Confirmados</th><th>Situação</th><th /></tr>
            </thead>
            <tbody>
              {eventos.map((ev) => {
                const conf = ev.eventos_inscricoes?.[0]?.count ?? 0;
                return (
                  <tr key={ev.id} className={passado(ev) || !ev.ativo ? 'apagada' : ''}>
                    <td className="strong">{ev.titulo}</td>
                    <td>{dataHora(ev.data_hora)}</td>
                    <td>{ev.local ?? '—'}</td>
                    <td className="num">{conf}{ev.vagas ? ` / ${ev.vagas}` : ''}</td>
                    <td>{!ev.ativo ? <span className="pill neutral">Oculto</span> : passado(ev) ? <span className="pill neutral">Realizado</span> : <span className="pill ok">Agendado</span>}</td>
                    <td>
                      <div className="row gap-8 fim">
                        <button className="btn ghost sm" onClick={() => verInscritos(ev)}>Inscritos</button>
                        <button className="btn outline sm" onClick={() => editar(ev)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={f.id ? 'Editar evento' : 'Novo evento'} aberto={aberto} fechar={() => setAberto(false)}>
        <form className="col gap-12" onSubmit={salvar}>
          <Campo id="ev-titulo" rotulo="Nome do evento">
            <input id="ev-titulo" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          </Campo>
          <div className="grid-2 gap-10">
            <Campo id="ev-data" rotulo="Data e horário">
              <input id="ev-data" type="datetime-local" value={f.data_hora} onChange={(e) => setF({ ...f, data_hora: e.target.value })} />
            </Campo>
            <Campo id="ev-vagas" rotulo="Vagas (opcional)">
              <input id="ev-vagas" inputMode="numeric" value={f.vagas} onChange={(e) => setF({ ...f, vagas: e.target.value })} />
            </Campo>
          </div>
          <Campo id="ev-local" rotulo="Local">
            <input id="ev-local" value={f.local} onChange={(e) => setF({ ...f, local: e.target.value })} />
          </Campo>
          <Campo id="ev-desc" rotulo="Descrição (opcional)">
            <textarea id="ev-desc" rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          </Campo>
          <Interruptor id="ev-ativo" rotulo="Mostrar no app" valor={f.ativo} mudar={(v) => setF({ ...f, ativo: v })} />
          {erroForm && <Erro>{erroForm}</Erro>}
          <button className="btn primary block" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar evento'}</button>
        </form>
      </Modal>

      <Modal titulo={`Inscritos · ${inscritosDe?.titulo ?? ''}`} aberto={inscritosDe !== null} fechar={() => setInscritosDe(null)} largo>
        {inscritos === null ? (
          <Carregando />
        ) : inscritos.length === 0 ? (
          <Vazio icone="user" titulo="Ninguém confirmou ainda" />
        ) : (
          <>
            <div className="tabela-caixa">
              <table className="tabela">
                <thead><tr><th>Nome</th><th>WhatsApp</th><th>Confirmou</th></tr></thead>
                <tbody>
                  {inscritos.map((i, n) => (
                    <tr key={n}>
                      <td>{i.associado?.perfil?.nome ?? '—'} <span className="muted">#{i.associado?.numero}</span></td>
                      <td>{i.associado?.perfil?.telefone ?? '—'}</td>
                      <td>{dataHora(i.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn outline" onClick={exportarInscritos}>Exportar lista</button>
          </>
        )}
      </Modal>
    </>
  );
}
