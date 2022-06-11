import { CSSProperties, FC } from 'react';

import classNames from 'classnames';

import { useApps } from 'renderer/AppStore';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign } from 'renderer/GesturePrediction';

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

export default TaskBar;
