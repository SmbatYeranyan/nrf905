var util = require('util');
var SPI = require('pi-spi');
var GPIO = require('pi-pins');


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
var DEFAULT_CONFIG = [0x6a, 0x00, 0x44, 0x20, 0x20, 0xe7, 0xe7, 0xe7, 0xe7, 0xdb]; // 16MHz XOF, UP_CLK_EN off

var bufferize = function(value) {
	return util.isArray(value) ? new Buffer(value) : value;
};

var Nrf905 = function(options) {
	options = options || {};

	var pin_DR = GPIO.connect(options.pin_DR || 18);
	var pin_PWR_UP = GPIO.connect(options.pin_PWR_UP || 12);
	var pin_TRX_CE = GPIO.connect(options.pin_TRX_CE || 15);
	var pin_TX_EN = GPIO.connect(options.pin_TX_EN || 16);
	var spi = SPI.initialize(options.dev || '/dev/spidev0.0');

	pin_DR.mode('in');
	pin_PWR_UP.mode('out');
	pin_TRX_CE.mode('out');
	pin_TX_EN.mode('out');
	pin_PWR_UP.value(true);
	pin_TRX_CE.value(false);
	pin_TX_EN.value(false);

	var self = this;

	self.config = function(data, offset, callback) {
		var readonly = false;
		if (typeof offset === 'function') {
			callback = offset;
			offset = data;
			readonly = true;
		}
		var txbuf = new Buffer(CONFIG_REG_SIZE - offset + 1);
		txbuf.fill(0);
		txbuf[0] = CMDS.R_CONFIG | offset;
		spi.transfer(txbuf, txbuf.length, function(err, buf) {
			if (err || readonly)
				return callback(err, buf);
			buf[0] = CMDS.W_CONFIG | offset;
			data.copy(buf, 1);
			spi.transfer(buf, buf.length, callback);
		});
	};

	self.RXAddress = function(value, callback) {
		self.config(5, function(err, buf) {
			if (err || typeof value === 'function')
				return value(err, buf && buf.slice(0, 4));
			var txbuf = new Buffer(5);
			bufferize(value).copy(txbuf);
			txbuf[4] = buf[buf.length - 1];
			self.config(txbuf, 5, callback);
		});
	};

	self.TXAddress = function(value, callback) {
		var txbuf;
		if (typeof value === 'function') {
			txbuf = new Buffer(4 + 1);
			txbuf.fill(0);
			txbuf[0] = CMDS.R_TX_ADDRESS;
			spi.transfer(txbuf, txbuf.length, value);
		} else {
			txbuf = new Buffer(value.length + 1);
			txbuf[0] = CMDS.W_TX_ADDRESS;
			bufferize(value).copy(txbuf, 1);
			spi.transfer(txbuf, txbuf.length, callback);
		}
	};

	self.send = function(data, callback) {
		self.config([data.length], 4, function(err) {
			if (err) return callback(err);
			var txbuf = new Buffer(data.length + 1);
			txbuf[0] = CMDS.W_TX_PAYLOAD;
			bufferize(data).copy(txbuf, 1);
			spi.transfer(txbuf, txbuf.length, function(err) {
				if (err) return callback(err);
				pin_DR.removeAllListeners();
				pin_DR.once('rise', function() {
					pin_TRX_CE.value(false);
					callback(null);
				});
				pin_TX_EN.value(true);
				pin_TRX_CE.value(true);
			});
		});
	};

	self.receive = function(length, callback) {
		self.config([length], 3, function(err) {
			if (err) return callback(err);
			pin_DR.removeAllListeners();
			pin_DR.once('rise', function() {
				pin_TRX_CE.value(false);
				var txbuf = new Buffer(length + 1);
				txbuf[0] = CMDS.R_RX_PAYLOAD;
				spi.transfer(txbuf, txbuf.length, callback);
			});
			pin_TX_EN.value(false);
			pin_TRX_CE.value(true);
		});
	};

	return self;
};

module.exports = function(options, cb) {
	var nrf = new Nrf905(options);
	nrf.config(DEFAULT_CONFIG, 0, function(err) {
		cb(err, nrf);
	});
};