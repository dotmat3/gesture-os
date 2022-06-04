import { useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Gesture } from 'renderer/components/GestureIndicator/GestureIndicator';

import CommandMode from '../CommandMode';
import MainScreen from '../MainScreen';

import './App.scss';

export type GesturePredictionType = { label: Gesture; confidence: number };

const App = () => {
  const [showCommandMode, setShowCommandMode] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.on('gesture-prediction', (prediction) => {
      const { label } = prediction as GesturePredictionType;

      if (label === 'left palm') {
        // eslint-disable-next-line no-console
        console.log('Show command mode');
        setShowCommandMode(true);
      } else {
        // eslint-disable-next-line no-console
        console.log('Hide command mode');
        setShowCommandMode(false);
      }
    });
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainScreen />} />
        </Routes>
      </Router>
      {showCommandMode && <CommandMode />}
    </>
  );
};

export default App;
