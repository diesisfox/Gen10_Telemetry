const stream = require('stream');

const startingBytes = [
	[0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28],
	[0x29, 0x2a, 0x2c, 0x2d, 0x2e, 0x3a, 0x3b, 0x3c, 0x3e]
];

function isValidDataByte(x){ //TODO replace with regexp
	if( x>='A' && x<='Z' ||
		x>='a' && x<='z' ||
		x>='0' && x<='9' ||
		x=='+' || x=='/' || x=='='){
		return true;
	}
	return false;
}

function parseFrame(buf, fmt){
	let frm = {};
	frm.timestamp = Date.now();
	frm.ide = fmt.ide;
	frm.dlc = fmt.dlc;
	frm.data = [];
	if(fmt.ide){
		frm.id = (buf.readUInt32BE(0) & 0xfffffff8) >> 3;
		for(let i=0; i<fmt.dlc; i++){
			frm.data.push((buf[3+i]&0x07)<<5 | (buf[4+i]&0xf8)>>3);
		}
	}else{
		frm.id = (buf.readUInt16BE(0) & 0xffe0) >> 5;
		for(let i=0; i<fmt.dlc; i++){
			frm.data.push((buf[1+i]&0x1f)<<3 | (buf[2+i]&0xe0)>>5);
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
	return false;
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
		this.unreplaceChars();
		while(this.buf.length >= 5){
			let fmt = parseStartingByte(this.buf[0]);
			if(fmt){
				if(this.buf.length < fmt.bytes+1) return;
				if(this.verifyData(fmt.bytes)){
					let frameBytes = Buffer.from(this.buf.slice(1, 1+fmt.bytes), 'base64');
					this.buf = this.buf.slice(1+fmt.bytes);
					this.emit('frame', parseFrame(frameBytes, fmt));
				}
			}else{
				this.buf = this.buf.slice(1);
			}
		}
	}

	verifyData(bytes){ //also cuts away bad data
		for(let i=0; i<bytes; i++){
			if(!isValidDataByte(this.buf[i+1])){
				this.buf = this.buf.slice(i+1);
				return false;
			}
		}
		return true;
	}

	unreplaceChars(){
		this.buf = this.buf.replace(/\?/g,'A').replace(/@/g,'+');
	}
}

module.exports = CanParser;
