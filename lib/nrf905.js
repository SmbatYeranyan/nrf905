var SPI = require('spi');
var events = require('events');
var util = require('util');

var CMDS = {
	W_CONFIG: 0x00, // 0000 AAAA
	R_CONFIG: 0x10, // 0001 AAAA
	W_TX_PAYLOAD: 0x20, // 0010 0000
	R_TX_PAYLOAD: 0x21, // 0010 0001
	W_TX_ADDRESS: 0x22, // 0010 0010
	R_TX_ADDRESS: 0x23, // 0010 0011
	R_RX_PAYLOAD: 0x24, // 0010 0100
	CHANNEL_CONFIG: 0x8000, // 1000 pphc cccc cccc
};

var CONFIG_REG_SIZE = 10;

var Nrf905 = function(options) {
	options = options || {};
	events.EventEmitter.call(this);

	var self = this;

	var spi = new SPI.Spi(options.dev || '/dev/spidev0.0', {
		'mode': SPI.MODE.MODE_0,
		'chipSelect': SPI.CS.none
	});
	spi.open();

	self.readConfig = function(offset, cb) {
		if (typeof offset === 'function') {
			cb = offset;
			offset = 0;
		} else {
			offset = offset || 0;
		}
		var size = CONFIG_REG_SIZE - offset + 1;
		var txbuf = new Buffer(size);
		var rxbuf = new Buffer(size);
		txbuf[0] = CMDS.R_CONFIG | offset;
		spi.transfer(txbuf, rxbuf, function(device, buf) {
			cb(buf[0], buf.slice(1));
		});
	};

	self.writeConfig = function(data, offset, cb) {
		if (typeof offset === 'function') {
			offset = 0;
			cb = offset;
		} else {
			offset = offset || 0;
		}
		var txbuf = new Buffer(CONFIG_REG_SIZE - offset + 1);
		txbuf[0] = CMDS.W_CONFIG | offset;
		data.copy(txbuf, 1);
		var rxbuf = new Buffer(1);
		spi.transfer(txbuf, rxbuf, function(device, buf) {
			cb(buf[0]);
		});
	};
};

util.inherits(Nrf905, events.EventEmitter);

module.exports = function(options) {
	return new Nrf905(options);
};