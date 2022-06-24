import { FC, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';

import { AppActionType, useApps } from 'renderer/AppStore';
import { Gesture, Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import GestureIndicator from 'renderer/components/GestureIndicator';
import Popup from 'renderer/components/Popup';

import {
  DEFAULT_EXPLORER,
  DEFAULT_PHOTO,
  DEFAULT_TEXT,
  DEFAULT_VIDEO,
} from 'renderer/config';
import AppLauncher from './AppLauncher';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sound from '../../../../assets/audio-notification.mp3';
import MicIcon from '../../../../assets/mic-icon.svg';

import './CommandMode.scss';

export type VoiceResultProps = { active: boolean; speechText: string };

const VoiceResult: FC<VoiceResultProps> = ({ active, speechText }) => {
  if (speechText.trim().length === 0)
    return (
      <div className={classNames('voice-result', { active })}>
        <img src={MicIcon} alt="mic" />
        <h1>Listening...</h1>
      </div>
    );

  return (
    <div className={classNames('voice-result', { active })}>
      <h1>{speechText}</h1>
    </div>
  );
};

export type CommandModeProps = {
  onShowLayoutMode: VoidFunction;
};

const CommandMode: FC<CommandModeProps> = ({ onShowLayoutMode }) => {
  const gestures = useGestures();
  const [apps, appDispatch] = useApps();

  const [voiceActive, setVoiceActive] = useState(false);
  const [showVoiceResult, setShowVoiceResult] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [speechText, setSpeechText] = useState('');
  const [audio] = useState(new Audio(sound));

  const voiceActiveRef = useRef(voiceActive);
  const historyLengthRef = useRef(apps.history.length);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        audio.play();
      }
    };

    const listener = (): void => {
      if (voiceActiveRef.current) return;
      window.electron.ipcRenderer.sendMessage('start-speech-recognition');
      setVoiceActive(true);
      setShowVoiceResult(true);
      setSpeechText('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      audio.play();
    };

    gestures.on({ hand: Hand.right, sign: Sign.palm }, listener, 10);
    const number = gestures.onAny(anyListener);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.palm }, 10);
      gestures.offAny(number);
    };
  }, [audio, gestures]);

  useEffect(() => {
    const speechListener = (text: string) => setSpeechText(text);

    const executeCommand = (text: string) => {
      setVoiceActive(false);

      const matchStart = text.toLowerCase().match(/^start\s\w*/g);
      const matchShutdown = text.toLowerCase().match(/^shut\sdown$/g);

      let commandResolved = false;

      if (matchStart) {
        const [, appToLaunch] = matchStart[0].split(' ');
        commandResolved = true;
        switch (appToLaunch) {
          case 'photo':
            appDispatch({
              type: AppActionType.open,
              payload: { id: uuidv4(), ...DEFAULT_PHOTO },
            });
            break;
          case 'video':
            appDispatch({
              type: AppActionType.open,
              payload: { id: uuidv4(), ...DEFAULT_VIDEO },
            });
            break;
          case 'explorer':
          case 'file':
            appDispatch({
              type: AppActionType.open,
              payload: { id: uuidv4(), ...DEFAULT_EXPLORER },
            });
            break;
          case 'text':
            appDispatch({
              type: AppActionType.open,
              payload: { id: uuidv4(), ...DEFAULT_TEXT },
            });
            break;
          default:
            commandResolved = false;
        }
      }

      if (matchShutdown) {
        window.electron.ipcRenderer.sendMessage('exit');
        commandResolved = true;
      }

      if (!commandResolved)
        timeoutRef.current = setTimeout(() => setShowVoiceResult(false), 3000);
      else setShowVoiceResult(false);
    };

    const clearSpeechPreview = window.electron.ipcRenderer.on(
      'speech-preview',
      speechListener as (text: unknown) => void
    );
    const clearSpeechRecognized = window.electron.ipcRenderer.on(
      'speech-recognized',
      executeCommand as (text: unknown) => void
    );

    return () => {
      if (clearSpeechPreview) clearSpeechPreview();
      if (clearSpeechRecognized) clearSpeechRecognized();
    };
  }, [appDispatch]);

  useEffect(() => {
    const onSwipeLeft = () => appDispatch({ type: AppActionType.selectLeft });
    const onSwipeRight = () => appDispatch({ type: AppActionType.selectRight });
    const onSwipeDown = () => setShowPopup(true);

    gestures.on({ hand: Hand.right, sign: Sign.swipeLeft }, onSwipeLeft, 10);
    gestures.on({ hand: Hand.right, sign: Sign.swipeRight }, onSwipeRight, 10);
    gestures.on({ hand: Hand.right, sign: Sign.swipeDown }, onSwipeDown, 10);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.swipeLeft }, 10);
      gestures.off({ hand: Hand.right, sign: Sign.swipeRight }, 10);
      gestures.off({ hand: Hand.right, sign: Sign.swipeDown }, 10);
    };
  }, [gestures, appDispatch]);

  useEffect(() => {
    const onSwipeUp = () => {
      if (historyLengthRef.current !== 0) onShowLayoutMode();
    };

    gestures.on({ hand: Hand.right, sign: Sign.swipeUp }, onSwipeUp, 10);

    return () => gestures.off({ hand: Hand.right, sign: Sign.swipeUp }, 10);
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
              text="Change windows layout"
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
          {showVoiceResult && (
            <VoiceResult active={voiceActive} speechText={speechText} />
          )}
          {!showVoiceResult && <AppLauncher />}
        </div>
        {history.length !== 0 && (
          <div className="command-mode__footer">
            <GestureIndicator
              hand={Hand.right}
              sign={Sign.swipeLeft}
              text="Change app left"
              hideIndication
              horizontal
            />
            <GestureIndicator
              hand={Hand.right}
              sign={Sign.swipeDown}
              text="Close app"
              hideIndication
              swap
            />
            <GestureIndicator
              hand={Hand.right}
              sign={Sign.swipeRight}
              text="Change app right"
              horizontal
              hideIndication
              swap
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CommandMode;
