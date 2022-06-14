import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { WindowQueue } from './utils';

export enum Hand {
  left = 'left',
  right = 'right',
}

export enum Sign {
  palm = 'palm',
  swipeUp = 'swipe up',
  swipeLeft = 'swipe left',
  swipeRight = 'swipe right',
  swipeDown = 'swipe down',
  one = 'one',
  two = 'two',
  three = 'three',
  four = 'four',
  none = 'none',
}

export type Gesture = { hand: Hand; sign: Sign };

export type GestureCallback = (gesture: Gesture) => void;
export type CountCallback = (gesture: Gesture, count: number) => void;

export type GesturePrediction = {
  on: (gesture: Gesture, callback: GestureCallback) => void;
  onAny: (callback: GestureCallback) => void;
  onCount: (
    gesture: Gesture,
    count: number,
    onComplete: GestureCallback,
    onCountUpdate: CountCallback
  ) => void;
  off: (gesture: Gesture, callback: GestureCallback) => void;
  offAny: (callback: GestureCallback) => void;
};

export type GesturesMap = Partial<{
  [gesture in string]: Array<GestureCallback>;
}>;
export type HandPrediction = { label: Sign; confidence: number };
export type GesturePredictionType = {
  left: HandPrediction;
  right: HandPrediction;
};

const KEYBOARD_MAP: { [keyCode in string]: Gesture } = {
  a: { hand: Hand.left, sign: Sign.palm },
  d: { hand: Hand.right, sign: Sign.palm },
  1: { hand: Hand.right, sign: Sign.one },
  2: { hand: Hand.right, sign: Sign.two },
  3: { hand: Hand.right, sign: Sign.three },
  4: { hand: Hand.right, sign: Sign.four },
  ArrowUp: { hand: Hand.right, sign: Sign.swipeUp },
  ArrowDown: { hand: Hand.right, sign: Sign.swipeDown },
  ArrowLeft: { hand: Hand.right, sign: Sign.swipeLeft },
  ArrowRight: { hand: Hand.right, sign: Sign.swipeRight },
  ' ': { hand: Hand.left, sign: Sign.none },
};

export const gestureToString = (gesture: Gesture) => {
  return `${gesture.hand}_${gesture.sign}`;
};

export const GESTURE_WINDOW_SIZE = 5;

class GestureManager {
  gestureWindow = {
    [Hand.left]: new WindowQueue<Gesture>(GESTURE_WINDOW_SIZE),
    [Hand.right]: new WindowQueue<Gesture>(GESTURE_WINDOW_SIZE),
  };

  gesturesMap: GesturesMap = {};

  gestureFrequency: { [index: string]: number } = {};

  keyboardGestures = {
    [Hand.left]: { label: Sign.none, confidence: 100 },
    [Hand.right]: { label: Sign.none, confidence: 100 },
  };

  addGesture(gesture: Gesture) {
    const index = gestureToString(gesture);
    if (index in this.gestureFrequency) this.gestureFrequency[index] += 1;
    else this.gestureFrequency[index] = 1;

    if (this.gestureWindow[gesture.hand].isFull()) {
      const head = this.gestureWindow[gesture.hand].getHead();
      const headIndex = gestureToString(head);
      this.gestureFrequency[headIndex] -= 1;
    }

    this.gestureWindow[gesture.hand].enqueue(gesture);
  }

  processGesture = (prediction: GesturePredictionType) => {
    const { left, right } = prediction;
    const leftGesture = { hand: Hand.left, sign: left.label };
    const rightGesture = { hand: Hand.right, sign: right.label };

    this.addGesture(leftGesture);
    this.addGesture(rightGesture);

    const leftLabel = gestureToString(leftGesture);
    const rightLabel = gestureToString(rightGesture);

    const leftCallbacks = this.gesturesMap[leftLabel];
    if (leftCallbacks)
      leftCallbacks.forEach((callback) => callback(leftGesture));

    const rightCallbacks = this.gesturesMap[rightLabel];
    if (rightCallbacks)
      rightCallbacks.forEach((callback) => callback(rightGesture));
  };

  register = () => {
    // eslint-disable-next-line no-console
    console.debug('GestureManager registered');

    window.electron.ipcRenderer.on(
      'gesture-prediction',
      this.processGesture as (prediction: unknown) => void
    );

    window.onkeydown = (event) => {
      const code = event.key;
      const gesture = KEYBOARD_MAP[code];

      if (gesture) {
        this.keyboardGestures[gesture.hand].label = gesture.sign;
        this.processGesture(this.keyboardGestures);
      }
    };
  };

  unregister = () => {
    // eslint-disable-next-line no-console
    console.debug('GestureManager unregistered');

    window.electron.ipcRenderer.off(
      'gesture-prediction',
      this.processGesture as (prediction: unknown) => void
    );
  };

  on = (gesture: Gesture, callback: GestureCallback) => {
    const index = gestureToString(gesture);

    if (index in this.gesturesMap) this.gesturesMap[index]?.push(callback);
    else this.gesturesMap[index] = [callback];

    return callback;
  };

  off = (gesture: Gesture, callback: GestureCallback) => {
    const index = gestureToString(gesture);
    if (index in this.gesturesMap)
      this.gesturesMap[index] = this.gesturesMap[index]?.filter(
        (fn) => callback !== fn
      );
  };

  onAny = (callback: GestureCallback) => {
    Object.values(Hand).forEach((hand) =>
      Object.values(Sign).forEach((sign) => this.on({ hand, sign }, callback))
    );
    return callback;
  };

  offAny = (callback: GestureCallback) => {
    Object.values(Hand).forEach((hand) =>
      Object.values(Sign).forEach((sign) => this.off({ hand, sign }, callback))
    );
  };

  onCount = (
    gesture: Gesture,
    count: number,
    onComplete: GestureCallback,
    onCountUpdate?: CountCallback
  ) => {
    const countCallback: GestureCallback = (_gesture) => {
      const index = gestureToString(gesture);
      const frequency = this.gestureFrequency[index];
      if (onCountUpdate) onCountUpdate(_gesture, frequency);

      if (index === gestureToString(_gesture) && frequency === count)
        onComplete(_gesture);
    };

    return this.onAny(countCallback);
  };

  offCount = (gesture: Gesture, callback: GestureCallback) =>
    this.off(gesture, callback);
}

const instance = new GestureManager();
export const Context = createContext<GestureManager>(instance);

export const GestureProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  useEffect(() => {
    instance.register();

    return () => instance.unregister();
  }, []);

  return <Context.Provider value={instance}>{children}</Context.Provider>;
};

export const useGestures = () => useContext(Context);
