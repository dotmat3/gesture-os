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
  zero = 'zero',
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

export type PriorityMap = { [priority: number]: GestureCallback };
export type GesturesMap = Partial<{ [gesture: string]: PriorityMap }>;
export type HandPrediction = { label: Sign; confidence: number };
export type GesturePredictionType = {
  left: HandPrediction;
  right: HandPrediction;
};

const KEYBOARD_MAP: { [keyCode in string]: Gesture } = {
  a: { hand: Hand.left, sign: Sign.palm },
  d: { hand: Hand.right, sign: Sign.palm },
  0: { hand: Hand.right, sign: Sign.zero },
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

export const gestureToString = (gesture: Gesture) =>
  `${gesture.hand}_${gesture.sign}`;

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

  anyPriorityCounter: number = 0;

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

  getHighestPriorityCallback = (callbacks?: PriorityMap) => {
    if (callbacks) {
      const priorities = Object.keys(callbacks).map((v) => parseInt(v, 10));

      if (priorities.length !== 0) return callbacks[Math.max(...priorities)];
    }

    return null;
  };

  processGesture = (prediction: GesturePredictionType) => {
    const { left, right } = prediction;

    const leftGesture = { hand: Hand.left, sign: left.label };
    const rightGesture = { hand: Hand.right, sign: right.label };

    this.addGesture(leftGesture);
    this.addGesture(rightGesture);

    // Left gesture
    const leftLabel = gestureToString(leftGesture);
    const leftCallbacks = this.gesturesMap[leftLabel];
    const leftCallback = this.getHighestPriorityCallback(leftCallbacks);
    if (leftCallback) leftCallback(leftGesture);

    // Right gesture
    const rightLabel = gestureToString(rightGesture);
    const rightCallbacks = this.gesturesMap[rightLabel];
    const rightCallback = this.getHighestPriorityCallback(rightCallbacks);
    if (rightCallback) rightCallback(rightGesture);

    // Any gesture
    const anyString = gestureToString({ sign: Sign.any, hand: Hand.any });
    const anyCallbacks = this.gesturesMap[anyString];
    if (anyCallbacks) {
      Object.values(anyCallbacks).forEach((cb) => {
        cb(leftGesture);
        cb(rightGesture);
      });
    }
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

  on = (gesture: Gesture, callback: GestureCallback, priority: number) => {
    const index = gestureToString(gesture);

    if (index in this.gesturesMap) {
      const map = this.gesturesMap[index];
      if (map) {
        if (priority in map)
          throw new Error(
            `Priority ${priority} for gesture ${gesture.hand}-${gesture.sign} already assigned`
          );

        map[priority] = callback;
      }
    } else this.gesturesMap[index] = { [priority]: callback };

    return priority;
  };

  off = (gesture: Gesture, priority: number) => {
    const index = gestureToString(gesture);
    if (index in this.gesturesMap) {
      const map = this.gesturesMap[index];
      if (map && priority in map) delete map[priority];
    }
  };

  onAny = (callback: GestureCallback) => {
    const anyGesture = { sign: Sign.any, hand: Hand.any };
    const priority = this.anyPriorityCounter;
    this.on(anyGesture, callback, priority);
    this.anyPriorityCounter += 1;
    return priority;
  };

  offAny = (priority: number) => {
    this.off({ sign: Sign.any, hand: Hand.any }, priority);
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

  offCount = (priority: number) => this.offAny(priority);
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
