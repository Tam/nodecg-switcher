(function () {
	'use strict';

	var panels = document.getElementsByClassName('panel');

	function toggle(a, panel) {
		a.addEventListener('click', function (e) {
			e.preventDefault();

			if (panel.classList.contains('minimize')) {
				panel.classList.remove('minimize');
				setTimeout(function () {
					panel.classList.remove('hide-content');
				}, 400);
			} else {
				panel.classList.add('hide-content');
				setTimeout(function () {
					panel.classList.add('minimize');
				}, 250);
			}
		});
	}

	function panelControls(panel) {
		var controls = panel.querySelectorAll('.controls a');

		[].slice.call(controls).forEach(function (el) {
			switch (el.className) {
				case 'toggle':
					toggle(el, panel);
					break;
				//case 'move':
				//	//
				//	break;
				case 'settings':
					el.addEventListener('click', function (e) {
						e.preventDefault();
						document.getElementById(el.getAttribute('data-settings') + '-settings')
							.classList.add('open-settings');
					});
					break;
				//case 'info':
				//	//
				//	break;
				default:
					el.addEventListener('click', function (e) {
						e.preventDefault();
					});
					break;
			}
		});
	}

	function settingsControls() {
		var settingsClose = document.querySelectorAll('.settings-overlay .settings .controls .close');

		[].slice.call(settingsClose).forEach(function (el) {
			el.addEventListener('click', function (e) {
				e.preventDefault();
				el.parentNode.parentNode.parentNode.parentNode.classList.remove('open-settings');
			});
		});
	}

	settingsControls();

	[].slice.call(panels).forEach(function (el) {
		panelControls(el);

		el.style.maxHeight = el.clientHeight + 'px';
	});

	window.addEventListener('resize', function () {
		[].slice.call(panels).forEach(function (el) {
			el.style.maxHeight = '1000px';
			el.style.maxHeight = el.clientHeight + 'px';
		});
	});
})();