/*
Class definition for the main window.
Contains most of the functionality behind the main window.
 */

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