import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import EquipoPage from './features/equipo/pages/EquipoPage';
import PlayerProfilePage from './features/jugadores/pages/PlayerProfilePage';
import TemporadasPage from './features/competencias/pages/TemporadasPage';
import PartidosPage from './features/partidos/pages/PartidosPage';
import EstadisticasPage from './features/estadisticas/pages/EstadisticasPage';
import NotificacionesPage from './features/notificaciones/pages/NotificacionesPage';
import PerfilPage from './features/perfil/pages/PerfilPage';
import LoginPage from './features/auth/pages/LoginPage';
import ClaimPage from './features/auth/pages/ClaimPage';
import ProtectedRoute from './app/routes/ProtectedRoute';
// auth not required here; routing uses `ProtectedRoute` to guard routes
import Navbar from './app/layout/Navbar';
import { FeatureFlagsProvider } from './shared/config/featureFlags';

/**
 * Rutas que se muestran a pantalla completa, sin navbar.
 *
 * Quien abre un link de invitación todavía no tiene cuenta: mostrarle la navegación de la app
 * —con el selector de jugador y un "Iniciar sesión" que no puede usar— es ofrecerle todo lo que
 * justamente no puede hacer todavía. El login está por el mismo motivo.
 */
const RUTAS_SIN_CHROME = ['/login', '/claim'];

const App = () => {
  const { pathname } = useLocation();
  const pantallaCompleta = RUTAS_SIN_CHROME.some((ruta) => pathname.startsWith(ruta));

  const rutas = (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Canje de invitaciones. Estaba en Overtime-Public, que no tiene sesión: el jugador
              creaba la cuenta ahí y quedaba parado en la app de los hinchas en vez de en la
              suya. Public conserva la ruta como redirección para las invitaciones ya enviadas. */}
          <Route path="/claim/:token" element={<ClaimPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipo"
            element={
              <ProtectedRoute>
                <EquipoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jugadores"
            element={
              <ProtectedRoute>
                <PlayerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competencias"
            element={
              <ProtectedRoute>
                <TemporadasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partidos"
            element={
              <ProtectedRoute>
                <PartidosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute>
                <EstadisticasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <NotificacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
  );

  if (pantallaCompleta) {
    return <FeatureFlagsProvider>{rutas}</FeatureFlagsProvider>;
  }

  return (
    <FeatureFlagsProvider>
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        {rutas}
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Overtime Dodgeball</span>
          <span>Gestión diaria para managers y staff</span>
        </div>
      </footer>
    </div>
    </FeatureFlagsProvider>
  );
};

export default App;
