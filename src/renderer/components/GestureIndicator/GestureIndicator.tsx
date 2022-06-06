/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Gesture } from 'renderer/GesturePrediction';

import EmojiOne from '../../../../assets/emoji-one.svg';
import EmojiTwo from '../../../../assets/emoji-two.svg';
import EmojiThree from '../../../../assets/emoji-three.svg';
import EmojiFour from '../../../../assets/emoji-four.svg';
import EmojiLeftHand from '../../../../assets/emoji-left-hand.svg';
import EmojiRightHand from '../../../../assets/emoji-right-hand.svg';
import SwipeUp from '../../../../assets/swipe-up.svg';

import './GestureIndicator.scss';

export type GestureIndicatorProps = {
  gesture: Gesture;
  text?: string;
};

const getGestureIcon = (gesture: Gesture): string => {
  switch (gesture) {
    case Gesture.leftPalm:
      return EmojiLeftHand;
    case Gesture.rightPalm:
      return EmojiRightHand;
    case Gesture.swipeUp:
      return SwipeUp;
    case Gesture.one:
      return EmojiOne;
    case Gesture.two:
      return EmojiTwo;
    case Gesture.three:
      return EmojiThree;
    case Gesture.four:
      return EmojiFour;
    default:
      return '';
  }
};

const GestureIndicator = ({ gesture, text }: GestureIndicatorProps) => {
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div className="gesture-indicator">
      {text && <h1 className="gesture-additional-text">{text}</h1>}
      <img src={getGestureIcon(gesture)} alt="gesture-icon" />
      <h1 className="gesture-text">{gesture}</h1>
    </div>
  );
};

GestureIndicator.defaultProps = {
  text: '',
};

export default GestureIndicator;
