//
//Author: James Liu
//
//Description: Tabulates the relevant CAN ID's for referencing
//

const EventEmitter = require('events');

const connState = {
	DISCONNECTED	= 0,
	CONNECTING		= 1,
	CONNECTED		= 2,
	UNRELIABLE		= 3,
	CONN_ERROR		= 4,
};

const nodeState = {
	INIT			= 0,
	ACTIVE			= 1,
	SHUTDOWN		= 2,
	HARD_ERROR		= 3,
};

const nodeCommand = {
	HRESET			= 0,
	RESET			= 1,
	SHUTDOWN		= 2,
	START			= 3,
	ACK				= 4,
	NACK			= 5,
};

const nodeID = {
	cc				= 1,			// Command center nodeID
	mc				= 2,			// Motor controller nodeID
	bps				= 3,			// Battery protection system nodeID
	ads				= 4,			// Array diagnostic system nodeID
	radio			= 6,			// Radio module nodeID
	dcb				= 7,			// Driver ctrl board nodeID
};

const canID = {
	p2pOffset	 	= 0x040,
	swOffset 	 	= 0x050,
	fwOffset	 	= 0x180,
	p2pOffsetEnd 	= 0x04f,
	swOffsetEnd	 	= 0x05f,
	fwOffsetEnd 	= 0x18f,
	bpsTrip			= 0x012,
	remoteSD		= 0x030,		// Radio controlled car shutdown (soft)
	remoteRS		= 0x031,		// Radio controlled untrip (soft)
	remoteDS		= 0x032,		// Radio controlled trip disable (soft)
	remoteES		= 0x033,		// Radio controlled trip enable (soft)
	battQCount		= 0x200,		// Battery net Coulomb count
	battPwr			= 0x201,		// Battery power
	motorPwr		= 0x202,		// Motor power
	lpBusPwr		= 0x203,		// Low power bus power
	pptAPwr			= 0x20A,		// PPT A Power
	pptBPwr			= 0x20B,		// PPT B Power
	pptCPwr			= 0x20C,		// PPT C Power
	voltOffset		= 0x350,		// Note the index of first module voltage at 0x350
	voltOffsetEnd	= 0x358,
	tempOffset 		= 0x580,		// Note the index of first temperature is at 0x580
	tempOffsetEnd	= 0x58f,
	bpsTempOffset2 	= 0x590,
	MCBtempOffset	= 0x540,
	LOG_FRAME_0_RL	= 0x05048225,
	LOG_FRAME_0_RR	= 0x05048245,
	LOG_FRAME_0_FL	= 0x05048265,
	LOG_FRAME_0_FR	= 0x05048285,
	LOG_FRAME_1_RL	= 0x05148225,
	LOG_FRAME_1_RR	= 0x05148245,
	LOG_FRAME_1_FL	= 0x05148265,
	LOG_FRAME_1_FR	= 0x05148285,
	LOG_FRAME_2_VM	= 0x05248228,
	WS22_BUS_MES	= 0x402,
	WS22_VELO_MES	= 0x403,
};

const muduleNames = {
	1: "CC",
	2: "MCI",
	3: "BPS",
	4: "ADS",
	6: "RDL",
}

class SolarCar extends EventEmitter{
	constructor(parser, encoder){
		super();
		this.frameBank = [];
		this.arrVolt = [];
		this.arrCurr = [];
		this.arrPow = [];
		this.cellT = [];
		this.cellV = [];
		this.tripBuf = [];
		if(parser instanceof CanParser){
			this.parser = canParser;
			this.attach(parser);
		}else{

		}
	}

	attachParser(parser){
		parser.on('frame', this._processFrame);
	}

	attachEncoder(encoder){

	}

	_processFrame(frm){
		this.frameBank[frm.id] = frm;
		if(frm.id == canID.battPwr){ //psb
			this.battVolt = frm.data.readInt32BE(0)/1E6;
			this.battCurr = frm.data.readInt32BE(4)/1E6;
		}else if(frm.id >= canID.pptAPwr && frm.id <= canID.pptCPwr){ //ads
			this.arrVolt[frm.id-canID.pptAPwr] = frm.data.readInt32BE(0)/1E6;
			this.arrCurr[frm.id-canID.pptAPwr] = frm.data.readInt32BE(4)/1E6;
			this.arrPow[frm.id-canID.pptAPwr] = this.arrCurr[frm.id-canID.pptAPwr]*this.arrVolt[frm.id-canID.pptAPwr];
		}else if(frm.id >= canID.tempOffset && frm.id <= canID.tempOffsetEnd){ //cellT
			this.cellT[(frm.id-canID.tempOffset)*2+0] = frm.data.readInt32BE(0)/1E6;
			this.cellT[(frm.id-canID.tempOffset)*2+1] = frm.data.readInt32BE(4)/1E6;
		}else if(frm.id >= canID.voltOffset && frm.id <= canID.voltOffsetEnd){ //cellV
			for(let i=0; i<4; i++){
				this.cellV[(frm.id-canID.voltOffset)*4+i] = frm.data.readUInt16BE(i*2)/1E4;
			}
		}else if(frm.id == canID.bpsTrip){ //trip!
			this.tripBuf.push(frm);
		}else if(frm.id >= canID.fwOffset && frm.id <= canID.fwOffsetEnd){ //FW

		}else if(frm.id >= canID.swOffset && frm.id <= canID.swOffsetEnd){ //SW

		}else if(frm.id >= canID.p2pOffset && frm.id <= canID.p2pOffsetEnd){ //p2p

		}else if(frm.id == MCBtempOffset){ // MCB temp 1

		}else if(frm.id == MCBtempOffset+1){ //MCB temp 2

		}else if(frm.id == bpsTempOffset2){ // BPS misc temp

		}
	}

	get battPow(){
		return this.battCurr*this.battVolt;
	}
}

class CanModule{
	constructor(ID, name, solarCar){
		super();
		this._FW = 0;
		this._connState = connState.DISCONNECTED;
		this._SW = nodeState.INIT;
		if(ID) this.ID = ID;
		if(name) this.name = name;
	}

	set FW(fw){this._FW = fw;}
	get FW(){return this._FW;}

	set connState(cs){this._connState = cs;}
	get connState(){return this._connState;}

	set SW(sw){this._SW = sw;}
	get SW(){return this._SW;}

	set solarCar(sc){this._solarCar = sc;}
	get SolarCar(){return this._solarCar;}
}

module.exports = SolarCar;
module.exports.connState = connState;
module.exports.nodeState = nodeState;
module.exports.nodeCommand = nodeCommand;
module.exports.nodeID = nodeID;
module.exports.canID = canID;
module.exports.muduleNames = muduleNames;
