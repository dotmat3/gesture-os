import { FC, useEffect, useState } from 'react';

import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { AppInstanceProps } from 'renderer/AppStore';
import { mod } from 'renderer/utils';

import './PhotoViewer.scss';

const IMAGES = [
  'https://freedesignfile.com/upload/2017/02/Dark-wood-background-Stock-Photo-08.jpg',
  'https://images.unsplash.com/photo-1451417379553-15d8e8f49cde?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
  'https://t3.ftcdn.net/jpg/03/48/49/76/360_F_348497628_qb3h0owAcbndYBjAVfy67zXC41EMW3xD.jpg',
];

const PhotoViewer: FC<AppInstanceProps> = ({ selected }) => {
  const gestures = useGestures();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const onLeft = () =>
      setCurrentImageIndex((prev) => mod(prev - 1, IMAGES.length));
    const onRight = () =>
      setCurrentImageIndex((prev) => mod(prev + 1, IMAGES.length));

    const cleanup = () => {
      gestures.off({ hand: Hand.right, sign: Sign.swipeLeft }, 5);
      gestures.off({ hand: Hand.right, sign: Sign.swipeRight }, 5);
    };

    if (selected) {
      gestures.on({ hand: Hand.right, sign: Sign.swipeLeft }, onLeft, 5);
      gestures.on({ hand: Hand.right, sign: Sign.swipeRight }, onRight, 5);
    }

    return cleanup;
  }, [gestures, selected]);

  return (
    <div className="photo-viewer">
      <GestureIndicator
        hand={Hand.right}
        sign={Sign.swipeLeft}
        hideIndication
      />
      <div className="photo-viewer__image">
        <img src={IMAGES[currentImageIndex]} alt="current" />
      </div>
      <GestureIndicator
        hand={Hand.right}
        sign={Sign.swipeRight}
        hideIndication
      />
    </div>
  );
};

export default PhotoViewer;
