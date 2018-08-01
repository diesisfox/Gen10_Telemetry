/*
    Main js file for gen10 telemetry
*/
//Old Code
/*
//node modules
const EventEmitter = require('events');
const childProcess = require('child_process');
const electron = require('electron');

const { app, ipcMain } = electron;

//custom modules
const LogStream = require('./app/LogStream');
const SerialPort = require('./app/ConnectSerial');
const CanParser = require('./app/canParser');
const CanReader = require('./app/CanReader');

const emtr = new EventEmitter();

let radioPort;
let logFile;

//Opening Serial Port
SerialPort.ConnectSerial(radioPort);

//Creating file to log
emtr.on('SerialPort:connected',()=>{
    LogStream.create(logFile);
    console.log('Log file created');
});

//Creating New CAN Parser
emtr.on('LogFile:created', ()=>{
    const CanParser = new CanParser();
    radioPort.pipe(CanParser);

    CanParser.on('frame', ()=>{
        CanReader.displayFrame(logFile);
    });

    tk.terminal.on('mouse',(name,data)=>{
        if(name == 'MOUSE_LEFT_BUTTON_PRESSED'){
            CanReader.readReport();
        }else if(name == 'MOUSE_RIGHT_BUTTON_PRESSED'){
            childProcess.spawn('osascript', ['-e','say "Fuck you too Frank!"']);
        }
    });
});

*/

'use strict';

//Node Modules
const electron = require('electron');
const { ipcMain, app, Menu } = electron;
const SerialPort = require('serialport');
const fs = require('fs');
const dateformat = require('dateformat');

//Custom Modules
const MainWindow = require('./MainWindow/Class');

let main;
let port = null;
let logFile = null;

app.on('ready', ()=>{
    main = new MainWindow(`file://${__dirname}/index.html`);

    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

app.on('quit', () => {
   if(port!=null){
       if(port.isOpen)
           port.close();
   }
});

ipcMain.on('connect', (event, portInfo) => {
    const baudRateInt = parseInt(portInfo.baudRate, 10);
    port = new SerialPort(portInfo.comName, {baudRate: baudRateInt}, (err) => {
        if(err){
            if(port != null){
                main.webContents.send('ConnectionError', 'Already connected to port');
            }
            else {
                main.webContents.send('ConnectionError', `${err.message}. Port is most likely busy.`);
            }
        }
        else{
            main.webContents.send('connected', portInfo);
        }
    });
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

        port.on('data', (data) => {
            logFile.write(data.toString());
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