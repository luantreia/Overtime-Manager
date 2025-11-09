import { useCallback, useEffect, useState } from 'react';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getEquiposDelJugador } from '../../jugadores/services/jugadorEquipoService';
import { getPartido, getPartidos } from '../services/partidoService';
import { InvalidObjectIdError } from '../../../utils/validateObjectId';
import type { Partido, Equipo } from '../../../types';
import { ModalPartidoAdmin } from '../components';
import { useToken } from '../../../app/providers/AuthContext';
// Crear partidos desde el flujo de jugador está deshabilitado (no permitimos crear amistosos aquí)
import ModalAlineacionPartido from '../components/modals/ModalAlineacionPartido';
import ModalInformacionPartido from '../components/modals/ModalInformacionPartido';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

const PartidosPage = () => {
  const token = useToken();
  const { jugadorSeleccionado } = useJugador();
  const { addToast } = useToast();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  // eliminado: seleccionado no se usa en la UI
  const [proximos, setProximos] = useState<Partido[]>([]);
  const [recientes, setRecientes] = useState<Partido[]>([]);
  const [partidoEquipoContext, setPartidoEquipoContext] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [partidoAdminId, setPartidoAdminId] = useState<string | null>(null);
  const [alineacionModalAbierto, setAlineacionModalAbierto] = useState(false);
  const [partidoAlineacionId, setPartidoAlineacionId] = useState<string | null>(null);
  const [infoModalAbierto, setInfoModalAbierto] = useState(false);
  const [partidoInfoId, setPartidoInfoId] = useState<string | null>(null);

  const refreshPartidos = useCallback(async () => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) return;
    try {
      setLoading(true);
      const equiposDelJugador = await getEquiposDelJugador(jugadorId);
      setEquipos(equiposDelJugador);

      // Obtener partidos por cada equipo y unirlos (sin duplicados).
      // Además guardamos qué equipo del jugador se usó como contexto para cada partido
      const partidosPorEquipoRaw = await Promise.all(
        equiposDelJugador.map(async (eq) => {
          const partidos = await getPartidos({ equipoId: eq.id });
          return { equipoId: eq.id, partidos };
        })
      );

      const partidosMap = new Map<string, Partido>();
      const contextoMap: Record<string, string> = {};

      partidosPorEquipoRaw.forEach(({ equipoId, partidos }) => {
        partidos.forEach((p) => {
          if (!partidosMap.has(p.id)) {
            partidosMap.set(p.id, p);
            contextoMap[p.id] = equipoId;
          }
        });
      });

      const partidos = Array.from(partidosMap.values());
      setPartidoEquipoContext(contextoMap);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const futuros: Partido[] = [];
      const pasados: Partido[] = [];

      partidos.forEach((partido) => {
        const fechaPartido = partido.fecha ? new Date(partido.fecha) : null;

        if (!fechaPartido || Number.isNaN(fechaPartido.getTime())) {
          futuros.push(partido);
          return;
        }

        const fechaComparacion = new Date(fechaPartido);
        fechaComparacion.setHours(0, 0, 0, 0);

        if (fechaComparacion.getTime() >= hoy.getTime()) {
          futuros.push(partido);
        } else {
          pasados.push(partido);
        }
      });

      futuros.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      pasados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setProximos(futuros);
      setRecientes(pasados);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los partidos del jugador.' });
    } finally {
      setLoading(false);
    }
  }, [jugadorSeleccionado?.id, addToast]);

  useEffect(() => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) {
      setProximos([]);
      setRecientes([]);
      setEquipos([]);
      return;
    }

    void refreshPartidos();
  }, [jugadorSeleccionado?.id, refreshPartidos]);


  const handleSeleccionar = async (partidoId: string) => {
    try {
      const equipoContext = partidoEquipoContext[partidoId];
      await getPartido(partidoId, equipoContext);
      setPartidoAdminId(partidoId);
      setModalAdminAbierto(true);
    } catch (error) {
      console.error(error);
      if (error instanceof InvalidObjectIdError) {
        addToast({ type: 'error', title: 'ID inválido', message: 'El identificador del partido no es válido. Revisá la selección.' });
      } else {
        addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar el detalle del partido' });
      }
    }
  };

  const handleAbrirAlineacion = (partidoId: string) => {
    setPartidoAlineacionId(partidoId);
    setAlineacionModalAbierto(true);
  };

  const handleCerrarAlineacion = () => {
    setAlineacionModalAbierto(false);
    setPartidoAlineacionId(null);
  };

  const handleAbrirInformacion = (partidoId: string) => {
    setPartidoInfoId(partidoId);
    setInfoModalAbierto(true);
  };

  const handleCerrarInformacion = () => {
    setInfoModalAbierto(false);
    setPartidoInfoId(null);
  };

  // eliminado: handler sin uso real en la UI

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná un jugador</h1>
        <p className="mt-2 text-sm text-slate-500">
          Elegí un jugador para revisar sus partidos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Partidos</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Programación y resultados relacionados al jugador.</p>
          {/* Crear partidos desde el flujo de jugador está deshabilitado */}
        </div>
      </header>

      {modalAdminAbierto && partidoAdminId ? (
        <ModalPartidoAdmin
          partidoId={partidoAdminId}
          token={token ?? ''}
          onClose={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
          }}
          onPartidoEliminado={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
            void refreshPartidos();
          }}
          equipoId={partidoAdminId ? partidoEquipoContext[partidoAdminId] : equipos[0]?.id}
        />
      ) : null}

      <ModalAlineacionPartido
        partidoId={partidoAlineacionId ?? ''}
        equipoId={partidoAlineacionId ? partidoEquipoContext[partidoAlineacionId] : equipos[0]?.id}
        isOpen={alineacionModalAbierto && Boolean(partidoAlineacionId)}
        onClose={handleCerrarAlineacion}
        onSaved={() => {
          handleCerrarAlineacion();
        }}
      />

      <ModalInformacionPartido
        partidoId={partidoInfoId}
        isOpen={infoModalAbierto && Boolean(partidoInfoId)}
        onClose={handleCerrarInformacion}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Próximos partidos</h2>
            <span className="text-xs uppercase tracking-wide text-slate-400">En agenda</span>
          </header>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : proximos.length ? (
            <div className="space-y-4">
              {proximos.map((partido) => (
                <PartidoCard
                  key={partido.id}
                  partido={partido}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => handleAbrirAlineacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🏐 Alineación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbrirInformacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🖊️ Datos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSeleccionar(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      >
                        📊 Estadísticas
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No hay partidos pendientes.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Resultados recientes</h2>
            <span className="text-xs uppercase tracking-wide text-slate-400">Hasta 10 más recientes</span>
          </header>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : recientes.length ? (
            <div className="space-y-4">
              {recientes.slice(0, 10).map((partido) => (
                <PartidoCard
                  key={partido.id}
                  partido={partido}
                  variante="resultado"
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => handleAbrirAlineacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🏐 Alineación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbrirInformacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🖊️ Datos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSeleccionar(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      >
                        📊 Estadísticas
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No hay resultados registrados.
            </p>
          )}
        </div>
      </section>
      
      {/* Crear partidos deshabilitado en vista jugador - no renderizamos ModalCrearPartido aquí. */}
    </div>
  );
};

export default PartidosPage;
