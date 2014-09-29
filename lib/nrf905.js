var events = require('events');

function nrf905(){
	events.EventEmitter.call(this);
	
	var SPI = require('spi');
	var self = this;
		
	self.cmds = {
		W_CONFIG: 0x00,	// 0000 AAAA
		R_CONFIG: 0x10,	// 0001 AAAA
		W_TX_PAYLOAD: 0x20, // 0010 0000
		R_TX_PAYLOAD: 0x21, // 0010 0001
		W_TX_ADDRESS: 0x22, // 0010 0010
		R_TX_ADDRESS: 0x23, // 0010 0011
		R_RX_PAYLOAD: 0x24, // 0010 0100
		CHANNEL_CONFIG: 0x8000, // 1000 pphc cccc cccc
	}
	
	var spi = new SPI.Spi('/dev/spidev0.1', {
	    'mode': SPI.MODE['MODE_0'],  
	    'chipSelect': SPI.CS['none'] 
	  }, function(s){s.open();});



	function readSpi(command, callback){
		var buffer = new Buffer(command);
		spi.read(buffer, function(device, buffer2) {
			callback(buffer);
		});
		
	}


	self.readRX = function(){
		readSpi(cmds.R_TX_PAYLOAD, function(buffer){
			self.emit("R_RX_PAYLOAD", buffer);
		});
	}
}

nrf905.prototype.__proto__ = events.EventEmitter.prototype;

exports.nrf905 = new nrf905();
