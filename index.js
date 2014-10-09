var nrf905 = require("./lib");

nrf905({
	dev: '/dev/spidev0.0',
	pin_DR: 18, /* gpio 24 */
	pin_PWR_UP: 12, /* gpio 18 */
	pin_TRX_CE: 15, /* gpio 22 */
	pin_TX_EN: 16 /* gpio 23 */
}, function(err, radio) {
	radio.config(0, function(err, config) {
		console.log('config', err, config);
		radio.receive(32, function(err, data) {
			console.log('recv', err, data);
		});
	});
});