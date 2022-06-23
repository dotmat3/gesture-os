import { CSSProperties, FC, useEffect, useState } from 'react';

import classNames from 'classnames';

import { useApps } from 'renderer/AppStore';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import MicIcon from '../../../../assets/mic-icon.svg';
import LeftHandIcon from '../../../../assets/white-left-hand.svg';
import RightHandIcon from '../../../../assets/white-right-hand.svg';

export type TaskBarProps = { time: string; date: string };

const TaskBar: FC<TaskBarProps> = ({ time, date }) => {
  const [apps] = useApps();
  const gestures = useGestures();

  const [leftHandActive, setLeftHandActive] = useState(false);
  const [rightHandActive, setRightHandActive] = useState(false);
  const [micActive, setMicActive] = useState(false);

  useEffect(() => {
    const onStartSpeech = () => setMicActive(true);
    const onStopSpeech = () => setMicActive(false);

    const clearStartSpeechListener = window.electron.ipcRenderer.on(
      'start-speech-signal',
      onStartSpeech
    );
    const clearStopSpeechListener = window.electron.ipcRenderer.on(
      'stop-speech-signal',
      onStopSpeech
    );

    const priority = gestures.onAny((gesture) => {
      if (gesture.hand === Hand.left)
        setLeftHandActive(gesture.sign !== Sign.none);
      if (gesture.hand === Hand.right)
        setRightHandActive(gesture.sign !== Sign.none);
    });

    return () => {
      if (clearStartSpeechListener) clearStartSpeechListener();
      if (clearStopSpeechListener) clearStopSpeechListener();

      gestures.offAny(priority);
    };
  }, [gestures]);

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
      <div className="task-bar__icons">
        <div className="task-bar__hands">
          <img
            className={classNames('task-bar__lhand', {
              active: leftHandActive,
            })}
            src={LeftHandIcon}
            alt="lhand"
          />
          <img
            className={classNames('task-bar__rhand', {
              active: rightHandActive,
            })}
            src={RightHandIcon}
            alt="rhand"
          />
        </div>
        <img
          className={classNames('task-bar__mic', { active: micActive })}
          src={MicIcon}
          alt="mic"
        />
      </div>
      <div className="date-time">
        <p>{time}</p>
        <p>{date}</p>
      </div>
    </div>
  );
};

export default TaskBar;
