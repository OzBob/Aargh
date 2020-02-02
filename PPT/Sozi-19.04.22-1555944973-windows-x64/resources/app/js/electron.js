'use strict';

var _electron = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = void 0;

function createWindow() {
    // This sets the initial window size.
    // If Sozi has been opened before, the size and location will be
    // loaded from local storage in backend/Electron.js.
    mainWindow = new _electron.BrowserWindow({ width: 800, height: 600 });
    mainWindow.loadURL('file://' + __dirname + '/../index.html');

    // mainWindow.toggleDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
_electron.app.on('ready', createWindow);

// Quit when all windows are closed.
_electron.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        _electron.app.quit();
    }
});

_electron.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
