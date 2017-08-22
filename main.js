const readline = require('readline');
const SerialPort = require('serialport');
const chalk = require('chalk');
const Base64 = require('js-base64');
const CanParser = require('./CanParser.js');

const stdio = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const log = console.log;
var radioPort, canParser;


SerialPort.list((err,ports)=>{
	if(ports.length){
		radioPort = ports;
		log('Choose a serial port:');
		for(let i=0; i<ports.length; i++){
			log(chalk.yellow(i)+') ' + chalk.cyan(ports[i].comName) + ', manufacturer: ' + chalk.dim(ports[i].manufacturer));
		}
		choosePort();
	}
});

function choosePort(){
	stdio.question('> ', (res)=>{
		res = parseInt(res);
		if(Number.isNaN(res) || res >= radioPort.length || res<0){
			log(chalk.red("Pls no fucktarderino"));
			choosePort();
		}else{
			radioPort = new SerialPort(radioPort[res].comName,{
				baudRate:115200
			});
			canParser = new CanParser();
			radioPort.pipe(canParser);
			canParser.on('frame', displayFrame);
		}
	})
}

function displayFrame(frame){

}

function scanPorts() {

}
