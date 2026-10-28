import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '../components/Icon';
import { StatusPill } from '../components/StatusPill';
import { Carregando, Erro } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { hora, mensagemErro, mesAno } from '../lib/formato';

const RENOVAR_MS = 4 * 60 * 1000; // o token vale 5 minutos no banco

export function Carteirinha() {
  const { perfil, associado, recarregar } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  const gerarToken = useCallback(async () => {
    setErro('');
    const { data, error } = await supabase.rpc('gerar_token_carteirinha');
    if (error) {
      setErro(mensagemErro(error));
      return;
    }
    setToken(data as string);
    setAtualizadoEm(new Date());
  }, []);

  useEffect(() => {
    gerarToken();
    const id = window.setInterval(gerarToken, RENOVAR_MS);
    return () => window.clearInterval(id);
  }, [gerarToken]);

  async function atualizar() {
    setAtualizando(true);
    await Promise.all([recarregar(), gerarToken()]);
    setAtualizando(false);
  }

  if (!associado || !perfil) return <Carregando />;
  const ativo = associado.status === 'ativo';

  return (
    <>
      <header className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar">
          <Icon name="chevronLeft" size={20} stroke={2.2} />
        </Link>
        <h1 className="h-md">Minha carteirinha</h1>
      </header>

      <main className="content">
        <div className="member-card">
          <Icon name="snow" size={180} stroke={1.2} className="member-card-bg" />
          <div className="row-between">
            <div className="row gap-8">
              <Icon name="snow" size={24} stroke={1.8} />
              <strong className="text-17">RefriOne</strong>
            </div>
            <span className="pill yellow tracking">{(associado.plano?.nome ?? 'Membro').toUpperCase()}</span>
          </div>
          <div className="col gap-2">
            <span className="label-caps">ASSOCIADO</span>
            <strong className="text-21">{perfil.nome}</strong>
          </div>
          <div className="grid-2">
            <div className="col gap-2">
              <span className="small on-dark-muted">Nº do associado</span>
              <strong>{associado.numero}</strong>
            </div>
            <div className="col gap-2">
              <span className="small on-dark-muted">Membro desde</span>
              <strong>{mesAno(associado.membro_desde)}</strong>
            </div>
          </div>
        </div>

        <div className="card col center gap-14 pad-22">
          {ativo ? (
            <span className="pill ok lg">
              <Icon name="check" size={16} stroke={2.6} /> Assinatura ativa
            </span>
          ) : (
            <StatusPill status={associado.status} />
          )}
          {token ? (
            <div className={ativo ? 'qr' : 'qr apagado'}>
              <QRCodeSVG value={token} size={184} level="M" fgColor="#0E1A3A" aria-label="QR Code de validação da carteirinha" />
            </div>
          ) : (
            !erro && <Carregando texto="Gerando código…" />
          )}
          <span className="muted small text-center">
            {ativo
              ? 'Mostre este código no balcão da RefriOne. Ele muda a cada poucos minutos e a validação consulta seu cadastro na hora.'
              : 'Os benefícios são liberados quando a assinatura estiver ativa.'}
            {atualizadoEm && (
              <>
                <br />
                Código gerado às {hora(atualizadoEm)}.
              </>
            )}
          </span>
          {erro && <Erro>{erro}</Erro>}
        </div>

        <button className="btn primary block" onClick={atualizar} disabled={atualizando}>
          {atualizando ? 'Atualizando…' : 'Atualizar status'}
        </button>
      </main>
    </>
  );
}
