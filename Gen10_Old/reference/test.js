const readline = require('readline');
const SerialPort = require('serialport');
const chalk = require('chalk');
const ansi = require('ansi-escapes');
const CanParser = require('./canParser.js');

var frameBank = [];

const stdio = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

canParser = new CanParser();
canParser.on('frame', displayFrame);

ask();

function ask(){
	stdio.question('> ', (res)=>{
		canParser.write(res);
		ask();
	})
}

function displayFrame(frame){
	frameBank[frame.id] = frame;
	drawReport();
	console.log('\n',frame);
}

function drawReport(){
	[w,h] = process.stdout.getWindowSize();
	process.stdout.write(`${ansi.clearScreen}${('#').repeat(w)}

${chalk.cyan('BATTERY POWER:')}
Voltage: ${
	frameBank[0x201] ? chalk.orange((frameBank[0x201].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
} V,	Current: ${
	frameBank[0x201] ? chalk.orange((frameBank[0x201].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
} A,	Power: ${
	frameBank[0x201] ? chalk.orange(((frameBank[0x201].data.readInt32BE(0)/1E6) * (frameBank[0x201].data.readInt32BE(4)/1E6)).toFixed(3)) : '?'
} W

${chalk.cyan('CELL VOLTAGES:')}
${
	Array(9).join(0).split(0).map((item, i) => `L${Math.floor(i/3)}C${(i%3)*4+0}: ${
		frameBank[0x350+i] ? chalk.orange((frameBank[0x350+i].data.readUInt16BE(0)/1E4).toFixed(3)) : '?'
	} V,	L${Math.floor(i/3)}C${(i%3)*4+1}: ${
		frameBank[0x350+i] ? chalk.orange((frameBank[0x350+i].data.readUInt16BE(2)/1E4).toFixed(3)) : '?'
	} V,	L${Math.floor(i/3)}C${(i%3)*4+2}: ${
		frameBank[0x350+i] ? chalk.orange((frameBank[0x350+i].data.readUInt16BE(4)/1E4).toFixed(3)) : '?'
	} V,	L${Math.floor(i/3)}C${(i%3)*4+3}: ${
		frameBank[0x350+i] ? chalk.orange((frameBank[0x350+i].data.readUInt16BE(6)/1E4).toFixed(3)) : '?'
	} V
`).join('')
}

${chalk.cyan('PPT POWER:')}
${
	Array(3).join(0).split(0).map((item, i) => `PPT${i}: Voltage: ${
		frameBank[0x20A+i] ? chalk.orange((frameBank[0x20A+i].data.readInt32BE(0)/1E6).toFixed(3)) : '?'
	} V,	Current: ${
		frameBank[0x20A+i] ? chalk.orange((frameBank[0x20A+i].data.readInt32BE(4)/1E6).toFixed(3)) : '?'
	} A,	Power: ${
		frameBank[0x20A+i] ? chalk.orange(((frameBank[0x20A+i].data.readInt32BE(0)/1E6) * (frameBank[0x201].data.readInt32BE(4)/1E6)).toFixed(3)) : '?'
	} W
`).join('')
}

${chalk.cyan('HEARTBEAT TIMESTAMPS:')}
${
	Array(16).join(0).split(0).map((item, i) => `${i}: ${
		chalk.magenta(frameBank[0x050+i] ? frameBank[0x050+i].timestamp.toLocaleTimeString()) : '?'
	}, `).join('')
}

${('#').repeat(w)}
`);
}
