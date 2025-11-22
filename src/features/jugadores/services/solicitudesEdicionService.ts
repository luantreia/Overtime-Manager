// Wrapper especializado para el módulo de jugadores que reutiliza los servicios compartidos.
// Limita los tipos visibles y aplica scope=related para reducir la exposición.

import {
  getSolicitudesEdicion as getSolicitudesEdicionShared,
  crearSolicitudEdicion as crearSolicitudShared,
  actualizarSolicitudEdicion as actualizarSolicitudShared,
  cancelarSolicitudEdicion as cancelarSolicitudShared,
  getSolicitudAprobadores as getSolicitudAprobadoresShared,
} from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import type {
  ISolicitudEdicion,
  ISolicitudesPaginadas,
  ISolicitudCrearPayload,
  ISolicitudActualizarPayload,
  ISolicitudAprobadores,
} from '../../../shared/features/solicitudes/types/solicitudesEdicion';

const TIPOS_JUGADOR_MANAGER = [
  'jugador-equipo-crear',
  'jugador-equipo-eliminar',
  'jugador-equipo-editar',
] as const;

export const obtenerSolicitudesEdicion = async (page = 1, limit = 10): Promise<ISolicitudEdicion[]> => {
  const resp: ISolicitudesPaginadas = await getSolicitudesEdicionShared({ page, limit, scope: 'related' });
  return resp.solicitudes.filter(s => TIPOS_JUGADOR_MANAGER.includes(s.tipo as any));
};

export const crearSolicitudEdicion = async (payload: ISolicitudCrearPayload): Promise<ISolicitudEdicion> => {
  return crearSolicitudShared(payload);
};

export const actualizarSolicitudEdicion = async (id: string, payload: ISolicitudActualizarPayload): Promise<ISolicitudEdicion> => {
  return actualizarSolicitudShared(id, payload);
};

export const cancelarSolicitudEdicion = async (id: string): Promise<{ message: string }> => {
  return cancelarSolicitudShared(id);
};

export const getSolicitudAprobadores = async (id: string): Promise<ISolicitudAprobadores> => {
  return getSolicitudAprobadoresShared(id);
};

// Exportar alias para compatibilidad con código existente
export const crearSolicitud = crearSolicitudEdicion;
export const actualizarSolicitud = actualizarSolicitudEdicion;
