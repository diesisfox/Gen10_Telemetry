//node modules
const tk = require('terminal-kit');
const childProcess = require('child_process');

//custom modules
const CustomSerial = require('./app/SelectReadSerialPort');
const DataLogger = require('./app/DataLogging');

//Opening Serial Port
const serial = new CustomSerial;
serial.selectPort();

//Creating file to log
const datalog = new DataLogger;
datalog.createLogStream();

//James what does this do?
tk.terminal.on('mouse',(name,data)=>{
	if(name == 'MOUSE_LEFT_BUTTON_PRESSED'){
		serial.reportRead();
	}else if(name == 'MOUSE_RIGHT_BUTTON_PRESSED'){
		childProcess.spawn('osascript', ['-e','say "Fuck you too Frank!"']);
	}
});