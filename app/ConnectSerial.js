/*
    Allows the user to select what serial port to listen to and adjust baud rate
    Still needs to be tested
*/
'use strict';

const SerialPort = require('serialport');
const readline = require('readline');
const EventEmitter = require('events');

let portList;
let baudrate;

const emtr = new EventEmitter();

//creates a new command line interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//lists the available ports for connection
function PrintSerialPorts(){
    SerialPort.list((err, ports) => {
        portList = ports;
        let portNumber = 0;
        ports.forEach((port)=>{
            console.log(`${portNumber}, ${port.comName}, ${port.manufacturer}`);
            portNumber++;
        });
    });
}

//queries user for baud rate
function inputBaudRate(){
    rl.question('Input Baud Rate: ', (answer)=>{
        baudrate = answer;
    });
}

function SerialChooseAndConnect(port) {
    console.log('Choose a serial port to listen to:');
    PrintSerialPorts();
    rl.question('Enter serial port number: ', (answer)=>{
        if(answer >= portList.length || answer < 0 || Number.isNaN(answer)){
            console.log('This port does not exist dumb ass');
            SerialChooseAndConnect();
        }
        else {
            inputBaudRate();
            port = new SerialPort(portList[answer].comName, {
                baudRate: baudrate
            });
            console.log(`Connected to port ${portlist[answer].comName} at ${baudrate}`);
            emtr.emit('SerialPort:connected');
        }
    });
}

function saveSerialPorts(){
    SerialPort.list((err, ports) => {
        return ports;
    });
}


module.exports.ConnectSerial = SerialChooseAndConnect;
module.exports.saveSerialPorts = saveSerialPorts;