import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import {
  canjearInvitacion,
  previsualizarInvitacion,
  type InvitacionPreview,
} from '../services/claimService';

const inputClass =
  'w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40';

/**
 * Mismas reglas que valida el backend en `validators/userValidator.js`. Validar acá también no
 * es duplicación por gusto: es la diferencia entre corregir mientras se escribe y enterarse
 * después de mandar el formulario.
 */
const validarPassword = (password: string): string | null => {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula';
  if (!/\d/.test(password)) return 'La contraseña debe incluir un número';
  return null;
};

/**
 * Reclamar un perfil de jugador desde el link de invitación que le manda su DT.
 *
 * Esta pantalla vivía en Overtime-Public, que es el portal de los hinchas y no tiene sesión.
 * El jugador creaba su cuenta ahí y quedaba parado en la app equivocada: terminaba en el
 * `/perfil` de Public, sin acceso a nada de lo suyo. Ahora el link cae en Manager, que es su
 * app, y al canjear entra directamente a su perfil ya con sesión abierta.
 *
 * Public conserva la ruta `/claim/:token` como redirección, porque hay invitaciones ya
 * enviadas con la URL vieja y romperlas sería romper el onboarding de gente que todavía no
 * llegó a usar el producto.
 */
const ClaimPage = () => {
  const { token } = useParams<{ token: string }>();
  const { establecerSesion } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [jugador, setJugador] = useState<InvitacionPreview | null>(null);
  const [errorPreview, setErrorPreview] = useState<string | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(true);

  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorPreview('El link de invitación está incompleto.');
      setCargandoPreview(false);
      return;
    }
    let cancelado = false;
    previsualizarInvitacion(token)
      .then(({ jugador: preview }) => {
        if (cancelado) return;
        setJugador(preview);
        // El nombre del jugador como valor inicial: casi siempre es el mismo, y escribirlo de
        // nuevo es fricción gratis en el primer contacto con la app.
        setDatos((prev) => ({ ...prev, nombre: preview.nombre ?? '' }));
      })
      .catch((err) =>
        !cancelado && setErrorPreview(err?.message || 'Esta invitación ya no es válida.'),
      )
      .finally(() => !cancelado && setCargandoPreview(false));
    return () => {
      cancelado = true;
    };
  }, [token]);

  const cambiar = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setDatos((prev) => ({ ...prev, [evento.target.name]: evento.target.value }));
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!token) return;
    setError(null);

    if (datos.password !== datos.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const errorPassword = validarPassword(datos.password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await canjearInvitacion(token, {
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        password: datos.password,
      });
      // El endpoint crea la cuenta y devuelve los tokens: se entra directo, sin pedirle al
      // jugador que inicie sesión con la contraseña que acaba de tipear.
      establecerSesion(respuesta);
      addToast({
        type: 'success',
        title: '¡Listo!',
        message: `Ya sos el dueño del perfil de ${jugador?.nombre ?? 'tu jugador'}.`,
      });
      navigate('/perfil', { replace: true });
    } catch (err) {
      const mensaje = (err as { message?: string })?.message || 'No pudimos reclamar el perfil.';
      setError(mensaje);
      addToast({ type: 'error', title: 'No se pudo reclamar', message: mensaje });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 font-bold text-white">
            OT
          </div>

          {cargandoPreview && <p className="mt-4 text-sm text-slate-200/80">Cargando invitación…</p>}

          {!cargandoPreview && errorPreview && (
            <>
              <h1 className="mt-4 text-xl font-semibold text-white">Invitación no disponible</h1>
              <p className="mt-2 text-sm text-slate-200/80">{errorPreview}</p>
              <p className="mt-4 text-xs text-slate-300/70">
                Las invitaciones vencen y son de un solo uso. Pedile a tu entrenador que te
                genere una nueva.
              </p>
            </>
          )}

          {!cargandoPreview && jugador && (
            <>
              {jugador.foto && (
                <img
                  src={jugador.foto}
                  alt={jugador.nombre}
                  className="mt-3 h-16 w-16 rounded-full object-cover"
                />
              )}
              <h1 className="mt-4 text-xl font-semibold text-white">
                Estás reclamando el perfil de {jugador.nombre}
              </h1>
              <p className="mt-1 text-sm text-slate-200/80">
                Creá tu cuenta y el perfil pasa a ser tuyo.
              </p>
            </>
          )}
        </div>

        {!cargandoPreview && jugador && (
          <form className="space-y-4" onSubmit={enviar}>
            <div>
              <label className="mb-1 block text-sm text-white" htmlFor="nombre">
                Nombre completo
              </label>
              <input
                id="nombre"
                className={inputClass}
                type="text"
                name="nombre"
                autoComplete="name"
                value={datos.nombre}
                onChange={cambiar}
                required
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={inputClass}
                type="email"
                name="email"
                autoComplete="email"
                value={datos.email}
                onChange={cambiar}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className={inputClass}
                type="password"
                name="password"
                autoComplete="new-password"
                value={datos.password}
                onChange={cambiar}
                required
                placeholder="8 caracteres, con mayúscula, minúscula y número"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white" htmlFor="confirmPassword">
                Repetir contraseña
              </label>
              <input
                id="confirmPassword"
                className={inputClass}
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={datos.confirmPassword}
                onChange={cambiar}
                required
                placeholder="La misma de arriba"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{error}</p>
            )}

            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-brand-300"
              disabled={enviando}
              type="submit"
            >
              {enviando ? 'Reclamando…' : 'Crear cuenta y reclamar perfil'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaimPage;
