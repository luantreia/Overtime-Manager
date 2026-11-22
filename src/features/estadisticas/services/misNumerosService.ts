import { authFetch } from '../../../shared/utils/authFetch';

/**
 * "Mis números": la planilla propia del jugador sobre sus partidos.
 * Espeja overtime/src/services/planillaJugadorService.js.
 */

export type Totales = { throws: number; hits: number; outs: number; catches: number };

export interface EquipoRef {
  _id: string;
  nombre?: string;
  escudo?: string;
}

export interface PartidoRef {
  _id: string;
  fecha: string;
  estado: string;
  equipoLocal?: EquipoRef;
  equipoVisitante?: EquipoRef;
  marcadorLocal?: number;
  marcadorVisitante?: number;
}

export interface Aporte {
  estado: 'pendiente' | 'aceptado' | 'descartado';
  equipo: string;
  fecha: string;
  motivo?: string;
}

export interface FilaMisNumeros {
  partido: PartidoRef;
  /** Lo que dice el registro oficial de la competencia. */
  oficial: Totales | null;
  /** Lo que dice la planilla de tu equipo sobre vos. */
  equipo: { planillaId: string; equipo: EquipoRef | null; estado: string; totales: Totales } | null;
  /** Lo que cargaste vos. */
  propia: { planillaId: string; totales: Totales; aporte: Aporte | null; notas: string; actualizada: string } | null;
}

export const getMisNumeros = (jugadorId: string) =>
  authFetch<FilaMisNumeros[]>(`/planillas-jugador/resumen?jugador=${jugadorId}`);

export const getPartidosDisponibles = (jugadorId: string) =>
  authFetch<Array<PartidoRef & { miEquipo: string }>>(`/planillas-jugador/partidos-disponibles?jugador=${jugadorId}`);

export const crearMiPlanilla = (partido: string, jugador: string) =>
  authFetch<{ planillaId: string; equipo: string }>('/planillas-jugador', { method: 'POST', body: { partido, jugador } });

export const guardarMisNumeros = (planillaId: string, numeros: Totales & { notas?: string }) =>
  authFetch<Totales>(`/planillas-jugador/${planillaId}/numeros`, { method: 'PUT', body: numeros });

export const eliminarMiPlanilla = (planillaId: string) =>
  authFetch<void>(`/planillas-jugador/${planillaId}`, { method: 'DELETE' });

export const aportarAlEquipo = (planillaId: string) =>
  authFetch<{ aporte: Aporte }>(`/planillas-jugador/${planillaId}/aporte`, { method: 'POST' });

export const retirarAporte = (planillaId: string) =>
  authFetch<{ aporte: null }>(`/planillas-jugador/${planillaId}/aporte`, { method: 'DELETE' });

export const CAMPOS: Array<keyof Totales> = ['throws', 'hits', 'outs', 'catches'];

export const mismosTotales = (a?: Totales | null, b?: Totales | null): boolean =>
  !!a && !!b && CAMPOS.every((c) => (a[c] || 0) === (b[c] || 0));
