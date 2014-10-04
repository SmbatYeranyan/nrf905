var radio = require("./lib/nrf905");
radio = radio.nrf905;


radio.writeConfigSpi();
setInterval(function(){
	radio.readConfigSpi();

}, 2000)