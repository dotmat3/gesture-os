import GestureIndicator from 'renderer/components/GestureIndicator';

import './CommandMode.scss';

const CommandMode = () => {
  return (
    <div className="command-mode">
      <h1>Command mode</h1>
      <GestureIndicator gesture="left palm" text="Go back" />
    </div>
  );
};

export default CommandMode;
