import React from 'react';
import { Select } from '../../../shared/components/ui';
import { useJugador } from '../../../app/providers/JugadorContext';

const PlayerSelector: React.FC = () => {
  const { jugadores, jugadorSeleccionado, seleccionarJugador } = useJugador();

  const options = [{ value: '', label: 'Seleccionar jugador' }, ...jugadores.map((j) => ({ value: j.id, label: j.nombre }))];

  return (
    <div className="block">
      <Select
        id="player-selector"
        label=""
        value={jugadorSeleccionado?.id ?? ''}
        onChange={(e) => seleccionarJugador((e.target as HTMLSelectElement).value)}
        options={options}
      />
    </div>
  );
};

export default PlayerSelector;
