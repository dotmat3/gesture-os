import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import CommandMode from '../CommandMode';
import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/command-mode" element={<CommandMode />} />
      </Routes>
    </Router>
  );
};

export default App;
