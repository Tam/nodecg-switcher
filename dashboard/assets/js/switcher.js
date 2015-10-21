(function (window) {
	'use strict';

	// Globals
	var PANEL = document.getElementById('panelSwitcher'),
		SETTINGS_MODAL = window.top.document.getElementById('nodecg-switcher_switcherSettings'),
		SCENES_CONTAINER = {
			el: document.getElementById('scenes'),
			clear: function () {
				this.el.innerHTML = '';
			},
			append: function (node) {
				this.el.appendChild(node);
			},
			active: function () {
				return this.el.getElementsByClassName('active')[0];
			}
		},
		ERROR = {
			el: PANEL.getElementsByClassName('error')[0],
			isVisible: false,
			name: '',
			show: function (timeout) {
				var self = this;
				timeout = timeout || 10000;

				if (this.el.classList.contains('visible')) {
					this.hide();

					setTimeout(function () {
						self.el.classList.add('visible');
					}, 250);
				} else {
					this.el.classList.add('visible');
				}

				if (timeout !== -1) {
					setTimeout(function () {
						self.hide();
					}, timeout);
				}

				console.error('[Switcher]', this.el.innerText);
				this.isVisible = true;

				return this;
			},
			hide: function () {
				this.el.classList.remove('visible');
				this.isVisible = false;
				this.name = '';
				return this;
			},
			set: function (text, name) {
				var self = this;

				this.el.innerText = text;
				if (name) this.name = name;

				this.el.addEventListener('click', function () {
					self.hide();
				});

				return this;
			}
		};

	/**
	 * Helpers
	 */
	var Helpers = {
		get: function (url, successCallback, failCallback) {
			var request = new XMLHttpRequest();

			request.onload = function () {
				if (request.status >= 200 && request.status < 400)
					if (successCallback) successCallback(request.responseText);
					else if (failCallback) failCallback();
			};

			request.onerror = function () {
				if (failCallback) failCallback();
			};

			request.open('GET', url, true);
			request.send();
		},
		parseXML: function (xml) {
			var raw = (new window.DOMParser()).parseFromString(xml, 'text/xml').documentElement;

			function parseNode(node) {
				var nodeObj = {};

				if (node.childElementCount) {
					for (var i = 0; i < node.childNodes.length; i++) {
						var child = node.childNodes[i],
							childName = child.nodeName;
						if (nodeObj.hasOwnProperty(childName)) childName = childName + '_' + i;
						nodeObj[childName] = parseNode(child);
					}
				} else {
					if (node.innerHTML) nodeObj.text = node.innerHTML;
				}

				if (node.attributes && node.attributes.length) {
					for (var name in node.attributes) {
						if (node.attributes.hasOwnProperty(name)) {
							var nodeName = node.attributes[name].nodeName,
								origName = name;
							if (nodeObj.hasOwnProperty(nodeName)) nodeName = nodeName + '_attr';
							nodeObj[nodeName] = node.attributes[origName].value;
						}
					}
				}

				return nodeObj;
			}

			return parseNode(raw);
		},
		addPlaceholders: function (sceneCount) {
			var placeholderCount = (sceneCount > 0) ? sceneCount % 4 : 4,
				placeholder = document.createElement('span');
			for (var i = 0; i < placeholderCount; i++) SCENES_CONTAINER.append(placeholder.cloneNode(false));
		}
	};

	/**
	 * vMix
	 */
	var vMix = {
		scenes: {},
		activeScene: '',
		apiUrl: '192.168.0.6:8088',
		isInitialized: false,
		hasConnection: false,
		activeTimeout: null,
		api: function (params, successCallback, failCallback) {
			var urlParams = '';

			if (params && params !== {}) {
				for (var key in params) {
					if (params.hasOwnProperty(key)) {
						if (urlParams !== '') urlParams += '&';
						urlParams += key + '=' + encodeURIComponent(params[key]);
					}
				}

				urlParams = '?' + urlParams;
			}

			Helpers.get('http://' + vMix.apiUrl + '/api/' + urlParams, successCallback, function () {
				vMix.hasConnection = false;
				failCallback();
			});
		},
		checkConnection: function () {
			vMix.api(null, function () {
				vMix.hasConnection = true;
				if (ERROR.name === 'vMixConnectionError') ERROR.hide();
				vMix.loop();
			}, function () {
				vMix.hasConnection = false;
				if (vMix.isInitialized) vMix.activeTimeout = setTimeout(vMix.checkConnection, 5000);
			});
		},
		switchScenes: function (newSceneId, el) {
			if (newSceneId !== vMix.activeScene) {
				vMix.api({
					'Function': 'Cut',
					//'Duration': 0,
					'Input': newSceneId
				}, function () {
					var currentActive = SCENES_CONTAINER.active();
					if (currentActive) currentActive.classList.remove('active');

					el.classList.add('active');

					vMix.activeScene = newSceneId;
				}, function () {
					if (ERROR.name !== 'vMixSceneSwitchError')
						ERROR.set('Unable to switch scenes!', 'vMixSceneSwitchError').show();
				});
			}
		},
		updateScenes: function () {
			this.api(null, function (res) {
				var raw = Helpers.parseXML(res),
					scenes = raw.inputs,
					active = parseInt(raw.active.text),
					sName = '',
					vMixScenes = {};

				for (sName in scenes) if (scenes.hasOwnProperty(sName)) vMixScenes[sName] = scenes[sName];

				if (JSON.stringify(vMixScenes) !== JSON.stringify(vMix.scenes) ||
					scenes[Object.keys(scenes)[active-1]].key !== vMix.activeScene) {
					vMix.scenes = vMixScenes;

					var scene = document.createElement('a'),
						sceneCount = 0;

					scene.setAttribute('href', '#');

					var clickEvent = function (el, key) {
						el.addEventListener('click', function (e) {
							e.preventDefault();
							vMix.switchScenes(key, el);
						}, true);
					};

					SCENES_CONTAINER.clear();

					var i = 0;
					for (sName in scenes) {
						if (scenes.hasOwnProperty(sName)) {
							i++;
							var s = scenes[sName],
								n = scene.cloneNode(true);

							n.setAttribute('data-id', s.key);
							n.innerText = s.title;
							clickEvent(n, s.key);
							if (i === active) {
								n.classList.add('active');
								vMix.activeScene = s.key;
							}

							SCENES_CONTAINER.append(n);

							sceneCount++;
						}
					}

					Helpers.addPlaceholders(sceneCount);
				}
			}, function () {
				SCENES_CONTAINER.clear();
				Helpers.addPlaceholders(0);
				if (ERROR.name !== 'vMixSceneUpdateError' && vMix.hasConnection)
					ERROR.set('Unable to update vMix scenes!', 'vMixSceneUpdateError').show();
			});
		},
		loop: function () {
			if (vMix.isInitialized) {
				if (vMix.hasConnection) {
					vMix.updateScenes();

					vMix.activeTimeout = setTimeout(vMix.loop, 1000);
				} else {
					vMix.checkConnection();
					SCENES_CONTAINER.clear();
					Helpers.addPlaceholders(0);
					console.log(ERROR);
					if (ERROR.name !== 'vMixConnectionError')
						ERROR.set('Unable to connect to vMix!', 'vMixConnectionError').show();
				}
			}
		},
		init: function () {
			this.isInitialized = true;
			this.checkConnection();
			this.loop();
		},
		terminate: function () {
			this.isInitialized = false;
			this.scenes = {};
			this.activeScene = '';
			clearTimeout(vMix.activeTimeout);
			ERROR.hide();
		}
	};

	/**
	 * OBS
	 */
	var obs = {
		isInitialized: true,
		init: function () {
			this.isInitialized = true;
			SCENES_CONTAINER.clear();
			Helpers.addPlaceholders(0);
		},
		terminate: function () {
			this.isInitialized = false;
			ERROR.hide();
		}
	};

	/**
	 * Nav
	 */
	var nav = {
		el: PANEL.getElementsByTagName('nav')[0],
		items: {},
		addItem: function (name, label, click) {
			var a = document.createElement('a');
			a.setAttribute('href', '#');
			a.innerText = label;
			a.addEventListener('click', function (e) {
				e.preventDefault();
				click();
			});
			a.setActive = function () {
				var currActive = nav.el.getElementsByClassName('active')[0];
				if (currActive) currActive.classList.remove('active');
				this.classList.add('active');
			};

			this.items[name] = a;
			this.el.appendChild(a);
		}
	};

	/**
	 * Panel
	 */
	var panel = {
		el: window.top.document.getElementById('nodecg-switcher_switcher'),
		init: function () {
			var button = window.top.document.createElement('paper-icon-button');
			button.icon = 'settings';

			button.addEventListener('click', function () {
				SETTINGS_MODAL.open();
			});

			var infoButton = this.el.querySelector('paper-icon-button#infoBtn');
			infoButton.parentNode.insertBefore(button, infoButton);
		}
	};

	/**
	 * Init!
	 */
	function init() {
		panel.init();
		ERROR.set('No software enabled, please check settings!').show(-1);

		nav.addItem('vmix', 'vMix', function () {
			nav.items.vmix.setActive();
			vMix.init();
			obs.terminate();
		});
		nav.addItem('obs', 'OBS', function () {
			nav.items.obs.setActive();
			vMix.terminate();
			obs.init();
		});

		nav.items.obs.setActive();
	}

	init();

	// Settings
	function settings() {
		Helpers.get('settings_modal.html', function (data) {
			data = data.replace(/(\r\n|\n|\r)/gm,'');

			var parser = new DOMParser(),
				doc = parser.parseFromString(data, 'text/html');

			var modal = doc.body.firstChild;
			window.top.document.body.appendChild(modal);
		});
	}
	settings();
})(window);