import { useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { AppProvider } from 'renderer/AppStore';

import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';

import CommandMode from '../CommandMode';
import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  const gestures = useGestures();
  const [showCommandMode, setShowCommandMode] = useState(false);

  useEffect(() => {
    gestures.on({ hand: Hand.left, sign: Sign.palm }, () =>
      setShowCommandMode(true)
    );

    gestures.onAny(({ hand, sign }) => {
      if (hand === Hand.left && sign !== Sign.palm) setShowCommandMode(false);
    });
  }, [gestures]);

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainScreen />} />
        </Routes>
      </Router>
      <CSSTransition
        in={showCommandMode}
        timeout={300}
        classNames="command-mode"
        mountOnEnter
        unmountOnExit
      >
        <CommandMode onClose={() => setShowCommandMode(false)} />
      </CSSTransition>
    </AppProvider>
  );
};

export default App;
