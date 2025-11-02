import { useEffect, useMemo, useState } from 'react';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getResumenEstadisticasJugador } from '../services/estadisticasService';
import EstadisticaCard from '../../../shared/components/EstadisticaCard';
import { formatDate } from '../../../utils/formatDate';
import { formatNumber } from '../../../utils/formatNumber';
import type { EstadisticaJugador } from '../../../types';
import { ArrowTrendingUpIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { SeccionTop5estadisticasDirectas } from '../components/sections/SeccionTop5estadisticasDirectas';



const RESULTADO_STYLES: Record<'W' | 'D' | 'L', string> = {
  W: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  D: 'bg-amber-100 text-amber-700 border border-amber-200',
  L: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const RESULTADO_LABELS: Record<'W' | 'D' | 'L', string> = {
  W: 'Victoria',
  D: 'Empate',
  L: 'Derrota',
};

const EstadisticasPage = () => {
  const { jugadorSeleccionado } = useJugador();
  const { addToast } = useToast();
  const [resumen, setResumen] = useState<any | null>(null);
  const [estadisticasPorPartido, setEstadisticasPorPartido] = useState<any[]>([]);
  const [historial, setHistorial] = useState<
    { fecha: string; resultado: 'W' | 'D' | 'L'; puntosAnotados: number; puntosRecibidos: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) {
      setResumen(null);
      setEstadisticasPorPartido([]);
      setHistorial([]);
      return;
    }

    let isCancelled = false;

    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        const datos = await getResumenEstadisticasJugador(jugadorId);
        if (isCancelled) return;
        setResumen(datos);
        setEstadisticasPorPartido(datos.estadisticasPorPartido || []);
        // Mapear un historial simple si viene información por partido
        setHistorial(
          (datos.estadisticasPorPartido || []).map((p: any) => ({
            fecha: p.fecha,
            resultado: 'D' as const,
            puntosAnotados: p.marcadorLocal ?? 0,
            puntosRecibidos: p.marcadorVisitante ?? 0,
          })),
        );
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar las estadísticas del jugador.' });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void fetchEstadisticas();

    return () => {
      isCancelled = true;
    };
  }, [jugadorSeleccionado?.id]);

  const cards = useMemo(() => {
    if (!resumen) return [];
    return [
      {
        titulo: 'Efectividad',
        valor: `${formatNumber(resumen.efectividadEquipo)}%`,
        descripcion: 'Victorias sobre el total de partidos disputados.',
        icono: <ShieldCheckIcon className="h-6 w-6" />,
        tono: 'emerald' as const,
      },
      {
        titulo: 'Puntos por partido',
        valor: formatNumber(resumen.puntosPorPartido),
        descripcion: 'Promedio ofensivo en la temporada.',
        icono: <ChartBarIcon className="h-6 w-6" />,
        tono: 'brand' as const,
      },
      {
        titulo: 'Posición actual',
        valor: resumen.posicionActual ? `#${resumen.posicionActual}` : '—',
        descripcion: 'Ranking en la competencia activa.',
        icono: <ArrowTrendingUpIcon className="h-6 w-6" />,
        tono: 'amber' as const,
      },
    ];
  }, [resumen]);

  const quickStats = useMemo(() => {
    const victorias = historial.filter((item) => item.resultado === 'W').length;
    const empates = historial.filter((item) => item.resultado === 'D').length;
    const derrotas = historial.filter((item) => item.resultado === 'L').length;

    const totalAnotados = historial.reduce((total, item) => total + item.puntosAnotados, 0);
    const totalRecibidos = historial.reduce((total, item) => total + item.puntosRecibidos, 0);
    const promedioAnotados = historial.length ? totalAnotados / historial.length : null;
    const promedioRecibidos = historial.length ? totalRecibidos / historial.length : null;

    const stats: Array<{ label: string; value: string }> = [
      { label: 'Partidos registrados', value: historial.length.toString() },
      { label: 'Balance reciente', value: `${victorias}-${empates}-${derrotas}` },
    ];

    stats.push({
      label: 'Puntos promedio a favor',
      value: promedioAnotados !== null ? formatNumber(promedioAnotados) : '—',
    });

    stats.push({
      label: 'Puntos promedio en contra',
      value: promedioRecibidos !== null ? formatNumber(promedioRecibidos) : '—',
    });

    if (resumen) {
      stats.push({ label: 'Efectividad global', value: `${formatNumber(resumen.efectividadEquipo)}%` });
      stats.push({ label: 'Posición actual', value: resumen.posicionActual ? `#${resumen.posicionActual}` : '—' });
    }

    return stats;
  }, [historial, resumen]);

  const historialReciente = useMemo(() => historial.slice(0, 5), [historial]);
  const racha = resumen?.racha ?? [];

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná un jugador</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí un jugador para ver sus estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Estadísticas del jugador</h1>
        <p className="text-sm text-slate-500">Resumen de rendimiento y métricas del jugador seleccionado.</p>
      </header>

      {loading ? <p className="text-sm text-slate-500">Cargando estadísticas…</p> : null}

      {cards.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <EstadisticaCard key={card.titulo} {...card} />
          ))}
        </section>
      ) : !loading ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          Todavía no hay métricas generales para este jugador.
        </section>
      ) : null}
      <section className="grid gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Estadísticas por partido</h2>
            <p className="text-sm text-slate-500">Detalle de métricas por encuentro donde el jugador registró estadísticas.</p>
          </header>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Partido</th>
                  <th className="px-4 py-3 text-right">Throws</th>
                  <th className="px-4 py-3 text-right">Hits</th>
                  <th className="px-4 py-3 text-right">Outs</th>
                  <th className="px-4 py-3 text-right">Catches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estadisticasPorPartido.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">{formatDate(p.fecha)}</td>
                    <td className="px-4 py-3">{p.nombrePartido || 'Partido'}</td>
                    <td className="px-4 py-3 text-right">{p.throws ?? 0}</td>
                    <td className="px-4 py-3 text-right">{p.hits ?? 0}</td>
                    <td className="px-4 py-3 text-right">{p.outs ?? 0}</td>
                    <td className="px-4 py-3 text-right">{p.catches ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {estadisticasPorPartido.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">Sin registros de estadísticas para este jugador.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Historial de resultados</h2>
            <p className="text-sm text-slate-500">Detalle completo de los encuentros registrados.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-400">{historial.length} partidos</span>
        </header>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Resultado</th>
                <th className="px-4 py-3 text-right">Puntos anotados</th>
                <th className="px-4 py-3 text-right">Puntos recibidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {historial.map((item) => (
                <tr key={item.fecha} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{RESULTADO_LABELS[item.resultado]}</td>
                  <td className="px-4 py-3 text-right">{item.puntosAnotados}</td>
                  <td className="px-4 py-3 text-right">{item.puntosRecibidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {historial.length === 0 ? (
            <p className="px-4 py-5 text-sm text-slate-500">Sin resultados recientes.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default EstadisticasPage;
