import { FC, useEffect, useState } from 'react';

import { AppInstanceProps } from 'renderer/AppStore';

import './TextViewer.scss';

export type TextViewerArgs = { text?: string; path?: string };

const TextViewer: FC<AppInstanceProps> = ({ args }) => {
  const { text, path } = args as TextViewerArgs;

  const [content, setContent] = useState<string>(text || '');

  useEffect(() => {
    if (text) setContent(text);
  }, [text]);

  useEffect(() => {
    if (path) {
      window.electron.ipcRenderer
        .invoke('read-file', path)
        .then((res) => setContent(res as string))
        // eslint-disable-next-line no-console
        .catch((err) => console.error(err));
    }
  }, [path]);

  return (
    <div className="text-viewer">
      {path && (
        <p className="text-viewer__path">
          <span>Path:</span> ~{path.replace('.', '🏠')}
        </p>
      )}
      <div className="text-viewer__content">
        {content.split('\n').map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={index}>{row}</p>
        ))}
      </div>
    </div>
  );
};

export default TextViewer;
