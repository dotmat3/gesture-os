import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { WindowQueue } from './utils';

export enum Hand {
  left = 'left',
  right = 'right',
  any = 'any',
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
  any = 'any',
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

  emulateGestureInterval: NodeJS.Timer | null = null;

  addGesture(gesture: Gesture) {
    const index = gestureToString(gesture);
    if (index in this.gestureFrequency) this.gestureFrequency[index] += 1;
    else this.gestureFrequency[index] = 1;

    if (gesture.hand !== Hand.any) {
      if (this.gestureWindow[gesture.hand].isFull()) {
        const head = this.gestureWindow[gesture.hand].getHead();
        const headIndex = gestureToString(head);
        this.gestureFrequency[headIndex] -= 1;
      }

      this.gestureWindow[gesture.hand].enqueue(gesture);
    }
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
    if (leftCallbacks && leftCallbacks.length !== 0)
      leftCallbacks[leftCallbacks.length - 1](leftGesture);

    const rightCallbacks = this.gesturesMap[rightLabel];
    if (rightCallbacks && rightCallbacks.length !== 0)
      rightCallbacks[rightCallbacks.length - 1](rightGesture);

    const anyString = gestureToString({ sign: Sign.any, hand: Hand.any });

    const anyCallbacks = this.gesturesMap[anyString];
    anyCallbacks?.forEach((cb) => {
      cb(leftGesture);
      cb(rightGesture);
    });
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

      if (gesture && gesture.hand !== Hand.any) {
        this.keyboardGestures[gesture.hand].label = gesture.sign;
      }
    };

    window.onkeyup = (event) => {
      const code = event.key;
      const gesture = KEYBOARD_MAP[code];

      if (gesture && gesture.hand !== Hand.any) {
        this.keyboardGestures[gesture.hand].label = Sign.none;
      }
    };

    this.emulateGestureInterval = setInterval(() => {
      this.processGesture(this.keyboardGestures);
    }, 1000);
  };

  unregister = () => {
    // eslint-disable-next-line no-console
    console.debug('GestureManager unregistered');

    window.electron.ipcRenderer.off(
      'gesture-prediction',
      this.processGesture as (prediction: unknown) => void
    );

    if (this.emulateGestureInterval) clearInterval(this.emulateGestureInterval);
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
    return this.on({ sign: Sign.any, hand: Hand.any }, callback);
  };

  offAny = (callback: GestureCallback) => {
    this.off({ sign: Sign.any, hand: Hand.any }, callback);
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
