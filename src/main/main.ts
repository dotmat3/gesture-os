/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  ipcMain,
  protocol,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ChildProcess, spawn } from 'child_process';

import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

import fs from 'fs';
import { resolveHtmlPath } from './util';

export enum HierarchyNodeType {
  text = 'text',
  image = 'image',
  video = 'video',
  folder = 'folder',
  file = 'file',
}

export type HierarchyNode = { name: string; type: HierarchyNodeType };

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const ROOT = path.join(process.cwd(), 'GestureOSRoot');

const getType = (directory: string, filename: string) => {
  const stats = fs.lstatSync(path.join(directory, filename));
  const isDir = stats.isDirectory();

  if (isDir) return HierarchyNodeType.folder;

  switch (path.extname(filename)) {
    case '.mp4':
      return HierarchyNodeType.video;
    case '.png':
      return HierarchyNodeType.image;
    case '.txt':
      return HierarchyNodeType.text;
    default:
      return HierarchyNodeType.file;
  }
};

ipcMain.handle('list-path', (_event, args) => {
  const [relativePath] = args;
  const completePath = path.join(ROOT, relativePath);
  const result = fs.readdirSync(completePath);
  const files: Array<HierarchyNode> = [];

  result.forEach((filename) => {
    const type = getType(completePath, filename);
    files.push({ name: filename, type });
  });

  return files;
});

ipcMain.handle('read-file', (_event, args) => {
  const [relativePath] = args;
  const completePath = path.join(ROOT, relativePath);
  console.log('Reading file', completePath);
  return fs.readFileSync(completePath, { encoding: 'utf-8' });
});

ipcMain.on('exit', () => {
  console.log('Shutting down');
  app.quit();
});

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  const electronDebug = require('electron-debug');
  electronDebug({ showDevTools: false });
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.removeMenu();
  // mainWindow.fullScreen = true;

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function startSocketIOServer() {
  const expressApp = express();
  const server = http.createServer(expressApp);

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Speech

    const onStartSpeech = () => {
      console.log('Sending start speech recognition');
      if (mainWindow) mainWindow.webContents.send('start-speech-signal');
      socket.emit('start-speech-recognition');
    };
    ipcMain.on('start-speech-recognition', onStartSpeech);

    const onCancelSpeech = () => {
      console.log('Sending cancel speech recognition');
      if (mainWindow) mainWindow.webContents.send('stop-speech-signal');
      socket.emit('cancel-speech-recognition');
    };
    ipcMain.on('cancel-speech-recognition', onCancelSpeech);

    const onStopSpeech = () => {
      console.log('Sending stop speech recognition');
      if (mainWindow) mainWindow.webContents.send('stop-speech-signal');
      socket.emit('stop-speech-recognition');
    };
    ipcMain.on('stop-speech-recognition', onStopSpeech);

    socket.on('speech-recognized', (text) => {
      console.log('Received', text);
      if (mainWindow) mainWindow.webContents.send('speech-recognized', text);
    });

    socket.on('speech-preview', (text) => {
      if (mainWindow) mainWindow.webContents.send('speech-preview', text);
    });

    // Gesture
    socket.on('gesture-prediction', (prediction) => {
      if (mainWindow)
        mainWindow.webContents.send('gesture-prediction', prediction);
    });

    socket.on('python-exception', (e) => console.log(e));

    socket.on('disconnect', () => {
      console.log('A user disconnected');
      ipcMain.off('start-speech-recognition', onStartSpeech);
      ipcMain.off('cancel-speech-recognition', onCancelSpeech);
      ipcMain.off('stop-speech-recognition', onStopSpeech);
    });
  });

  server.listen(5000);

  return server;
}

app
  .whenReady()
  .then(() => {
    protocol.registerFileProtocol('atom', (request, callback) => {
      const url = request.url.substring(7).replace('$', ROOT);
      // eslint-disable-next-line promise/no-callback-in-promise
      callback({ path: url });
    });

    const socketIOServer = startSocketIOServer();
    socketIOServer.on('listening', () => {
      console.log('SocketIO server started');

      let pythonProcess: ChildProcess | null = null;

      globalShortcut.register('Ctrl+P', () => {
        if (!pythonProcess) {
          console.log('Starting python process...');
          pythonProcess = spawn('python', ['src/python/index.py']);
        } else {
          console.log('Killing python process...');
          pythonProcess.kill();
          pythonProcess = null;
        }
      });
    });

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
