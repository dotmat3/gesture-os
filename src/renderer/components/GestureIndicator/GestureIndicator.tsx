/* eslint-disable jsx-a11y/click-events-have-key-events */
import { FC, HTMLAttributes } from 'react';
import { Hand, Sign } from 'renderer/GesturePrediction';

import classNames from 'classnames';
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
  hideIndication?: boolean;
  horizontal?: boolean;
  swap?: boolean;
};

const getGestureIcon = (hand: Hand, sign: Sign): string => {
  switch (sign) {
    case Sign.palm:
      return hand === Hand.left ? EmojiLeftHand : EmojiRightHand;
    case Sign.swipeUp:
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

const GestureIndicator: FC<
  GestureIndicatorProps & HTMLAttributes<HTMLDivElement>
> = ({ hand, sign, text, hideIndication, className, horizontal, swap }) => {
  const rootClassName = classNames(
    'gesture-indicator',
    className,
    { horizontal },
    { swap }
  );

  if (horizontal)
    return (
      <div className={rootClassName}>
        <img
          src={getGestureIcon(hand, sign)}
          alt="gesture-icon"
          className="gesture-indicator__icon"
        />
        <div className="gesture-indicator__vbox">
          {text && <p className="gesture-indicator__additional-text">{text}</p>}
          {!hideIndication && (
            <p className="gesture-indicator__text">
              {hand} {sign}
            </p>
          )}
        </div>
      </div>
    );

  return (
    <div className={rootClassName}>
      {text && <p className="gesture-indicator__additional-text">{text}</p>}
      <img
        src={getGestureIcon(hand, sign)}
        alt="gesture-icon"
        className="gesture-indicator__icon"
      />
      {!hideIndication && (
        <p className="gesture-indicator__text">
          {hand} {sign}
        </p>
      )}
    </div>
  );
};

GestureIndicator.defaultProps = {
  text: undefined,
  hideIndication: false,
  horizontal: false,
  swap: false,
};

export default GestureIndicator;
