import { authFetch } from '../../../utils/authFetch';
import { isValidObjectId, InvalidObjectIdError } from '../../../utils/validateObjectId';
import type { EstadisticaEquipoResumen, EstadisticaJugador } from '../../../types';

type EstadisticasEquipoResponse = {
  resumen: EstadisticaEquipoResumen;
  jugadores: EstadisticaJugador[];
};

type EstadisticaHistorica = {
  fecha: string;
  resultado: 'W' | 'D' | 'L';
  puntosAnotados: number;
  puntosRecibidos: number;
};

export const getEstadisticasEquipo = (equipoId: string) =>
  authFetch<EstadisticasEquipoResponse>(`/estadisticas?equipo=${equipoId}`);

export const getHistorialResultados = (equipoId: string) =>
  authFetch<EstadisticaHistorica[]>(`/estadisticas/historial?equipo=${equipoId}`);

export interface EstadisticaJugadorSetResumen {
  _id: string;
  jugadorPartido?: {
    _id?: string;
    equipo?: {
      _id?: string;
      nombre?: string;
      escudo?: string;
    } | string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
}

export interface EstadisticaSetResumen {
  _id: string;
  numeroSet: number;
  estadoSet?: string;
  ganadorSet?: string;
  estadisticas?: EstadisticaJugadorSetResumen[];
}

export interface ResumenEstadisticasAutomaticas {
  sets?: EstadisticaSetResumen[];
}

export interface EstadisticaJugadorSetDetalle {
  _id: string;
  jugador?: {
    _id?: string;
    nombre?: string;
    apellido?: string;
  } | string;
  equipo?: {
    _id?: string;
    nombre?: string;
    escudo?: string;
  } | string;
  jugadorPartido?: {
    _id?: string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  tipoCaptura?: string;
}

export interface EstadisticaManualJugador {
  _id?: string;
  jugadorPartido?: {
    _id?: string;
    jugador?: {
      nombre?: string;
    };
    equipo?: {
      _id?: string;
      nombre?: string;
      escudo?: string;
    } | string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  tipoCaptura?: string;
}

export interface EstadisticaManualEquipo {
  _id?: string;
  nombre?: string;
  escudo?: string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  jugadores?: number;
  efectividad?: number;
}

export type JugadorPartidoResumen = {
  _id: string;
  jugador: EstadisticaManualJugador['jugadorPartido'];
  equipo: string | { _id?: string };
};

export type EstadisticaJugadorPartidoPayload = Record<string, unknown> & {
  jugadorPartido: string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  tipoCaptura?: string;
  fuente?: string;
  _id?: string;
};

export interface ResumenEstadisticasManual {
  jugadores?: EstadisticaManualJugador[];
  equipos?: EstadisticaManualEquipo[];
  mensaje?: string;
  tipo?: string;
}

type SetPartidoResumen = {
  _id: string;
  numeroSet: number;
  estadoSet?: string;
  ganadorSet?: string;
};

export const getResumenEstadisticasAutomaticas = async (partidoId: string) => {
  if (!isValidObjectId(partidoId)) {
    throw new InvalidObjectIdError('ID inválido (cliente)');
  }
  // 1) Obtener los sets del partido
  const sets = await authFetch<SetPartidoResumen[]>(`/set-partido?partido=${partidoId}`);

  // 2) Para cada set, obtener las estadísticas de jugador-set directamente
  const setsConEstadisticas = await Promise.all(
    (sets || [])
      .sort((a, b) => (a.numeroSet || 0) - (b.numeroSet || 0))
      .map(async (set) => {
        const stats = await authFetch<EstadisticaJugadorSetDetalle[]>(`/estadisticas/jugador-set?set=${set._id}`);
        // Mapear al tipo resumido esperado por la UI
        const estadisticas = (stats || []).map((s) => ({
          _id: s._id,
          jugadorPartido: s.jugadorPartido,
          throws: s.throws ?? 0,
          hits: s.hits ?? 0,
          outs: s.outs ?? 0,
          catches: s.catches ?? 0,
        })) as EstadisticaJugadorSetResumen[];

        return {
          _id: set._id,
          numeroSet: set.numeroSet,
          estadoSet: set.estadoSet,
          ganadorSet: set.ganadorSet,
          estadisticas,
        } as EstadisticaSetResumen;
      })
  );

  const payload: ResumenEstadisticasAutomaticas = {
    sets: setsConEstadisticas,
  };
  return payload;
};

export const getResumenEstadisticasManual = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<ResumenEstadisticasManual>(`/estadisticas/jugador-partido-manual/resumen-partido/${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

// Resumen de estadísticas agregadas por jugador
export const getResumenEstadisticasJugador = (jugadorId: string) =>
  (isValidObjectId(jugadorId)
    ? authFetch<any>(`/estadisticas/jugador/${jugadorId}/resumen`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorSet = (setId: string) =>
  (isValidObjectId(setId)
    ? authFetch<EstadisticaJugadorSetDetalle[]>(`/estadisticas/jugador-set?set=${setId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getJugadoresPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<JugadorPartidoResumen[]>(`/jugador-partido?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const buscarEstadisticaJugadorSet = (setId: string, jugadorPartidoId: string) =>
  (!isValidObjectId(setId) || !isValidObjectId(jugadorPartidoId)
    ? Promise.reject(new InvalidObjectIdError('ID inválido (cliente)'))
    : authFetch<EstadisticaJugadorSetDetalle[]>(`/estadisticas/jugador-set?set=${setId}&jugadorPartido=${jugadorPartidoId}`));

export const crearEstadisticaJugadorSet = (payload: {
  set: string;
  jugadorPartido: string;
  jugador: string;
  equipo: string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
}) =>
  authFetch(`/estadisticas/jugador-set`, {
    method: 'POST',
    body: payload,
  });

export const actualizarEstadisticaJugadorSet = (
  id: string,
  payload: {
    throws?: number;
    hits?: number;
    outs?: number;
    catches?: number;
  },
) =>
  (isValidObjectId(id)
    ? authFetch(`/estadisticas/jugador-set/${id}`, {
        method: 'PUT',
        body: payload,
      })
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoManual = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido-manual?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getResumenEstadisticasJugadorPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<{ jugadores?: EstadisticaManualJugador[] }>(`/estadisticas/jugador-partido/resumen-partido/${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoPorEquipo = (equipoId: string) =>
  (isValidObjectId(equipoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido?equipo=${equipoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoManualPorEquipo = (equipoId: string) =>
  (isValidObjectId(equipoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido-manual?equipo=${equipoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoPorPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoManualPorPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido-manual?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoPorJugadorPartido = (jugadorPartidoId: string) =>
  (isValidObjectId(jugadorPartidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido?jugadorPartido=${jugadorPartidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorPartidoManualPorJugadorPartido = (jugadorPartidoId: string) =>
  (isValidObjectId(jugadorPartidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-partido-manual?jugadorPartido=${jugadorPartidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const getEstadisticasJugadorSetPorPartido = (partidoId: string) =>
  (isValidObjectId(partidoId)
    ? authFetch<EstadisticaManualJugador[]>(`/estadisticas/jugador-set?partido=${partidoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const guardarEstadisticaJugadorPartido = (payload: EstadisticaJugadorPartidoPayload) =>
  authFetch('/estadisticas/jugador-partido', {
    method: 'POST',
    body: payload,
  });

export const actualizarEstadisticaJugadorPartido = (
  id: string,
  payload: EstadisticaJugadorPartidoPayload,
) =>
  authFetch(`/estadisticas/jugador-partido/${id}`, {
    method: 'PUT',
    body: payload,
  });

export const guardarEstadisticaManualJugadorPartido = (payload: EstadisticaJugadorPartidoPayload) =>
  authFetch('/estadisticas/jugador-partido-manual', {
    method: 'POST',
    body: payload,
  });

export const actualizarEstadisticaManualJugadorPartido = (
  id: string,
  payload: EstadisticaJugadorPartidoPayload,
) =>
  authFetch(`/estadisticas/jugador-partido-manual/${id}`, {
    method: 'PUT',
    body: payload,
  });

export const recalcularEstadisticasEquipoPartido = (partidoId: string, equipoId: string) =>
  authFetch('/estadisticas/equipo-partido/actualizar', {
    method: 'POST',
    body: {
      partidoId,
      equipoId,
      creadoPor: 'usuario',
    },
  });
