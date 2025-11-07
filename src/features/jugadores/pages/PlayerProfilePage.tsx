import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PlayerDetails from '../components/PlayerDetails';
import PlayerTeams from '../components/PlayerTeams';
import ModalSolicitarIngreso from '../components/modals/ModalSolicitarIngreso';
import PlayerSolicitudesEdicion from '../components/PlayerSolicitudesEdicion';
import PlayerStats from '../components/PlayerStats';
import { getJugadorById, updateJugador } from '../services/jugadorService';
import { getEquiposDelJugador } from '../services/jugadorEquipoService';
import { solicitarCrearContratoJugadorEquipo } from '../services/solicitudesJugadorEquipoService';
import { getResumenEstadisticasJugador } from '../../estadisticas/services/estadisticasService';
import type { Jugador } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useJugador } from '../../../app/providers/JugadorContext';

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams();
  const { addToast } = useToast();
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [loading, setLoading] = useState(false);
  const [equipos, setEquipos] = useState([] as any[]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);

  const { jugadorSeleccionado } = useJugador();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        let data = null;
        if (playerId) {
          data = await getJugadorById(playerId);
        } else if (jugadorSeleccionado) {
          // usar el jugador seleccionado desde el contexto
          data = jugadorSeleccionado;
        } else {
          data = null;
        }

        if (!cancelled) setJugador(data);
      } catch (err) {
        console.error(err);
        addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el jugador' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [playerId, jugadorSeleccionado, addToast]);

  useEffect(() => {
    if (!jugador) return;
    let cancelled = false;
    const loadExtras = async () => {
      try {
        if (!jugador.id) {
          // jugador exists but lacks an id; nothing to load
          // eslint-disable-next-line no-console
          console.warn('Jugador sin id en PlayerProfilePage, se omiten cargas adicionales', jugador);
          return;
        }

        const [eqs, resumen] = await Promise.all([
          getEquiposDelJugador(jugador.id),
          getResumenEstadisticasJugador(jugador.id),
        ]);
        if (cancelled) return;
        setEquipos(eqs || []);
        // resumen may contain estadisticasPorPartido; map to a simple estadistica array if possible
        const stats = (resumen?.estadisticasPorPartido || []).map((p: any) => ({
          jugador: jugador,
          partidosJugados: p.setsJugados ?? 0,
          puntosPromedio: p.throws ?? 0,
          bloqueosPromedio: 0,
          efectividad: p.efectividad ? Number(p.efectividad) : 0,
          faltasPromedio: 0,
        }));
        setEstadisticas(stats);
      } catch (err) {
        console.error('Error cargando datos adicionales del jugador', err);
      }
    };

    void loadExtras();
    return () => {
      cancelled = true;
    };
  }, [jugador]);

  const refreshExtras = async () => {
    if (!jugador?.id) return;
    try {
      const eqs = await getEquiposDelJugador(jugador.id);
      setEquipos(eqs || []);
    } catch (err) {
      // ignore
    }
  };

  // solicitar modal state
  const [isSolicitarOpen, setIsSolicitarOpen] = useState(false);
  const [initialEquipoToSolicitar, setInitialEquipoToSolicitar] = useState<string | undefined>(undefined);

  const openSolicitarModal = useCallback((equipoId?: string) => {
    setInitialEquipoToSolicitar(equipoId);
    setIsSolicitarOpen(true);
  }, []);

  const handleSolicitarIngreso = useCallback(async (payload: { jugadorId: string; equipoId: string; fechaInicio?: string; fechaFin?: string; rol?: string }) => {
    try {
      await solicitarCrearContratoJugadorEquipo(payload);
      addToast({ type: 'success', title: 'Solicitud enviada', message: 'La solicitud será revisada por los administradores del equipo.' });
      await refreshExtras();
    } catch (err) {
      console.error('Error solicitando ingreso:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos enviar la solicitud.' });
      throw err;
    }
  }, [addToast]);

  const handleSave = async (payload: Partial<Jugador>) => {
    if (!jugador) return;
    try {
      setLoading(true);
      const updated = await updateJugador(jugador.id, payload);
      setJugador(updated);
      addToast({ type: 'success', title: 'Guardado', message: 'Perfil actualizado' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !jugador) {
    return <div className="text-sm text-slate-500">Cargando jugador…</div>;
  }

  if (!jugador) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">Jugador no encontrado</h2>
        <p className="mt-2 text-sm text-slate-500">Seleccioná o buscá un jugador para ver su perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PlayerDetails jugador={jugador} onSave={handleSave} />
          <div className="mt-4">
            <PlayerStats estadisticas={estadisticas} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <PlayerTeams jugador={jugador} equipos={equipos} onSolicitar={(id) => openSolicitarModal(id)} />
          <PlayerSolicitudesEdicion jugadorId={jugador.id} />
        </div>
      </div>
      <ModalSolicitarIngreso
        jugadorId={jugador.id}
        initialEquipoId={initialEquipoToSolicitar}
        isOpen={isSolicitarOpen}
        onClose={() => setIsSolicitarOpen(false)}
        onSubmit={handleSolicitarIngreso}
      />
    </div>
  );
};

export default PlayerProfilePage;
