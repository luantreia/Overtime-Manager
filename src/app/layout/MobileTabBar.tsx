import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  IdentificationIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../providers/AuthContext';
import { usePendientesDelJugador } from '../hooks/usePendientesDelJugador';

type Icono = typeof HomeIcon;

/**
 * Los cuatro destinos de todos los días del jugador: ver la semana, los partidos, los
 * entrenamientos y sus números. El resto queda en «Más».
 */
const TABS_PRINCIPALES: { to: string; label: string; Icon: Icono }[] = [
  { to: '/dashboard', label: 'Inicio', Icon: HomeIcon },
  { to: '/partidos', label: 'Partidos', Icon: ClipboardDocumentListIcon },
  { to: '/entrenamientos', label: 'Entrenam.', Icon: BoltIcon },
  { to: '/estadisticas', label: 'Estadísticas', Icon: ChartBarIcon },
];

const ENLACES_MAS: { to: string; label: string; Icon: Icono }[] = [
  { to: '/equipo', label: 'Equipo', Icon: UsersIcon },
  { to: '/jugadores', label: 'Ficha del jugador', Icon: IdentificationIcon },
  { to: '/competencias', label: 'Competencias', Icon: TrophyIcon },
  { to: '/notificaciones', label: 'Notificaciones', Icon: BellIcon },
  { to: '/perfil', label: 'Perfil', Icon: UserCircleIcon },
];

/**
 * Navegación principal en mobile: barra fija abajo, al alcance del pulgar.
 *
 * Reemplaza como vía principal al menú hamburguesa del `Navbar`, que deja los enlaces detrás de un
 * botón en la esquina superior derecha, la zona más lejana del pulgar con el teléfono en una mano.
 *
 * Se oculta desde `lg`, que es donde el `Navbar` muestra su propia fila de enlaces: los dos
 * nunca se ven a la vez.
 *
 * El `pb-[env(safe-area-inset-bottom)]` no es opcional: `index.html` declara
 * `viewport-fit=cover`, así que sin él la fila de etiquetas queda debajo de la barra de gestos.
 */
export default function MobileTabBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [masAbierto, setMasAbierto] = useState(false);
  const pendientes = usePendientesDelJugador();

  // Con el panel abierto el fondo no debe scrollear por detrás. Se libera siempre al
  // desmontar, incluso si el panel quedó abierto durante una navegación.
  useEffect(() => {
    if (!masAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [masAbierto]);

  useEffect(() => {
    if (!masAbierto) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMasAbierto(false);
    };
    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, [masAbierto]);

  if (!isAuthenticated) return null;

  const claseTab = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 text-2xs font-bold [touch-action:manipulation] ${
      isActive ? 'text-brand-600' : 'text-muted'
    }`;

  return (
    <>
      {masAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setMasAbierto(false)}
        />
      )}

      {masAbierto && (
        <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg lg:hidden">
          {ENLACES_MAS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMasAbierto(false)}
              className="flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 [touch-action:manipulation] hover:bg-slate-50"
            >
              <Icon aria-hidden className="h-5 w-5 shrink-0 text-slate-500" />
              {label}
              {to === '/notificaciones' && pendientes > 0 && (
                <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-2xs font-bold text-white">
                  {pendientes}
                </span>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => {
              setMasAbierto(false);
              logout();
              navigate('/login');
            }}
            className="flex min-h-[2.75rem] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-rose-600 [touch-action:manipulation] hover:bg-rose-50"
          >
            <ArrowRightOnRectangleIcon aria-hidden className="h-5 w-5 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Navegación principal"
      >
        {TABS_PRINCIPALES.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={claseTab}>
            <Icon aria-hidden className="h-6 w-6" />
            {label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMasAbierto((v) => !v)}
          aria-expanded={masAbierto}
          className={`relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 text-2xs font-bold [touch-action:manipulation] ${
            masAbierto ? 'text-brand-600' : 'text-muted'
          }`}
        >
          <EllipsisHorizontalIcon aria-hidden className="h-6 w-6" />
          Más
          {/* Notificaciones vive dentro del panel, así que sin esta marca un pendiente nuevo no
              se vería hasta abrirlo. Es un punto y no el número: el conteo exacto está adentro,
              al lado de la sección, y acá sólo hace falta saber que hay algo. */}
          {pendientes > 0 && !masAbierto && (
            <span
              aria-label={`${pendientes} solicitudes pendientes`}
              className="absolute right-[calc(50%-1.1rem)] top-1.5 h-2 w-2 rounded-full bg-brand-600"
            />
          )}
        </button>
      </nav>
    </>
  );
}
