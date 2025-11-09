import React, { useEffect, useState } from 'react';
import { obtenerSolicitudesEdicion, actualizarSolicitudEdicion, cancelarSolicitudEdicion } from '../services/solicitudesEdicionService';
import { getEquipo } from '../../equipo/services/equipoService';
import { getUsuarioById, getAdminsEquipo } from '../../auth/services/usersService';
import type { SolicitudEdicion, Equipo, Usuario } from '../../../types';
import { useAuth } from '../../../app/providers/AuthContext';
import { getRelacionesPorJugadorRaw } from '../services/jugadorEquipoService';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

// Interfaces específicas para los datos de las solicitudes
interface DatosCrearJugadorEquipo {
  jugadorId: string;
  equipoId: string;
  fechaInicio?: string;
  fechaFin?: string;
  rol?: string;
}

interface DatosEliminarJugadorEquipo {
  contratoId: string;
}

type DatosSolicitud = DatosCrearJugadorEquipo | DatosEliminarJugadorEquipo;

interface Props {
  jugadorId: string;
  administradores?: string[];
}

const PlayerSolicitudesEdicion: React.FC<Props> = ({ jugadorId, administradores = [] }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudEdicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombresEquipos, setNombresEquipos] = useState<Map<string, string>>(new Map());
  const [usuariosCreadores, setUsuariosCreadores] = useState<Map<string, Usuario>>(new Map());
  const [adminsEquipos, setAdminsEquipos] = useState<Map<string, string[]>>(new Map());
  const { user } = useAuth();
  const { addToast } = useToast();
  const [contratoToEquipo, setContratoToEquipo] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    cargarSolicitudes();
  }, [jugadorId]);

  const cargarNombresEquipos = async (equipoIds: string[]) => {
    const nuevosNombres = new Map(nombresEquipos);
    const idsFaltantes = equipoIds.filter(id => !nuevosNombres.has(id));

    for (const equipoId of idsFaltantes) {
      try {
        const equipo = await getEquipo(equipoId);
        nuevosNombres.set(equipoId, equipo.nombre);
      } catch (error) {
        console.error(`Error cargando equipo ${equipoId}:`, error);
        nuevosNombres.set(equipoId, `Equipo ${equipoId.slice(-6)}`); // fallback
      }
    }

    setNombresEquipos(nuevosNombres);
  };

  const cargarUsuariosCreadores = async (creadorIds: string[]) => {
    const nuevosUsuarios = new Map(usuariosCreadores);
    const idsFaltantes = creadorIds.filter(id => !nuevosUsuarios.has(id) && id !== user?.id); // no cargar el usuario actual

    for (const creadorId of idsFaltantes) {
      try {
        const usuario = await getUsuarioById(creadorId);
        nuevosUsuarios.set(creadorId, usuario);
      } catch (error) {
        console.error(`Error cargando usuario ${creadorId}:`, error);
        // No fallback, ya que no queremos mostrar IDs
      }
    }

    setUsuariosCreadores(nuevosUsuarios);
  };

  const cargarAdminsEquipos = async (equipoIds: string[]) => {
    const nuevosAdmins = new Map(adminsEquipos);
    const idsFaltantes = equipoIds.filter(id => !nuevosAdmins.has(id));

    for (const equipoId of idsFaltantes) {
      try {
        const admins = await getAdminsEquipo(equipoId);
        const adminIds = admins.map((a: any) => typeof a === 'string' ? a : a.id);
        nuevosAdmins.set(equipoId, adminIds);
      } catch (error) {
        console.error(`Error cargando admins equipo ${equipoId}:`, error);
        nuevosAdmins.set(equipoId, []); // fallback
      }
    }

    setAdminsEquipos(nuevosAdmins);
  };

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      // Cargar todas las solicitudes pendientes
      const todasPendientes = await obtenerSolicitudesEdicion({ estado: 'pendiente' });

      // Obtener relaciones para este jugador para resolver contrato -> equipo
      const relaciones = await getRelacionesPorJugadorRaw(jugadorId);
      const mapaContratoAEquipo = new Map<string, string>();
      for (const r of relaciones) {
        const contratoId = r._id;
        const rawEquipo = (r as any).equipo;
        const equipoId = typeof rawEquipo === 'string' ? rawEquipo : rawEquipo?._id;
        if (contratoId && equipoId) {
          mapaContratoAEquipo.set(contratoId, equipoId);
        }
      }
      setContratoToEquipo(mapaContratoAEquipo);

      // Filtrar las que están relacionadas con este jugador
      const relacionadas = todasPendientes.filter(solicitud => {
        // Mostrar solicitudes creadas por este usuario (puede cancelar)
        if (solicitud.creadoPor === user?.id) {
          return true;
        }

        // Mostrar solicitudes que afectan a este jugador (como admin puede aprobar)
        if (solicitud.tipo === 'jugador-equipo-crear') {
          const datos = solicitud.datosPropuestos as unknown as DatosCrearJugadorEquipo;
          return datos.jugadorId === jugadorId;
        }

        if (solicitud.tipo === 'jugador-equipo-eliminar') {
          const datos = solicitud.datosPropuestos as unknown as DatosEliminarJugadorEquipo;
          // pertenece si el contrato corresponde a alguna relación del jugador
          return !!mapaContratoAEquipo.get(datos.contratoId);
        }

        return false;
      });

      setSolicitudes(relacionadas);

      // Cargar nombres de equipos necesarios
      const equipoIds = relacionadas
        .map(s => {
          if (s.tipo === 'jugador-equipo-crear') {
            return (s.datosPropuestos as unknown as DatosCrearJugadorEquipo).equipoId;
          }
          if (s.tipo === 'jugador-equipo-eliminar') {
            const contratoId = (s.datosPropuestos as unknown as DatosEliminarJugadorEquipo).contratoId;
            return mapaContratoAEquipo.get(contratoId);
          }
          return undefined;
        })
        .filter((x): x is string => Boolean(x));

      if (equipoIds.length > 0) {
        await cargarNombresEquipos(equipoIds);
        await cargarAdminsEquipos(equipoIds);
      }

      // Cargar usuarios creadores
      const creadorIds = relacionadas
        .filter(s => s.creadoPor !== user?.id)
        .map(s => s.creadoPor);

      if (creadorIds.length > 0) {
        await cargarUsuariosCreadores(creadorIds);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aceptado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'jugador-equipo-crear': return 'Solicitar unirse a equipo';
      case 'jugador-equipo-eliminar': return 'Solicitar abandonar equipo';
      default: return tipo;
    }
  };

  const handleCancelar = async (solicitudId: string) => {
    try {
      await cancelarSolicitudEdicion(solicitudId);
      addToast({ type: 'success', title: 'Solicitud cancelada', message: 'La solicitud fue cancelada.' });
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      addToast({ type: 'error', title: 'Error', message: 'No se pudo cancelar la solicitud.' });
    }
  };

  const handleAprobar = async (solicitudId: string) => {
    try {
      await actualizarSolicitudEdicion(solicitudId, { estado: 'aceptado' });
      addToast({ type: 'success', title: 'Solicitud aprobada', message: 'Se aplicarán los cambios correspondientes.' });
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      addToast({ type: 'error', title: 'Error', message: 'No se pudo aprobar la solicitud.' });
    }
  };

  const handleRechazar = async (solicitudId: string, motivo: string = 'Rechazada') => {
    try {
      await actualizarSolicitudEdicion(solicitudId, { estado: 'rechazado', motivoRechazo: motivo });
      addToast({ type: 'success', title: 'Solicitud rechazada', message: 'La solicitud fue rechazada.' });
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      addToast({ type: 'error', title: 'Error', message: 'No se pudo rechazar la solicitud.' });
    }
  };

  // Función para determinar qué acciones puede hacer el usuario con esta solicitud
  const getAccionesDisponibles = (solicitud: SolicitudEdicion) => {
    const esSolicitante = solicitud.creadoPor === user?.id;
    const esAdminGlobal = user?.rol === 'admin';
    const esAdminJugadorActual = administradores.includes(user?.id || '');

    // Si el usuario creó la solicitud, solo puede cancelarla
    if (esSolicitante) {
      return { puedeCancelar: true, puedeAprobar: false, puedeRechazar: false };
    }

    // Para solicitudes de jugador-equipo-crear
    if (solicitud.tipo === 'jugador-equipo-crear') {
      const datos = solicitud.datosPropuestos as unknown as DatosCrearJugadorEquipo;
      const adminsEquipo = adminsEquipos.get(datos.equipoId) || [];
      const esAdminEquipoActual = adminsEquipo.includes(user?.id || '');

      // Determinar de qué lado se creó la solicitud
      const creadorEsAdminEquipo = adminsEquipo.includes(solicitud.creadoPor);
      const creadorEsAdminJugador = administradores.includes(solicitud.creadoPor);

      // Admin global siempre puede aprobar/rechazar
      if (esAdminGlobal) {
        return { puedeCancelar: false, puedeAprobar: true, puedeRechazar: true };
      }

      // Si la solicitud la creó un admin del equipo, debe aprobar un admin del jugador
      if (creadorEsAdminEquipo && esAdminJugadorActual) {
        return { puedeCancelar: false, puedeAprobar: true, puedeRechazar: true };
      }

      // Si la solicitud la creó un admin del jugador, debe aprobar un admin del equipo
      if (creadorEsAdminJugador && esAdminEquipoActual) {
        return { puedeCancelar: false, puedeAprobar: true, puedeRechazar: true };
      }
    }

    // Para solicitudes de jugador-equipo-eliminar: cualquiera de los admin (jugador o equipo) o admin global
    if (solicitud.tipo === 'jugador-equipo-eliminar') {
      const datos = solicitud.datosPropuestos as unknown as DatosEliminarJugadorEquipo;
      const equipoId = contratoToEquipo.get(datos.contratoId);
      const adminsEquipo = equipoId ? (adminsEquipos.get(equipoId) || []) : [];
      const esAdminEquipoActual = adminsEquipo.includes(user?.id || '');

      if (esAdminGlobal || esAdminEquipoActual || esAdminJugadorActual) {
        return { puedeCancelar: false, puedeAprobar: true, puedeRechazar: true };
      }
    }

    return { puedeCancelar: false, puedeAprobar: false, puedeRechazar: false };
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Solicitudes Pendientes</h3>
        <p className="text-sm text-slate-500">Solicitudes relacionadas con este jugador que requieren aprobación.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-slate-500">No hay solicitudes pendientes relacionadas.</p>
      ) : (
        <ul className="space-y-3">
          {solicitudes.map((solicitud, index) => {
            const acciones = getAccionesDisponibles(solicitud);
            const esSolicitante = solicitud.creadoPor === user?.id;

            return (
              <li key={`${solicitud.id}-${index}`} className="flex items-start justify-between p-3 border border-slate-100 rounded-lg">
                <div className="text-sm flex-1">
                  <div className="font-medium text-slate-900">{getTipoLabel(solicitud.tipo)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {(() => {
                      const creadorInfo = (() => {
                        if (esSolicitante) {
                          return 'Enviada por ti';
                        }
                        const userCreador = usuariosCreadores.get(solicitud.creadoPor);
                        if (userCreador) {
                          return `${userCreador.nombre} (${userCreador.email})`;
                        }
                        return `Usuario ${solicitud.creadoPor.slice(-6)}`; // fallback con últimos 6 chars
                      })();
                      return creadorInfo;
                    })()} | {solicitud.createdAt ? new Date(solicitud.createdAt).toLocaleString() : 'Fecha no disponible'}
                  </div>
                  {solicitud.datosPropuestos && (
                    <div className="text-xs text-slate-400 mt-1">
                      {solicitud.tipo === 'jugador-equipo-crear' && (() => {
                        const datos = solicitud.datosPropuestos as unknown as DatosCrearJugadorEquipo;
                        const nombreEquipo = nombresEquipos.get(datos.equipoId) || `Equipo ${datos.equipoId.slice(-6)}`;
                        return (
                          <>
                            Equipo: {nombreEquipo}<br/>
                            {datos.fechaInicio && `Desde: ${new Date(datos.fechaInicio).toLocaleDateString()}`}<br/>
                            {datos.fechaFin && `Hasta: ${new Date(datos.fechaFin).toLocaleDateString()}`}
                          </>
                        );
                      })()}
                      {solicitud.tipo === 'jugador-equipo-eliminar' && (() => {
                        const datos = solicitud.datosPropuestos as unknown as DatosEliminarJugadorEquipo;
                        const equipoId = contratoToEquipo.get(datos.contratoId);
                        const nombreEquipo = equipoId ? (nombresEquipos.get(equipoId) || `Equipo ${equipoId.slice(-6)}`) : 'Equipo desconocido';
                        return (
                          <>
                            Equipo: {nombreEquipo}<br/>
                            Contrato: {datos.contratoId}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                    Pendiente
                  </span>
                  {(acciones.puedeCancelar || acciones.puedeAprobar || acciones.puedeRechazar) && (
                    <div className="flex gap-1">
                      {acciones.puedeCancelar && !acciones.puedeAprobar && !acciones.puedeRechazar ? (
                        <button
                          onClick={() => handleCancelar(solicitud.id)}
                          className="text-xs bg-slate-500 text-white px-2 py-1 rounded hover:bg-slate-600"
                          title="Cancelar solicitud"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <>
                          {acciones.puedeAprobar && (
                            <button
                              onClick={() => handleAprobar(solicitud.id)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              title="Aprobar solicitud"
                            >
                              ✓
                            </button>
                          )}
                          {acciones.puedeRechazar && (
                            <button
                              onClick={() => handleRechazar(solicitud.id)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              title="Rechazar solicitud"
                            >
                              ✗
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PlayerSolicitudesEdicion;
