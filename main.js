var nrf905 = require("./lib/nrf905");


var radio = nrf905();

radio.readConfig(function(status, config) {
	console.log(status, config);
});