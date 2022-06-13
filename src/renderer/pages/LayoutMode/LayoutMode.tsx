/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AppActionType,
  AppInstance,
  LayoutApps,
  useApps,
} from 'renderer/AppStore';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
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

  const [tempApp, setTempApp] = useState('0');
  const [tempLetter, setTempLetter] = useState('');

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

  const gridTemplateAreas = useMemo(
    () => computeLayout(blocks, configuration),
    [blocks, configuration]
  );

  const assignApp = useCallback(() => {
    const app = apps.history[parseInt(tempApp, 10)];
    // eslint-disable-next-line no-console
    console.debug('Assigning', app.name, 'to', tempLetter);
    setAssignedApps((prev) => {
      return { ...prev, [tempLetter]: app };
    });
  }, [apps.history, tempApp, tempLetter]);

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
      <div style={{ display: 'flex' }}>
        <select
          value={tempApp}
          onChange={(e) => setTempApp(e.currentTarget.value)}
        >
          {apps.history.map((app, index) => (
            <option key={app.id} value={index}>
              {app.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Letter"
          value={tempLetter}
          onChange={(e) => setTempLetter(e.currentTarget.value)}
        />
        <button type="submit" onClick={assignApp}>
          Add
        </button>
      </div>
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
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeDown}
          text="Go Back"
          horizontal
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeRight}
          text="Change configuration"
          horizontal
          swap
        />
      </div>
    </div>
  );
};

export default LayoutMode;
