/*
 ,
 {
 "name": "switcherSettings",
 "title": "Switcher Settings",
 "file": "settings.html",
 "width": 3,
 "dialog": true
 }
 */

(function (window) {
	'use strict';

	// Config
	var config = window.nodecg.Replicant('config');

	// TODO: Find out why Replicants aren't working...
	console.log(config);

	/**
	 * Settings
	 */
	var settings = {
		el: window.top.document.getElementById('nodecg-switcher_switcherSettings'),
		toast: window.top.document.getElementById('toast'),
		vmix: {
			ip: document.getElementById('vMixIpAddress'),
			port: document.getElementById('vMixPort'),
			init: function () {
				//
			}
		},
		save: function () {
			this.el.close();
			this.toast.text = 'Switcher Settings Saved!';
			this.toast.show();
		},
		init: function () {
			document.getElementById('save').addEventListener('click', function () {
				settings.save();
			});

			this.vmix.init();
		}
	};

	settings.init();
})(window);
