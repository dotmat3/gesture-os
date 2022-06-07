/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { Gesture, Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import './CommandMode.scss';

const CommandMode = () => {
  const gestures = useGestures();

  const [voiceActive, setVoiceActive] = useState<boolean>(false);

  const [speechText, setSpeechText] = useState('');

  const voiceActiveRef = useRef(voiceActive);
  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

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

  return (
    <div className="command-mode">
      <h1>Command mode</h1>
      <h2>Voice active: {voiceActive ? 'Active' : 'Not active'}</h2>
      <h3>{speechText}</h3>
      <GestureIndicator hand={Hand.left} sign={Sign.palm} text="Go back" />
    </div>
  );
};

export default CommandMode;
