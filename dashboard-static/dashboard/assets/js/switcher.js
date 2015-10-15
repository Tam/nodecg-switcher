(function (window) {
	"use strict";

	// Globals
	var SCENES_CONTAINER = {
			el: document.getElementById('scenes'),
			clear: function () {
				this.el.innerHTML = '';
			},
			append: function (node) {
				this.el.appendChild(node);
			}
		};

	//var	scenes = SCENES_CONTAINER.querySelectorAll('a');
	//
	//// Scenes on click
	//[].slice.call(scenes).forEach(function (el) {
	//	el.addEventListener('click', function (e) {
	//		e.preventDefault();
	//
	//		var currentActive = SCENES_CONTAINER.querySelector('.active');
	//		if (currentActive) currentActive.classList.remove('active');
	//
	//		el.classList.add('active');
	//	});
	//});

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

			request.onerror = failCallback;

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
		// TODO: Fix this
		addPlaceholders: function (sceneCount) {
			var placeholderCount = (Math.ceil(sceneCount / 4) * 4) % sceneCount,
				placeholder = document.createElement('span');
			for (var i = 0; i < placeholderCount; i++) SCENES_CONTAINER.append(placeholder.cloneNode(false));
		}
	};

	var vMix = {
		scenes: {},
		apiUrl: '127.0.0.1:8088',
		api: function (params, successCallback, failCallback) {
			var urlParams = "";

			if (params && params !== {}) {
				for (var key in params) {
					if (params.hasOwnProperty(key)) {
						if (urlParams !== "") urlParams += "&";
						urlParams += key + "=" + encodeURIComponent(params[key]);
					}
				}

				urlParams = '?' + urlParams;
			}

			Helpers.get('http://' + vMix.apiUrl + '/api/' + urlParams, successCallback, failCallback);
		},
		switchScenes: function (newSceneId) {
			console.log('Switching to %s', newSceneId);
		},
		updateScenes: function () {
			this.api(null, function (res) {
				var scenes = Helpers.parseXML(res).inputs,
					scene = document.createElement('a'),
					sceneCount = 0;
				scene.setAttribute('href', '#');
				scene.addEventListener('click', function (e) {
					e.preventDefault();
					console.dir(this);
				});

				SCENES_CONTAINER.clear();

				for (var sName in scenes) {
					var s = scenes[sName],
						n = scene.cloneNode(false);

					n.setAttribute('data-id', s.key);
					n.innerText = s.title;

					SCENES_CONTAINER.append(n);

					sceneCount++;
				}

				Helpers.addPlaceholders(sceneCount);
			}, function () {
				console.error('[Switcher]', 'Unable to update vMix scenes!');
			});
		},
		init: function () {
			// TODO: Add connection check!
			var checkForSceneChanges = function () {
				vMix.updateScenes();

				setTimeout(checkForSceneChanges, 1000);
			};
			checkForSceneChanges();
		}
	};

	// TODO: Check settings to work out what software to target. Make switchable on the fly?
	vMix.init();
})(window);