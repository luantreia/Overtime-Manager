import { crearSolicitudEdicion, obtenerSolicitudesEdicion, actualizarSolicitudEdicion } from './solicitudesEdicionService';
import type { SolicitudCrearJugadorEquipo } from './solicitudesEdicionService';

// Funciones para crear solicitudes de JugadorEquipo
export const solicitarCrearContratoJugadorEquipo = (payload: SolicitudCrearJugadorEquipo['datosPropuestos']) =>
  crearSolicitudEdicion({
    tipo: 'jugador-equipo-crear',
    entidad: null,
    datosPropuestos: payload,
  });

export const solicitarEliminarContratoJugadorEquipo = (contratoId: string) =>
  crearSolicitudEdicion({
    tipo: 'jugador-equipo-eliminar',
    entidad: null,
    datosPropuestos: { contratoId },
  });

// Funciones para gestionar solicitudes (para admins)
export const obtenerSolicitudesCrearJugadorEquipo = (filtros?: { equipoId?: string; estado?: string }) => {
  const params: any = { tipo: 'jugador-equipo-crear' };
  if (filtros?.estado) params.estado = filtros.estado;
  return obtenerSolicitudesEdicion(params);
};

export const obtenerSolicitudesEliminarJugadorEquipo = (filtros?: { equipoId?: string; estado?: string }) => {
  const params: any = { tipo: 'jugador-equipo-eliminar' };
  if (filtros?.estado) params.estado = filtros.estado;
  return obtenerSolicitudesEdicion(params);
};

export const aprobarSolicitudJugadorEquipo = (solicitudId: string) =>
  actualizarSolicitudEdicion(solicitudId, { estado: 'aceptado' });

export const rechazarSolicitudJugadorEquipo = (solicitudId: string, motivoRechazo: string) =>
  actualizarSolicitudEdicion(solicitudId, { estado: 'rechazado', motivoRechazo });
