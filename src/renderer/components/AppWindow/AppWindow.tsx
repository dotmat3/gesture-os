import classNames from 'classnames';
import { createElement, CSSProperties, FC, useMemo } from 'react';

import { AppInstance, useApps } from 'renderer/AppStore';

import './AppWindow.scss';

export type AppWindowProps = AppInstance & {
  selected: boolean;
};

const AppWindow: FC<AppWindowProps> = ({
  id,
  name,
  color,
  selected,
  component,
}) => {
  const [{ layout }] = useApps();

  const gridArea = useMemo(() => {
    if (layout) return `app${layout.apps[id] + 1}`;
    return '';
  }, [layout, id]);

  return (
    <div
      className={classNames('app-window', { selected })}
      style={{ gridArea }}
    >
      <div
        className="app-window__header"
        style={{ '--color': color } as CSSProperties}
      >
        {name}
      </div>
      <div className="app-window__content">
        {createElement(component, { selected })}
      </div>
    </div>
  );
};

export default AppWindow;
