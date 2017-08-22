const stream = require('stream');

const startingBytes = [
	[0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28],
	[0x29, 0x2a, 0x2c, 0x2d, 0x2e, 0x3a, 0x3b, 0x3c, 0x3e]
];

function isValidDataByte(x){
	if( x>='A' && x<='Z' ||
		x>='a' && x<='z' ||
		x=='+' || x=='/' || x=='='){
		return true;
	}
	return false;
}

function unreplaceChars(str){
	str = str.replace('?','A');
	str = str.replace('@','+');
}

function parseFrame(buf, fmt){
	let frm = {};
	frm.timestamp = Date.now();
	frm.ide = fmt.ide;
	frm.dlc = fmt.dlc;
	frm.data = [];
	if(fmt.ide){
		frm.id = buf.readUInt32BE(0) & 0xfffffff8;
		for(let i=0; i<fmt.dlc; i++){
			frm.data.push(buf[3+i]&0x07 | buf[4+i]&0xf8);
		}
	}else{
		frm.id = buf.readUInt16BE(0) & 0xffe0;
		for(let i=0; i<fmt.dlc; i++){
			frm.data.push(buf[1+i]&0x1f | buf[2+i]&0xe0);
		}
	}
	return frm;
}

function parseStartingByte(x){
	for(let i=0; i<startingBytes.length; i++){
		for(let j=0; j<startingBytes[i].length; j++){
			if(x.charCodeAt() == startingBytes[i][j]){
				return {
					ide: i,
					dlc: j,
					bytes: Math.ceil(((i?29:11)+j*8)/24)*4
				};
			}
		}
	}
	return {};
}

class CanParser extends stream.Writable{
	constructor(options){
		super(options);
		this.buf = '';
	}

	_writev(chunks, callback){
		for (let chunk of chunks){
			this.buf += chunk.toString();
		}
		this.processIncoming();
		callback();
	}

	_write(chunk, encoding, callback){
		this.buf += chunk;
		this.processIncoming();
		callback();
	}

	processIncoming(){
		unreplaceChars(this.buf);
		while(this.buf.length >= 5){
			let fmt = parseStartingByte(this.buf[0]);
			if(fmt){
				if(this.verifyData(this.buf, fmt.bytes)){
					let frameBytes = Buffer.from(this.buf.slice(1, 1+fmt.bytes), 'base64');
					this.buf = this.buf.slice(1+fmt.bytes);
					this.emit('frame', parseFrame(frameBytes, fmt));
				}
			}else{
				this.buf = this.buf.slice(1);
			}
		}
	}

	verifyData(str, bytes){ //also cuts away bad data
		if(this.buf.length < bytes+1) return false;
		for(let i=0; i<bytes; i++){
			if(!isValidDataByte(str[i+1])){
				str = str.slice(i+2);
				return false;
			}
		}
		return true;
	}
}

module.exports = CanParser;
