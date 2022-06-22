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
  icon,
  color,
  selected,
  component,
  args,
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
        <img src={icon} alt="icon" />
        {name}
      </div>
      <div className="app-window__content">
        {createElement(component, { selected, args })}
      </div>
    </div>
  );
};

export default AppWindow;
