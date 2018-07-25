/*
    Main js file for genX telemetry
*/
'use strict';

//node modules
const EventEmitter = require('events');
const childProcess = require('child_process');
const electron = require('electron');

const { app, BrowserWindow, ipcMain } = electron;

//custom modules
const LogStream = require('./app/LogStream');
const SerialPort = require('./app/ConnectSerial');
const CanParser = require('./app/canParser');
const CanReader = require('./app/CanReader');

//Browser Windows for Electron
const MainWindow = require('./windows/MainWindow');


const emtr = new EventEmitter();

let radioPort;
let logFile;

// //Opening Serial Port
// SerialPort.ConnectSerial(radioPort);
//
// //Creating file to log
// emtr.on('SerialPort:connected',()=>{
//     LogStream.create(logFile);
//     console.log('Log file created');
// });
//
// //Creating New CAN Parser
// emtr.on('LogFile:created', ()=>{
//     const CanParser = new CanParser();
//     radioPort.pipe(CanParser);
//
//     CanParser.on('frame', ()=>{
//         CanReader.displayFrame(logFile);
//     });
//
//     tk.terminal.on('mouse',(name,data)=>{
//         if(name == 'MOUSE_LEFT_BUTTON_PRESSED'){
//             CanReader.readReport();
//         }else if(name == 'MOUSE_RIGHT_BUTTON_PRESSED'){
//             childProcess.spawn('osascript', ['-e','say "Fuck you too Frank!"']);
//         }
//     });
// });

let mainWindow;

app.on('ready', ()=>{
    mainWindow = new MainWindow(`file://${__dirname}/windows/MainWindow.html`);
});