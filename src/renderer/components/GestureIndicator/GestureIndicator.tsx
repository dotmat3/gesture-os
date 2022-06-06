/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Hand, Sign } from 'renderer/GesturePrediction';

import EmojiOne from '../../../../assets/emoji-one.svg';
import EmojiTwo from '../../../../assets/emoji-two.svg';
import EmojiThree from '../../../../assets/emoji-three.svg';
import EmojiFour from '../../../../assets/emoji-four.svg';
import EmojiLeftHand from '../../../../assets/emoji-left-hand.svg';
import EmojiRightHand from '../../../../assets/emoji-right-hand.svg';
import SwipeUp from '../../../../assets/swipe-up.svg';

import './GestureIndicator.scss';

export type GestureIndicatorProps = {
  hand: Hand;
  sign: Sign;
  text?: string;
};

const getGestureIcon = (hand: Hand, sign: Sign): string => {
  switch (sign) {
    case Sign.palm:
      return hand === Hand.left ? EmojiLeftHand : EmojiRightHand;
    case Sign.swipeDown:
      return SwipeUp;
    case Sign.one:
      return EmojiOne;
    case Sign.two:
      return EmojiTwo;
    case Sign.three:
      return EmojiThree;
    case Sign.four:
      return EmojiFour;
    default:
      return '';
  }
};

const GestureIndicator = ({ hand, sign, text }: GestureIndicatorProps) => {
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div className="gesture-indicator">
      {text && <h1 className="gesture-additional-text">{text}</h1>}
      <img src={getGestureIcon(hand, sign)} alt="gesture-icon" />
      <h1 className="gesture-text">
        {hand} {sign}
      </h1>
    </div>
  );
};

GestureIndicator.defaultProps = {
  text: undefined,
};

export default GestureIndicator;
