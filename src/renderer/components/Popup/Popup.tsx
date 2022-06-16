import { FC, useEffect } from 'react';
import { Hand, Sign, useGestures } from 'renderer/GesturePrediction';
import GestureIndicator from '../GestureIndicator';

import './Popup.scss';

export type PopupProps = {
  text: string;
  onCancel: VoidFunction;
  onConfirm: VoidFunction;
};
export type ShowPopupProps = { show: boolean } & PopupProps;

const Popup: FC<PopupProps> = ({ text, onCancel, onConfirm }) => {
  const gestures = useGestures();

  useEffect(() => {
    gestures.on({ hand: Hand.right, sign: Sign.zero }, onCancel, 20);
    gestures.on({ hand: Hand.right, sign: Sign.palm }, onConfirm, 20);

    return () => {
      gestures.off({ hand: Hand.right, sign: Sign.zero }, 20);
      gestures.off({ hand: Hand.right, sign: Sign.palm }, 20);
    };
  });

  return (
    <div className="popup">
      <p>{text}</p>
      <div className="popup__btns">
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.zero}
          text="Cancel"
          big
        />
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.palm}
          text="Confirm"
          big
        />
      </div>
    </div>
  );
};

const ShowPopup: FC<ShowPopupProps> = ({ show, text, onCancel, onConfirm }) => {
  if (show)
    return <Popup text={text} onCancel={onCancel} onConfirm={onConfirm} />;

  return null;
};

export default ShowPopup;
