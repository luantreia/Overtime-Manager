import { crearSolicitudEdicion, getSolicitudesEdicion, actualizarSolicitudEdicion } from '../../../shared/features/solicitudes';
import type { ISolicitudEdicion } from '../../../shared/utils/types/solicitudesEdicion';

// Funciones para crear solicitudes de JugadorEquipo
export const solicitarCrearContratoJugadorEquipo = (payload: {
  jugadorId: string;
  equipoId: string;
  rol?: string;
  numeroCamiseta?: number;
  fechaInicio?: string;
  fechaFin?: string;
}) =>
  crearSolicitudEdicion({ tipo: 'jugador-equipo-crear', entidad: undefined, datosPropuestos: payload });

export const solicitarEliminarContratoJugadorEquipo = (contratoId: string) =>
  crearSolicitudEdicion({ tipo: 'jugador-equipo-eliminar', entidad: undefined, datosPropuestos: { contratoId } });

// Funciones para gestionar solicitudes (para admins)
export const obtenerSolicitudesCrearJugadorEquipo = async (filtros?: { equipoId?: string; estado?: string }): Promise<ISolicitudEdicion[]> => {
  const resp = await getSolicitudesEdicion({ tipo: 'jugador-equipo-crear', estado: filtros?.estado as any });
  return resp.solicitudes;
};

export const obtenerSolicitudesEliminarJugadorEquipo = async (filtros?: { equipoId?: string; estado?: string }): Promise<ISolicitudEdicion[]> => {
  const resp = await getSolicitudesEdicion({ tipo: 'jugador-equipo-eliminar', estado: filtros?.estado as any });
  return resp.solicitudes;
};

export const aprobarSolicitudJugadorEquipo = (solicitudId: string) =>
  actualizarSolicitudEdicion(solicitudId, { estado: 'aceptado' });

export const rechazarSolicitudJugadorEquipo = (solicitudId: string, motivoRechazo: string) =>
  actualizarSolicitudEdicion(solicitudId, { estado: 'rechazado', motivoRechazo });
