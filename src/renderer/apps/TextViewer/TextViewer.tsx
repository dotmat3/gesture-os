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
        .catch((err) => console.error(err));
    }
  }, [path]);

  return (
    <div className="text-viewer">
      {path && (
        <p>
          <span>Path:</span> ~{path.replace('.', '🏠')}
        </p>
      )}
      <p className="text-viewer__content">{content}</p>
    </div>
  );
};

export default TextViewer;
