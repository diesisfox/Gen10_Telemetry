/*
    Main js file for genX telemetry
*/
'use strict';
//NOTE: Electron doesn't work with serial port. At least when I tried, it messed everything up.
//We might have to run it in a way where electron is built on top of this already created backend without ever
//relying on the serial port module.

//node modules
const EventEmitter = require('events');
const childProcess = require('child_process');

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