import { ComponentType } from 'react';

import PhotoViewer from 'renderer/apps/PhotoViewer';
import VideoPlayer from 'renderer/apps/VideoPlayer';
// eslint-disable-next-line import/no-cycle
import FileExplorer from 'renderer/apps/FileExplorer';
import TextViewer from 'renderer/apps/TextViewer';

import PhotoIcon from '../../assets/photo-viewer-icon.svg';
import VideoIcon from '../../assets/video-player-icon.svg';
import FileIcon from '../../assets/file-explorer-icon.svg';
import TextIcon from '../../assets/text-viewer-icon.svg';

import { AppInstanceProps } from './AppStore';
import { PhotoViewerArgs } from './apps/PhotoViewer/PhotoViewer';
import { VideoPlayerArgs } from './apps/VideoPlayer/VideoPlayer';
// eslint-disable-next-line import/no-cycle
import { FileExplorerArgs } from './apps/FileExplorer/FileExplorer';
import { TextViewerArgs } from './apps/TextViewer/TextViewer';

export type AppTemplate = {
  name: string;
  icon: string;
  color: string;
  component: ComponentType<AppInstanceProps>;
  args: { [name: string]: unknown };
};

export const PhotoApp = (args: PhotoViewerArgs): AppTemplate => ({
  name: 'Photo',
  icon: PhotoIcon,
  color: '#81C046',
  component: PhotoViewer,
  args,
});

export const VideoApp = (args: VideoPlayerArgs): AppTemplate => ({
  name: 'Video',
  icon: VideoIcon,
  color: '#DE482B',
  component: VideoPlayer,
  args,
});

export const ExplorerApp = (args: FileExplorerArgs): AppTemplate => ({
  name: 'Explorer',
  icon: FileIcon,
  color: '#3B77BC',
  component: FileExplorer,
  args,
});

export const TextApp = (args: TextViewerArgs): AppTemplate => ({
  name: 'Text',
  icon: TextIcon,
  color: '#FCCF03',
  component: TextViewer,
  args,
});

export const defaultAppsToLaunch: Array<AppTemplate> = [
  PhotoApp({
    images: [
      'https://freedesignfile.com/upload/2017/02/Dark-wood-background-Stock-Photo-08.jpg',
      'https://images.unsplash.com/photo-1451417379553-15d8e8f49cde?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
      'https://t3.ftcdn.net/jpg/03/48/49/76/360_F_348497628_qb3h0owAcbndYBjAVfy67zXC41EMW3xD.jpg',
    ],
  }),
  VideoApp({
    video:
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  }),
  ExplorerApp({ path: '.' }),
  TextApp({
    text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. In dolore quaerat, amet maiores ex autem hic a, quam molestias voluptates doloribus! Modi eos quae cum accusamus dolorem inventore consectetur deleniti.',
  }),
];
