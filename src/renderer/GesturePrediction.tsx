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

export enum Gesture {
  leftPalm = 'left palm',
  rightPalm = 'right palm',
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

export type GestureCallback = (gesture: Gesture) => void;
export type GesturePrediction = {
  on: (gesture: Gesture, callback: GestureCallback) => void;
  onAny: (callback: GestureCallback) => void;
  off: (gesture: Gesture, callback: GestureCallback) => void;
};

export type GesturesMap = Partial<{
  [gesture in Gesture]: Array<GestureCallback>;
}>;
export type GesturePredictionType = { label: Gesture; confidence: number };

const Context = createContext<GesturePrediction | null>(null);

const KEYBOARD_MAP: { [keyCode in string]: Gesture } = {
  a: Gesture.leftPalm,
  d: Gesture.rightPalm,
  1: Gesture.one,
  2: Gesture.two,
  3: Gesture.three,
  4: Gesture.four,
  ArrowUp: Gesture.swipeUp,
  ArrowDown: Gesture.swipeDown,
  ArrowLeft: Gesture.swipeLeft,
  ArrowRight: Gesture.swipeRight,
  ' ': Gesture.none,
};

export const GestureProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const gestureContext = useRef<GesturePrediction | null>(null);

  const [gesturesMap, setGesturesMap] = useState<GesturesMap>({});

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('Register gesture listeners');

    const listener = (prediction: unknown) => {
      const { label } = prediction as GesturePredictionType;
      const callbacks = gesturesMap[label];
      if (callbacks) callbacks.forEach((callback) => callback(label));
    };
    window.electron.ipcRenderer.on('gesture-prediction', listener);

    window.onkeydown = (event) => {
      const code = event.key;
      const label = KEYBOARD_MAP[code];
      if (label) {
        listener({ label, confidence: 100 });
      }
    };

    return () => {
      // eslint-disable-next-line no-console
      console.debug('Cleanup!');
      window.electron.ipcRenderer.off('gesture-prediction', listener);
    };
  }, [gesturesMap]);

  const on = useCallback((gesture: Gesture, callback: GestureCallback) => {
    setGesturesMap((prev) => {
      if (gesture in prev) {
        prev[gesture]?.push(callback);
      } else {
        prev[gesture] = [callback];
      }
      return prev;
    });
  }, []);

  const off = useCallback((gesture: Gesture, callback: GestureCallback) => {
    setGesturesMap((prev) => {
      if (gesture in prev)
        prev[gesture] = prev[gesture]?.filter((fn) => callback !== fn);
      return prev;
    });
  }, []);

  const onAny = useCallback((callback: GestureCallback) => {
    setGesturesMap((prev) => {
      Object.values(Gesture).forEach((gesture) => {
        if (gesture in prev) {
          prev[gesture]?.push(callback);
        } else {
          prev[gesture] = [callback];
        }
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
