import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { CSSTransition } from 'react-transition-group';

import { AppInstance, useApps } from 'renderer/AppStore';
import {
  GestureCallback,
  Hand,
  Sign,
  useGestures,
} from 'renderer/GesturePrediction';
import AppWindow from 'renderer/components/AppWindow';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { computeLayout, getDateString, getTimeString } from 'renderer/utils';

import CommandMode from '../CommandMode';
import LayoutMode from '../LayoutMode';
import TaskBar from './TaskBar';

import './MainScreen.scss';

export type CommandModeWithTransitionProps = {
  show: boolean;
  onShowLayoutMode: VoidFunction;
};

const CommandModeWithTransition: FC<CommandModeWithTransitionProps> = ({
  show,
  onShowLayoutMode,
}) => {
  return (
    <CSSTransition
      in={show}
      timeout={300}
      classNames="command-mode"
      mountOnEnter
      unmountOnExit
    >
      <CommandMode onShowLayoutMode={onShowLayoutMode} />
    </CSSTransition>
  );
};

export type LayoutModeWithTransitionProps = {
  show: boolean;
  onClose: VoidFunction;
};

const LayoutModeWithTransition: FC<LayoutModeWithTransitionProps> = ({
  show,
  onClose,
}) => {
  return (
    <CSSTransition
      in={show}
      timeout={300}
      classNames="layout-mode"
      mountOnEnter
      unmountOnExit
    >
      <LayoutMode onClose={onClose} />
    </CSSTransition>
  );
};

export type MainScreenWithAppProps = {
  time: string;
  date: string;
};

const MainScreenWithApp: FC<MainScreenWithAppProps> = ({ time, date }) => {
  const [apps] = useApps();

  const gridTemplateAreas = useMemo(() => {
    if (apps.layout)
      return computeLayout(apps.layout.blocks, apps.layout.configuration);
    return '';
  }, [apps.layout]);

  const renderIfInLayout = useCallback(
    ({ id, name, icon, color, component }: AppInstance) => {
      if (apps.layout && id in apps.layout.apps)
        return (
          <AppWindow
            key={id}
            id={id}
            name={name}
            icon={icon}
            color={color}
            component={component}
            selected={id === apps.selected}
          />
        );

      return null;
    },
    [apps.layout, apps.selected]
  );

  return (
    <>
      <div className="main-screen__app-content" style={{ gridTemplateAreas }}>
        {apps.history.map(renderIfInLayout)}
      </div>
      <TaskBar time={time} date={date} />
    </>
  );
};

export type MainScreenWithoutAppProps = { time: string; date: string };

const MainScreenWithoutApp: FC<MainScreenWithoutAppProps> = ({
  time,
  date,
}) => {
  return (
    <>
      <h2>Gesture OS</h2>
      <h1>{time}</h1>
      <h2>{date}</h2>
      <div className="main-screen__content">
        <GestureIndicator
          hand={Hand.left}
          sign={Sign.palm}
          text="Command mode"
          big
        />
      </div>
    </>
  );
};

const MainScreen = () => {
  const gestures = useGestures();
  const [apps] = useApps();

  const [timeString, setTimeString] = useState('--:--');
  const [dateString, setDateString] = useState('-----, -- ----');

  const [showCommandMode, setShowCommandMode] = useState(false);
  const [showLayoutMode, setShowLayoutMode] = useState(false);

  useEffect(() => {
    const onPalm = () => {
      if (!showLayoutMode) setShowCommandMode(true);
    };
    const onAny: GestureCallback = ({ hand, sign }) => {
      if (hand === Hand.left && sign !== Sign.palm) {
        setShowLayoutMode(false);
        setShowCommandMode(false);
      }
    };

    gestures.on({ hand: Hand.left, sign: Sign.palm }, onPalm);
    gestures.onAny(onAny);

    return () => {
      gestures.off({ hand: Hand.left, sign: Sign.palm }, onPalm);
      gestures.offAny(onAny);
    };
  }, [gestures, showLayoutMode]);

  useEffect(() => {
    setTimeString(getTimeString());
    setDateString(getDateString());

    const interval = setInterval(() => {
      setTimeString(getTimeString());
      setDateString(getDateString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const onShowLayoutMode = useCallback(() => {
    setShowCommandMode(false);
    setShowLayoutMode(true);
  }, []);

  const onHideLayoutMode = useCallback(() => {
    setShowLayoutMode(false);
    setShowCommandMode(true);
  }, []);

  return (
    <div className="main-screen">
      <LayoutModeWithTransition
        show={showLayoutMode}
        onClose={onHideLayoutMode}
      />
      <CommandModeWithTransition
        show={showCommandMode}
        onShowLayoutMode={onShowLayoutMode}
      />
      {!apps.selected && (
        <MainScreenWithoutApp time={timeString} date={dateString} />
      )}
      {apps.selected && (
        <MainScreenWithApp time={timeString} date={dateString} />
      )}
    </div>
  );
};

export default MainScreen;
