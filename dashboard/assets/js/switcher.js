(function (window) {
	'use strict';

	// Globals
	var PANEL = document.getElementById('panelSwitcher'),
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
			show: function () {
				var self = this;

				if (this.el.classList.contains('visible')) {
					this.hide();

					setTimeout(function () {
						self.el.classList.add('visible');
					}, 250);
				} else {
					this.el.classList.add('visible');
				}

				setTimeout(function () {
					self.hide();
				}, 10000);

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
		apiUrl: '127.0.0.1:8088',
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

	function nav () {
		var n = PANEL.getElementsByTagName('nav')[0],
			a = n.getElementsByTagName('a');

		[].slice.call(a).forEach(function (el) {
			el.addEventListener('click', function (e) {
				e.preventDefault();

				if (!el.classList.contains('active')) {
					var active = n.getElementsByClassName('active')[0];
					if (active) active.classList.remove('active');

					el.classList.add('active');

					switch (el.getAttribute('data-s')) {
						case 'vmix':
							obs.terminate();
							vMix.init();
							break;
						case 'obs':
							vMix.terminate();
							obs.init();
					}
				}
			});
		});
	}

	nav();
	vMix.init();
})(window);