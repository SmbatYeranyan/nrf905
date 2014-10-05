var nrf905 = require("./lib");

var radio = nrf905({
	dev: '/dev/spidev0.0',
	pin_DR: 18, /* gpio 24 */
	pin_PWR_UP: 16, /* gpio 23 */
	pin_TRX_CE: 15, /* gpio 22 */
	pin_TX_EN: 11 /* gpio 17 */
});

radio.readConfig(function(status, config) {
	console.log(status, config);
});
