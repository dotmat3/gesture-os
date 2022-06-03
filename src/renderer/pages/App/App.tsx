import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
