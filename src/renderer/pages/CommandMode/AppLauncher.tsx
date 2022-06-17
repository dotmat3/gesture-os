import { ComponentType, FC, useEffect } from 'react';

import PhotoViewer from 'renderer/apps/PhotoViewer';
import VideoPlayer from 'renderer/apps/VideoPlayer';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { AppActionType, AppInstanceProps, useApps } from 'renderer/AppStore';

import { v4 as uuidv4 } from 'uuid';

import Icon from '../../../../assets/icon.svg';

export type AppTemplate = {
  name: string;
  icon: string;
  color: string;
  component: ComponentType<AppInstanceProps>;
};
export type AppToLaunchProps = AppTemplate & { sign: Sign };

const defaultAppsToLaunch: Array<AppTemplate> = [
  {
    name: 'Photo',
    icon: Icon,
    color: '#81C046',
    component: PhotoViewer,
  },
  {
    name: 'Video',
    icon: Icon,
    color: '#DE482B',
    component: VideoPlayer,
  },
  {
    name: 'Settings',
    icon: Icon,
    color: '#3B77BC',
    component: PhotoViewer,
  },
  {
    name: 'Calculator',
    icon: Icon,
    color: '#FCCF03',
    component: PhotoViewer,
  },
];

const AppToLaunch: FC<AppToLaunchProps> = ({
  sign,
  name,
  color,
  icon,
  component,
}) => {
  const gestures = useGestures();
  const [, appDispatch] = useApps();

  useEffect(() => {
    const onLaunch = () => {
      appDispatch({
        type: AppActionType.open,
        payload: { id: uuidv4(), name, icon, color, component },
      });
    };

    gestures.on({ hand: Hand.right, sign }, onLaunch, 10);

    return () => gestures.off({ hand: Hand.right, sign }, 10);
  }, [appDispatch, color, gestures, icon, name, sign, component]);

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
        />
      ))}
    </div>
  );
};

export default AppLauncher;
