const stream = require('stream');

const startingBytes = [
	[0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28],
	[0x29, 0x2a, 0x2c, 0x2d, 0x2e, 0x3a, 0x3b, 0x3c, 0x3e]
];

function encode(frm){
	let frameBuf = [];
	if(frm.ide){
		frameBuf.push((frm.id>>(29-8))&0xff);
		frameBuf.push((frm.id>>(29-16))&0xff);
		frameBuf.push((frm.id>>(29-24))&0xff);
		frameBuf.push((frm.id<<(32-29))&0xff);
		for(let i=0; i<frm.dlc; i++){
			frameBuf[frameBuf.length-1] |= frm.data[i]>>5;
			frameBuf.push((frm.data[i]<<3)&0xff);
		}
	}else{
		frameBuf.push((frm.id>>(11-8))&0xff);
		frameBuf.push((frm.id<<(16-11))&0xff);
		for(let i=0; i<frm.dlc; i++){
			frameBuf[frameBuf.length-1] |= frm.data[i]>>3;
			frameBuf.push((frm.data[i]<<5)&0xff);
		}
	}
	frameBuf = Buffer.from(Buffer.from(frameBuf).toString('base64'));
	return Buffer.concat([Buffer.from([startingBytes[frm.ide][frm.dlc]]), frameBuf]);
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
