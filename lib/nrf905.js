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
	
	var spi = new SPI.Spi('/dev/spidev0.0', {
	    'mode': SPI.MODE['MODE_0'],  
	    'chipSelect': SPI.CS['none'] 
	  }, function(s){});

	spi.maxSpeed(106000); // in Hz
	spi.open();


	function readConfig(){
		var buffer = new Buffer(0x10);
		spi.read(buffer, function(device, buffer2) {
			console.log(buffer2);
			console.log(new Buffer(buffer));
		});
		
	}


	function writeConfig(){

		var buf = new Buffer([ 0x10, 0x4C, 0x0C,0x44,0x20,0x20, 0x1C,0x1C,0x1C,0x1C, 0x58]);
		spi.write(buf, function(device, buf2) {
			var s = "";
			for (var i=0; i < buf.length; i++)
			s = s + buf[i] + " ";
			console.log(s);
		});

	}

	self.writeConfig = function(){
		writeConfig();
	}

	self.read = function(cmd, callback){
		readSpi(cmd, function(buffer){
			callback(buffer);
		});
	}

}

nrf905.prototype.__proto__ = events.EventEmitter.prototype;

exports.nrf905 = new nrf905();
