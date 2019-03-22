//
//
//Authors: Ryan Song, James Liu
//
//Description:
//Stores, handles and packages CAN frame into a message for display on main screen.
//Eventually, we want to include someway of storing data, perhaps use mongoDB.
//
//

'use strict';

const stream = require('stream');
const canParser = require('./canParser');


function generateDisplay(frame) {
    //frameBank holds the frames for indexing
    //powerBuf stores information on power to computer averages
    let frameBank = [];
    let powerBuf = [];
    let powerAvg;
    //store frame in an array for easy access
    //once a new frame with the same id, aka from same component on the car, the old data gets overwritten
    frameBank[frame.id] = frame;
    //id 0x201 refers to the battery. Refer to solarCar.js document for other CAN ID's
    //These calculations compute power and convert from MV to V and MA to A
    if(frame.id == 0x201) {
        powerBuf.push({
            value: (frame.data.readInt32BE(0) / 1E6) * (frame.data.readInt32BE(4) / 1E6),
            timestamp: frame.timestamp
        });
        powerAvg = 0;
        for (let i = 0; i < powerBuf.length; i++) {
            if (powerBuf[i].timestamp < Date.now() - 600000) {
                powerBuf.shift();
            } else {
                powerAvg += powerBuf[i].value;
            }
        }
        powerAvg /= powerBuf.length;
    }
    //generate display of frame
    const frameDisplay =
        `BATTERY POWER: \n
         \t Voltage: ${frameBank[0x201] ? (frameBank[0x201].data.readInt32BE(0)/1E6).toFixed(3) : '?'} V, \n
         \t Current: ${frameBank[0x201] ? (frameBank[0x201].data.readInt32BE(4)/1E6).toFixed(3) : '?'} A, \n
         \t Power: ${frameBank[0x201] ? (frameBank[0x201].data.readInt32BE(0)/1E6)*(frameBank[0x201].data.readInt32BE(4)/1E6) : '?'} W, \n
         \t 5minAvg: ${poweravg ? poweravg.toFixed(3) + ' (' + powerBuf.length + ' pcs)' : '?' } \n
         \n
         CELL VOLTAGES: \n
         ${Array(9).fill(null).map((item, i) => `
         \t L${Math.floor(i/3)} C${(i%3)*4+0}: \n    
         \t \t ${frameBank[0x350 + i] ? (frameBank[350 + i].data.readUInt16BE(0)/1E4).toFixed(3) : '?'} V \n
         \t L${Math.floor(i/3)} C${(i%3)*4+1}: \n
         \t \t ${frameBank[0x350 + i] ? (frameBank[350 + i].data.readUInt16BE(2)/1E4).toFixed(3) : '?'} V \n
         \t L${Math.floor(i/3)} C${(i%3)*4+2}: \n
         \t \t ${frameBank[0x350 + i] ? (frameBank[350 + i].data.readUInt16BE(4) / 1E4).toFixed(3) : '?'} V \n
         \t L${Math.floor(i/3)} C${(i%3)*4+3}: \n
         \t \t ${frameBank[0x350 + i] ? (frameBank[350 + i].data.readUInt16BE(6) / 1E4).toFixed(3) : '?'} V \n
         `)} \n
         CELL TEMPERATURES: \n
         ${Array(8).fill(null).map((item, i) => `
            ${Array(2).fill(null).map((item, j) => `
                \t ${i*4+j*2+0}: \n
                \t \t ${frameBank[0x580+i*2*j] ? (frameBank[0x580+i*2+j].data.readInt32BE(0)/1E6).toFixed(3) : '?'} °C, \n
                \t ${i*4+j*2+1}: \n
                \t \t ${frameBank[0x580+i*2*j] ? (frameBank[0x580+i*2+j].data.readInt32BE(4)/1E6).toFixed(3) : '?'} °C, \n
            `)}
         `)}
         MISC TEMPERATURES: \n
         \t Driver Temperature: \n
         \t \t ${frameBank[0x540] ? (frameBank[0x540].data.readInt32BE(0)/1E6).toFixed(3) : '?'} °C \n
         \t Motor Temperature: \n
         \t \t ${frameBank[0x540] ? (frameBank[0x540].data.readInt32BE(4)/1E6).toFixed(3) : '?'} °C \n
         \t MCB CPU Temperature: \n
         \t \t ${frameBank[0x540] ? (frameBank[0x541].data.readInt32BE(0)/1E6).toFixed(3) : '?'} °C \n
         PPT POWERS: \n
         ${Array(3).fill(null).map((item, i) => `
         \t PPT${i}: \n
         \t \t Voltage:${frameBank[0x20A+i] ? (frameBank[0x20A+i].data.readInt32BE(0)/1E6).toFixed(3) : '?'} V, \n
         \t \t Current: ${frameBank[0x20A+i] ? chalk.yellow((frameBank[0x20A+i].data.readInt32BE(4)/1E6).toFixed(3)) : '?'} A, \n
         \t \t Power: ${frameBank[0x20A+i] ? chalk.yellow(((frameBank[0x20A+i].data.readInt32BE(0)/1E6) * (frameBank[0x20A+i].data.readInt32BE(4)/1E6)).toFixed(3)) : '?'} W \n
         `)}
         MOTOR CONTROL: \n
         \t Last Reset: ${frameBank[0x503] ? frameBank[0x503].timestamp.toLocaleDateString() : '?'} \n
         \t Drive: \n
         \t \t Velocity: ${frameBank[0x501] ? chalk.yellow((frameBank[0x501].data.readFloatLE(0)).toFixed(3)) : '?'} rpm, \n
         \t \t Current: ${frameBank[0x501] ? chalk.yellow((frameBank[0x501].data.readFloatLE(4)*100).toFixed(3)) : '?'} %, \n
         \t \t Power: ${frameBank[0x502] ? chalk.yellow((frameBank[0x502].data.readFloatLE(0)).toFixed(3) + ', ' + (frameBank[0x502].data.readFloatLE(4)).toFixed(3)) : '?'} \n
         \t \t Stats: ${frameBank[0x403] ? chalk.yellow((frameBank[0x403].data.readFloatLE(0)).toFixed(3) + ', ' + (frameBank[0x403].data.readFloatLE(4)).toFixed(3)) : '?'} \n
         \t \t Speed: ${frameBank[0x05048225] ? chalk.yellow((((frameBank[0x05048225].data[5]) | ((frameBank[0x05048225].data[6]&0xf) << 8))*60*Math.PI*(559/1000000)).toFixed(3)) : '?'} \n
         HEARTBEAT TIMESTAMPS: \n
         ${Array(16).fill(null).map((item, i) => `
            ${i}: ${frameBank[0x050+i] ? frameBank[0x050+i].timestamp.toLocaleTimeString() : '?'} \n
         `)}
         EOF \n \n
        `;
    return frameDisplay;
}

module.exports.generateDisplay = generateDisplay;