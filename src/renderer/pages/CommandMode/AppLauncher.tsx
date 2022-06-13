import { FC, useEffect } from 'react';
import { AppActionType, useApps } from 'renderer/AppStore';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import { v4 as uuidv4 } from 'uuid';

import Icon from '../../../../assets/icon.svg';

export type AppTemplate = { name: string; icon: string; color: string };
export type AppToLaunchProps = AppTemplate & { sign: Sign };

const defaultAppsToLaunch: Array<AppTemplate> = [
  {
    name: 'Mail',
    icon: Icon,
    color: '#81C046',
  },
  {
    name: 'Browser',
    icon: Icon,
    color: '#DE482B',
  },
  {
    name: 'Settings',
    icon: Icon,
    color: '#3B77BC',
  },
  {
    name: 'Calculator',
    icon: Icon,
    color: '#FCCF03',
  },
];

const AppToLaunch: FC<AppToLaunchProps> = ({ sign, name, color, icon }) => {
  const gestures = useGestures();
  const [, appDispatch] = useApps();

  useEffect(() => {
    const onLaunch = () => {
      appDispatch({
        type: AppActionType.open,
        payload: { id: uuidv4(), name, icon, color },
      });
    };

    gestures.on({ hand: Hand.right, sign }, onLaunch);

    return () => gestures.off({ hand: Hand.right, sign }, onLaunch);
  }, [appDispatch, color, gestures, icon, name, sign]);

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
        />
      ))}
    </div>
  );
};

export default AppLauncher;
