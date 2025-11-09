import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PlayerDetails from '../components/PlayerDetails';
import PlayerTeams from '../components/PlayerTeams';
import ModalSolicitarIngreso from '../components/modals/ModalSolicitarIngreso';
import SeccionAdministradoresJugador from '../components/SeccionAdministradoresJugador';
import PlayerSolicitudesEdicion from '../components/PlayerSolicitudesEdicion';
import PlayerStats from '../components/PlayerStats';
import { getJugadorById, updateJugador } from '../services/jugadorService';
import { getEquiposDelJugador } from '../services/jugadorEquipoService';
import { solicitarCrearContratoJugadorEquipo } from '../services/solicitudesJugadorEquipoService';
import { getResumenEstadisticasJugador } from '../../estadisticas/services/estadisticasService';
import { getUsuarioById, agregarAdminJugador, quitarAdminJugador, getAdminsJugador } from '../../auth/services/usersService';
import type { Jugador, Usuario } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useJugador } from '../../../app/providers/JugadorContext';
import { useAuth } from '../../../app/providers/AuthContext';

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams();
  const { addToast } = useToast();
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [loading, setLoading] = useState(false);
  const [equipos, setEquipos] = useState([] as any[]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<Map<string, Usuario>>(new Map());
  const [nuevoAdmin, setNuevoAdmin] = useState('');
  const [loadingAgregar, setLoadingAgregar] = useState(false);

  const { jugadorSeleccionado } = useJugador();
  const { user } = useAuth();

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

  useEffect(() => {
    if (jugador?.administradores && jugador.administradores.length > 0) {
      loadAdminUsers();
    } else {
      setAdminUsers(new Map());
    }
  }, [jugador?.administradores, loadAdminUsers]);

  const loadAdminUsers = useCallback(async () => {
    if (!jugador?.administradores) return;
    const adminPromises = jugador.administradores.map(async (id) => {
      const item = adminUsers.get(id);
      if (item) return item;
      // Fetch if not cached
      return await getUsuarioById(id).catch(() => ({ id, nombre: id, email: 'Usuario no encontrado' } as Usuario));
    });
    const users = await Promise.all(adminPromises);
    const newMap = new Map<string, Usuario>();
    users.forEach((user) => {
      newMap.set(user.id, user);
    });
    setAdminUsers(newMap);
  }, [jugador?.administradores, adminUsers]);

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
  }, [addToast, refreshExtras]);

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


  const handleNuevoAdminChange = (value: string) => {
    setNuevoAdmin(value);
  };

  const handleAgregarAdmin = async () => {
    const email = nuevoAdmin.trim();
    if (!email || !jugador) return;

    try {
      setLoadingAgregar(true);
      await agregarAdminJugador(jugador.id, email);
      // Recargar administradores
      const adminsActualizados = await getAdminsJugador(jugador.id);
      const adminIds = adminsActualizados.map((a: any) => typeof a === 'string' ? a : a.id);
      setJugador({ ...jugador, administradores: adminIds });
      // Poblar usuarios (si no poblados, fetch)
      const userPromises = adminsActualizados.map(async (a: any) => {
        if (typeof a === 'object' && a.id) return a as Usuario;
        // Fetch
        return await getUsuarioById(a).catch(() => ({ id: a, nombre: a, email: 'Usuario no encontrado' } as Usuario));
      });
      const users = await Promise.all(userPromises);
      const adminUsersMap = new Map<string, Usuario>();
      users.forEach((user: Usuario) => {
        adminUsersMap.set(user.id, user);
      });
      setAdminUsers(adminUsersMap);
      addToast({ type: 'success', title: 'Agregado', message: 'Administrador agregado' });
      setNuevoAdmin('');
    } catch (error: any) {
      console.error('Error agregando admin:', error);
      addToast({ type: 'error', title: 'Error', message: error?.message || 'No se pudo agregar el administrador' });
    } finally {
      setLoadingAgregar(false);
    }
  };

  const handleQuitarAdmin = async (id: string) => {
    if (!jugador) return;
    try {
      await quitarAdminJugador(jugador.id, id);
      // Recargar administradores
      const adminsActualizados = await getAdminsJugador(jugador.id);
      const adminIds = adminsActualizados.map((a: any) => typeof a === 'string' ? a : a.id);
      setJugador({ ...jugador, administradores: adminIds });
      // Poblar usuarios (si no poblados, fetch)
      const userPromises = adminsActualizados.map(async (a: any) => {
        if (typeof a === 'object' && a.id) return a as Usuario;
        // Fetch
        return await getUsuarioById(a).catch(() => ({ id: a, nombre: a, email: 'Usuario no encontrado' } as Usuario));
      });
      const users = await Promise.all(userPromises);
      const adminUsersMap = new Map<string, Usuario>();
      users.forEach((user: Usuario) => {
        adminUsersMap.set(user.id, user);
      });
      setAdminUsers(adminUsersMap);
      addToast({ type: 'success', title: 'Quitado', message: 'Administrador removido' });
    } catch (error: any) {
      console.error('Error quitando admin:', error);
      addToast({ type: 'error', title: 'Error', message: error?.message || 'No se pudo quitar el administrador' });
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
          <PlayerSolicitudesEdicion jugadorId={jugador.id} administradores={jugador.administradores} />
          {(user?.rol === 'admin' || user?.id === jugador.creadoPor) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SeccionAdministradoresJugador
                admins={jugador.administradores?.map(id => {
                  const user = adminUsers.get(id);
                  return { id, nombre: user?.nombre, email: user?.email };
                }) || []}
                nuevoAdmin={nuevoAdmin}
                onNuevoAdminChange={handleNuevoAdminChange}
                onAgregarAdmin={handleAgregarAdmin}
                onQuitarAdmin={handleQuitarAdmin}
                loadingAgregar={loadingAgregar}
              />
            </div>
          )}
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
