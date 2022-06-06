import { useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import CommandMode from '../CommandMode';
import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  const gesturePrediction = useGestures();
  const [showCommandMode, setShowCommandMode] = useState(false);

  useEffect(() => {
    gesturePrediction.on({ hand: Hand.left, sign: Sign.palm }, () => {
      // eslint-disable-next-line no-console
      console.log('Arrivata left palm');
      setShowCommandMode(true);
    });

    gesturePrediction.onAny(({ hand, sign }) => {
      // eslint-disable-next-line no-console
      console.log('Arrivata', sign, 'with', hand, 'hand');
      if (hand === Hand.left && sign !== Sign.palm) {
        // eslint-disable-next-line no-console
        console.log('Close command mode');
        setShowCommandMode(false);
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
      >
        <CommandMode />
      </CSSTransition>
    </>
  );
};

export default App;
