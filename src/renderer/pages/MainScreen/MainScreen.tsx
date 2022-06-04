import { useEffect, useState } from 'react';

import GestureIndicator from '../../components/GestureIndicator';

import './MainScreen.scss';

const getTimeString = () => {
  const date = new Date();
  const h = date.getHours();
  const hh = h < 10 ? `0${h}` : h;
  const m = date.getMinutes();
  const mm = m < 10 ? `0${m}` : m;
  const s = date.getSeconds();
  const ss = s < 10 ? `0${s}` : s;

  return `${hh}:${mm}:${ss}`;
};

const getDateString = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const MainScreen = () => {
  const [timeString, setTimeString] = useState('--:--:--');
  const [dateString, setDateString] = useState('-----, -- ----');

  useEffect(() => {
    setTimeString(getTimeString());
    setDateString(getDateString());

    const interval = setInterval(() => {
      setTimeString(getTimeString());
      setDateString(getDateString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-screen">
      <h2>Gesture OS</h2>
      <h1>{timeString}</h1>
      <h2>{dateString}</h2>
      <div className="content">
        <GestureIndicator gesture="left palm" text="Command mode" />
      </div>
    </div>
  );
};

export default MainScreen;
