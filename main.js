var radio = require("./lib/nrf905");
radio = radio.nrf905;



radio.read(radio.cmds.R_TX_PAYLOAD, function(buffer){
	console.log(buffer);
});