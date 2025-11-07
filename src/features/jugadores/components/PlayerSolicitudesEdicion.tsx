import React, { useEffect, useState } from 'react';
import { obtenerSolicitudesEdicion, actualizarSolicitudEdicion, cancelarSolicitudEdicion } from '../services/solicitudesEdicionService';
import { getEquipo } from '../../equipo/services/equipoService';
import type { SolicitudEdicion, Equipo } from '../../../types';
import { useAuth } from '../../../app/providers/AuthContext';

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
}

const PlayerSolicitudesEdicion: React.FC<Props> = ({ jugadorId }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudEdicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombresEquipos, setNombresEquipos] = useState<Map<string, string>>(new Map());
  const { user } = useAuth();

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

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      // Cargar todas las solicitudes pendientes
      const todasPendientes = await obtenerSolicitudesEdicion({ estado: 'pendiente' });

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

        // Para solicitudes de eliminación, por ahora no las mostramos
        // (requeriría verificar si el contrato pertenece al jugador)
        return false;
      });

      setSolicitudes(relacionadas);

      // Cargar nombres de equipos necesarios
      const equipoIds = relacionadas
        .filter(s => s.tipo === 'jugador-equipo-crear')
        .map(s => (s.datosPropuestos as unknown as DatosCrearJugadorEquipo).equipoId);

      if (equipoIds.length > 0) {
        await cargarNombresEquipos(equipoIds);
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
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
    }
  };

  const handleAprobar = async (solicitudId: string) => {
    try {
      await actualizarSolicitudEdicion(solicitudId, { estado: 'aceptado' });
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
    }
  };

  const handleRechazar = async (solicitudId: string, motivo: string = 'Rechazada') => {
    try {
      await actualizarSolicitudEdicion(solicitudId, { estado: 'rechazado', motivoRechazo: motivo });
      // Recargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
    }
  };

  // Función para determinar qué acciones puede hacer el usuario con esta solicitud
  const getAccionesDisponibles = (solicitud: SolicitudEdicion) => {
    const esSolicitante = solicitud.creadoPor === user?.id;
    const esAdmin = user?.rol === 'admin';

    // Si el usuario creó la solicitud, solo puede cancelarla
    if (esSolicitante) {
      return { puedeCancelar: true, puedeAprobar: false, puedeRechazar: false };
    }

    // Si es admin y la solicitud afecta a este jugador, puede aprobar/rechazar
    if (esAdmin) {
      // Verificar si la solicitud afecta al jugador actual
      if (solicitud.tipo === 'jugador-equipo-crear') {
        const datos = solicitud.datosPropuestos as unknown as DatosCrearJugadorEquipo;
        return datos.jugadorId === jugadorId ? { puedeCancelar: false, puedeAprobar: true, puedeRechazar: true } : { puedeCancelar: false, puedeAprobar: false, puedeRechazar: false };
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
                      const creadorInfo = esSolicitante ? 'Enviada por ti' : `ID creador: ${solicitud.creadoPor}`;
                      console.log('Debug solicitud:', {
                        solicitudId: solicitud.id,
                        creadoPor: solicitud.creadoPor,
                        userId: user?.id,
                        esSolicitante,
                        creadorInfo
                      });
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
                        return <>Contrato: {datos.contratoId}</>;
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
                      {acciones.puedeCancelar && (
                        <button
                          onClick={() => handleCancelar(solicitud.id)}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                          title="Cancelar solicitud"
                        >
                          ✗
                        </button>
                      )}
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
