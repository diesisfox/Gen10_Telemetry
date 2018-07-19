'use strict';

const chalk = require('chalk');
const ansi = require('ansi-escapes');
const tk = require('terminal-kit');
const childProcess = require('child_process');
const util = require('util');

let poweravg;
let frameBank = [];
let powerBuf = [];

function displayFrame(frame, logFile){
    frameBank[frame.id] = frame;
    if(frame.id == 0x201){
        powerBuf.push({
            value: (frame.data.readInt32BE(0)/1E6) * (frame.data.readInt32BE(4)/1E6),
            timestamp: frame.timestamp,
        });
        poweravg = 0;
        for(let i=0; i<powerBuf.length; i++){
            if(powerBuf[i].timestamp < Date.now()-600000){
                powerBuf.shift();
            }else{
                poweravg+=powerBuf[i].value;
            }
        }
        poweravg/=powerBuf.length;
    }
    drawReport(frame);
    logFile.write(util.inspect(frame)+',\n');
    tk.terminal.grabInput({mouse:'button'});
}

function drawReport(frame){
    [w,h] = process.stdout.getWindowSize();
    process.stdout.write($`{ansi.clearScreen}${('#').repeat(w)}

${chalk.cyan('BATTERY POWER:')}
Voltage: ${
        frameBank[0x201] ? chalk.yellow((frameBank[0x201].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
        } V,	Current: ${
        frameBank[0x201] ? chalk.yellow((frameBank[0x201].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
        } A,	Power: ${
        frameBank[0x201] ? chalk.yellow(((frameBank[0x201].data.readInt32BE(0)/1E6) * (frameBank[0x201].data.readInt32BE(4)/1E6)).toFixed(3)) : '?'
        } W,	5minAvg: ${
        poweravg? chalk.yellow(poweravg.toFixed(3)) + ' (' + powerBuf.length + ' pcs)' : '?'
        }

${chalk.cyan('CELL VOLTAGES:')}
${
        Array(9).fill(null).map((item, i) => `L${Math.floor(i/3)}C${(i%3)*4+0}: ${
            frameBank[0x350+i] ? chalk.yellow((frameBank[0x350+i].data.readUInt16BE(0)/1E4).toFixed(3)) : '?'
            } V,	L${Math.floor(i/3)}C${(i%3)*4+1}: ${
            frameBank[0x350+i] ? chalk.yellow((frameBank[0x350+i].data.readUInt16BE(2)/1E4).toFixed(3)) : '?'
            } V,	L${Math.floor(i/3)}C${(i%3)*4+2}: ${
            frameBank[0x350+i] ? chalk.yellow((frameBank[0x350+i].data.readUInt16BE(4)/1E4).toFixed(3)) : '?'
            } V,	L${Math.floor(i/3)}C${(i%3)*4+3}: ${
            frameBank[0x350+i] ? chalk.yellow((frameBank[0x350+i].data.readUInt16BE(6)/1E4).toFixed(3)) : '?'
            } V`).join('\n')
        }

${chalk.cyan('CELL TEMPERATURES:')}
${
        Array(8).fill(null).map((item, i) => `${
            Array(2).fill(null).map((item, j) => `${i*4+j*2+0}: ${
                frameBank[0x580+i*2+j] ? chalk.yellow((frameBank[0x580+i*2+j].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
                } °C,	${i*4+j*2+1}: ${
                frameBank[0x580+i*2+j] ? chalk.yellow((frameBank[0x580+i*2+j].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
                } °C,`).join('\t')
            }`).join('\n')
        }

${chalk.cyan('MISC TEMPERATURES:')}
Driver Temperature: ${
        frameBank[0x540] ? chalk.yellow((frameBank[0x540].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
        } °C
Motor Temperature: ${
        frameBank[0x540] ? chalk.yellow((frameBank[0x540].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
        } °C
MCB CPU Temperature: ${
        frameBank[0x541] ? chalk.yellow((frameBank[0x541].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
        } °C

${chalk.cyan('PPT POWERS:')}
${
        Array(3).fill(null).map((item, i) => `PPT${i}: Voltage: ${
            frameBank[0x20A+i] ? chalk.yellow((frameBank[0x20A+i].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
            } V,	Current: ${
            frameBank[0x20A+i] ? chalk.yellow((frameBank[0x20A+i].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
            } A,	Power: ${
            frameBank[0x20A+i] ? chalk.yellow(((frameBank[0x20A+i].data.readInt32BE(0)/1E6) * (frameBank[0x20A+i].data.readInt32BE(4)/1E6)).toFixed(3)) : '?'
            } W`).join('\n')
        }

${chalk.cyan('MOTOR CONTROL:')}
Last Reset: ${frameBank[0x503] ? chalk.magenta(frameBank[0x503].timestamp.toLocaleDateString()) : '?'}
Drive:	Velocity: ${frameBank[0x501] ? chalk.yellow((frameBank[0x501].data.readFloatLE(0)).toFixed(3)) : '?'} rpm,	Current: ${frameBank[0x501] ? chalk.yellow((frameBank[0x501].data.readFloatLE(4)*100).toFixed(3)) : '?'} %
Power: ${frameBank[0x502] ? chalk.yellow((frameBank[0x502].data.readFloatLE(0)).toFixed(3) + ', ' + (frameBank[0x502].data.readFloatLE(4)).toFixed(3)) : '?'}
Stats: ${frameBank[0x403] ? chalk.yellow((frameBank[0x403].data.readFloatLE(0)).toFixed(3) + ', ' + (frameBank[0x403].data.readFloatLE(4)).toFixed(3)) : '?'}
Speed: ${
        frameBank[0x05048225] ? chalk.yellow((((frameBank[0x05048225].data[5]) | ((frameBank[0x05048225].data[6]&0xf) << 8))*60*Math.PI*(559/1000000)).toFixed(3)) : '?'
        // frameBank[0x403] ? chalk.yellow((frameBank[0x403].data.readFloatLE(0)*60*Math.PI*(559/1000000)).toFixed(3)) : '?'
        }

${chalk.cyan('HEARTBEAT TIMESTAMPS:')}
${
        Array(16).fill(null).map((item, i) => `${i}: ${
            frameBank[0x050+i] ? chalk.magenta(frameBank[0x050+i].timestamp.toLocaleTimeString()) : '?'
            }, `).join('')
        }

${('#').repeat(w)}

${util.inspect(frame,{colors:true})}
`);
}

function readReport(){
    let reports = [];
    if(frameBank[0x05048225]){
        reports.push(`the speed is ${(((frameBank[0x05048225].data[5]) | ((frameBank[0x05048225].data[6]&0xf) << 8))*60*Math.PI*(559/1000000)).toFixed(1)} KPH`);
    }
    if(frameBank[0x201]){
        reports.push(`the power is ${((frameBank[0x201].data.readInt32BE(0)/1E6) * (frameBank[0x201].data.readInt32BE(4)/1E6)).toFixed(0)} watts`);
        reports.push(`the voltage is ${(frameBank[0x201].data.readInt32BE(0)/1E6).toFixed(1)} volts`);
    }
    if(frameBank[0x540]){
        reports.push(`the motor temperature is ${(frameBank[0x540].data.readInt32BE(4)/1E6).toFixed(1)} degrees`);
    }
    if(reports.length>1)reports[reports.length-1] = 'and ' + reports[reports.length-1];
    reports = reports.join(', ');
    childProcess.spawn('osascript', ['-e',`say "${reports}"`]);
}

module.exports.displayFrame = displayFrame;
module.exports.readReport = readReport;