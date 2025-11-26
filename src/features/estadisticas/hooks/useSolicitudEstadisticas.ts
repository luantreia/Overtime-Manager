import { useState } from 'react';
import { crearSolicitudEdicion } from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

interface SolicitudEstadisticasData {
  jugadorId: string;
  ataques: number;
  defensas: number;
  faltas: number;
  errores: number;
  puntosDeOro: number;
  minutosJugados: number;
  rol?: 'jugador' | 'shagger';
}

export const useSolicitudEstadisticas = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const solicitarRegistro = async (data: SolicitudEstadisticasData) => {
    try {
      setLoading(true);
      await crearSolicitudEdicion({
        tipo: 'solicitarEstadisticasJugador',
        entidad: data.jugadorId,
        datosPropuestos: {
          jugadorId: data.jugadorId,
          ataques: data.ataques,
          defensas: data.defensas,
          faltas: data.faltas,
          errores: data.errores,
          puntosDeOro: data.puntosDeOro,
          minutosJugados: data.minutosJugados,
          rol: data.rol || 'jugador',
        },
      });
      addToast({
        type: 'success',
        title: 'Solicitud enviada',
        message: 'Las estadísticas han sido solicitadas para registro',
      });
      return true;
    } catch (error: any) {
      console.error('Error al crear solicitud:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'No pudimos enviar la solicitud',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { solicitarRegistro, loading };
};
