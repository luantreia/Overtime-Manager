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

// Shape que devuelve el backend
type BackendSolicitud = {
  _id: string;
  tipo: string;
  entidad?: string | null;
  datosPropuestos: Record<string, unknown>;
  estado: string;
  creadoPor: string;
  createdAt?: string;
  updatedAt?: string;
};

const mapSolicitud = (s: BackendSolicitud): SolicitudEdicion => ({
  id: s._id,
  tipo: s.tipo,
  entidad: s.entidad ?? null,
  datosPropuestos: s.datosPropuestos,
  estado: s.estado as SolicitudEdicion['estado'],
  creadoPor: s.creadoPor,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export const crearSolicitudEdicion = (payload: CrearSolicitudPayload) =>
  authFetch<BackendSolicitud>('/solicitudes-edicion', {
    method: 'POST',
    body: payload,
  }).then(mapSolicitud);

export const obtenerSolicitudesEdicion = (filtros?: { tipo?: string; estado?: string; creadoPor?: string; entidad?: string }) => {
  const params = new URLSearchParams();
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.estado) params.set('estado', filtros.estado);
  if (filtros?.creadoPor) params.set('creadoPor', filtros.creadoPor);
  if (filtros?.entidad) params.set('entidad', filtros.entidad);

  return authFetch<BackendSolicitud[]>(`/solicitudes-edicion?${params.toString()}`).then((arr) => arr.map(mapSolicitud));
};

export const actualizarSolicitudEdicion = (id: string, payload: { estado: string; motivoRechazo?: string }) =>
  authFetch<BackendSolicitud>(`/solicitudes-edicion/${id}`, {
    method: 'PUT',
    body: payload,
  }).then(mapSolicitud);

export const cancelarSolicitudEdicion = (id: string) =>
  authFetch<{ message: string }>(`/solicitudes-edicion/${id}`, {
    method: 'DELETE',
  });
