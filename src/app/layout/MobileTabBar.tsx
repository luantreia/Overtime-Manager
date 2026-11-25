import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  IdentificationIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { MobileTabBar as KitMobileTabBar } from 'overtime-kit';
import { useAuth } from '../providers/AuthContext';
import { usePendientesDelJugador } from '../hooks/usePendientesDelJugador';

/**
 * Los cuatro destinos de todos los días del jugador: ver la semana, los partidos, los
 * entrenamientos y sus números. El resto queda en «Más». La barra en sí vive en overtime-kit.
 */
export default function MobileTabBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pendientes = usePendientesDelJugador();

  if (!isAuthenticated) return null;

  return (
    <KitMobileTabBar
      LinkComponent={Link}
      currentPath={pathname}
      tabs={[
        { to: '/dashboard', label: 'Inicio', icon: <HomeIcon /> },
        { to: '/partidos', label: 'Partidos', icon: <ClipboardDocumentListIcon /> },
        { to: '/entrenamientos', label: 'Entrenam.', icon: <BoltIcon /> },
        { to: '/estadisticas', label: 'Estadísticas', icon: <ChartBarIcon /> },
      ]}
      more={[
        { to: '/equipo', label: 'Equipo', icon: <UsersIcon /> },
        { to: '/jugadores', label: 'Ficha del jugador', icon: <IdentificationIcon /> },
        { to: '/competencias', label: 'Competencias', icon: <TrophyIcon /> },
        { to: '/notificaciones', label: 'Notificaciones', icon: <BellIcon />, badge: pendientes },
        { to: '/perfil', label: 'Perfil', icon: <UserCircleIcon /> },
      ]}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
}
