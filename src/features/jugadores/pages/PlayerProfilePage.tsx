import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PlayerDetails from '../components/PlayerDetails';
import PlayerTeams from '../components/PlayerTeams';
import ModalSolicitarIngreso from '../components/modals/ModalSolicitarIngreso';
import SolicitudModal from '../../../shared/components/SolicitudModal/SolicitudModal';
import SeccionAdministradoresJugador from '../components/SeccionAdministradoresJugador';
import PlayerSolicitudesEdicion from '../components/PlayerSolicitudesEdicion';
import PlayerStats from '../components/PlayerStats';
import { getJugadorById, updateJugador } from '../services/jugadorService';
import { getEquiposDelJugador, getRelacionesPorJugadorRaw } from '../services/jugadorEquipoService';
import { solicitarCrearContratoJugadorEquipo } from '../services/solicitudesJugadorEquipoService';
import { getResumenEstadisticasJugador } from '../../estadisticas/services/estadisticasService';
import { getUsuarioById, agregarAdminJugador, quitarAdminJugador, getAdminsJugador } from '../../auth/services/usersService';
import type { Jugador, Usuario } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useJugador } from '../../../app/providers/JugadorContext';
import { useAuth } from '../../../app/providers/AuthContext';
import { fromMainValueToError } from 'recharts/types/state/selectors/axisSelectors';

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams();
  const { addToast } = useToast();
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [loading, setLoading] = useState(false);
  const [equipos, setEquipos] = useState([] as any[]);
  const [contratosPorEquipo, setContratosPorEquipo] = useState<Record<string, any>>({});
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<Map<string, Usuario>>(new Map());
  const [nuevoAdmin, setNuevoAdmin] = useState('');
  const [loadingAgregar, setLoadingAgregar] = useState(false);

  // editar contrato modal (SolicitudModal) state
  const [isSolicitudEditOpen, setIsSolicitudEditOpen] = useState(false);
  const [solicitudEditContext, setSolicitudEditContext] = useState<any | undefined>(undefined);
  const [solicitudEditPrefillTipo, setSolicitudEditPrefillTipo] = useState<any | undefined>(undefined);
  const [solicitudEditPrefillDatos, setSolicitudEditPrefillDatos] = useState<Record<string, any> | undefined>(undefined);

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

        const [eqs, resumen, relacionesRaw] = await Promise.all([
          getEquiposDelJugador(jugador.id),
          getResumenEstadisticasJugador(jugador.id),
          getRelacionesPorJugadorRaw(jugador.id),
        ]);
        if (cancelled) return;
        setEquipos(eqs || []);
        // Build contratosPorEquipo map (prefer accepted relation per equipo)
        const map: Record<string, any> = {};
        (relacionesRaw || []).forEach((rel: any) => {
          const rawEquipo = (rel as any).equipo;
          let equipoId: string | undefined;
          if (!rawEquipo) return;
          if (typeof rawEquipo === 'string') equipoId = rawEquipo;
          else if (rawEquipo && rawEquipo._id) equipoId = rawEquipo._id;
          if (!equipoId) return;
          if (!map[equipoId]) map[equipoId] = rel;
          if (rel.estado === 'aceptado') map[equipoId] = rel;
        });
        setContratosPorEquipo(map);
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

  const loadAdminUsers = useCallback(async () => {
    if (!jugador?.administradores) return;
    
    // Get current admin users for the cache
    const currentAdminUsers = new Map(adminUsers);
    
    // Only fetch users that aren't already in the cache
    const usersToFetch = jugador.administradores.filter((id: string) => !currentAdminUsers.has(id));
    
    if (usersToFetch.length === 0) return;
    
    try {
      const fetchedUsers = await Promise.all(
        usersToFetch.map((id: string) => 
          getUsuarioById(id)
            .then(user => ({ user, id }))
            .catch(() => ({ 
              user: { id, nombre: id, email: 'Usuario no encontrado' } as Usuario, 
              id 
            }))
        )
      );
      
      // Update the state with new users
      setAdminUsers(prev => {
        const newMap = new Map(prev);
        fetchedUsers.forEach(({ user }) => {
          newMap.set(user.id, user);
        });
        return newMap;
      });
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  }, [jugador?.administradores, adminUsers]);

  useEffect(() => {
    if (jugador?.administradores && jugador.administradores.length > 0) {
      loadAdminUsers();
    } else {
      setAdminUsers(new Map());
    }
  }, [jugador?.administradores, loadAdminUsers]);

  const refreshExtras = useCallback(async () => {
    if (!jugador?.id) return;
    try {
      const eqs = await getEquiposDelJugador(jugador.id);
      setEquipos(eqs || []);
    } catch (err) {
      // ignore
    }
  }, [jugador?.id]);

  // solicitar modal state
  const [isSolicitarOpen, setIsSolicitarOpen] = useState(false);
  const [initialEquipoToSolicitar, setInitialEquipoToSolicitar] = useState<string | undefined>(undefined);

  const openSolicitarModal = useCallback((equipoId?: string) => {
    setInitialEquipoToSolicitar(equipoId);
    setIsSolicitarOpen(true);
  }, []);

  const openEditarContratoModal = useCallback((equipoId: string) => {
    const rel = contratosPorEquipo[equipoId];
    if (!rel) return;
    const contratoId = rel._id;
    setSolicitudEditContext({ contexto: 'equipo', entidadId: contratoId });
    setSolicitudEditPrefillTipo('jugador-equipo-editar');
    setSolicitudEditPrefillDatos({
      rol: rel.rol,
      fechaInicio: rel.fechaInicio ?? rel.desde ?? undefined,
      fechaFin: rel.fechaFin ?? rel.hasta ?? undefined,
      estado: rel.estado === 'aceptado' ? 'activo' : rel.estado,
      contratoId: rel._id,
      jugadorId: rel.jugador && typeof rel.jugador === 'object' ? rel.jugador._id : rel.jugador,
      equipoId: (rel.equipo && typeof rel.equipo === 'object') ? rel.equipo._id : rel.equipo,
    });
    setIsSolicitudEditOpen(true);
  }, [contratosPorEquipo]);

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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Acciones</h3>
            <div>
              <button
                type="button"
                onClick={() => openSolicitarModal(undefined)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Nueva solicitud de ingreso
              </button>
            </div>
          </div>

          {(() => {
            const filtered = equipos.filter((e) => {
              const rel = contratosPorEquipo?.[e.id];
              return rel && (rel.estado === 'aceptado' || rel.estado === 'baja');
            });
            return (
              <PlayerTeams jugador={jugador} equipos={filtered} contratosPorEquipo={contratosPorEquipo} onEditarContrato={openEditarContratoModal} />
            );
          })()}
          <PlayerSolicitudesEdicion jugadorId={jugador.id} administradores={jugador.administradores} />
          {(user?.rol === 'admin' || user?.id === jugador.creadoPor) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SeccionAdministradoresJugador
                  admins={jugador.administradores?.map((id: string) => {
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
      {isSolicitudEditOpen && (
        <SolicitudModal
          isOpen={isSolicitudEditOpen}
          contexto={solicitudEditContext}
          onClose={() => setIsSolicitudEditOpen(false)}
          onSuccess={async () => {
            setIsSolicitudEditOpen(false);
            await refreshExtras();
          }}
          prefillTipo={solicitudEditPrefillTipo}
          prefillDatos={solicitudEditPrefillDatos}
        />
      )}
    </div>
  );
};

export default PlayerProfilePage;
