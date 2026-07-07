import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getEquiposDelJugador } from '../../jugadores/services/jugadorEquipoService';
import { getPartidos } from '../../partidos/services/partidoService';
import { getResumenEstadisticasJugador } from '../../estadisticas/services/estadisticasService';
import { formatNumber } from '../../../shared/utils/formatNumber';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import EstadisticaCard from '../../../shared/components/EstadisticaCard';
import { ShieldCheckIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import type { Partido } from '../../../types';

const DashboardPage = () => {
  const { jugadorSeleccionado, loading: loadingJugador } = useJugador();
  const [proximoPartido, setProximoPartido] = useState<Partido | null>(null);
  const [resumen, setResumen] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const greetingName = useMemo(() => jugadorSeleccionado?.nombre ?? 'jugador', [jugadorSeleccionado]);

  const cargar = useCallback(async () => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) return;
    try {
      setLoading(true);
      const [equipos, resumenData] = await Promise.all([
        getEquiposDelJugador(jugadorId),
        getResumenEstadisticasJugador(jugadorId).catch(() => null),
      ]);
      setResumen(resumenData);

      const partidosPorEquipo = await Promise.all(
        equipos.map((eq) => getPartidos({ equipoId: eq.id }).catch(() => []))
      );
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const futuros = partidosPorEquipo
        .flat()
        .filter((p) => {
          const fecha = p.fecha ? new Date(p.fecha) : null;
          if (!fecha || Number.isNaN(fecha.getTime())) return false;
          const fechaSinHora = new Date(fecha);
          fechaSinHora.setHours(0, 0, 0, 0);
          return fechaSinHora.getTime() >= hoy.getTime() && p.estado !== 'cancelado';
        })
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      setProximoPartido(futuros[0] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [jugadorSeleccionado?.id]);

  useEffect(() => { void cargar(); }, [cargar]);

  const cards = useMemo(() => {
    if (!resumen) return [];
    return [
      {
        titulo: 'Efectividad',
        valor: `${formatNumber(resumen.efectividadEquipo)}%`,
        icono: <ShieldCheckIcon className="h-6 w-6" />,
        tono: 'emerald' as const,
      },
      {
        titulo: 'Puntos por partido',
        valor: formatNumber(resumen.puntosPorPartido),
        icono: <ChartBarIcon className="h-6 w-6" />,
        tono: 'brand' as const,
      },
      {
        titulo: 'Posición actual',
        valor: resumen.posicionActual ? `#${resumen.posicionActual}` : '—',
        icono: <ArrowTrendingUpIcon className="h-6 w-6" />,
        tono: 'amber' as const,
      },
    ];
  }, [resumen]);

  if (loadingJugador) {
    return <p className="text-sm text-slate-500">Cargando jugador…</p>;
  }

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Seleccioná un jugador</h2>
        <p className="mt-2 text-sm text-slate-500">
          Elegí un jugador desde el selector superior para ver su panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Hola, {greetingName}</h1>
        <p className="text-sm text-slate-500">Panel de gestión del jugador seleccionado.</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Próximo partido</h2>
          <Link to="/partidos" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Ver todos →</Link>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ) : proximoPartido ? (
          <PartidoCard partido={proximoPartido} variante="proximo" />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
            No hay partidos programados por ahora.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Resumen rápido</h2>
          <Link to="/estadisticas" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Ver estadísticas →</Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <EstadisticaCard key={card.titulo} {...card} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Todavía no hay estadísticas registradas para este jugador.
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
