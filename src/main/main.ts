import { app, BrowserWindow, ipcMain, session, dialog } from 'electron';
import { join } from 'path';
import { readFileSync } from 'fs';

let mainWindow:any = null;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
    mainWindow.openDevTools();
  } else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

ipcMain.handle('open-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav'] }
    ]
  });
  return result.filePaths[0];
});

ipcMain.on('set-app-title', (event, title) => {
  mainWindow.setTitle(title);
});

ipcMain.handle('load-audio-file', (event, filePath) => {
  try {
    const data = readFileSync(filePath)
    // const audioBlob = new Blob([data], { type: 'audio/mp3' });
    // const audioUrl = URL.createObjectURL(audioBlob);
    const audioBase64 = data.toString('base64');
    const audioUrl = 'data:audio/mp3;base64,' + audioBase64;
    return audioUrl;
  } catch (err) {
    console.error('Error reading audio file', err);
    return "";
  }
});