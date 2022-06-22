import { FC, useEffect, useRef, useState } from 'react';

import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { AppInstanceProps } from 'renderer/AppStore';
import { mod } from 'renderer/utils';

import './PhotoViewer.scss';

export type PhotoViewerArgs = { images: Array<string> };

const PhotoViewer: FC<AppInstanceProps> = ({ selected, args }) => {
  const { images } = args as PhotoViewerArgs;

  const gestures = useGestures();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const numImagesRef = useRef(images.length);

  useEffect(() => {
    numImagesRef.current = images.length;
  }, [images]);

  useEffect(() => {
    const onLeft = () =>
      setCurrentImageIndex((prev) => mod(prev - 1, numImagesRef.current));
    const onRight = () =>
      setCurrentImageIndex((prev) => mod(prev + 1, numImagesRef.current));

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
      {images.length > 1 && (
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeLeft}
          hideIndication
        />
      )}
      <div className="photo-viewer__image">
        <img src={images[currentImageIndex]} alt="current" />
      </div>
      {images.length > 1 && (
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeRight}
          hideIndication
        />
      )}
    </div>
  );
};

export default PhotoViewer;
