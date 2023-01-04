const {getAuthenticatedFetch} = require("./lib/client-credentials");
const {menubar} = require('menubar');
const path = require("path");
const fsExtra = require("fs-extra");
const {removeToday, getAllDates, getVacationsToday} = require("./lib/utils");
const {ipcMain} = require('electron');

main();

async function main() {
  const mb = menubar({
    showDockIcon: false,
    icon: path.join(process.cwd(), 'icon.png'),
    browserWindow: {
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      }
    }
  });

  mb.on('ready', async () => {
    let upcoming;
    let vacationsToday;
    console.log('app is ready');
    ipcMain.handle('upcoming', () => upcoming);
    ipcMain.handle('vacationsToday', () => vacationsToday);

    const configFilePath = path.join(process.cwd(), 'config.json');
    const {vacations} = await fsExtra.readJson(configFilePath);
    const fetch = await getAuthenticatedFetch(configFilePath);
    const data = await getAllDates(vacations, fetch);
    upcoming = data;
    console.log(data);
    vacationsToday = getVacationsToday(data)
    console.log(vacationsToday);
    removeToday(upcoming);
  });

  mb.on('after-create-window', () => {
    const mainWindow = mb.window;
  });

  mb.once('show', function () {
    //mb.window.openDevTools();
  });
}

