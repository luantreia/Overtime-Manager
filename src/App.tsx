import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import EquipoPage from './features/equipo/pages/EquipoPage';
import PlayerProfilePage from './features/jugadores/pages/PlayerProfilePage';
import TemporadasPage from './features/competencias/pages/TemporadasPage';
import PartidosPage from './features/partidos/pages/PartidosPage';
import EstadisticasPage from './features/estadisticas/pages/EstadisticasPage';
import EntrenamientosPage from './features/entrenamientos/pages/EntrenamientosPage';
import NotificacionesPage from './features/notificaciones/pages/NotificacionesPage';
import PerfilPage from './features/perfil/pages/PerfilPage';
import LoginPage from './features/auth/pages/LoginPage';
import OlvidePasswordPage from './features/auth/pages/OlvidePasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import ClaimPage from './features/auth/pages/ClaimPage';
import ProtectedRoute from './app/routes/ProtectedRoute';
// auth not required here; routing uses `ProtectedRoute` to guard routes
import Navbar from './app/layout/Navbar';
import MobileTabBar from './app/layout/MobileTabBar';
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
          <Route path="/olvide-password" element={<OlvidePasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
            path="/entrenamientos"
            element={
              <ProtectedRoute>
                <EntrenamientosPage />
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
    <div className="flex min-h-dvh flex-col bg-slate-50 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
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

      {/* El padding inferior de arriba deja libre la barra fija de mobile: sin él tapa el final
          del contenido y el pie de página. Suma el safe-area porque la barra también lo hace. */}
      <MobileTabBar />
    </div>
    </FeatureFlagsProvider>
  );
};

export default App;
