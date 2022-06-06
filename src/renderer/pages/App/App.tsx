import { useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

import { Gesture, useGestures } from 'renderer/GesturePrediction';

import CommandMode from '../CommandMode';
import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  const gesturePrediction = useGestures();
  const [showCommandMode, setShowCommandMode] = useState(false);

  useEffect(() => {
    gesturePrediction.on(Gesture.leftPalm, () => {
      // eslint-disable-next-line no-console
      console.log('Arrivata left palm');
      setShowCommandMode(true);
    });

    gesturePrediction.onAny((gesture) => {
      if (gesture !== Gesture.leftPalm) {
        setShowCommandMode(false);
        // eslint-disable-next-line no-console
        console.log('Arrivata', gesture);
      }
    });
  }, [gesturePrediction]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainScreen />} />
        </Routes>
      </Router>
      <CSSTransition
        in={showCommandMode}
        timeout={300}
        classNames="command-mode"
        unmountOnExit
      >
        <CommandMode />
      </CSSTransition>
    </>
  );
};

export default App;
