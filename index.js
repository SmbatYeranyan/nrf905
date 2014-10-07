var nrf905 = require("./lib");

nrf905({
	dev: '/dev/spidev0.0',
	pin_DR: 18, /* gpio 24 */
	pin_PWR_UP: 12, /* gpio 18 */
	pin_TRX_CE: 15, /* gpio 22 */
	pin_TX_EN: 11 /* gpio 17 */
}, function(err, radio) {
	radio.readConfig(function(status, config) {
		console.log('config', config);
		radio.receive(32, function(data) {
			console.log('recv', data);
		});
	});
});