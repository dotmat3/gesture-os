import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
export type GesturePrediction = {
  on: (gesture: Gesture, callback: GestureCallback) => void;
  onAny: (callback: GestureCallback) => void;
  off: (gesture: Gesture, callback: GestureCallback) => void;
};

export type GesturesMap = Partial<{
  [gesture in string]: Array<GestureCallback>;
}>;
export type HandPrediction = { label: Sign; confidence: number };
export type GesturePredictionType = {
  left: HandPrediction;
  right: HandPrediction;
};

const Context = createContext<GesturePrediction | null>(null);

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

const gestureToString = (gesture: Gesture) => {
  return `${gesture.hand}_${gesture.sign}`;
};

export const GestureProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const gestureContext = useRef<GesturePrediction | null>(null);

  const [gesturesMap, setGesturesMap] = useState<GesturesMap>({});

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('Register gesture listeners');

    const listener = (prediction: GesturePredictionType) => {
      const { left, right } = prediction;
      const leftLabel = `left_${left.label}`;
      const rightLabel = `right_${right.label}`;

      const leftCallbacks = gesturesMap[leftLabel];
      if (leftCallbacks)
        leftCallbacks.forEach((callback) =>
          callback({ hand: Hand.left, sign: left.label })
        );

      const rightCallbacks = gesturesMap[rightLabel];
      if (rightCallbacks)
        rightCallbacks.forEach((callback) =>
          callback({ hand: Hand.right, sign: left.label })
        );
    };
    window.electron.ipcRenderer.on(
      'gesture-prediction',
      listener as (prediction: unknown) => void
    );

    window.onkeydown = (event) => {
      const code = event.key;
      const gesture = KEYBOARD_MAP[code];
      if (gesture) {
        const callbacks = gesturesMap[gestureToString(gesture)];
        if (callbacks) callbacks.forEach((callback) => callback(gesture));
      }
    };

    return () => {
      // eslint-disable-next-line no-console
      console.debug('Cleanup!');
      window.electron.ipcRenderer.off(
        'gesture-prediction',
        listener as (prediction: unknown) => void
      );
    };
  }, [gesturesMap]);

  const on = useCallback((gesture: Gesture, callback: GestureCallback) => {
    setGesturesMap((prev) => {
      const index = gestureToString(gesture);
      if (index in prev) {
        prev[index]?.push(callback);
      } else {
        prev[index] = [callback];
      }
      return prev;
    });
  }, []);

  const off = useCallback((gesture: Gesture, callback: GestureCallback) => {
    setGesturesMap((prev) => {
      const index = gestureToString(gesture);
      if (index in prev)
        prev[index] = prev[index]?.filter((fn) => callback !== fn);
      return prev;
    });
  }, []);

  const onAny = useCallback((callback: GestureCallback) => {
    setGesturesMap((prev) => {
      Object.values(Hand).forEach((hand) => {
        Object.values(Sign).forEach((sign) => {
          const index = gestureToString({ hand, sign });
          if (index in prev) {
            prev[index]?.push(callback);
          } else {
            prev[index] = [callback];
          }
        });
      });
      return prev;
    });
  }, []);

  gestureContext.current = { on, off, onAny };

  return (
    <Context.Provider value={gestureContext.current}>
      {children}
    </Context.Provider>
  );
};

export const useGestures = (): GesturePrediction => {
  const gesturesContext = useContext(Context);
  const gestures = useMemo(() => gesturesContext, [gesturesContext]);
  if (gestures === null) throw Error('Context has not been Provided!');
  return gestures;
};
