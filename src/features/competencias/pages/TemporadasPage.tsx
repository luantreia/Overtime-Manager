import { useEffect, useState } from 'react';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getTemporadasDelJugador } from '../services/temporadasService';
import type { TemporadaJugador } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

const TemporadasPage = () => {
  const { addToast } = useToast();
  const { jugadorSeleccionado } = useJugador();
  const [temporadas, setTemporadas] = useState<TemporadaJugador[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) {
      setTemporadas([]);
      return;
    }

    let isCancelled = false;

    const fetch = async () => {
      try {
        setLoading(true);
        const temporadasDelJugador = await getTemporadasDelJugador(jugadorId);
        if (isCancelled) return;

        // Ordenar temporadas: activas primero, luego terminadas por fecha más reciente
        const temporadasOrdenadas = temporadasDelJugador.sort((a, b) => {
          const fechaFinA = a.fechaFin ? new Date(a.fechaFin) : null;
          const fechaFinB = b.fechaFin ? new Date(b.fechaFin) : null;

          // Ambas sin fecha de fin (activas) - mantener orden relativo
          if (!fechaFinA && !fechaFinB) return 0;

          // A es activa, B terminada - A primero
          if (!fechaFinA && fechaFinB) return -1;

          // B es activa, A terminada - B primero
          if (fechaFinA && !fechaFinB) return 1;

          // Ambas terminadas - más reciente primero
          if (fechaFinA && fechaFinB) {
            return fechaFinB.getTime() - fechaFinA.getTime();
          }

          return 0;
        });

        setTemporadas(temporadasOrdenadas);
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar las temporadas del jugador.' });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void fetch();

    return () => {
      isCancelled = true;
    };
  }, [jugadorSeleccionado?.id, addToast]);

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná un jugador</h1>
        <p className="mt-2 text-sm text-slate-500">
          Elegí un jugador para ver las temporadas de sus equipos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Temporadas</h1>
        <p className="text-sm text-slate-500">
          Visualizá las temporadas en las que participás con tus equipos.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando temporadas…</p>
      ) : temporadas.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {temporadas.map((temporada) => {
            const ahora = new Date();
            const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin) : null;
            const fechaInicio = temporada.fechaInicio ? new Date(temporada.fechaInicio) : null;
            const estaActiva = !fechaFin || fechaFin > ahora;
            const estaProxima = fechaInicio && fechaInicio > ahora;

            return (
              <div key={temporada.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{temporada.nombre}</h3>
                    <p className="text-sm text-slate-500">{temporada.competencia.nombre}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        temporada.estado === 'activo'
                          ? estaActiva
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                          : temporada.estado === 'baja'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {temporada.estado === 'activo'
                          ? estaProxima
                            ? 'Próxima'
                            : estaActiva
                            ? 'Activa'
                            : 'Finalizada'
                          : temporada.estado === 'baja'
                          ? 'Baja'
                          : temporada.estado
                        }
                      </span>
                      {temporada.rol && (
                        <p className="text-xs text-slate-500">{temporada.rol}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium">Equipo:</span> {temporada.equipo.nombre}</p>
                  <p><span className="font-medium">Modalidad:</span> {temporada.competencia.modalidad}</p>
                  <p><span className="font-medium">Categoría:</span> {temporada.competencia.categoria}</p>
                  {temporada.fechaInicio && temporada.fechaFin && (
                    <p><span className="font-medium">Período:</span> {new Date(temporada.fechaInicio).toLocaleDateString()} - {new Date(temporada.fechaFin).toLocaleDateString()}</p>
                  )}
                  {temporada.descripcion && (
                    <p className="mt-3 text-slate-500">{temporada.descripcion}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
          No participás en ninguna temporada actualmente.
        </div>
      )}
    </div>
  );
};

export default TemporadasPage;
