import type { SolicitudEdicionTipo } from '../../solicitudes/types/solicitudesEdicion';
import type { UseNotificacionesConfigResult } from '../types/notificacionesTypes';

const TIPO_CATEGORIAS: Record<string, string> = {
  // Contratos y relaciones jugador-equipo
  'jugador-equipo-crear': 'Plantilla',
  'jugador-equipo-editar': 'Plantilla',
  'jugador-equipo-eliminar': 'Plantilla',
  
  // Contratos con competencias
  'contratoEquipoCompetencia': 'Competencias',
};

const TIPO_LABELS: Record<string, string> = {
  // Contratos y relaciones jugador-equipo
  'jugador-equipo-crear': 'Agregar Jugador',
  'jugador-equipo-editar': 'Editar Jugador',
  'jugador-equipo-eliminar': 'Eliminar Jugador',
  
  // Contratos con competencias
  'contratoEquipoCompetencia': 'Equipo en Competencia',
};

/**
 * Hook de configuración para NotificacionesPanel en Overtime-Manager
 * Tipos: jugador-equipo-crear/editar/eliminar, contratoEquipoCompetencia
 */
export const useNotificacionesConfig = (): UseNotificacionesConfigResult => {
  const allowedTipos: readonly SolicitudEdicionTipo[] = [
    'jugador-equipo-crear',
    'jugador-equipo-editar',
    'jugador-equipo-eliminar',
  ];

  const categoriaDeTipo = (tipo: SolicitudEdicionTipo): string => {
    return TIPO_CATEGORIAS[tipo] || 'Otros';
  };

  const labelTipo = (tipo: SolicitudEdicionTipo): string => {
    return TIPO_LABELS[tipo] || tipo;
  };

  const categoriasDisponibles = ['Plantilla', 'Competencias', 'Otros'];

  return {
    allowedTipos,
    categoriaDeTipo,
    labelTipo,
    categoriasDisponibles,
    canApprove: true,
  };
};
