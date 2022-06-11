import { FC, useCallback, useEffect, useState } from 'react';

import { CSSTransition } from 'react-transition-group';

import { AppInstance, useApps } from 'renderer/AppStore';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { getDateString, getTimeString } from 'renderer/utils';

import GestureIndicator from 'renderer/components/GestureIndicator';

import CommandMode from '../CommandMode';
import LayoutMode from '../LayoutMode';
import TaskBar from './TaskBar';

import './MainScreen.scss';

export type CommandModeWithTransitionProps = {
  show: boolean;
  onClose: VoidFunction;
  onShowLayoutMode: VoidFunction;
};

const CommandModeWithTransition: FC<CommandModeWithTransitionProps> = ({
  show,
  onClose,
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
      <CommandMode onClose={onClose} onShowLayoutMode={onShowLayoutMode} />
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
  currentApp: AppInstance;
  time: string;
  date: string;
};
const MainScreenWithApp: FC<MainScreenWithAppProps> = ({
  currentApp,
  time,
  date,
}) => {
  const { name, color } = currentApp;

  return (
    <>
      <div className="app-content" style={{ backgroundColor: color }}>
        <h1>{name}</h1>
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
      <div className="content">
        <GestureIndicator
          hand={Hand.left}
          sign={Sign.palm}
          text="Command mode"
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
    gestures.on({ hand: Hand.left, sign: Sign.palm }, () =>
      setShowCommandMode(true)
    );

    gestures.onAny(({ hand, sign }) => {
      if (hand === Hand.left && sign !== Sign.palm) {
        setShowLayoutMode(false);
        setShowCommandMode(false);
      }
    });
  }, [gestures]);

  useEffect(() => {
    setTimeString(getTimeString());
    setDateString(getDateString());

    const interval = setInterval(() => {
      setTimeString(getTimeString());
      setDateString(getDateString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { history } = apps;
  const currentApp = history.find((app) => app.id === apps.selected);

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
        onClose={() => setShowCommandMode(false)}
        onShowLayoutMode={onShowLayoutMode}
      />
      {!currentApp && (
        <MainScreenWithoutApp time={timeString} date={dateString} />
      )}
      {currentApp && (
        <MainScreenWithApp
          currentApp={currentApp}
          time={timeString}
          date={dateString}
        />
      )}
    </div>
  );
};

export default MainScreen;
