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

  let dataUpdated = false;

  mb.on('ready', async () => {
    let upcoming = undefined;
    let vacationsToday = undefined;
    console.log('app is ready');
    ipcMain.handle('upcoming', () => upcoming);
    ipcMain.handle('vacationsToday', () => vacationsToday);

    const configFilePath = path.join(process.cwd(), 'config.json');
    const {vacations} = await fsExtra.readJson(configFilePath);
    const fetch = await getAuthenticatedFetch(configFilePath);

    const result = await getLatestData(fetch, vacations);
    upcoming = result.upcoming;
    vacationsToday = result.vacationsToday;

    if (!mb.window) {
      dataUpdated = true;
    } else {
      mb.window.webContents.send('dataUpdated', true);
    }

    setInterval(async () => {
      const result = await getLatestData(fetch, vacations);
      upcoming = result.upcoming;
      vacationsToday = result.vacationsToday;
      mb.window.webContents.send('dataUpdated', true);
    }, 30*60*1000, fetch, vacations);
  });

  mb.on('after-create-window', () => {
    const mainWindow = mb.window;

    if (dataUpdated) {
      mainWindow.webContents.send('dataUpdated', true);
    }
  });

  mb.once('show', function () {
    //mb.window.openDevTools();
  });
}

async function getLatestData(fetch, vacations) {
  if (!fetch || !vacations) {
    throw new Error('Function getLatestData does not have all parameters.');
  }

  console.log('Getting latest data...');
  const data = await getAllDates(vacations, fetch);
  const upcoming = data;
  console.log(data);
  const vacationsToday = getVacationsToday(data)
  console.log(vacationsToday);
  removeToday(upcoming);

  return {upcoming, vacationsToday};
}

