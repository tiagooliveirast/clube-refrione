import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mensagemErro, reais } from '../lib/formato';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Cabecalho, Kpi, dataHora } from './ui';

interface Indicadores {
  ativos: number;
  pendentes: number;
  inadimplentes: number;
  cancelados_mes: number;
  novos_mes: number;
  receita_mes: number;
  receita_prevista: number;
  usos_mes: number;
  desconto_mes: number;
  compras_mes: number;
  cupons_mes: number;
  refriclube_ativos: number;
}

interface UsoRecente {
  id: string;
  descricao: string | null;
  valor_compra: number | null;
  valor_desconto: number | null;
  criado_em: string;
  associado: { numero: string; perfil: { nome: string } | null } | null;
  vendedor: { nome: string } | null;
}

export function VisaoGeral() {
  const [ind, setInd] = useState<Indicadores | null>(null);
  const [usos, setUsos] = useState<UsoRecente[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    supabase.rpc('indicadores_admin').then(({ data, error }) => {
      if (error) setErro(mensagemErro(error));
      else setInd(data as Indicadores);
    });
    supabase
      .from('usos_beneficio')
      .select('id, descricao, valor_compra, valor_desconto, criado_em, associado:associados(numero, perfil:perfis(nome)), vendedor:perfis!usos_beneficio_vendedor_id_fkey(nome)')
      .order('criado_em', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) setErro(mensagemErro(error));
        setUsos((data as unknown as UsoRecente[]) ?? []);
      });
  }, []);

  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <>
      <Cabecalho titulo="Visão geral" subtitulo={`Números do clube em ${mes}`} />
      {erro && <Erro>{erro}</Erro>}
      {!ind ? (
        !erro && <Carregando />
      ) : (
        <>
          <div className="kpis">
            <Kpi rotulo="Associados ativos" valor={String(ind.ativos)} detalhe={`+${ind.novos_mes} novos no mês`} destaque />
            <Kpi rotulo="Receita recebida no mês" valor={reais(ind.receita_mes)} detalhe={`Prevista por mês: ${reais(ind.receita_prevista)}`} />
            <Kpi rotulo="Aguardando pagamento" valor={String(ind.pendentes)} />
            <Kpi rotulo="Em atraso" valor={String(ind.inadimplentes)} detalhe={`${ind.cancelados_mes} cancelados no mês`} />
          </div>
          <div className="kpis">
            <Kpi rotulo="Benefícios usados no mês" valor={String(ind.usos_mes)} detalhe={`${ind.cupons_mes} cupons gerados`} />
            <Kpi rotulo="Vendas para associados" valor={reais(ind.compras_mes)} detalhe="registradas no balcão" />
            <Kpi rotulo="Desconto concedido" valor={reais(ind.desconto_mes)} />
            <Kpi rotulo="Com Refriclube liberado" valor={String(ind.refriclube_ativos)} />
          </div>
        </>
      )}

      <section className="adm-bloco">
        <div className="row-between">
          <h2 className="h-sm">Últimos benefícios usados no balcão</h2>
          <Link to="/admin/associados" className="small strong">Ver associados</Link>
        </div>
        {usos === null ? (
          <Carregando />
        ) : usos.length === 0 ? (
          <Vazio icone="gift" titulo="Nenhum uso registrado ainda" texto="Os registros feitos pelos vendedores na tela do balcão aparecem aqui." />
        ) : (
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Associado</th>
                  <th>Compra</th>
                  <th className="num">Valor</th>
                  <th className="num">Desconto</th>
                  <th>Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {usos.map((u) => (
                  <tr key={u.id}>
                    <td>{dataHora(u.criado_em)}</td>
                    <td>
                      {u.associado?.perfil?.nome ?? '—'} <span className="muted">#{u.associado?.numero}</span>
                    </td>
                    <td>{u.descricao || '—'}</td>
                    <td className="num">{reais(u.valor_compra)}</td>
                    <td className="num">{reais(u.valor_desconto)}</td>
                    <td>{u.vendedor?.nome ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
