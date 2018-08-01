'use strict';

//Node Modules
const electron = require('electron');
const { ipcRenderer } = electron;
const serial = require('serialport');

//Custom Modules


//Loading Serial Ports in Selection Menu
function RefreshSerial (){
    serial.list((err, ports) => {
        document.getElementById('SerialPortSelect').innerHTML = '';
        if(ports.length > 0) {
            ports.forEach((element) => {
                const option = document.createElement('option');
                const text = document.createTextNode(element.comName.toString());
                option.appendChild(text);
                document.getElementById('SerialPortSelect').appendChild(option);
            });
        }
    });
}

//Connecting to the Serial Port
function ConnectSerial(){
    const PortSelect = document.getElementById('SerialPortSelect');
    const RateSelect = document.getElementById('BaudRateSelect');
    const comName = PortSelect.options[PortSelect.selectedIndex].text;
    const baudRate = RateSelect.options[RateSelect.selectedIndex].text;
    const portInfo = {
        comName: comName,
        baudRate: baudRate
    };

    ipcRenderer.send('connect', portInfo);
}

ipcRenderer.on('connected', (event, portInfo) => {
    document.getElementById('connectionMessage').innerText = `Connected to ${portInfo.comName} at ${portInfo.baudRate}.`;
});

ipcRenderer.on('ConnectionError', (event, message) => {
    document.getElementById('connectionMessage').innerText = message;
});

function LoadCurrentDir(){
    document.getElementById('filepath').value = __dirname.toString();
}

function generateLog(){
    const path = document.getElementById('filepath').value;
    ipcRenderer.send('generateLog', path);
}

ipcRenderer.on('logFile:success', (event) => {
    document.getElementById('logFileMessage').innerText = 'Successfully Generated Log File';
});

ipcRenderer.on('logFile:failed', (event, message) => {
    document.getElementById('logFileMessage').innerText = message;
});

//execute when body has loaded
function UponLoad() {
    LoadCurrentDir();
    RefreshSerial();
}