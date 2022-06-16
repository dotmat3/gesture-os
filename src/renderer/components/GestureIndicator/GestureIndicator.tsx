import { FC, HTMLAttributes, useEffect, useState } from 'react';

import classNames from 'classnames';

import {
  Gesture,
  GestureCallback,
  Hand,
  Sign,
  useGestures,
} from 'renderer/GesturePrediction';

import EmojiZero from '../../../../assets/emoji-zero.svg';
import EmojiOne from '../../../../assets/emoji-one.svg';
import EmojiTwo from '../../../../assets/emoji-two.svg';
import EmojiThree from '../../../../assets/emoji-three.svg';
import EmojiFour from '../../../../assets/emoji-four.svg';
import EmojiLeftHand from '../../../../assets/emoji-left-hand.svg';
import EmojiRightHand from '../../../../assets/emoji-right-hand.svg';
import SwipeUp from '../../../../assets/swipe-up.svg';
import SwipeDown from '../../../../assets/swipe-down.svg';
import SwipeLeft from '../../../../assets/swipe-left.svg';
import SwipeRight from '../../../../assets/swipe-right.svg';

import './GestureIndicator.scss';

export type GestureIndicatorProps = {
  hand: Hand;
  sign: Sign;
  text?: string;
  hideIndication?: boolean;
  horizontal?: boolean;
  swap?: boolean;
  big?: boolean;
  countRequired?: number;
  onTrigger?: GestureCallback;
};

const getGestureIcon = (hand: Hand, sign: Sign): string => {
  switch (sign) {
    case Sign.palm:
      return hand === Hand.left ? EmojiLeftHand : EmojiRightHand;
    case Sign.swipeUp:
      return SwipeUp;
    case Sign.swipeDown:
      return SwipeDown;
    case Sign.swipeLeft:
      return SwipeLeft;
    case Sign.swipeRight:
      return SwipeRight;
    case Sign.zero:
      return EmojiZero;
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
> = ({
  hand,
  sign,
  text,
  hideIndication,
  className,
  horizontal,
  swap,
  big,
  countRequired,
  onTrigger,
}) => {
  const gestures = useGestures();
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const gesture = { hand, sign };

    const onComplete = () => {
      if (onTrigger) onTrigger(gesture);
      setTimeout(() => setCurrentProgress(0), 500);
    };

    const onCountUpdate = (_gesture: Gesture, count: number) => {
      if (countRequired) setCurrentProgress((count / countRequired) * 100);
    };

    let countPriority: number | null = null;
    if (countRequired) {
      countPriority = gestures.onCount(
        gesture,
        countRequired,
        onComplete,
        onCountUpdate
      );
    }
    return () => {
      if (countPriority) gestures.offCount(countPriority);
    };
  }, [gestures, hand, countRequired, sign, onTrigger]);

  const rootClassName = classNames(
    'gesture-indicator',
    className,
    { horizontal },
    { swap },
    { big }
  );

  const ProgressComponent = (
    <div
      className="gesture-indicator__progress"
      style={{ height: `${currentProgress}%` }}
    />
  );

  const TextComponent = !hideIndication && (
    <p className="gesture-indicator__text">
      {hand} {sign}
    </p>
  );

  const IconComponent = (
    <img
      src={getGestureIcon(hand, sign)}
      alt="gesture-icon"
      className="gesture-indicator__icon"
    />
  );

  const AdditionalTextComponent = text && (
    <p className="gesture-indicator__additional-text">{text}</p>
  );

  if (horizontal)
    return (
      <div className={rootClassName}>
        {IconComponent}
        <div className="gesture-indicator__vbox">
          {AdditionalTextComponent}
          {TextComponent}
        </div>

        {ProgressComponent}
      </div>
    );

  return (
    <div className={rootClassName}>
      {AdditionalTextComponent}
      {IconComponent}
      {TextComponent}
      {ProgressComponent}
    </div>
  );
};

GestureIndicator.defaultProps = {
  text: undefined,
  hideIndication: false,
  horizontal: false,
  swap: false,
  big: false,
  countRequired: undefined,
  onTrigger: undefined,
};

export default GestureIndicator;
