import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { mensagemErro } from '../lib/formato';
import { useAuth } from '../auth/AuthProvider';
import { Carregando, Erro } from '../components/Estados';
import { Cabecalho, Campo } from './ui';

export function ConfiguracoesAdmin() {
  const { recarregar } = useAuth();
  const [carregado, setCarregado] = useState(false);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [regulamento, setRegulamento] = useState('');
  const [refriclube, setRefriclube] = useState('');
  const [validade, setValidade] = useState('7');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        if (d) {
          setNome(d.nome_clube ?? '');
          setWhatsapp(d.whatsapp ?? '');
          setRegulamento(d.regulamento_url ?? '');
          setRefriclube(d.refriclube_url ?? '');
          setValidade(String(d.validade_cupom_dias ?? 7));
        }
        setCarregado(true);
      });
  }, []);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setAviso('');
    const dias = parseInt(validade, 10);
    if (isNaN(dias) || dias < 1) return setErro('A validade do cupom precisa ser de pelo menos 1 dia.');
    const zap = whatsapp.replace(/\D/g, '');
    if (zap && zap.length < 10) return setErro('Digite o WhatsApp com DDD.');
    setSalvando(true);
    const { error } = await supabase
      .from('configuracoes')
      .update({
        nome_clube: nome.trim() || 'Clube de Benefícios RefriOne',
        whatsapp: zap ? (zap.length <= 11 ? '55' + zap : zap) : null,
        regulamento_url: regulamento.trim() || null,
        refriclube_url: refriclube.trim() || 'https://refriclube.app.br',
        validade_cupom_dias: dias,
      })
      .eq('id', 1);
    setSalvando(false);
    if (error) return setErro(mensagemErro(error));
    setAviso('Configurações salvas.');
    recarregar();
  }

  if (!carregado) return <Carregando />;

  return (
    <>
      <Cabecalho titulo="Configurações" subtitulo="Informações gerais do clube usadas no app" />
      <section className="adm-bloco adm-estreito">
        <form className="col gap-12" onSubmit={salvar}>
          <Campo id="cfg-nome" rotulo="Nome do clube">
            <input id="cfg-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <Campo id="cfg-zap" rotulo="WhatsApp de atendimento do clube (com DDD)" ajuda="Aparece no botão “Falar com o clube” do app.">
            <input id="cfg-zap" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Campo>
          <Campo id="cfg-reg" rotulo="Link do regulamento (opcional)" ajuda="Pode ser um PDF no Google Drive com acesso por link.">
            <input id="cfg-reg" type="url" value={regulamento} onChange={(e) => setRegulamento(e.target.value)} />
          </Campo>
          <Campo id="cfg-refri" rotulo="Endereço do Refriclube">
            <input id="cfg-refri" type="url" value={refriclube} onChange={(e) => setRefriclube(e.target.value)} />
          </Campo>
          <Campo id="cfg-val" rotulo="Validade dos cupons (dias)">
            <input id="cfg-val" inputMode="numeric" value={validade} onChange={(e) => setValidade(e.target.value)} />
          </Campo>
          {aviso && <div className="alerta sucesso">{aviso}</div>}
          {erro && <Erro>{erro}</Erro>}
          <button className="btn primary" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar configurações'}</button>
        </form>
      </section>
    </>
  );
}
