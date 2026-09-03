import { authFetch } from '../../../shared/utils/authFetch';
import type { Usuario } from '../../../shared/utils/types/types';

export type InvitacionPreview = {
  nombre: string;
  alias?: string;
  foto?: string;
};

export type ResultadoClaim = {
  accessToken: string;
  refreshToken?: string;
  user: Usuario;
};

/**
 * Canje de una invitación para reclamar un perfil de jugador.
 *
 * Las dos llamadas van sin token a propósito (`useAuth: false`): quien abre este link todavía
 * no tiene cuenta — de eso se trata. Mandar un Authorization con el token de otra sesión que
 * quedó en el navegador sería, además de inútil, confuso para el backend.
 */
export const previsualizarInvitacion = (token: string) =>
  authFetch<{ jugador: InvitacionPreview }>(`/jugadores/invitaciones/${token}`, { useAuth: false });

export const canjearInvitacion = (
  token: string,
  datos: { nombre: string; email: string; password: string },
) =>
  authFetch<ResultadoClaim>(`/jugadores/invitaciones/${token}/claim`, {
    method: 'POST',
    body: datos,
    useAuth: false,
  });
