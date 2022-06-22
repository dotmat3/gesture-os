import { FC, useEffect, useRef, useState } from 'react';

import GestureIndicator from 'renderer/components/GestureIndicator';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import { AppInstanceProps } from 'renderer/AppStore';

import './VideoPlayer.scss';
import classNames from 'classnames';

export type VideoPlayerArgs = { video: string };

const VideoPlayer: FC<AppInstanceProps> = ({ selected, args }) => {
  const { video } = args as VideoPlayerArgs;

  const gestures = useGestures();

  const [fullscreen, setFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const onPlay = () => {
      if (videoRef.current) videoRef.current.play();
    };
    const onPause = () => {
      if (videoRef.current) videoRef.current.pause();
    };
    const onRequestFullscreen = () => setFullscreen(true);
    const onExitFullscreen = () => setFullscreen(false);

    const cleanup = () => {
      gestures.off({ hand: Hand.right, sign: Sign.palm }, 5);
      gestures.off({ hand: Hand.right, sign: Sign.zero }, 5);
      gestures.off({ hand: Hand.right, sign: Sign.swipeUp }, 5);
      gestures.off({ hand: Hand.right, sign: Sign.swipeDown }, 5);
    };

    if (selected) {
      gestures.on({ hand: Hand.right, sign: Sign.palm }, onPlay, 5);
      gestures.on({ hand: Hand.right, sign: Sign.zero }, onPause, 5);
      gestures.on(
        { hand: Hand.right, sign: Sign.swipeUp },
        onRequestFullscreen,
        5
      );
      gestures.on(
        { hand: Hand.right, sign: Sign.swipeDown },
        onExitFullscreen,
        5
      );
    }

    return cleanup;
  }, [gestures, selected]);

  return (
    <div className={classNames('video-player', { fullscreen })}>
      <div className="video-player__video">
        <video src={video} ref={videoRef} controls>
          <track kind="captions" />
        </video>
      </div>
      <div className="video-player__footer">
        <GestureIndicator hand={Hand.right} sign={Sign.palm} text="Play" />
        <GestureIndicator hand={Hand.right} sign={Sign.zero} text="Pause" />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeUp}
          text="Fullscreen"
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.swipeDown}
          text="Exit fullscreen"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
