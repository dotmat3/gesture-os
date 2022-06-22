import { FC, useEffect } from 'react';

import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { AppActionType, useApps } from 'renderer/AppStore';
import { AppTemplate, defaultAppsToLaunch } from 'renderer/config';

import { v4 as uuidv4 } from 'uuid';

export type AppToLaunchProps = AppTemplate & { sign: Sign };

const AppToLaunch: FC<AppToLaunchProps> = ({
  sign,
  name,
  color,
  icon,
  component,
  args,
}) => {
  const gestures = useGestures();
  const [, appDispatch] = useApps();

  useEffect(() => {
    const onLaunch = () => {
      appDispatch({
        type: AppActionType.open,
        payload: { id: uuidv4(), name, icon, color, component, args },
      });
    };

    gestures.on({ hand: Hand.right, sign }, onLaunch, 10);

    return () => gestures.off({ hand: Hand.right, sign }, 10);
  }, [appDispatch, color, gestures, icon, name, sign, component, args]);

  return (
    <div className="application">
      <p className="application__name">{name}</p>
      <div className="application__icon" style={{ backgroundColor: color }}>
        <img src={icon} alt="icon" />
      </div>
      <GestureIndicator hand={Hand.right} sign={sign} />
    </div>
  );
};

const SIGNS = [Sign.one, Sign.two, Sign.three, Sign.four];

const AppLauncher = () => {
  return (
    <div className="application-launcher">
      {defaultAppsToLaunch.map((app, index) => (
        <AppToLaunch
          key={app.name}
          sign={SIGNS[index]}
          name={app.name}
          color={app.color}
          icon={app.icon}
          component={app.component}
          args={app.args}
        />
      ))}
    </div>
  );
};

export default AppLauncher;
