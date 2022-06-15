/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AppActionType,
  AppInstance,
  LayoutApps,
  useApps,
} from 'renderer/AppStore';
import {
  GestureCallback,
  Hand,
  Sign,
  useGestures,
} from 'renderer/GesturePrediction';
import GestureIndicator from 'renderer/components/GestureIndicator';
import { computeLayout } from 'renderer/utils';

import './LayoutMode.scss';

export type LayoutModePreviewProps = { onClose: VoidFunction };

const LayoutModePreview: FC<LayoutModePreviewProps> = ({ onClose }) => {
  const gestures = useGestures();
  const [apps, appDispatch] = useApps();

  const [blocks, setBlocks] = useState<number>(1);
  const [configuration, setConfiguration] = useState<number>(0);
  const [assignedApps, setAssignedApps] = useState<{
    [letter in string]: AppInstance;
  }>({});

  const [voiceActive, setVoiceActive] = useState(false);
  const voiceActiveRef = useRef(voiceActive);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  const { layout } = apps;

  const applyLayout = useCallback(() => {
    if (Object.keys(assignedApps).length < blocks) return;

    // eslint-disable-next-line no-console
    console.debug('Apply layout', assignedApps);

    const layoutApps: LayoutApps = {};
    for (const letter of Object.keys(assignedApps)) {
      const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
      // eslint-disable-next-line no-continue
      if (index + 1 > blocks) continue;

      const appId = assignedApps[letter].id;
      layoutApps[appId] = index;
    }

    appDispatch({
      type: AppActionType.changeLayout,
      payload: { apps: layoutApps, blocks, configuration },
    });

    onClose();
  }, [appDispatch, assignedApps, blocks, configuration, onClose]);

  const assignApp = useCallback(
    (appIndex: number, letter: string) => {
      if (!['A', 'B', 'C', 'D'].includes(letter.toUpperCase())) return;
      if (letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1 > blocks) return;
      if (appIndex > apps.history.length) return;
      const app = apps.history[appIndex - 1];
      // eslint-disable-next-line no-console
      console.debug('Assigning', app.name, 'to', letter);
      setAssignedApps((prev) => ({ ...prev, [letter]: app }));
    },
    [apps.history, blocks]
  );

  useEffect(() => {
    const onSwipeUp = () => applyLayout();
    gestures.on({ hand: Hand.right, sign: Sign.swipeUp }, onSwipeUp);

    return () =>
      gestures.off({ hand: Hand.right, sign: Sign.swipeUp }, onSwipeUp);
  }, [gestures, applyLayout]);

  useEffect(() => {
    if (!layout) return;

    const newAssignedApps: { [letter in string]: AppInstance } = {};
    const appIds = Object.keys(layout.apps);
    for (const appId of appIds) {
      const index = layout.apps[appId];
      const letter = String.fromCharCode(index + 'A'.charCodeAt(0));
      const app = apps.history.find((element) => element.id === appId);
      if (app) newAssignedApps[letter] = app;
    }

    setAssignedApps(newAssignedApps);
    setBlocks(layout.blocks);
    setConfiguration(layout.configuration);
  }, [apps.history, layout]);

  useEffect(() => {
    const resetConfiguration = () => setConfiguration(0);

    const onOne = () => {
      setBlocks(1);
      resetConfiguration();
    };

    const onTwo = () => {
      setBlocks(2);
      resetConfiguration();
    };

    const onThree = () => {
      setBlocks(3);
      resetConfiguration();
    };

    const onFour = () => {
      setBlocks(4);
      resetConfiguration();
    };

    gestures.on({ hand: Hand.right, sign: Sign.one }, onOne);
    gestures.on({ hand: Hand.right, sign: Sign.two }, onTwo);
    gestures.on({ hand: Hand.right, sign: Sign.three }, onThree);
    gestures.on({ hand: Hand.right, sign: Sign.four }, onFour);

    const onSwipeLeft = () => setConfiguration((prev) => prev - 1);
    const onSwipeRight = () => setConfiguration((prev) => prev + 1);

    gestures.on({ hand: Hand.right, sign: Sign.swipeLeft }, onSwipeLeft);
    gestures.on({ hand: Hand.right, sign: Sign.swipeRight }, onSwipeRight);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.one }, onOne);
      gestures.off({ hand: Hand.right, sign: Sign.two }, onTwo);
      gestures.off({ hand: Hand.right, sign: Sign.three }, onThree);
      gestures.off({ hand: Hand.right, sign: Sign.four }, onFour);

      gestures.off({ hand: Hand.right, sign: Sign.swipeLeft }, onSwipeLeft);
      gestures.off({ hand: Hand.right, sign: Sign.swipeRight }, onSwipeRight);
    };
  }, [gestures]);

  useEffect(() => {
    const activateVoiceCommands = () => {
      if (voiceActiveRef.current) return;
      window.electron.ipcRenderer.sendMessage('start-speech-recognition');
      setVoiceActive(true);
    };

    const onAnyHandler: GestureCallback = (gesture) => {
      if (
        voiceActiveRef.current &&
        gesture.hand === Hand.right &&
        gesture.sign !== Sign.palm
      ) {
        window.electron.ipcRenderer.sendMessage('stop-speech-recognition');
        setVoiceActive(false);
      }
    };

    const speechListener = (text: string) => {
      const commands = text
        .toLowerCase()
        .replace(' ', '')
        .match(/[a-d]\d/g);
      commands?.forEach((command) => {
        const letter = command.charAt(0).toUpperCase();
        const number = parseInt(command.charAt(1), 10);
        assignApp(number, letter);
      });
    };

    gestures.on({ hand: Hand.right, sign: Sign.palm }, activateVoiceCommands);
    gestures.onAny(onAnyHandler);

    window.electron.ipcRenderer.on(
      'speech-preview',
      speechListener as (text: unknown) => void
    );

    return () => {
      gestures.off(
        { hand: Hand.right, sign: Sign.palm },
        activateVoiceCommands
      );
      gestures.offAny(onAnyHandler);
      window.electron.ipcRenderer.off(
        'speech-preview',
        speechListener as (text: unknown) => void
      );
    };
  }, [assignApp, gestures]);

  const gridTemplateAreas = useMemo(
    () => computeLayout(blocks, configuration),
    [blocks, configuration]
  );

  const renderAppPreview = useCallback(
    (index: number) => {
      const letter: string = String.fromCharCode(index + 'A'.charCodeAt(0));

      const assignedApp = assignedApps[letter];

      if (assignedApp)
        return (
          <div
            key={letter}
            className="layout-mode__block"
            style={{
              gridArea: `app${index + 1}`,
              backgroundColor: assignedApp.color,
            }}
          >
            <p className="layout-mode__letter">{letter}</p>
            <p className="layout-mode__app-name">{assignedApp.name}</p>
          </div>
        );

      return (
        <div
          key={letter}
          className="layout-mode__block"
          style={{ gridArea: `app${index + 1}` }}
        >
          <p className="layout-mode__letter">{letter}</p>
        </div>
      );
    },
    [assignedApps]
  );

  return (
    <div className="layout-mode__preview" style={{ gridTemplateAreas }}>
      {[...Array(blocks)].map((_, index) => renderAppPreview(index))}
      <p>Voice active: {voiceActive.toString()}</p>
    </div>
  );
};

export type LayoutModeAppProps = AppInstance & { index: number };

const LayoutModeApp: FC<LayoutModeAppProps> = ({
  index,
  color,
  name,
  icon,
}) => {
  return (
    <div className="layout-mode__app" style={{ backgroundColor: color }}>
      <img src={icon} alt={name} />
      <p>
        {name} ({index})
      </p>
    </div>
  );
};

export type LayoutModeProps = { onClose: VoidFunction };

const LayoutMode: FC<LayoutModeProps> = ({ onClose }) => {
  const gestures = useGestures();
  const [apps] = useApps();

  useEffect(() => {
    gestures.on({ hand: Hand.right, sign: Sign.swipeDown }, onClose);

    return () =>
      gestures.off({ hand: Hand.right, sign: Sign.swipeDown }, onClose);
  }, [gestures, onClose]);

  return (
    <div className="layout-mode">
      <GestureIndicator
        hand={Hand.right}
        sign={Sign.swipeUp}
        text="Change layout"
        horizontal
        hideIndication
      />
      <LayoutModePreview onClose={onClose} />
      <div className="layout-mode__apps">
        {apps.history.map(({ id, name, color, icon }, index) => (
          <LayoutModeApp
            index={index + 1}
            key={id}
            id={id}
            name={name}
            color={color}
            icon={icon}
          />
        ))}
      </div>
      <div className="layout-mode__bottom">
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeLeft}
          text="Change configuration"
          horizontal
          hideIndication
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeDown}
          text="Go Back"
          horizontal
          hideIndication
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeRight}
          text="Change configuration"
          horizontal
          hideIndication
          swap
        />
      </div>
    </div>
  );
};

export default LayoutMode;
