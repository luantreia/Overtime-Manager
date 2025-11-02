import { authFetch } from '../../../utils/authFetch';
import type { Jugador, SolicitudJugador, ContratoJugadorResumen } from '../../../types';
import { getEquipo } from '../../equipo/services/equipoService';
import { isValidObjectId, InvalidObjectIdError } from '../../../utils/validateObjectId';
import type { Equipo } from '../../../types';

type JugadorEquipoQuery = {
  equipoId?: string | null;
  estado?: 'activo' | 'pendiente' | 'baja';
};

type InvitacionPayload = {
  jugadorId: string;
  equipoId: string;
  rol?: string;
  numeroCamiseta?: number;
  fechaInicio?: string;
  fechaFin?: string | null;
};

type UpdateEstadoPayload = {
  estado: 'aceptado' | 'rechazado' | 'baja';
  motivoRechazo?: string;
};

type ContratoPayload = {
  rol?: string;
  numeroCamiseta?: number;
  fechaInicio?: string;
  fechaFin?: string | null;
};

type BackendJugador = {
  _id: string;
  nombre?: string;
  posicion?: string;
  alias?: string;
  estado?: string;
  numeroCamiseta?: number;
};

type BackendJugadorEquipo = {
  _id: string;
  jugador: BackendJugador | string;
  equipo: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'baja';
  rol?: string;
  desde?: string;
  hasta?: string;
  fechaSolicitud?: string;
  origen?: 'equipo' | 'jugador';
  fechaAceptacion?: string;
  createdAt?: string;
  updatedAt?: string;
};

const mapJugador = (relacion: BackendJugadorEquipo): Jugador => {
  const jugadorData = typeof relacion.jugador === 'string' ? { _id: relacion.jugador } : relacion.jugador;

  return {
    id: jugadorData._id,
    nombre: jugadorData.nombre ?? jugadorData.alias ?? 'Jugador',
    posicion: jugadorData.posicion ?? 'Jugador',
    numeroCamiseta: jugadorData.numeroCamiseta,
    estado: relacion.estado === 'aceptado' ? 'activo' : relacion.estado === 'baja' ? 'baja' : 'pendiente',
    rolEnEquipo: relacion.rol,
    rol: relacion.rol,
    fechaInicio: relacion.desde ?? undefined,
    fechaFin: relacion.hasta ?? undefined,
    contratoId: relacion._id,
    creadoPor: (typeof relacion.jugador === 'object' && (relacion.jugador as any).creadoPor) ? (relacion.jugador as any).creadoPor : undefined,
    administradores: (typeof relacion.jugador === 'object' && (relacion.jugador as any).administradores) ? (relacion.jugador as any).administradores : undefined,
  };
};

const mapSolicitud = (relacion: BackendJugadorEquipo): SolicitudJugador => ({
  id: relacion._id,
  jugador: mapJugador(relacion),
  estado: relacion.estado === 'aceptado' ? 'aceptado' : relacion.estado === 'rechazado' ? 'rechazado' : 'pendiente',
  mensaje: relacion.origen === 'jugador' ? 'Solicitud enviada por el jugador' : 'Invitación del equipo',
  origen: relacion.origen,
  fechaSolicitud: relacion.fechaSolicitud ?? relacion.createdAt,
  solicitadoPor: (relacion as any).solicitadoPor ?? undefined,
  equipo: ((): { id: string; nombre: string; creadoPor?: string; administradores?: string[] } | undefined => {
    const raw = (relacion as any).equipo;
    if (!raw) return undefined;
    if (typeof raw === 'string') return { id: raw, nombre: '' };
    return { id: raw._id, nombre: raw.nombre, creadoPor: raw.creadoPor, administradores: raw.administradores };
  })(),
  fechaInicio: relacion.desde ?? undefined,
  fechaFin: relacion.hasta ?? null,
});

const mapContratoResumen = (relacion: BackendJugadorEquipo): ContratoJugadorResumen => {
  const jugadorData = typeof relacion.jugador === 'string' ? { _id: relacion.jugador } : relacion.jugador;

  return {
    id: relacion._id,
    jugadorNombre: jugadorData.nombre ?? jugadorData.alias ?? 'Jugador',
    estado: relacion.estado,
    rol: relacion.rol,
    origen: relacion.origen,
    fechaInicio: relacion.desde,
    fechaFin: relacion.hasta ?? null,
    fechaSolicitud: relacion.fechaSolicitud ?? relacion.createdAt,
    fechaAceptacion: relacion.fechaAceptacion ?? undefined,
  };
};

export const getJugadoresEquipo = async ({ equipoId, estado }: JugadorEquipoQuery): Promise<Jugador[]> => {
  const queryEstado = estado ? `&estado=${estado}` : '';
  const queryEquipo = equipoId ? `equipo=${equipoId}` : '';
  const queryString = [queryEquipo, queryEstado].filter(Boolean).join('&');
  const url = `/jugador-equipo${queryString ? `?${queryString}` : ''}`;
  const relaciones = await authFetch<BackendJugadorEquipo[]>(url);
  return relaciones.filter((relacion) => relacion.estado === 'aceptado').map(mapJugador);
};

export const getSolicitudesJugadores = async (equipoId: string): Promise<SolicitudJugador[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?equipo=${equipoId}`);
  return relaciones.filter((relacion) => relacion.estado === 'pendiente').map(mapSolicitud);
};

export const getContratosNoActivos = async (equipoId: string): Promise<ContratoJugadorResumen[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?equipo=${equipoId}`);
  return relaciones.filter((relacion) => relacion.estado !== 'aceptado').map(mapContratoResumen);
};

export const getHistorialSolicitudesJugadorEquipo = async (
  equipoId: string
): Promise<ContratoJugadorResumen[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?equipo=${equipoId}`);
  return relaciones
    .map(mapContratoResumen)
    .sort((a, b) => {
      const fechaA = a.fechaAceptacion ?? a.fechaSolicitud ?? '';
      const fechaB = b.fechaAceptacion ?? b.fechaSolicitud ?? '';
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
    });
};

// Obtener solicitudes pendientes para un jugador (solicitudes donde jugador es el seleccionado)
export const getSolicitudesPorJugador = async (jugadorId: string): Promise<SolicitudJugador[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?jugador=${jugadorId}`);
  return relaciones.filter((relacion) => relacion.estado === 'pendiente').map(mapSolicitud);
};

// Obtener historial de solicitudes/contratos para un jugador
export const getHistorialSolicitudesPorJugador = async (
  jugadorId: string
): Promise<ContratoJugadorResumen[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?jugador=${jugadorId}`);
  return relaciones
    .map(mapContratoResumen)
    .sort((a, b) => {
      const fechaA = a.fechaAceptacion ?? a.fechaSolicitud ?? '';
      const fechaB = b.fechaAceptacion ?? b.fechaSolicitud ?? '';
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
    });
};

export const invitarJugador = (payload: InvitacionPayload) =>
  authFetch<SolicitudJugador>('/jugador-equipo/solicitar-equipo', {
    method: 'POST',
    body: {
      jugador: payload.jugadorId,
      equipo: payload.equipoId,
      rol: payload.rol,
      numeroCamiseta: payload.numeroCamiseta,
      desde: payload.fechaInicio,
      hasta: payload.fechaFin,
    },
  });

// Solicitud iniciada por el jugador (flujo jugador -> equipo)
// Usa el endpoint /solicitar-jugador que crea la relación con origen: 'jugador'
export const solicitarIngresoEquipo = (payload: { jugadorId: string; equipoId: string; fechaInicio?: string; fechaFin?: string | null }) =>
  authFetch<SolicitudJugador>('/jugador-equipo/solicitar-jugador', {
    method: 'POST',
    body: {
      jugador: payload.jugadorId,
      equipo: payload.equipoId,
      desde: payload.fechaInicio,
      hasta: payload.fechaFin,
    },
  });

// Obtener opciones de equipos disponibles para un jugador (usa el endpoint protegido)
export const obtenerOpcionesEquiposParaJugador = async (jugadorId: string, q?: string) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('jugador', jugadorId);
  const data = await authFetch<Array<{ _id: string; nombre: string; alias?: string; pais?: string; escudo?: string }>>(
    `/jugador-equipo/opciones?${params.toString()}`
  );

  return data.map((item) => ({ id: item._id, nombre: item.nombre, escudo: item.escudo }));
};

export const eliminarSolicitud = (contratoId: string) =>
  authFetch<void>(`/jugador-equipo/${contratoId}`, { method: 'DELETE' });

export const actualizarEstadoJugador = (contratoId: string, payload: UpdateEstadoPayload) =>
  (isValidObjectId(contratoId)
    ? authFetch(`/jugador-equipo/${contratoId}`, {
        method: 'PUT',
        body: payload,
      })
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const actualizarContratoJugador = (contratoId: string, payload: ContratoPayload) =>
  (isValidObjectId(contratoId)
    ? authFetch(`/jugador-equipo/${contratoId}`, {
        method: 'PUT',
        body: payload,
      })
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEquiposDelJugador = async (jugadorId: string): Promise<Equipo[]> => {
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?jugador=${jugadorId}`);
  // Normalizar ids de equipo: el backend a veces devuelve el equipo como string o como objeto { _id }
  const equipoIds = Array.from(
    new Set(
      relaciones
        .map((r) => {
          const raw = (r as any).equipo;
          if (!raw) return undefined;
          if (typeof raw === 'string') return raw;
          if (typeof raw === 'object' && raw._id) return raw._id;
          return undefined;
        })
        .filter(Boolean)
    )
  );

  const equipos: Equipo[] = [];
  for (const id of equipoIds) {
    try {
      // getEquipo mapea al tipo Equipo
      // evitar llamar con ids inválidos (evita '/equipos/[object Object]' o 'undefined')
      if (typeof id !== 'string' || id.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('Saltando id de equipo inválido al obtener equipos del jugador:', id);
        continue;
      }
      const equipo = await getEquipo(id as string);
      equipos.push(equipo);
    } catch (err) {
      // ignore individual fetch errors but log
      // eslint-disable-next-line no-console
      console.error('Error obteniendo equipo', id, err);
    }
  }

  return equipos;
};
