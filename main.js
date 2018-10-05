//
//
//Author: Ryan Song
//
//Description: This the main file for Gen10 Telemetry application. It's main goal is to
//run the main electron framework and performing majority of tasks in the backend.
//Refer to the README.md file for installation instructions.
//
//

'use strict';

//Node Modules
const electron = require('electron');
const { ipcMain, app, Menu } = electron;
const SerialPort = require('serialport');
const fs = require('fs');
const dateformat = require('dateformat');

//Custom Modules
const MainWindow = require('./MainWindow/Class');
const canParser = require('./CAN/canParser');
const frameHandler = require('./CAN/frameHandler');

let main;
let port = null;
let logFile = null;
const CanParser = new canParser();

app.on('ready', ()=>{
    main = new MainWindow(`file://${__dirname}/index.html`);
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

app.on('quit', () => {
   //close serial ports if any exist
   if(port!=null){
       if(port.isOpen)
           port.close();
   }
});

ipcMain.on('connect', (event, portInfo) => {
    const baudRateInt = parseInt(portInfo.baudRate, 10);
    port = new SerialPort(portInfo.comName, {baudRate: baudRateInt}, (err) => {
        //send error messages
        if(err){
            if(port != null){
                main.webContents.send('Connection:Error', 'Already connected to port');
            }
            else {
                main.webContents.send('Connection:Error', `${err.message}. Port is most likely busy.`);
            }
        }
        else{
            main.webContents.send('Connection:Success', portInfo);
        }
    });
    //send stream into CanParser
    port.pipe(CanParser);
});

ipcMain.on('generateLog', (event, path) => {
    let ValidDirectory;

    try{
        fs.lstatSync(path).isDirectory();
        ValidDirectory = true;
    } catch(e){
        ValidDirectory = false;
    }

    if(port != null && ValidDirectory){
        fs.stat(`${path}/logs`,(err,stat)=>{
            if(stat && stat.isDirectory()){
                logFile = fs.createWriteStream(`${path}/logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
            }else{
                fs.mkdir(`${path}/logs`,(e)=>{
                    if(e)
                        console.log(e);
                    logFile = fs.createWriteStream(`${path}/logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
                })
            }
        });

        main.webContents.send('logFile:success', null);
    }
    else{
        if(!ValidDirectory){
            const message = 'Error: Non-existent directory';
            main.webContents.send('logFile:failed', message);
        }
        if(port == null){
            const message = 'Error: Not connected to any serial port';
            main.webContents.send('logFile:failed', message);
        }
    }
});

CanParser.on('frame', (frame) => {
    //refer to frameHandler.js
    const message = frameHandler.generateDisplay(frame);
    main.webContents.send('canFrame:generated', message);
});

//test signal if needed
function testSignal(){
    main.webContents.send('testSignal', null);
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
              label: 'Test',
              click(){
                  testSignal();
              }
            },
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

if(process.env.NODE_ENV !== 'production'){
    menuTemplate.push({
        label: 'Developer',
        submenu: [
            {
                role: 'reload'
            },
            {
                label: 'Toggle Developer Tools',
                accelerator: process.platform === 'darwin' ? 'Command + Alt + I' : 'Ctrl + Shift + I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    });
}