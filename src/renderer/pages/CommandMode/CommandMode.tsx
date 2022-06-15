import { FC, useEffect, useRef, useState } from 'react';

import { AppActionType, useApps } from 'renderer/AppStore';
import { Gesture, Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import GestureIndicator from 'renderer/components/GestureIndicator';
import Popup from 'renderer/components/Popup';

import AppLauncher from './AppLauncher';

import './CommandMode.scss';

const VoiceResult = ({ speechText }: { speechText: string }) => {
  return <h1>{speechText}</h1>;
};

export type CommandModeProps = {
  onShowLayoutMode: VoidFunction;
};

const CommandMode: FC<CommandModeProps> = ({ onShowLayoutMode }) => {
  const gestures = useGestures();
  const [apps, appDispatch] = useApps();

  const [voiceActive, setVoiceActive] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [speechText, setSpeechText] = useState('');

  const voiceActiveRef = useRef(voiceActive);
  const historyLengthRef = useRef(apps.history.length);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    historyLengthRef.current = apps.history.length;
  }, [apps.history]);

  useEffect(() => {
    const anyListener = ({ hand, sign }: Gesture): void => {
      if (!voiceActiveRef.current) return;
      if (hand === Hand.right && sign !== Sign.palm) {
        window.electron.ipcRenderer.sendMessage('stop-speech-recognition');
        setVoiceActive(false);
      }
    };

    const listener = (): void => {
      if (voiceActiveRef.current) return;
      window.electron.ipcRenderer.sendMessage('start-speech-recognition');
      setVoiceActive(true);
    };

    gestures.on({ hand: Hand.right, sign: Sign.palm }, listener);

    gestures.onAny(anyListener);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.palm }, listener);

      gestures.offAny(anyListener);
    };
  }, [gestures]);

  useEffect(() => {
    const speechListener = (text: string) => {
      setSpeechText(text);
    };

    window.electron.ipcRenderer.on(
      'speech-preview',
      speechListener as (text: unknown) => void
    );
    window.electron.ipcRenderer.on(
      'speech-recognized',
      speechListener as (text: unknown) => void
    );

    return () => {
      window.electron.ipcRenderer.off(
        'speech-preview',
        speechListener as (text: unknown) => void
      );
      window.electron.ipcRenderer.off(
        'speech-recognized',
        speechListener as (text: unknown) => void
      );
    };
  }, []);

  useEffect(() => {
    const onSwipeLeft = () => appDispatch({ type: AppActionType.selectLeft });
    const onSwipeRight = () => appDispatch({ type: AppActionType.selectRight });
    const onSwipeDown = () => setShowPopup(true);

    gestures.on({ hand: Hand.right, sign: Sign.swipeLeft }, onSwipeLeft);
    gestures.on({ hand: Hand.right, sign: Sign.swipeRight }, onSwipeRight);
    gestures.on({ hand: Hand.right, sign: Sign.swipeDown }, onSwipeDown);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.swipeLeft }, onSwipeLeft);
      gestures.off({ hand: Hand.right, sign: Sign.swipeRight }, onSwipeRight);
      gestures.off({ hand: Hand.right, sign: Sign.swipeDown }, onSwipeDown);
    };
  }, [gestures, appDispatch]);

  useEffect(() => {
    const onSwipeUp = () => {
      if (historyLengthRef.current !== 0) onShowLayoutMode();
    };

    gestures.on({ hand: Hand.right, sign: Sign.swipeUp }, onSwipeUp);

    return () =>
      gestures.off({ hand: Hand.right, sign: Sign.swipeUp }, onSwipeUp);
  }, [gestures, appDispatch, onShowLayoutMode]);

  const { history } = apps;

  return (
    <>
      <Popup
        show={showPopup}
        text="Do you want to close the current app?"
        onCancel={() => setShowPopup(false)}
        onConfirm={() => {
          // Close current application
          setShowPopup(false);
          appDispatch({ type: AppActionType.close });
        }}
      />
      <div className="command-mode">
        <div className="command-mode__header">
          <GestureIndicator
            hand={Hand.left}
            sign={Sign.palm}
            text="Go back"
            horizontal
          />
          {history.length !== 0 && (
            <GestureIndicator
              className="command-mode__swipe-up"
              hand={Hand.right}
              sign={Sign.swipeUp}
              text="Swipe up to change app layout"
              hideIndication
              swap
            />
          )}
          <GestureIndicator
            hand={Hand.right}
            sign={Sign.palm}
            text="Voice commands"
            horizontal
            swap
          />
        </div>
        <div className="command-mode__content">
          {voiceActive && <VoiceResult speechText={speechText} />}
          {!voiceActive && <AppLauncher />}
        </div>
      </div>
    </>
  );
};

export default CommandMode;
