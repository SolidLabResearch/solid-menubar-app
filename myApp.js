const {getAuthenticatedFetch} = require("./lib/client-credentials");
const { menubar } = require('menubar');
const path = require("path");
const fsExtra = require("fs-extra");
const {getRDFasJson, turtleToN3Store} = require("./lib/utils");
const { DataFactory } = require('n3');
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const {ipcMain} = require('electron');

main();

async function main() {
  let dates = ['2023-12-23'];
  const mb = menubar({
    showDockIcon: false,
    browserWindow: {
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      }
    }
  });

  mb.on('ready', async () => {
    console.log('app is ready');
    ipcMain.handle('dates', () => dates);
    // your app code here

    const configFilePath = path.join(process.cwd(), 'config.json');
    const {vacationUrl} = await fsExtra.readJson(configFilePath);
    const fetch = await getAuthenticatedFetch(configFilePath);
    //const data = await getRDFasJson(vacationUrl, {}, fetch);
    const response = await fetch(vacationUrl, {headers: {'accept': 'text/turtle'}});
    const store = await turtleToN3Store(await response.text());
    dates = store.getObjects(null, namedNode('https://data.knows.idlab.ugent.be/person/office/#date'), null).map(a => a.value);
    console.log(dates);
  });

  mb.on('after-create-window', () => {
    const mainWindow = mb.window;

  });

  mb.once('show', function () {
    //mb.window.openDevTools();
  });
}