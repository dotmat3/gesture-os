import GestureIndicator from 'renderer/components/GestureIndicator';
import { Gesture } from 'renderer/GesturePrediction';

import './CommandMode.scss';

const CommandMode = () => {
  return (
    <div className="command-mode">
      <h1>Command mode</h1>
      <GestureIndicator gesture={Gesture.leftPalm} text="Go back" />
    </div>
  );
};

export default CommandMode;
