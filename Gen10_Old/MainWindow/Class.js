//
//
//Author: Ryan Song
//
//Description: Defines the class that is the main browser window launched by electron
//
//

const electron = require('electron');
//destructuring electron
const { BrowserWindow } = electron;

class MainWindow extends BrowserWindow{
    constructor(url) {
        super({});
        this.loadURL(url);
    }
}

module.exports = MainWindow;