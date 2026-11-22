import { authFetch } from '../../../shared/utils/authFetch';
import type {
  AsistenciaEntrenamientoEstado,
  AsistenciaEntrenamientoRespuesta,
  EntrenamientoEstado,
  EntrenamientoTipo,
} from '../../../shared/types/modelos.generado';

/**
 * Entrenamientos del jugador logueado (no del "jugador seleccionado": el backend lo resuelve
 * desde el token, porque responder "voy" lo tiene que hacer la persona, no quien la administra).
 */
export interface MiEntrenamiento {
  _id: string;
  fecha: string;
  duracionMinutos?: number;
  lugar?: string;
  tipo?: EntrenamientoTipo;
  titulo?: string;
  estado: EntrenamientoEstado;
  equipo: { _id: string; nombre: string; escudo?: string } | null;
  respuesta: AsistenciaEntrenamientoRespuesta;
  respuestaMotivo: string;
  asistencia: AsistenciaEntrenamientoEstado;
}

export const getMisEntrenamientos = async (): Promise<MiEntrenamiento[]> => {
  const data = await authFetch<{ entrenamientos: MiEntrenamiento[] }>('/entrenamientos/mios');
  return data?.entrenamientos ?? [];
};

export const responderEntrenamiento = (
  id: string,
  respuesta: AsistenciaEntrenamientoRespuesta,
  motivo?: string
) =>
  authFetch<{ ok: boolean; respuesta: AsistenciaEntrenamientoRespuesta }>(
    `/entrenamientos/${id}/respuesta`,
    { method: 'PUT', body: { respuesta, motivo } }
  );

/** Se puede responder mientras la sesión no pasó y el staff no cargó asistencia. */
export const admiteRespuesta = (e: MiEntrenamiento) =>
  e.estado === 'programado' && new Date(e.fecha).getTime() > Date.now();
