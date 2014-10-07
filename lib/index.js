var events = require('events');
var util = require('util');
var SPI = require('spi');
var gpio = require('r-pi-gpio');


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
var CONFIG_INIT_BYTE9 = 0xdb; // 16MHz XOF, UP_CLK_EN off

var bufferize = function(value) {
	return util.isArray(value) ? new Buffer(value) : value;
};

var Nrf905 = function(options) {
	var self = this;
	events.EventEmitter.call(this);
	options = options || {};
	var pin_DR = gpio.input(options.pin_DR || 18);
	var pin_PWR_UP = gpio.output(options.pin_PWR_UP || 12);
	var pin_TRX_CE = gpio.output(options.pin_TRX_CE || 15);
	var pin_TX_EN = gpio.output(options.pin_TX_EN || 11);
	var spi = new SPI.Spi(options.dev || '/dev/spidev0.0', {
		maxSpeed: 1024 * 1024
	});
	spi.open();
	pin_PWR_UP(true);
	pin_TRX_CE(false);
	pin_TX_EN(false);

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
		bufferize(data).copy(txbuf, 1);
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
				bufferize(value).copy(txbuf);
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
			bufferize(value).copy(txbuf, 1);
			spiWrite(txbuf, function(device, buf) {
				cb(buf[0]);
			});
		}
	};

	var interval = null;

	self.send = function(data, cb) {
		pin_TX_EN(true);
		self.writeConfig([ data.length ], 4, function(status, buf) {
			var txbuf = new Buffer(data.length + 1);
			txbuf[0] = CMDS.W_TX_PAYLOAD;
			bufferize(data).copy(txbuf, 1);
			spiWrite(txbuf, function() {
				clearInterval(interval);
				interval = setInterval(function() {
					if (pin_DR()) {
						clearInterval(interval);
						pin_TRX_CE(false);
						interval = null;
						cb();
					}
				}, 0);
				pin_TRX_CE(true);
			});
		});
	};

	self.receive = function(length, cb) {
		self.writeConfig([ length ], 3, function(status, buf) {
			clearInterval(interval);
			interval = setInterval(function() {
				if (pin_DR()) {
					clearInterval(interval);
					pin_TRX_CE(false);
					var txbuf = new Buffer(length + 1);
					txbuf[0] = CMDS.R_RX_PAYLOAD;
					spiWrite(txbuf, cb);
				}
			}, 0);
			pin_TX_EN(false);
			pin_TRX_CE(true);
		});
	};

	return self;
};

util.inherits(Nrf905, events.EventEmitter);

module.exports = function(options, cb) {
	var nrf = new Nrf905(options);
	nrf.writeConfig([CONFIG_INIT_BYTE9], 9, function() {
		cb(null, nrf);
	});
};