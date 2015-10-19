(function (window) {
	'use strict';

	/**
	 * Settings
	 */
	var settings = {
		el: window.top.document.getElementById('nodecg-switcher_switcherSettings'),
		toast: window.top.document.getElementById('toast'),
		save: function () {
			this.el.close();
			this.toast.text = 'Switcher Settings Saved!';
			this.toast.show();
		},
		init: function () {
			document.getElementById('save').addEventListener('click', function () {
				settings.save();
			});
		}
	};

	settings.init();
})(window);
