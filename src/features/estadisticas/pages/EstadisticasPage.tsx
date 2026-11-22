import { useEffect, useMemo, useState } from 'react';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getResumenEstadisticasJugador } from '../services/estadisticasService';
import EstadisticaCard from '../../../shared/components/EstadisticaCard';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatNumber } from '../../../shared/utils/formatNumber';
import { ArrowTrendingUpIcon, ChartBarIcon, ShieldCheckIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import ModalSolicitudEstadisticas from '../components/ModalSolicitudEstadisticas';
import SeccionMisNumeros from '../components/SeccionMisNumeros';
import { DataTable } from 'overtime-kit';



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
  const [modalAbierto, setModalAbierto] = useState(false);
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
  }, [jugadorSeleccionado?.id, addToast]);

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

  // Removed unused derived values to satisfy lint

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Resumen de rendimiento y métricas del jugador seleccionado.</p>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Solicitar registro
          </button>
        </div>
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
      {jugadorSeleccionado?.id ? <SeccionMisNumeros jugadorId={jugadorSeleccionado.id} /> : null}
      <section className="grid gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Estadísticas por partido</h2>
            <p className="text-sm text-slate-500">Detalle de métricas por encuentro donde el jugador registró estadísticas.</p>
          </header>
          <DataTable
            caption="Estadísticas por partido"
            data={estadisticasPorPartido}
            rowKey={(p) => p._id}
            empty="Sin registros de estadísticas para este jugador."
            mobile="scroll"
            columns={[
              { id: 'fecha', header: 'Fecha', sortValue: (p) => (p.fecha ? new Date(p.fecha) : null), cell: (p) => formatDate(p.fecha) },
              { id: 'partido', header: 'Partido', sortValue: (p) => p.nombrePartido, cell: (p) => p.nombrePartido || 'Partido' },
              { id: 'throws', header: 'Throws', align: 'right', sortValue: (p) => p.throws ?? 0, cell: (p) => p.throws ?? 0 },
              { id: 'hits', header: 'Hits', align: 'right', sortValue: (p) => p.hits ?? 0, cell: (p) => p.hits ?? 0 },
              { id: 'outs', header: 'Outs', align: 'right', sortValue: (p) => p.outs ?? 0, cell: (p) => p.outs ?? 0 },
              { id: 'catches', header: 'Catches', align: 'right', sortValue: (p) => p.catches ?? 0, cell: (p) => p.catches ?? 0 },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Historial de resultados</h2>
            <p className="text-sm text-slate-500">Detalle completo de los encuentros registrados.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-muted">{historial.length} partidos</span>
        </header>
        <DataTable
          caption="Historial de resultados"
          data={historial}
          rowKey={(item) => item.fecha}
          empty="Sin resultados recientes."
          columns={[
            { id: 'fecha', header: 'Fecha', sortValue: (i) => (i.fecha ? new Date(i.fecha) : null), cell: (i) => formatDate(i.fecha) },
            { id: 'resultado', header: 'Resultado', sortValue: (i) => RESULTADO_LABELS[i.resultado], cell: (i) => <span className="font-medium text-slate-900">{RESULTADO_LABELS[i.resultado]}</span> },
            { id: 'anotados', header: 'Puntos anotados', align: 'right', sortValue: (i) => i.puntosAnotados, cell: (i) => i.puntosAnotados },
            { id: 'recibidos', header: 'Puntos recibidos', align: 'right', sortValue: (i) => i.puntosRecibidos, cell: (i) => i.puntosRecibidos },
          ]}
        />
      </section>

      <ModalSolicitudEstadisticas
        isOpen={modalAbierto}
        jugadorId={jugadorSeleccionado?.id || ''}
        jugadorNombre={jugadorSeleccionado?.nombre}
        onClose={() => setModalAbierto(false)}
      />
    </div>
  );
};

export default EstadisticasPage;
