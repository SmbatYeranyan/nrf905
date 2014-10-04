var nrf905 = require("./lib/nrf905");


var radio = nrf905();

radio.readConfig(function(config) {
	console.log(config);
});