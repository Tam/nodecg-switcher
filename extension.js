'use strict';

var fs = require('fs');

var defaultConfig = {
	vmix: {
		enabled: false,
		ip: '127.0.0.1',
		port: 8088
	},
	obs: {
		enabled: false,
		ip: '127.0.0.1',
		port: 4444
	}
};

var config;

module.exports = function (nodecg) {

	// Default Config
	if (!nodecg.bundleConfig) {
		fs.writeFile('cfg/nodecg-switcher.json', JSON.stringify(defaultConfig), function (err) {
			if (err) throw err;
			nodecg.log.info('Saved default config');
		});

		config = defaultConfig;
	} else {
		config = nodecg.bundleConfig;
	}

	var configRep = nodecg.Replicant('config', config);
	
	configRep.on('change', function (oldVal, newVal) {
		if (oldVal !== newVal) {

			config = newVal;

			fs.writeFile('cfg/nodecg-switcher.json', JSON.stringify(config), function (err) {
				if (err) throw err;
				nodecg.log.info('Saved config');
			});

		}
	});

};