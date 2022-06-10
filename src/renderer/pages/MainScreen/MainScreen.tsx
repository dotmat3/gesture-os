import classNames from 'classnames';
import { CSSProperties, FC, useEffect, useState } from 'react';
import { useApps } from 'renderer/AppStore';
import { Hand, Sign } from 'renderer/GesturePrediction';

import GestureIndicator from '../../components/GestureIndicator';

import './MainScreen.scss';

export type TaskBarProps = { time: string; date: string };

const TaskBar: FC<TaskBarProps> = ({ time, date }) => {
  const [apps] = useApps();

  return (
    <div className="task-bar">
      <GestureIndicator
        hand={Hand.left}
        sign={Sign.palm}
        text="Command mode"
        horizontal
      />
      <div className="task-bar__apps">
        {apps.history.map((app) => (
          <div
            className={classNames('app-icon', {
              active: app.id === apps.selected,
            })}
            style={{ '--color': app.color } as CSSProperties}
            key={app.id}
          >
            <img src={app.icon} alt="app icon" />
          </div>
        ))}
      </div>
      <div className="date-time">
        <p>{time}</p>
        <p>{date}</p>
      </div>
    </div>
  );
};

const getTimeString = () => {
  const date = new Date();
  const h = date.getHours();
  const hh = h < 10 ? `0${h}` : h;
  const m = date.getMinutes();
  const mm = m < 10 ? `0${m}` : m;

  return `${hh}:${mm}`;
};

const getDateString = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const MainScreen = () => {
  const [apps] = useApps();

  const [timeString, setTimeString] = useState('--:--');
  const [dateString, setDateString] = useState('-----, -- ----');

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

  return (
    <div className="main-screen">
      {!currentApp && (
        <>
          <h2>Gesture OS</h2>
          <h1>{timeString}</h1>
          <h2>{dateString}</h2>
          <div className="content">
            <GestureIndicator
              hand={Hand.left}
              sign={Sign.palm}
              text="Command mode"
            />
          </div>
        </>
      )}

      {currentApp && (
        <>
          <div
            className="app-content"
            style={{ backgroundColor: currentApp.color }}
          >
            <h1>{currentApp.name}</h1>
          </div>
          <TaskBar time={timeString} date={dateString} />
        </>
      )}
    </div>
  );
};

export default MainScreen;
