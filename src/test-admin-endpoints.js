import { authFetch } from '../shared/utils/authFetch';

// Script para probar los endpoints de administradores
const testAdminEndpoints = async () => {
  console.log('🧪 Testing admin endpoints...');

  // Obtener un jugador de ejemplo (necesitas reemplazar con un ID real)
  const testJugadorId = '673f1b8b8f8b8f8b8f8b8f8b'; // Reemplaza con un ID real

  try {
    console.log('1. Testing getAdminsJugador...');
    const admins = await authFetch(`/jugadores/${testJugadorId}/administradores`);
    console.log('✅ getAdminsJugador response:', admins);

    if (Array.isArray(admins) && admins.length > 0) {
      console.log('2. Testing getUsuarioById for first admin...');
      const firstAdminId = admins[0];
      const user = await authFetch(`/usuarios/${firstAdminId}`);
      console.log('✅ getUsuarioById response:', user);
    } else {
      console.log('⚠️ No admins found for this player');
    }
  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  }
};

// Ejecutar el test
testAdminEndpoints();