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

//Custom Modules
const MainWindow = require('./MainWindow/Class');
let main;

const serial = require('./app/ConnectSerial');

app.on('ready', ()=>{
    main = new MainWindow(`file://${__dirname}/index.html`);

    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

function testSignal(){
    main.webContents.send('RefreshConnection', null);
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
              label: 'Refresh Connection',
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