import { useMemo } from 'react';
import { useJugador } from '../../../app/providers/JugadorContext';

const DashboardPage = () => {
  const { jugadorSeleccionado, loading: loadingJugador } = useJugador();

  const greetingName = useMemo(() => jugadorSeleccionado?.nombre ?? 'jugador', [jugadorSeleccionado]);

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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Resumen rápido</h2>
        <p className="mt-2 text-sm text-slate-500">Aquí aparecerán estadísticas y acciones relevantes para el jugador.</p>
      </section>
    </div>
  );
};

export default DashboardPage;
