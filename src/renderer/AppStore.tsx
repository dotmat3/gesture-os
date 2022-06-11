import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { mod } from './utils';

export type AppInstance = {
  name: string;
  color: string;
  id: string;
  icon: string;
};

export enum AppActionType {
  open = 'open',
  close = 'close',
  select = 'select',
  selectLeft = 'select-left',
  selectRight = 'select-right',
}

export type AppAction =
  | { type: AppActionType.open; payload: AppInstance }
  | { type: AppActionType.close }
  | { type: AppActionType.select; payload: string }
  | { type: AppActionType.selectLeft }
  | { type: AppActionType.selectRight };

export type AppDispatcher = (action: AppAction) => void;
export type AppState = { history: Array<AppInstance>; selected: string | null };
export type AppContext = [AppState, AppDispatcher];

const Context = createContext<AppContext | null>(null);
const initialState: AppState = { history: [], selected: null };

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case AppActionType.open:
      return {
        history: [...state.history, action.payload],
        selected: action.payload.id,
      };
    case AppActionType.close: {
      const history = state.history.filter((app) => app.id !== state.selected);

      if (history.length === 0)
        return {
          history,
          selected: null,
        };

      const selected = history[history.length - 1].id;

      return { history, selected };
    }
    case AppActionType.select:
      return {
        ...state,
        selected: action.payload,
      };
    case AppActionType.selectLeft: {
      const { history, selected: currentAppId } = state;

      const currentAppIndex = history.findIndex(
        (app) => app.id === currentAppId
      );

      if (currentAppIndex === -1)
        throw new Error('Selected app not found in the history state');

      return {
        ...state,
        selected: history[mod(currentAppIndex - 1, history.length)].id,
      };
    }
    case AppActionType.selectRight: {
      const { history, selected: currentAppId } = state;

      const currentAppIndex = history.findIndex(
        (app) => app.id === currentAppId
      );

      if (currentAppIndex === -1)
        throw new Error('Selected app not found in the history state');

      return {
        ...state,
        selected: history[mod(currentAppIndex + 1, history.length)].id,
      };
    }
    default:
      return state;
  }
};

export const AppProvider: FC<PropsWithChildren<Record<string, unknown>>> = ({
  children,
}) => {
  const appReducer = useReducer(reducer, initialState);

  return <Context.Provider value={appReducer}> {children}</Context.Provider>;
};

export const useApps = (): AppContext => {
  const appsContext = useContext(Context);
  const apps = useMemo(() => appsContext, [appsContext]);
  if (apps === null) throw Error('Context has not been Provided!');
  return apps;
};
