import { FC, useEffect, useMemo, useRef, useState } from 'react';

import GestureIndicator from 'renderer/components/GestureIndicator';
import {
  GestureCallback,
  Hand,
  Sign,
  useGestures,
} from 'renderer/GesturePrediction';
import { AppActionType, AppInstanceProps, useApps } from 'renderer/AppStore';

// eslint-disable-next-line import/no-cycle
import { AppTemplate, PhotoApp, TextApp, VideoApp } from 'renderer/config';
import { v4 as uuidv4 } from 'uuid';
import TextIcon from '../../../../assets/text-icon.svg';
import ImageIcon from '../../../../assets/image-icon.svg';
import VideoIcon from '../../../../assets/video-icon.svg';
import FolderIcon from '../../../../assets/folder-icon.svg';
import FileIcon from '../../../../assets/file-icon.svg';

import './FileExplorer.scss';

export enum HierarchyNodeType {
  text = 'text',
  image = 'image',
  video = 'video',
  folder = 'folder',
  file = 'file',
}

export type HierarchyNode = { name: string; type: HierarchyNodeType };

export type FileProps = { index: number } & HierarchyNode;

const getAssociatedApp = (
  path: string,
  node: HierarchyNode
): AppTemplate | null => {
  switch (node.type) {
    case HierarchyNodeType.text:
      return TextApp({ path: `${path}/${node.name}` });
    case HierarchyNodeType.image:
      return PhotoApp({
        images: [`atom://${path.replace('.', '$')}/${node.name}`],
      });
    case HierarchyNodeType.video:
      return VideoApp({
        video: `atom://${path.replace('.', '$')}/${node.name}`,
      });
    default:
      return null;
  }
};

const File: FC<FileProps> = ({ index, name, type }) => {
  const icon = useMemo(() => {
    switch (type) {
      case HierarchyNodeType.text:
        return TextIcon;
      case HierarchyNodeType.image:
        return ImageIcon;
      case HierarchyNodeType.video:
        return VideoIcon;
      case HierarchyNodeType.folder:
        return FolderIcon;
      default:
        return FileIcon;
    }
  }, [type]);

  return (
    <div className="file">
      <div className="file__index">{index}</div>
      <img className="file__icon" src={icon} alt="icon" />
      <p>{name}</p>
    </div>
  );
};

export type FileExplorerArgs = { path: string };

const FileExplorer: FC<AppInstanceProps> = ({ selected, args }) => {
  const { path } = args as FileExplorerArgs;

  const gestures = useGestures();
  const [, appDispatch] = useApps();

  const [currentPath, setCurrentPath] = useState(path);
  const [files, setFiles] = useState<Array<HierarchyNode>>([]);
  const [voiceActive, setVoiceActive] = useState(false);

  const voiceActiveRef = useRef<boolean | null>(null);
  const filesRef = useRef<Array<HierarchyNode> | null>(null);
  const currentPathRef = useRef<string | null>(null);

  const compareFiles = (a: HierarchyNode, b: HierarchyNode): number => {
    const isFolder = (node: HierarchyNode) =>
      node.type === HierarchyNodeType.folder;

    if (isFolder(a) && isFolder(b)) return a.name.localeCompare(b.name);

    if (isFolder(a)) return -1;
    if (isFolder(b)) return 1;

    return a.name.localeCompare(b.name);
  };

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('list-path', currentPath)
      .then((result) =>
        setFiles((result as Array<HierarchyNode>).sort(compareFiles))
      )
      .catch((err) => console.error(err));
  }, [currentPath]);

  useEffect(() => {
    const goBack = () =>
      setCurrentPath((prev) => {
        const index = prev.lastIndexOf('/');
        return index === -1 ? prev : prev.slice(0, index);
      });

    if (selected)
      gestures.on({ hand: Hand.right, sign: Sign.swipeUp }, goBack, 5);

    return () => {
      if (selected) gestures.off({ hand: Hand.right, sign: Sign.swipeUp }, 5);
    };
  }, [gestures, selected]);

  useEffect(() => {
    const activateVoiceCommands = () => {
      if (voiceActiveRef.current) return;
      window.electron.ipcRenderer.sendMessage('start-speech-recognition');
      setVoiceActive(true);
    };

    const onAnyHandler: GestureCallback = (gesture) => {
      if (
        voiceActiveRef.current &&
        gesture.hand === Hand.right &&
        gesture.sign !== Sign.palm
      ) {
        window.electron.ipcRenderer.sendMessage('stop-speech-recognition');
        setVoiceActive(false);
      }
    };

    const speechListener = (text: string) => {
      if (!filesRef.current || text.length !== 1) return;

      // Extract the number from the text if present
      const indexArray = text.toLowerCase().replace(' ', '').match(/\d/g);
      if (!indexArray) return;

      const index = parseInt(indexArray[0], 10);

      // If the index is not associated to any node
      if (index >= filesRef.current.length) return;

      // eslint-disable-next-line no-console
      console.debug();

      const node = filesRef.current[index];

      // eslint-disable-next-line no-console
      console.debug(`Got text "${text}" opening ${node.name}`);

      // Open the folder if the associated node is a folder
      if (node.type === HierarchyNodeType.folder)
        setCurrentPath((prev) => `${prev}/${node.name}`);
      else if (currentPathRef.current) {
        // Get the app which can be used to open the file
        const associatedApp = getAssociatedApp(currentPathRef.current, node);

        // Launch the app
        if (associatedApp) {
          appDispatch({
            type: AppActionType.open,
            payload: {
              id: uuidv4(),
              ...associatedApp,
            },
          });
        }
      }
    };

    let number: number;
    let clearSpeechRecognized: VoidFunction | undefined;
    if (selected) {
      gestures.on(
        { hand: Hand.right, sign: Sign.palm },
        activateVoiceCommands,
        5
      );
      number = gestures.onAny(onAnyHandler);

      console.log('Register speech-recognized');
      clearSpeechRecognized = window.electron.ipcRenderer.on(
        'speech-recognized',
        speechListener as (text: unknown) => void
      );
    }

    return () => {
      if (selected && number) {
        gestures.off({ hand: Hand.right, sign: Sign.palm }, 5);
        gestures.offAny(number);

        console.log('Clear speech-recognized');
        if (clearSpeechRecognized) clearSpeechRecognized();
      }
    };
  }, [appDispatch, gestures, selected]);

  return (
    <div className="file-explorer">
      <div className="file-explorer__header">
        {currentPath !== '.' && (
          <GestureIndicator
            hand={Hand.right}
            sign={Sign.swipeUp}
            text="Go back"
            hideIndication
            swap
          />
        )}
        <GestureIndicator
          hand={Hand.right}
          sign={Sign.palm}
          text="Start listening"
          hideIndication
          swap
        />
      </div>
      <p>
        <span>Path:</span> ~{currentPath.replace('.', '🏠')}
      </p>
      <div className="file-explorer__content">
        {files.map((file, index) => (
          <File
            key={file.name}
            index={index}
            name={file.name}
            type={file.type}
          />
        ))}
        {files.length === 0 && <h1>No files</h1>}
      </div>
    </div>
  );
};

export default FileExplorer;
