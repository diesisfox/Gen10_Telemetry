
'use strict';

//Node Core Modules
const electron = require('electron');
const { ipcRenderer , app } = electron;
//Custom Modules
const ports = require('../../app/ConnectSerial');

//displays to user serial ports that can be selected
ipcRenderer.on('Port:Render',(event)=>{
    const AvailablePorts = ports.saveSerialPorts();
    let i = 0;
    let PortList = [];
    let Text = [];
    AvailablePorts.forEach(function(element){
        PortList[i] = document.createElement('li');
        Text[i] = document.createTextNode('Hello');
        PortList[i].appendChild(Text[i]);
        document.querySelector('ul').appendChild(PortList[i]);
        // PortList[i].setAttribute("value", element.comName);
        // PortList[i].setAttribute("id", `SerialPort${i}`);
        // PortList[i].innerHTML = `Port Name: ${element.comName}, Manufacturer: ${element.manufacturer}`;
        // document.getElementById("SerialPortSelect").appendChild(PortList[i]);
        // ++i;
        ipcRenderer.send('Reached');
    });
    const li = document.createElement('li');
    const text = document.createTextNode('Hello');
    li.appendChild(text);
    document.querySelector('ul').appendChild(li);
});

document.getElementById("SerialPortSubmit").on('onsubmit', ()=>{
    const comName = document.getElementById("SerialPortSelect").value;
    const baudRate = document.getElementById("BaudRateSelect").value;
    let port = 0;
    port = ports.connect(comName, baudRate);
    if(port!=0){
        ipcRenderer.send('Serial:Connected', null);
    }
});
