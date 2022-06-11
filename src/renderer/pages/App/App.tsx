import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from 'renderer/AppStore';

import MainScreen from '../MainScreen';

import './App.scss';

const App = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainScreen />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
