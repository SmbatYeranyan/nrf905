var events = require('events');
var util = require('util');
var SPI = require('spi');


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
		maxSpeed: 1024 * 1024
	});
	spi.open();

	var spiWrite = function(txbuf, cb) {
		var rxbuf = new Buffer(txbuf.length);
		rxbuf.fill(0);
		spi.transfer(txbuf, rxbuf, cb);
	};

	self.readConfig = function(offset, cb) {
		if (typeof offset === 'function') {
			cb = offset;
			offset = 0;
		} else {
			offset = offset || 0;
		}
		var txbuf = new Buffer(CONFIG_REG_SIZE - offset + 1);
		txbuf.fill(0);
		txbuf[0] = CMDS.R_CONFIG | offset;
		spiWrite(txbuf, function(device, buf) {
			cb(buf[0], buf.slice(1));
		});
	};

	self.writeConfig = function(data, offset, cb) {
		if (typeof offset === 'function') {
			cb = offset;
			offset = 0;
		} else {
			offset = offset || 0;
		}
		var txbuf = new Buffer(CONFIG_REG_SIZE - offset + 1);
		txbuf.fill(0);
		txbuf[0] = CMDS.W_CONFIG | offset;
		data.copy(txbuf, 1);
		spiWrite(txbuf, function(device, buf) {
			cb(buf[0]);
		});
	};

	self.RXAddress = function(value, cb) {
		self.readConfig(5, function(status, buf) {
			if (typeof value === 'function') {
				value(buf.slice(0, 4));
			} else {
				var txbuf = new Buffer(5);
				if (util.isArray(value)) {
					value = new Buffer(value);
				}
				value.copy(txbuf);
				txbuf[4] = buf[buf.length - 1];
				self.writeConfig(txbuf, 5, cb);
			}
		});
	};

	self.TXAddress = function(value, cb) {
		var txbuf;
		if (typeof value === 'function') {
			txbuf = new Buffer(4 + 1);
			txbuf.fill(0);
			txbuf[0] = CMDS.R_TX_ADDRESS;
			spiWrite(txbuf, function(device, buf) {
				value(buf[0], buf.slice(1));
			});
		} else {
			txbuf = new Buffer(value.length + 1);
			txbuf[0] = CMDS.W_TX_ADDRESS;
			if (util.isArray(value)) {
				value = new Buffer(value);
			}
			value.copy(txbuf, 1);
			spiWrite(txbuf, function(device, buf) {
				cb(buf[0]);
			});
		}
	};

	self.send = function(data, cb) {
	};

	self.receive = function(data, cb) {
	};

	return self;
};

util.inherits(Nrf905, events.EventEmitter);

module.exports = function(options) {
	return new Nrf905(options);
};