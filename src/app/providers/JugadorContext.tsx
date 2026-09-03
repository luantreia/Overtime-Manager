import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { getJugadores, getCurrentJugador } from '../../features/jugadores/services/jugadorService';
import { useAuth } from './AuthContext';
import type { Jugador } from '../../types';

type JugadorContextValue = {
	jugadores: Jugador[];
	jugadorSeleccionado: Jugador | null;
	loading: boolean;
	seleccionarJugador: (jugadorId: string) => void;
	recargarJugadores: () => Promise<void>;
};

const JugadorContext = createContext<JugadorContextValue | undefined>(undefined);

const JUGADOR_STORAGE_KEY = 'overtime_jugador_actual';

export const JugadorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { token } = useAuth();
	const [jugadores, setJugadores] = useState<Jugador[]>([]);
	const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	const cargarJugadores = useCallback(async () => {
		if (!token) {
			setJugadores([]);
			setJugadorSeleccionado(null);
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			const lista = await getJugadores();
			setJugadores(lista);

			const storedId = localStorage.getItem(JUGADOR_STORAGE_KEY);
			if (storedId) {
				const matched = lista.find((j) => j.id === storedId);
				if (matched) {
					setJugadorSeleccionado(matched);
					return;
				}
			}

			// Por defecto, mostrar el perfil vinculado a la cuenta del usuario
			// en vez de forzarlo a elegirse de la lista global de jugadores.
			try {
				const propio = await getCurrentJugador();
				const matched = lista.find((j) => j.id === propio.id) ?? propio;
				setJugadorSeleccionado(matched);
				return;
			} catch {
				// Sin perfil propio vinculado (o endpoint no disponible): cae al selector manual.
			}

			setJugadorSeleccionado(lista[0] ?? null);
		} catch (error) {
			console.error('Error cargando jugadores', error);
			setJugadores([]);
			setJugadorSeleccionado(null);
		} finally {
			setLoading(false);
		}
	}, [token]);

	/**
	 * Atado al token, no a `[]`. Sin sesión no hay jugadores que pedir —y pedirlos igual es un
	 * 401 en la pantalla de login o en el canje de invitaciones—; y después de iniciar sesión
	 * esto tiene que volver a correr, cosa que con `[]` no pasaba hasta recargar la página.
	 */
	useEffect(() => {
		void cargarJugadores();
	}, [cargarJugadores]);

	const seleccionarJugador = useCallback(
		(jugadorId: string) => {
			const next = jugadores.find((j) => j.id === jugadorId) ?? null;
			setJugadorSeleccionado(next);
			if (next) {
				localStorage.setItem(JUGADOR_STORAGE_KEY, next.id);
			} else {
				localStorage.removeItem(JUGADOR_STORAGE_KEY);
			}
		},
		[jugadores]
	);

	const value = useMemo(
		() => ({ jugadores, jugadorSeleccionado, loading, seleccionarJugador, recargarJugadores: cargarJugadores }),
		[jugadores, jugadorSeleccionado, loading, seleccionarJugador, cargarJugadores]
	);

	return <JugadorContext.Provider value={value}>{children}</JugadorContext.Provider>;
};

export const useJugador = () => {
	const context = useContext(JugadorContext);
	if (!context) {
		throw new Error('useJugador debe utilizarse dentro de JugadorProvider');
	}
	return context;
};
