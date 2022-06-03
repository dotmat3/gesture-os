import { useNavigate } from 'react-router-dom';

import GestureIndicator from 'renderer/components/GestureIndicator';

import './CommandMode.scss';

const CommandMode = () => {
  const navigate = useNavigate();

  return (
    <div className="command-mode">
      <h1>Command mode</h1>
      <GestureIndicator
        gesture="left palm"
        onClick={() => navigate('/')}
        text="Go back"
      />
    </div>
  );
};

export default CommandMode;
