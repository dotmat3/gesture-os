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
  changeLayout = 'change-layout',
}

export type AppAction =
  | { type: AppActionType.open; payload: AppInstance }
  | { type: AppActionType.close }
  | { type: AppActionType.select; payload: string }
  | { type: AppActionType.selectLeft }
  | { type: AppActionType.selectRight }
  | {
      type: AppActionType.changeLayout;
      payload: { apps: LayoutApps; blocks: number; configuration: number };
    };

export type AppDispatcher = (action: AppAction) => void;
export type LayoutApps = { [appId in string]: number };
export type Layout = {
  apps: LayoutApps;
  blocks: number;
  configuration: number;
};
export type AppState = {
  history: Array<AppInstance>;
  selected: string | null;
  layout: Layout | null;
};
export type AppContext = [AppState, AppDispatcher];

const Context = createContext<AppContext | null>(null);
const initialState: AppState = { history: [], selected: null, layout: null };

const changeApp = (state: AppState, direction: number) => {
  const { layout: currentLayout, history, selected: currentAppId } = state;

  const currentAppIndex = history.findIndex((app) => app.id === currentAppId);

  if (currentAppIndex === -1)
    throw new Error('Selected app not found in the history state');

  const selected = history[mod(currentAppIndex + direction, history.length)].id;
  const layout = { ...currentLayout } as Layout;

  if (!(selected in layout.apps) && currentAppId) {
    // Swap previous selected app with new one
    const index = layout.apps[currentAppId];
    delete layout.apps[currentAppId];
    layout.apps[selected] = index;
  }

  return {
    ...state,
    selected,
    layout,
  };
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case AppActionType.open: {
      const { id } = action.payload;

      return {
        history: [...state.history, action.payload],
        selected: id,
        layout: {
          apps: { [id]: 0 },
          blocks: 1,
          configuration: 0,
        },
      };
    }
    case AppActionType.close: {
      const history = state.history.filter((app) => app.id !== state.selected);

      if (history.length === 0)
        return {
          layout: null,
          history,
          selected: null,
        };

      const { layout } = state;

      if (!layout) throw new Error('Layout undefined when closing app');

      if (Object.keys(layout.apps).length === 1) {
        const selected = history[history.length - 1].id;

        return {
          ...state,
          layout: {
            blocks: 1,
            configuration: 0,
            apps: { [selected]: 0 },
          },
          history,
          selected,
        };
      }

      const lastIndex = history
        .map((app) => app.id in layout.apps)
        .lastIndexOf(true);

      if (!state.selected)
        throw new Error('Selected undefined when closing app');

      const apps = { ...layout.apps };
      delete apps[state.selected];

      return {
        layout: { ...layout, apps },
        history,
        selected: history[lastIndex].id,
      };
    }
    case AppActionType.select:
      return {
        ...state,
        selected: action.payload,
      };
    case AppActionType.selectLeft:
      return changeApp(state, -1);
    case AppActionType.selectRight:
      return changeApp(state, 1);
    case AppActionType.changeLayout: {
      const { selected } = state;

      if (selected && !(selected in action.payload.apps)) {
        const result = Object.entries(action.payload.apps).find(
          ([, index]) => index === 0
        );
        if (result)
          return { ...state, selected: result[0], layout: action.payload };

        const appId = Object.keys(action.payload.apps)[0];
        return { ...state, selected: appId, layout: action.payload };
      }

      return { ...state, layout: action.payload };
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
