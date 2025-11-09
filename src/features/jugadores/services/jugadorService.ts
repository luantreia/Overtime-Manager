import { authFetch } from '../../../utils/authFetch';
import type { Jugador } from '../../../types';

// Normalizador ligero: respeta los datos que provienen del modelo backend.
// No fabricamos campos ni valores por defecto; simplemente garantizamos `id` y dejamos
// el resto tal cual viene (o undefined si no está presente).
const mapBackendJugador = (b: any): Jugador => {
  const id = b?._id ?? b?.id ?? '';

  return {
    id,
    nombre: b?.nombre ?? b?.alias ?? '',
    alias: b?.alias,
    fechaNacimiento: b?.fechaNacimiento ? new Date(b.fechaNacimiento).toISOString().slice(0, 10) : undefined,
    genero: b?.genero,
    foto: b?.foto,
    nacionalidad: b?.nacionalidad,
    creadoPor: b?.creadoPor,
    administradores: Array.isArray(b?.administradores) ? b.administradores : undefined,
    // legacy/optional fields
    posicion: b?.posicion,
    estado: b?.estado,
    numeroCamiseta: b?.numeroCamiseta,
    rolEnEquipo: b?.rol ?? b?.rolEnEquipo,
    rol: b?.rol ?? undefined,
    fechaInicio: b?.desde ?? b?.fechaInicio,
    fechaFin: b?.hasta ?? b?.fechaFin ?? null,
    contratoId: b?._id ?? undefined,
    edad: b?.edad,
  } as Jugador;
};

export const getJugadorById = async (id: string): Promise<Jugador> => {
  const backend = await authFetch<any>(`/jugadores/${id}`);
  return mapBackendJugador(backend);
};

export const getCurrentJugador = async (): Promise<Jugador> => {
  const backend = await authFetch<any>(`/jugadores/me`);
  return mapBackendJugador(backend);
};

export const getJugadores = async (): Promise<Jugador[]> => {
  const backend = await authFetch<any[]>(`/jugadores/admin`).catch(async () => {
    // fallback a todos si el endpoint no existe
    const all = await authFetch<any[]>(`/jugadores`);
    return all;
  });
  return (backend || []).map(mapBackendJugador);
};

export const updateJugador = async (id: string, payload: Partial<Jugador>): Promise<Jugador> => {
  const backend = await authFetch<any>(`/jugadores/${id}`, { method: 'PATCH', body: payload });
  return mapBackendJugador(backend);
};
