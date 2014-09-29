var radio = require("./lib/nrf905");
radio = radio.nrf905;


radio.readRX();

radio.on("R_RX_PAYLOAD", function(buffer){
	console.log(new Buffer(buffer).toString());
});