import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign } from 'renderer/GesturePrediction';

import './CommandMode.scss';

const CommandMode = () => {
  return (
    <div className="command-mode">
      <h1>Command mode</h1>
      <GestureIndicator hand={Hand.left} sign={Sign.palm} text="Go back" />
    </div>
  );
};

export default CommandMode;
