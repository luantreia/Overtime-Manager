import { authFetch } from '../../../utils/authFetch';
import type { SolicitudEdicion } from '../../../types';


type CrearSolicitudPayload = {
  tipo: string;
  entidad: string | null;
  datosPropuestos: Record<string, unknown>;
};

// Tipos específicos para JugadorEquipo
export type SolicitudCrearJugadorEquipo = {
  tipo: 'jugador-equipo-crear';
  entidad: null;
  datosPropuestos: {
    jugadorId: string;
    equipoId: string;
    rol?: string;
    numeroCamiseta?: number;
    fechaInicio?: string;
    fechaFin?: string;
  };
};

export type SolicitudEliminarJugadorEquipo = {
  tipo: 'jugador-equipo-eliminar';
  entidad: null;
  datosPropuestos: {
    contratoId: string;
  };
};

export const crearSolicitudEdicion = (payload: CrearSolicitudPayload) =>
  authFetch<SolicitudEdicion>('/solicitudes-edicion', {
    method: 'POST',
    body: payload,
  });

export const obtenerSolicitudesEdicion = (filtros?: { tipo?: string; estado?: string; creadoPor?: string }) => {
  const params = new URLSearchParams();
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.estado) params.set('estado', filtros.estado);
  if (filtros?.creadoPor) params.set('creadoPor', filtros.creadoPor);

  return authFetch<SolicitudEdicion[]>(`/solicitudes-edicion?${params.toString()}`);
};

export const actualizarSolicitudEdicion = (id: string, payload: { estado: string; motivoRechazo?: string }) =>
  authFetch<SolicitudEdicion>(`/solicitudes-edicion/${id}`, {
    method: 'PUT',
    body: payload,
  });

export const cancelarSolicitudEdicion = (id: string) =>
  authFetch<{ message: string }>(`/solicitudes-edicion/${id}`, {
    method: 'DELETE',
  });
