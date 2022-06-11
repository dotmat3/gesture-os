import { FC, useEffect } from 'react';
import { AppInstance, useApps } from 'renderer/AppStore';

import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import './LayoutMode.scss';

export type LayoutModeProps = { onClose: VoidFunction };

export type LayoutModeAppProps = AppInstance;

const LayoutModeApp: FC<LayoutModeAppProps> = ({ color, name, icon }) => {
  return (
    <div className="layout-mode__app" style={{ backgroundColor: color }}>
      <img src={icon} alt={name} />
      <p>{name}</p>
    </div>
  );
};

const LayoutMode: FC<LayoutModeProps> = ({ onClose }) => {
  const gestures = useGestures();
  const [apps] = useApps();

  useEffect(() => {
    gestures.on({ hand: Hand.right, sign: Sign.swipeDown }, onClose);

    return () =>
      gestures.off({ hand: Hand.right, sign: Sign.swipeDown }, onClose);
  });

  return (
    <div className="layout-mode">
      <div className="layout-mode__preview" />
      <div className="layout-mode__apps">
        {apps.history.map(({ id, name, color, icon }) => (
          <LayoutModeApp
            key={id}
            id={id}
            name={name}
            color={color}
            icon={icon}
          />
        ))}
      </div>
      <GestureIndicator
        hand={Hand.right}
        sign={Sign.swipeDown}
        text="Swipe down to cancel"
        hideIndication
        horizontal
      />
    </div>
  );
};

export default LayoutMode;
