import { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { useJugador } from '../providers/JugadorContext';
import { getSolicitudesEdicion } from '../../shared/features/solicitudes';

const INTERVALO_MS = 30000;

/**
 * Cuántas solicitudes de edición pendientes tocan al jugador seleccionado.
 *
 * Lo usan el `Navbar` (badge de Notificaciones) y la `MobileTabBar` (punto sobre «Más»). El
 * intervalo se comparte entre todos los consumidores: los dos están montados a la vez —se ocultan
 * por CSS según el ancho, no se desmontan—, así que un temporizador por consumidor serían dos
 * consultas cada treinta segundos para pintar el mismo número.
 */
type Escucha = (cantidad: number) => void;

const escuchas = new Set<Escucha>();
let intervalo: number | null = null;
let jugadorActivo: string | null = null;
let ultimoValor = 0;

const contar = async (jugadorId: string): Promise<number> => {
  try {
    const resp = await getSolicitudesEdicion({ estado: 'pendiente' });
    return (resp.solicitudes || []).filter((s) => {
      const dp = (s?.datosPropuestos ?? {}) as Record<string, unknown>;
      return (
        s?.entidad === jugadorId ||
        dp.jugadorId === jugadorId ||
        dp.jugador === jugadorId ||
        JSON.stringify(dp).includes(jugadorId)
      );
    }).length;
  } catch {
    return 0;
  }
};

const refrescar = async (): Promise<void> => {
  const jugadorId = jugadorActivo;
  if (!jugadorId) return;

  const cantidad = await contar(jugadorId);
  // Entre que arrancó la consulta y volvió, el usuario pudo cambiar de jugador. Publicar este
  // resultado pintaría el número del jugador anterior.
  if (jugadorActivo !== jugadorId) return;

  ultimoValor = cantidad;
  escuchas.forEach((escucha) => escucha(cantidad));
};

export const usePendientesDelJugador = (): number => {
  const { isAuthenticated } = useAuth();
  const { jugadorSeleccionado } = useJugador();
  const jugadorId = jugadorSeleccionado?.id ?? null;

  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    // Sin sesión o sin jugador no hay nada que contar, y consultar igual dispara un 401 cada
    // treinta segundos mientras el usuario mira la pantalla de login.
    if (!isAuthenticated || !jugadorId) {
      setCantidad(0);
      return;
    }

    if (jugadorActivo !== jugadorId) {
      jugadorActivo = jugadorId;
      ultimoValor = 0;
    }
    setCantidad(ultimoValor);

    escuchas.add(setCantidad);
    void refrescar();
    if (intervalo === null) {
      intervalo = window.setInterval(() => void refrescar(), INTERVALO_MS);
    }

    return () => {
      escuchas.delete(setCantidad);
      if (escuchas.size === 0 && intervalo !== null) {
        window.clearInterval(intervalo);
        intervalo = null;
      }
    };
  }, [isAuthenticated, jugadorId]);

  return cantidad;
};

export default usePendientesDelJugador;
