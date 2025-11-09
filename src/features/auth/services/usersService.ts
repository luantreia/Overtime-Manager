import { authFetch } from '../../../utils/authFetch';
import type { Usuario } from '../../../types';

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await authFetch<Usuario[]>('/usuarios');
  return response;
};

export const getUsuarioById = async (id: string): Promise<Usuario> => {
  const response = await authFetch<Usuario>(`/usuarios/${id}`);
  return response;
};

// Funciones para gestionar administradores de jugador
export const agregarAdminJugador = async (jugadorId: string, email: string) => {
  const response = await authFetch(`/jugadores/${jugadorId}/administradores`, {
    method: 'POST',
    body: { email },
  });
  return response;
};

export const quitarAdminJugador = async (jugadorId: string, adminId: string) => {
  const response = await authFetch(`/jugadores/${jugadorId}/administradores/${adminId}`, {
    method: 'DELETE',
  });
  return response;
};

export const getAdminsJugador = async (jugadorId: string): Promise<any[]> => {
  const response = await authFetch<any[]>(`/jugadores/${jugadorId}/administradores`);
  return response;
};

export const getAdminsEquipo = async (equipoId: string): Promise<any[]> => {
  const response = await authFetch<any[]>(`/equipos/${equipoId}/administradores`);
  return response;
};
