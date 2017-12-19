;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

/*! jQuery UI - v1.12.1 - 2017-01-01
* http://jqueryui.com
* Includes: widget.js, position.js, data.js, disable-selection.js, focusable.js, form-reset-mixin.js, jquery-1-7.js, keycode.js, labels.js, scroll-parent.js, tabbable.js, unique-id.js, widgets/draggable.js, widgets/droppable.js, widgets/resizable.js, widgets/selectable.js, widgets/sortable.js, widgets/accordion.js, widgets/autocomplete.js, widgets/button.js, widgets/checkboxradio.js, widgets/controlgroup.js, widgets/datepicker.js, widgets/dialog.js, widgets/menu.js, widgets/mouse.js, widgets/progressbar.js, widgets/selectmenu.js, widgets/slider.js, widgets/spinner.js, widgets/tabs.js, widgets/tooltip.js, effect.js, effects/effect-blind.js, effects/effect-bounce.js, effects/effect-clip.js, effects/effect-drop.js, effects/effect-explode.js, effects/effect-fade.js, effects/effect-fold.js, effects/effect-highlight.js, effects/effect-puff.js, effects/effect-pulsate.js, effects/effect-scale.js, effects/effect-shake.js, effects/effect-size.js, effects/effect-slide.js, effects/effect-transfer.js
* Copyright jQuery Foundation and other contributors; Licensed MIT */

(function(t){"function"==typeof define&&define.amd?define(["jquery"],t):t(jQuery)})(function(t){function e(t){for(var e=t.css("visibility");"inherit"===e;)t=t.parent(),e=t.css("visibility");return"hidden"!==e}function i(t){for(var e,i;t.length&&t[0]!==document;){if(e=t.css("position"),("absolute"===e||"relative"===e||"fixed"===e)&&(i=parseInt(t.css("zIndex"),10),!isNaN(i)&&0!==i))return i;t=t.parent()}return 0}function s(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},t.extend(this._defaults,this.regional[""]),this.regional.en=t.extend(!0,{},this.regional[""]),this.regional["en-US"]=t.extend(!0,{},this.regional.en),this.dpDiv=n(t("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function n(e){var i="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return e.on("mouseout",i,function(){t(this).removeClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&t(this).removeClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&t(this).removeClass("ui-datepicker-next-hover")}).on("mouseover",i,o)}function o(){t.datepicker._isDisabledDatepicker(p.inline?p.dpDiv.parent()[0]:p.input[0])||(t(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),t(this).addClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&t(this).addClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&t(this).addClass("ui-datepicker-next-hover"))}function a(e,i){t.extend(e,i);for(var s in i)null==i[s]&&(e[s]=i[s]);return e}function r(t){return function(){var e=this.element.val();t.apply(this,arguments),this._refresh(),e!==this.element.val()&&this._trigger("change")}}t.ui=t.ui||{},t.ui.version="1.12.1";var h=0,l=Array.prototype.slice;t.cleanData=function(e){return function(i){var s,n,o;for(o=0;null!=(n=i[o]);o++)try{s=t._data(n,"events"),s&&s.remove&&t(n).triggerHandler("remove")}catch(a){}e(i)}}(t.cleanData),t.widget=function(e,i,s){var n,o,a,r={},h=e.split(".")[0];e=e.split(".")[1];var l=h+"-"+e;return s||(s=i,i=t.Widget),t.isArray(s)&&(s=t.extend.apply(null,[{}].concat(s))),t.expr[":"][l.toLowerCase()]=function(e){return!!t.data(e,l)},t[h]=t[h]||{},n=t[h][e],o=t[h][e]=function(t,e){return this._createWidget?(arguments.length&&this._createWidget(t,e),void 0):new o(t,e)},t.extend(o,n,{version:s.version,_proto:t.extend({},s),_childConstructors:[]}),a=new i,a.options=t.widget.extend({},a.options),t.each(s,function(e,s){return t.isFunction(s)?(r[e]=function(){function t(){return i.prototype[e].apply(this,arguments)}function n(t){return i.prototype[e].apply(this,t)}return function(){var e,i=this._super,o=this._superApply;return this._super=t,this._superApply=n,e=s.apply(this,arguments),this._super=i,this._superApply=o,e}}(),void 0):(r[e]=s,void 0)}),o.prototype=t.widget.extend(a,{widgetEventPrefix:n?a.widgetEventPrefix||e:e},r,{constructor:o,namespace:h,widgetName:e,widgetFullName:l}),n?(t.each(n._childConstructors,function(e,i){var s=i.prototype;t.widget(s.namespace+"."+s.widgetName,o,i._proto)}),delete n._childConstructors):i._childConstructors.push(o),t.widget.bridge(e,o),o},t.widget.extend=function(e){for(var i,s,n=l.call(arguments,1),o=0,a=n.length;a>o;o++)for(i in n[o])s=n[o][i],n[o].hasOwnProperty(i)&&void 0!==s&&(e[i]=t.isPlainObject(s)?t.isPlainObject(e[i])?t.widget.extend({},e[i],s):t.widget.extend({},s):s);return e},t.widget.bridge=function(e,i){var s=i.prototype.widgetFullName||e;t.fn[e]=function(n){var o="string"==typeof n,a=l.call(arguments,1),r=this;return o?this.length||"instance"!==n?this.each(function(){var i,o=t.data(this,s);return"instance"===n?(r=o,!1):o?t.isFunction(o[n])&&"_"!==n.charAt(0)?(i=o[n].apply(o,a),i!==o&&void 0!==i?(r=i&&i.jquery?r.pushStack(i.get()):i,!1):void 0):t.error("no such method '"+n+"' for "+e+" widget instance"):t.error("cannot call methods on "+e+" prior to initialization; "+"attempted to call method '"+n+"'")}):r=void 0:(a.length&&(n=t.widget.extend.apply(null,[n].concat(a))),this.each(function(){var e=t.data(this,s);e?(e.option(n||{}),e._init&&e._init()):t.data(this,s,new i(n,this))})),r}},t.Widget=function(){},t.Widget._childConstructors=[],t.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{classes:{},disabled:!1,create:null},_createWidget:function(e,i){i=t(i||this.defaultElement||this)[0],this.element=t(i),this.uuid=h++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=t(),this.hoverable=t(),this.focusable=t(),this.classesElementLookup={},i!==this&&(t.data(i,this.widgetFullName,this),this._on(!0,this.element,{remove:function(t){t.target===i&&this.destroy()}}),this.document=t(i.style?i.ownerDocument:i.document||i),this.window=t(this.document[0].defaultView||this.document[0].parentWindow)),this.options=t.widget.extend({},this.options,this._getCreateOptions(),e),this._create(),this.options.disabled&&this._setOptionDisabled(this.options.disabled),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:function(){return{}},_getCreateEventData:t.noop,_create:t.noop,_init:t.noop,destroy:function(){var e=this;this._destroy(),t.each(this.classesElementLookup,function(t,i){e._removeClass(i,t)}),this.element.off(this.eventNamespace).removeData(this.widgetFullName),this.widget().off(this.eventNamespace).removeAttr("aria-disabled"),this.bindings.off(this.eventNamespace)},_destroy:t.noop,widget:function(){return this.element},option:function(e,i){var s,n,o,a=e;if(0===arguments.length)return t.widget.extend({},this.options);if("string"==typeof e)if(a={},s=e.split("."),e=s.shift(),s.length){for(n=a[e]=t.widget.extend({},this.options[e]),o=0;s.length-1>o;o++)n[s[o]]=n[s[o]]||{},n=n[s[o]];if(e=s.pop(),1===arguments.length)return void 0===n[e]?null:n[e];n[e]=i}else{if(1===arguments.length)return void 0===this.options[e]?null:this.options[e];a[e]=i}return this._setOptions(a),this},_setOptions:function(t){var e;for(e in t)this._setOption(e,t[e]);return this},_setOption:function(t,e){return"classes"===t&&this._setOptionClasses(e),this.options[t]=e,"disabled"===t&&this._setOptionDisabled(e),this},_setOptionClasses:function(e){var i,s,n;for(i in e)n=this.classesElementLookup[i],e[i]!==this.options.classes[i]&&n&&n.length&&(s=t(n.get()),this._removeClass(n,i),s.addClass(this._classes({element:s,keys:i,classes:e,add:!0})))},_setOptionDisabled:function(t){this._toggleClass(this.widget(),this.widgetFullName+"-disabled",null,!!t),t&&(this._removeClass(this.hoverable,null,"ui-state-hover"),this._removeClass(this.focusable,null,"ui-state-focus"))},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_classes:function(e){function i(i,o){var a,r;for(r=0;i.length>r;r++)a=n.classesElementLookup[i[r]]||t(),a=e.add?t(t.unique(a.get().concat(e.element.get()))):t(a.not(e.element).get()),n.classesElementLookup[i[r]]=a,s.push(i[r]),o&&e.classes[i[r]]&&s.push(e.classes[i[r]])}var s=[],n=this;return e=t.extend({element:this.element,classes:this.options.classes||{}},e),this._on(e.element,{remove:"_untrackClassesElement"}),e.keys&&i(e.keys.match(/\S+/g)||[],!0),e.extra&&i(e.extra.match(/\S+/g)||[]),s.join(" ")},_untrackClassesElement:function(e){var i=this;t.each(i.classesElementLookup,function(s,n){-1!==t.inArray(e.target,n)&&(i.classesElementLookup[s]=t(n.not(e.target).get()))})},_removeClass:function(t,e,i){return this._toggleClass(t,e,i,!1)},_addClass:function(t,e,i){return this._toggleClass(t,e,i,!0)},_toggleClass:function(t,e,i,s){s="boolean"==typeof s?s:i;var n="string"==typeof t||null===t,o={extra:n?e:i,keys:n?t:e,element:n?this.element:t,add:s};return o.element.toggleClass(this._classes(o),s),this},_on:function(e,i,s){var n,o=this;"boolean"!=typeof e&&(s=i,i=e,e=!1),s?(i=n=t(i),this.bindings=this.bindings.add(i)):(s=i,i=this.element,n=this.widget()),t.each(s,function(s,a){function r(){return e||o.options.disabled!==!0&&!t(this).hasClass("ui-state-disabled")?("string"==typeof a?o[a]:a).apply(o,arguments):void 0}"string"!=typeof a&&(r.guid=a.guid=a.guid||r.guid||t.guid++);var h=s.match(/^([\w:-]*)\s*(.*)$/),l=h[1]+o.eventNamespace,c=h[2];c?n.on(l,c,r):i.on(l,r)})},_off:function(e,i){i=(i||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,e.off(i).off(i),this.bindings=t(this.bindings.not(e).get()),this.focusable=t(this.focusable.not(e).get()),this.hoverable=t(this.hoverable.not(e).get())},_delay:function(t,e){function i(){return("string"==typeof t?s[t]:t).apply(s,arguments)}var s=this;return setTimeout(i,e||0)},_hoverable:function(e){this.hoverable=this.hoverable.add(e),this._on(e,{mouseenter:function(e){this._addClass(t(e.currentTarget),null,"ui-state-hover")},mouseleave:function(e){this._removeClass(t(e.currentTarget),null,"ui-state-hover")}})},_focusable:function(e){this.focusable=this.focusable.add(e),this._on(e,{focusin:function(e){this._addClass(t(e.currentTarget),null,"ui-state-focus")},focusout:function(e){this._removeClass(t(e.currentTarget),null,"ui-state-focus")}})},_trigger:function(e,i,s){var n,o,a=this.options[e];if(s=s||{},i=t.Event(i),i.type=(e===this.widgetEventPrefix?e:this.widgetEventPrefix+e).toLowerCase(),i.target=this.element[0],o=i.originalEvent)for(n in o)n in i||(i[n]=o[n]);return this.element.trigger(i,s),!(t.isFunction(a)&&a.apply(this.element[0],[i].concat(s))===!1||i.isDefaultPrevented())}},t.each({show:"fadeIn",hide:"fadeOut"},function(e,i){t.Widget.prototype["_"+e]=function(s,n,o){"string"==typeof n&&(n={effect:n});var a,r=n?n===!0||"number"==typeof n?i:n.effect||i:e;n=n||{},"number"==typeof n&&(n={duration:n}),a=!t.isEmptyObject(n),n.complete=o,n.delay&&s.delay(n.delay),a&&t.effects&&t.effects.effect[r]?s[e](n):r!==e&&s[r]?s[r](n.duration,n.easing,o):s.queue(function(i){t(this)[e](),o&&o.call(s[0]),i()})}}),t.widget,function(){function e(t,e,i){return[parseFloat(t[0])*(u.test(t[0])?e/100:1),parseFloat(t[1])*(u.test(t[1])?i/100:1)]}function i(e,i){return parseInt(t.css(e,i),10)||0}function s(e){var i=e[0];return 9===i.nodeType?{width:e.width(),height:e.height(),offset:{top:0,left:0}}:t.isWindow(i)?{width:e.width(),height:e.height(),offset:{top:e.scrollTop(),left:e.scrollLeft()}}:i.preventDefault?{width:0,height:0,offset:{top:i.pageY,left:i.pageX}}:{width:e.outerWidth(),height:e.outerHeight(),offset:e.offset()}}var n,o=Math.max,a=Math.abs,r=/left|center|right/,h=/top|center|bottom/,l=/[\+\-]\d+(\.[\d]+)?%?/,c=/^\w+/,u=/%$/,d=t.fn.position;t.position={scrollbarWidth:function(){if(void 0!==n)return n;var e,i,s=t("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),o=s.children()[0];return t("body").append(s),e=o.offsetWidth,s.css("overflow","scroll"),i=o.offsetWidth,e===i&&(i=s[0].clientWidth),s.remove(),n=e-i},getScrollInfo:function(e){var i=e.isWindow||e.isDocument?"":e.element.css("overflow-x"),s=e.isWindow||e.isDocument?"":e.element.css("overflow-y"),n="scroll"===i||"auto"===i&&e.width<e.element[0].scrollWidth,o="scroll"===s||"auto"===s&&e.height<e.element[0].scrollHeight;return{width:o?t.position.scrollbarWidth():0,height:n?t.position.scrollbarWidth():0}},getWithinInfo:function(e){var i=t(e||window),s=t.isWindow(i[0]),n=!!i[0]&&9===i[0].nodeType,o=!s&&!n;return{element:i,isWindow:s,isDocument:n,offset:o?t(e).offset():{left:0,top:0},scrollLeft:i.scrollLeft(),scrollTop:i.scrollTop(),width:i.outerWidth(),height:i.outerHeight()}}},t.fn.position=function(n){if(!n||!n.of)return d.apply(this,arguments);n=t.extend({},n);var u,p,f,g,m,_,v=t(n.of),b=t.position.getWithinInfo(n.within),y=t.position.getScrollInfo(b),w=(n.collision||"flip").split(" "),k={};return _=s(v),v[0].preventDefault&&(n.at="left top"),p=_.width,f=_.height,g=_.offset,m=t.extend({},g),t.each(["my","at"],function(){var t,e,i=(n[this]||"").split(" ");1===i.length&&(i=r.test(i[0])?i.concat(["center"]):h.test(i[0])?["center"].concat(i):["center","center"]),i[0]=r.test(i[0])?i[0]:"center",i[1]=h.test(i[1])?i[1]:"center",t=l.exec(i[0]),e=l.exec(i[1]),k[this]=[t?t[0]:0,e?e[0]:0],n[this]=[c.exec(i[0])[0],c.exec(i[1])[0]]}),1===w.length&&(w[1]=w[0]),"right"===n.at[0]?m.left+=p:"center"===n.at[0]&&(m.left+=p/2),"bottom"===n.at[1]?m.top+=f:"center"===n.at[1]&&(m.top+=f/2),u=e(k.at,p,f),m.left+=u[0],m.top+=u[1],this.each(function(){var s,r,h=t(this),l=h.outerWidth(),c=h.outerHeight(),d=i(this,"marginLeft"),_=i(this,"marginTop"),x=l+d+i(this,"marginRight")+y.width,C=c+_+i(this,"marginBottom")+y.height,D=t.extend({},m),I=e(k.my,h.outerWidth(),h.outerHeight());"right"===n.my[0]?D.left-=l:"center"===n.my[0]&&(D.left-=l/2),"bottom"===n.my[1]?D.top-=c:"center"===n.my[1]&&(D.top-=c/2),D.left+=I[0],D.top+=I[1],s={marginLeft:d,marginTop:_},t.each(["left","top"],function(e,i){t.ui.position[w[e]]&&t.ui.position[w[e]][i](D,{targetWidth:p,targetHeight:f,elemWidth:l,elemHeight:c,collisionPosition:s,collisionWidth:x,collisionHeight:C,offset:[u[0]+I[0],u[1]+I[1]],my:n.my,at:n.at,within:b,elem:h})}),n.using&&(r=function(t){var e=g.left-D.left,i=e+p-l,s=g.top-D.top,r=s+f-c,u={target:{element:v,left:g.left,top:g.top,width:p,height:f},element:{element:h,left:D.left,top:D.top,width:l,height:c},horizontal:0>i?"left":e>0?"right":"center",vertical:0>r?"top":s>0?"bottom":"middle"};l>p&&p>a(e+i)&&(u.horizontal="center"),c>f&&f>a(s+r)&&(u.vertical="middle"),u.important=o(a(e),a(i))>o(a(s),a(r))?"horizontal":"vertical",n.using.call(this,t,u)}),h.offset(t.extend(D,{using:r}))})},t.ui.position={fit:{left:function(t,e){var i,s=e.within,n=s.isWindow?s.scrollLeft:s.offset.left,a=s.width,r=t.left-e.collisionPosition.marginLeft,h=n-r,l=r+e.collisionWidth-a-n;e.collisionWidth>a?h>0&&0>=l?(i=t.left+h+e.collisionWidth-a-n,t.left+=h-i):t.left=l>0&&0>=h?n:h>l?n+a-e.collisionWidth:n:h>0?t.left+=h:l>0?t.left-=l:t.left=o(t.left-r,t.left)},top:function(t,e){var i,s=e.within,n=s.isWindow?s.scrollTop:s.offset.top,a=e.within.height,r=t.top-e.collisionPosition.marginTop,h=n-r,l=r+e.collisionHeight-a-n;e.collisionHeight>a?h>0&&0>=l?(i=t.top+h+e.collisionHeight-a-n,t.top+=h-i):t.top=l>0&&0>=h?n:h>l?n+a-e.collisionHeight:n:h>0?t.top+=h:l>0?t.top-=l:t.top=o(t.top-r,t.top)}},flip:{left:function(t,e){var i,s,n=e.within,o=n.offset.left+n.scrollLeft,r=n.width,h=n.isWindow?n.scrollLeft:n.offset.left,l=t.left-e.collisionPosition.marginLeft,c=l-h,u=l+e.collisionWidth-r-h,d="left"===e.my[0]?-e.elemWidth:"right"===e.my[0]?e.elemWidth:0,p="left"===e.at[0]?e.targetWidth:"right"===e.at[0]?-e.targetWidth:0,f=-2*e.offset[0];0>c?(i=t.left+d+p+f+e.collisionWidth-r-o,(0>i||a(c)>i)&&(t.left+=d+p+f)):u>0&&(s=t.left-e.collisionPosition.marginLeft+d+p+f-h,(s>0||u>a(s))&&(t.left+=d+p+f))},top:function(t,e){var i,s,n=e.within,o=n.offset.top+n.scrollTop,r=n.height,h=n.isWindow?n.scrollTop:n.offset.top,l=t.top-e.collisionPosition.marginTop,c=l-h,u=l+e.collisionHeight-r-h,d="top"===e.my[1],p=d?-e.elemHeight:"bottom"===e.my[1]?e.elemHeight:0,f="top"===e.at[1]?e.targetHeight:"bottom"===e.at[1]?-e.targetHeight:0,g=-2*e.offset[1];0>c?(s=t.top+p+f+g+e.collisionHeight-r-o,(0>s||a(c)>s)&&(t.top+=p+f+g)):u>0&&(i=t.top-e.collisionPosition.marginTop+p+f+g-h,(i>0||u>a(i))&&(t.top+=p+f+g))}},flipfit:{left:function(){t.ui.position.flip.left.apply(this,arguments),t.ui.position.fit.left.apply(this,arguments)},top:function(){t.ui.position.flip.top.apply(this,arguments),t.ui.position.fit.top.apply(this,arguments)}}}}(),t.ui.position,t.extend(t.expr[":"],{data:t.expr.createPseudo?t.expr.createPseudo(function(e){return function(i){return!!t.data(i,e)}}):function(e,i,s){return!!t.data(e,s[3])}}),t.fn.extend({disableSelection:function(){var t="onselectstart"in document.createElement("div")?"selectstart":"mousedown";return function(){return this.on(t+".ui-disableSelection",function(t){t.preventDefault()})}}(),enableSelection:function(){return this.off(".ui-disableSelection")}}),t.ui.focusable=function(i,s){var n,o,a,r,h,l=i.nodeName.toLowerCase();return"area"===l?(n=i.parentNode,o=n.name,i.href&&o&&"map"===n.nodeName.toLowerCase()?(a=t("img[usemap='#"+o+"']"),a.length>0&&a.is(":visible")):!1):(/^(input|select|textarea|button|object)$/.test(l)?(r=!i.disabled,r&&(h=t(i).closest("fieldset")[0],h&&(r=!h.disabled))):r="a"===l?i.href||s:s,r&&t(i).is(":visible")&&e(t(i)))},t.extend(t.expr[":"],{focusable:function(e){return t.ui.focusable(e,null!=t.attr(e,"tabindex"))}}),t.ui.focusable,t.fn.form=function(){return"string"==typeof this[0].form?this.closest("form"):t(this[0].form)},t.ui.formResetMixin={_formResetHandler:function(){var e=t(this);setTimeout(function(){var i=e.data("ui-form-reset-instances");t.each(i,function(){this.refresh()})})},_bindFormResetHandler:function(){if(this.form=this.element.form(),this.form.length){var t=this.form.data("ui-form-reset-instances")||[];t.length||this.form.on("reset.ui-form-reset",this._formResetHandler),t.push(this),this.form.data("ui-form-reset-instances",t)}},_unbindFormResetHandler:function(){if(this.form.length){var e=this.form.data("ui-form-reset-instances");e.splice(t.inArray(this,e),1),e.length?this.form.data("ui-form-reset-instances",e):this.form.removeData("ui-form-reset-instances").off("reset.ui-form-reset")}}},"1.7"===t.fn.jquery.substring(0,3)&&(t.each(["Width","Height"],function(e,i){function s(e,i,s,o){return t.each(n,function(){i-=parseFloat(t.css(e,"padding"+this))||0,s&&(i-=parseFloat(t.css(e,"border"+this+"Width"))||0),o&&(i-=parseFloat(t.css(e,"margin"+this))||0)}),i}var n="Width"===i?["Left","Right"]:["Top","Bottom"],o=i.toLowerCase(),a={innerWidth:t.fn.innerWidth,innerHeight:t.fn.innerHeight,outerWidth:t.fn.outerWidth,outerHeight:t.fn.outerHeight};t.fn["inner"+i]=function(e){return void 0===e?a["inner"+i].call(this):this.each(function(){t(this).css(o,s(this,e)+"px")})},t.fn["outer"+i]=function(e,n){return"number"!=typeof e?a["outer"+i].call(this,e):this.each(function(){t(this).css(o,s(this,e,!0,n)+"px")})}}),t.fn.addBack=function(t){return this.add(null==t?this.prevObject:this.prevObject.filter(t))}),t.ui.keyCode={BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38},t.ui.escapeSelector=function(){var t=/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g;return function(e){return e.replace(t,"\\$1")}}(),t.fn.labels=function(){var e,i,s,n,o;return this[0].labels&&this[0].labels.length?this.pushStack(this[0].labels):(n=this.eq(0).parents("label"),s=this.attr("id"),s&&(e=this.eq(0).parents().last(),o=e.add(e.length?e.siblings():this.siblings()),i="label[for='"+t.ui.escapeSelector(s)+"']",n=n.add(o.find(i).addBack(i))),this.pushStack(n))},t.fn.scrollParent=function(e){var i=this.css("position"),s="absolute"===i,n=e?/(auto|scroll|hidden)/:/(auto|scroll)/,o=this.parents().filter(function(){var e=t(this);return s&&"static"===e.css("position")?!1:n.test(e.css("overflow")+e.css("overflow-y")+e.css("overflow-x"))}).eq(0);return"fixed"!==i&&o.length?o:t(this[0].ownerDocument||document)},t.extend(t.expr[":"],{tabbable:function(e){var i=t.attr(e,"tabindex"),s=null!=i;return(!s||i>=0)&&t.ui.focusable(e,s)}}),t.fn.extend({uniqueId:function(){var t=0;return function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++t)})}}(),removeUniqueId:function(){return this.each(function(){/^ui-id-\d+$/.test(this.id)&&t(this).removeAttr("id")})}}),t.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase());var c=!1;t(document).on("mouseup",function(){c=!1}),t.widget("ui.mouse",{version:"1.12.1",options:{cancel:"input, textarea, button, select, option",distance:1,delay:0},_mouseInit:function(){var e=this;this.element.on("mousedown."+this.widgetName,function(t){return e._mouseDown(t)}).on("click."+this.widgetName,function(i){return!0===t.data(i.target,e.widgetName+".preventClickEvent")?(t.removeData(i.target,e.widgetName+".preventClickEvent"),i.stopImmediatePropagation(),!1):void 0}),this.started=!1},_mouseDestroy:function(){this.element.off("."+this.widgetName),this._mouseMoveDelegate&&this.document.off("mousemove."+this.widgetName,this._mouseMoveDelegate).off("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(e){if(!c){this._mouseMoved=!1,this._mouseStarted&&this._mouseUp(e),this._mouseDownEvent=e;var i=this,s=1===e.which,n="string"==typeof this.options.cancel&&e.target.nodeName?t(e.target).closest(this.options.cancel).length:!1;return s&&!n&&this._mouseCapture(e)?(this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){i.mouseDelayMet=!0},this.options.delay)),this._mouseDistanceMet(e)&&this._mouseDelayMet(e)&&(this._mouseStarted=this._mouseStart(e)!==!1,!this._mouseStarted)?(e.preventDefault(),!0):(!0===t.data(e.target,this.widgetName+".preventClickEvent")&&t.removeData(e.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(t){return i._mouseMove(t)},this._mouseUpDelegate=function(t){return i._mouseUp(t)},this.document.on("mousemove."+this.widgetName,this._mouseMoveDelegate).on("mouseup."+this.widgetName,this._mouseUpDelegate),e.preventDefault(),c=!0,!0)):!0}},_mouseMove:function(e){if(this._mouseMoved){if(t.ui.ie&&(!document.documentMode||9>document.documentMode)&&!e.button)return this._mouseUp(e);if(!e.which)if(e.originalEvent.altKey||e.originalEvent.ctrlKey||e.originalEvent.metaKey||e.originalEvent.shiftKey)this.ignoreMissingWhich=!0;else if(!this.ignoreMissingWhich)return this._mouseUp(e)}return(e.which||e.button)&&(this._mouseMoved=!0),this._mouseStarted?(this._mouseDrag(e),e.preventDefault()):(this._mouseDistanceMet(e)&&this._mouseDelayMet(e)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,e)!==!1,this._mouseStarted?this._mouseDrag(e):this._mouseUp(e)),!this._mouseStarted)},_mouseUp:function(e){this.document.off("mousemove."+this.widgetName,this._mouseMoveDelegate).off("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,e.target===this._mouseDownEvent.target&&t.data(e.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(e)),this._mouseDelayTimer&&(clearTimeout(this._mouseDelayTimer),delete this._mouseDelayTimer),this.ignoreMissingWhich=!1,c=!1,e.preventDefault()},_mouseDistanceMet:function(t){return Math.max(Math.abs(this._mouseDownEvent.pageX-t.pageX),Math.abs(this._mouseDownEvent.pageY-t.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return!0}}),t.ui.plugin={add:function(e,i,s){var n,o=t.ui[e].prototype;for(n in s)o.plugins[n]=o.plugins[n]||[],o.plugins[n].push([i,s[n]])},call:function(t,e,i,s){var n,o=t.plugins[e];if(o&&(s||t.element[0].parentNode&&11!==t.element[0].parentNode.nodeType))for(n=0;o.length>n;n++)t.options[o[n][0]]&&o[n][1].apply(t.element,i)}},t.ui.safeActiveElement=function(t){var e;try{e=t.activeElement}catch(i){e=t.body}return e||(e=t.body),e.nodeName||(e=t.body),e},t.ui.safeBlur=function(e){e&&"body"!==e.nodeName.toLowerCase()&&t(e).trigger("blur")},t.widget("ui.draggable",t.ui.mouse,{version:"1.12.1",widgetEventPrefix:"drag",options:{addClasses:!0,appendTo:"parent",axis:!1,connectToSortable:!1,containment:!1,cursor:"auto",cursorAt:!1,grid:!1,handle:!1,helper:"original",iframeFix:!1,opacity:!1,refreshPositions:!1,revert:!1,revertDuration:500,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:20,snap:!1,snapMode:"both",snapTolerance:20,stack:!1,zIndex:!1,drag:null,start:null,stop:null},_create:function(){"original"===this.options.helper&&this._setPositionRelative(),this.options.addClasses&&this._addClass("ui-draggable"),this._setHandleClassName(),this._mouseInit()},_setOption:function(t,e){this._super(t,e),"handle"===t&&(this._removeHandleClassName(),this._setHandleClassName())},_destroy:function(){return(this.helper||this.element).is(".ui-draggable-dragging")?(this.destroyOnClear=!0,void 0):(this._removeHandleClassName(),this._mouseDestroy(),void 0)},_mouseCapture:function(e){var i=this.options;return this.helper||i.disabled||t(e.target).closest(".ui-resizable-handle").length>0?!1:(this.handle=this._getHandle(e),this.handle?(this._blurActiveElement(e),this._blockFrames(i.iframeFix===!0?"iframe":i.iframeFix),!0):!1)},_blockFrames:function(e){this.iframeBlocks=this.document.find(e).map(function(){var e=t(this);return t("<div>").css("position","absolute").appendTo(e.parent()).outerWidth(e.outerWidth()).outerHeight(e.outerHeight()).offset(e.offset())[0]})},_unblockFrames:function(){this.iframeBlocks&&(this.iframeBlocks.remove(),delete this.iframeBlocks)},_blurActiveElement:function(e){var i=t.ui.safeActiveElement(this.document[0]),s=t(e.target);s.closest(i).length||t.ui.safeBlur(i)},_mouseStart:function(e){var i=this.options;return this.helper=this._createHelper(e),this._addClass(this.helper,"ui-draggable-dragging"),this._cacheHelperProportions(),t.ui.ddmanager&&(t.ui.ddmanager.current=this),this._cacheMargins(),this.cssPosition=this.helper.css("position"),this.scrollParent=this.helper.scrollParent(!0),this.offsetParent=this.helper.offsetParent(),this.hasFixedAncestor=this.helper.parents().filter(function(){return"fixed"===t(this).css("position")}).length>0,this.positionAbs=this.element.offset(),this._refreshOffsets(e),this.originalPosition=this.position=this._generatePosition(e,!1),this.originalPageX=e.pageX,this.originalPageY=e.pageY,i.cursorAt&&this._adjustOffsetFromHelper(i.cursorAt),this._setContainment(),this._trigger("start",e)===!1?(this._clear(),!1):(this._cacheHelperProportions(),t.ui.ddmanager&&!i.dropBehaviour&&t.ui.ddmanager.prepareOffsets(this,e),this._mouseDrag(e,!0),t.ui.ddmanager&&t.ui.ddmanager.dragStart(this,e),!0)},_refreshOffsets:function(t){this.offset={top:this.positionAbs.top-this.margins.top,left:this.positionAbs.left-this.margins.left,scroll:!1,parent:this._getParentOffset(),relative:this._getRelativeOffset()},this.offset.click={left:t.pageX-this.offset.left,top:t.pageY-this.offset.top}},_mouseDrag:function(e,i){if(this.hasFixedAncestor&&(this.offset.parent=this._getParentOffset()),this.position=this._generatePosition(e,!0),this.positionAbs=this._convertPositionTo("absolute"),!i){var s=this._uiHash();if(this._trigger("drag",e,s)===!1)return this._mouseUp(new t.Event("mouseup",e)),!1;this.position=s.position}return this.helper[0].style.left=this.position.left+"px",this.helper[0].style.top=this.position.top+"px",t.ui.ddmanager&&t.ui.ddmanager.drag(this,e),!1},_mouseStop:function(e){var i=this,s=!1;return t.ui.ddmanager&&!this.options.dropBehaviour&&(s=t.ui.ddmanager.drop(this,e)),this.dropped&&(s=this.dropped,this.dropped=!1),"invalid"===this.options.revert&&!s||"valid"===this.options.revert&&s||this.options.revert===!0||t.isFunction(this.options.revert)&&this.options.revert.call(this.element,s)?t(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){i._trigger("stop",e)!==!1&&i._clear()}):this._trigger("stop",e)!==!1&&this._clear(),!1},_mouseUp:function(e){return this._unblockFrames(),t.ui.ddmanager&&t.ui.ddmanager.dragStop(this,e),this.handleElement.is(e.target)&&this.element.trigger("focus"),t.ui.mouse.prototype._mouseUp.call(this,e)},cancel:function(){return this.helper.is(".ui-draggable-dragging")?this._mouseUp(new t.Event("mouseup",{target:this.element[0]})):this._clear(),this},_getHandle:function(e){return this.options.handle?!!t(e.target).closest(this.element.find(this.options.handle)).length:!0},_setHandleClassName:function(){this.handleElement=this.options.handle?this.element.find(this.options.handle):this.element,this._addClass(this.handleElement,"ui-draggable-handle")},_removeHandleClassName:function(){this._removeClass(this.handleElement,"ui-draggable-handle")},_createHelper:function(e){var i=this.options,s=t.isFunction(i.helper),n=s?t(i.helper.apply(this.element[0],[e])):"clone"===i.helper?this.element.clone().removeAttr("id"):this.element;return n.parents("body").length||n.appendTo("parent"===i.appendTo?this.element[0].parentNode:i.appendTo),s&&n[0]===this.element[0]&&this._setPositionRelative(),n[0]===this.element[0]||/(fixed|absolute)/.test(n.css("position"))||n.css("position","absolute"),n},_setPositionRelative:function(){/^(?:r|a|f)/.test(this.element.css("position"))||(this.element[0].style.position="relative")},_adjustOffsetFromHelper:function(e){"string"==typeof e&&(e=e.split(" ")),t.isArray(e)&&(e={left:+e[0],top:+e[1]||0}),"left"in e&&(this.offset.click.left=e.left+this.margins.left),"right"in e&&(this.offset.click.left=this.helperProportions.width-e.right+this.margins.left),"top"in e&&(this.offset.click.top=e.top+this.margins.top),"bottom"in e&&(this.offset.click.top=this.helperProportions.height-e.bottom+this.margins.top)},_isRootNode:function(t){return/(html|body)/i.test(t.tagName)||t===this.document[0]},_getParentOffset:function(){var e=this.offsetParent.offset(),i=this.document[0];return"absolute"===this.cssPosition&&this.scrollParent[0]!==i&&t.contains(this.scrollParent[0],this.offsetParent[0])&&(e.left+=this.scrollParent.scrollLeft(),e.top+=this.scrollParent.scrollTop()),this._isRootNode(this.offsetParent[0])&&(e={top:0,left:0}),{top:e.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:e.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if("relative"!==this.cssPosition)return{top:0,left:0};var t=this.element.position(),e=this._isRootNode(this.scrollParent[0]);return{top:t.top-(parseInt(this.helper.css("top"),10)||0)+(e?0:this.scrollParent.scrollTop()),left:t.left-(parseInt(this.helper.css("left"),10)||0)+(e?0:this.scrollParent.scrollLeft())}},_cacheMargins:function(){this.margins={left:parseInt(this.element.css("marginLeft"),10)||0,top:parseInt(this.element.css("marginTop"),10)||0,right:parseInt(this.element.css("marginRight"),10)||0,bottom:parseInt(this.element.css("marginBottom"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e,i,s,n=this.options,o=this.document[0];return this.relativeContainer=null,n.containment?"window"===n.containment?(this.containment=[t(window).scrollLeft()-this.offset.relative.left-this.offset.parent.left,t(window).scrollTop()-this.offset.relative.top-this.offset.parent.top,t(window).scrollLeft()+t(window).width()-this.helperProportions.width-this.margins.left,t(window).scrollTop()+(t(window).height()||o.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top],void 0):"document"===n.containment?(this.containment=[0,0,t(o).width()-this.helperProportions.width-this.margins.left,(t(o).height()||o.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top],void 0):n.containment.constructor===Array?(this.containment=n.containment,void 0):("parent"===n.containment&&(n.containment=this.helper[0].parentNode),i=t(n.containment),s=i[0],s&&(e=/(scroll|auto)/.test(i.css("overflow")),this.containment=[(parseInt(i.css("borderLeftWidth"),10)||0)+(parseInt(i.css("paddingLeft"),10)||0),(parseInt(i.css("borderTopWidth"),10)||0)+(parseInt(i.css("paddingTop"),10)||0),(e?Math.max(s.scrollWidth,s.offsetWidth):s.offsetWidth)-(parseInt(i.css("borderRightWidth"),10)||0)-(parseInt(i.css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left-this.margins.right,(e?Math.max(s.scrollHeight,s.offsetHeight):s.offsetHeight)-(parseInt(i.css("borderBottomWidth"),10)||0)-(parseInt(i.css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top-this.margins.bottom],this.relativeContainer=i),void 0):(this.containment=null,void 0)
},_convertPositionTo:function(t,e){e||(e=this.position);var i="absolute"===t?1:-1,s=this._isRootNode(this.scrollParent[0]);return{top:e.top+this.offset.relative.top*i+this.offset.parent.top*i-("fixed"===this.cssPosition?-this.offset.scroll.top:s?0:this.offset.scroll.top)*i,left:e.left+this.offset.relative.left*i+this.offset.parent.left*i-("fixed"===this.cssPosition?-this.offset.scroll.left:s?0:this.offset.scroll.left)*i}},_generatePosition:function(t,e){var i,s,n,o,a=this.options,r=this._isRootNode(this.scrollParent[0]),h=t.pageX,l=t.pageY;return r&&this.offset.scroll||(this.offset.scroll={top:this.scrollParent.scrollTop(),left:this.scrollParent.scrollLeft()}),e&&(this.containment&&(this.relativeContainer?(s=this.relativeContainer.offset(),i=[this.containment[0]+s.left,this.containment[1]+s.top,this.containment[2]+s.left,this.containment[3]+s.top]):i=this.containment,t.pageX-this.offset.click.left<i[0]&&(h=i[0]+this.offset.click.left),t.pageY-this.offset.click.top<i[1]&&(l=i[1]+this.offset.click.top),t.pageX-this.offset.click.left>i[2]&&(h=i[2]+this.offset.click.left),t.pageY-this.offset.click.top>i[3]&&(l=i[3]+this.offset.click.top)),a.grid&&(n=a.grid[1]?this.originalPageY+Math.round((l-this.originalPageY)/a.grid[1])*a.grid[1]:this.originalPageY,l=i?n-this.offset.click.top>=i[1]||n-this.offset.click.top>i[3]?n:n-this.offset.click.top>=i[1]?n-a.grid[1]:n+a.grid[1]:n,o=a.grid[0]?this.originalPageX+Math.round((h-this.originalPageX)/a.grid[0])*a.grid[0]:this.originalPageX,h=i?o-this.offset.click.left>=i[0]||o-this.offset.click.left>i[2]?o:o-this.offset.click.left>=i[0]?o-a.grid[0]:o+a.grid[0]:o),"y"===a.axis&&(h=this.originalPageX),"x"===a.axis&&(l=this.originalPageY)),{top:l-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+("fixed"===this.cssPosition?-this.offset.scroll.top:r?0:this.offset.scroll.top),left:h-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+("fixed"===this.cssPosition?-this.offset.scroll.left:r?0:this.offset.scroll.left)}},_clear:function(){this._removeClass(this.helper,"ui-draggable-dragging"),this.helper[0]===this.element[0]||this.cancelHelperRemoval||this.helper.remove(),this.helper=null,this.cancelHelperRemoval=!1,this.destroyOnClear&&this.destroy()},_trigger:function(e,i,s){return s=s||this._uiHash(),t.ui.plugin.call(this,e,[i,s,this],!0),/^(drag|start|stop)/.test(e)&&(this.positionAbs=this._convertPositionTo("absolute"),s.offset=this.positionAbs),t.Widget.prototype._trigger.call(this,e,i,s)},plugins:{},_uiHash:function(){return{helper:this.helper,position:this.position,originalPosition:this.originalPosition,offset:this.positionAbs}}}),t.ui.plugin.add("draggable","connectToSortable",{start:function(e,i,s){var n=t.extend({},i,{item:s.element});s.sortables=[],t(s.options.connectToSortable).each(function(){var i=t(this).sortable("instance");i&&!i.options.disabled&&(s.sortables.push(i),i.refreshPositions(),i._trigger("activate",e,n))})},stop:function(e,i,s){var n=t.extend({},i,{item:s.element});s.cancelHelperRemoval=!1,t.each(s.sortables,function(){var t=this;t.isOver?(t.isOver=0,s.cancelHelperRemoval=!0,t.cancelHelperRemoval=!1,t._storedCSS={position:t.placeholder.css("position"),top:t.placeholder.css("top"),left:t.placeholder.css("left")},t._mouseStop(e),t.options.helper=t.options._helper):(t.cancelHelperRemoval=!0,t._trigger("deactivate",e,n))})},drag:function(e,i,s){t.each(s.sortables,function(){var n=!1,o=this;o.positionAbs=s.positionAbs,o.helperProportions=s.helperProportions,o.offset.click=s.offset.click,o._intersectsWith(o.containerCache)&&(n=!0,t.each(s.sortables,function(){return this.positionAbs=s.positionAbs,this.helperProportions=s.helperProportions,this.offset.click=s.offset.click,this!==o&&this._intersectsWith(this.containerCache)&&t.contains(o.element[0],this.element[0])&&(n=!1),n})),n?(o.isOver||(o.isOver=1,s._parent=i.helper.parent(),o.currentItem=i.helper.appendTo(o.element).data("ui-sortable-item",!0),o.options._helper=o.options.helper,o.options.helper=function(){return i.helper[0]},e.target=o.currentItem[0],o._mouseCapture(e,!0),o._mouseStart(e,!0,!0),o.offset.click.top=s.offset.click.top,o.offset.click.left=s.offset.click.left,o.offset.parent.left-=s.offset.parent.left-o.offset.parent.left,o.offset.parent.top-=s.offset.parent.top-o.offset.parent.top,s._trigger("toSortable",e),s.dropped=o.element,t.each(s.sortables,function(){this.refreshPositions()}),s.currentItem=s.element,o.fromOutside=s),o.currentItem&&(o._mouseDrag(e),i.position=o.position)):o.isOver&&(o.isOver=0,o.cancelHelperRemoval=!0,o.options._revert=o.options.revert,o.options.revert=!1,o._trigger("out",e,o._uiHash(o)),o._mouseStop(e,!0),o.options.revert=o.options._revert,o.options.helper=o.options._helper,o.placeholder&&o.placeholder.remove(),i.helper.appendTo(s._parent),s._refreshOffsets(e),i.position=s._generatePosition(e,!0),s._trigger("fromSortable",e),s.dropped=!1,t.each(s.sortables,function(){this.refreshPositions()}))})}}),t.ui.plugin.add("draggable","cursor",{start:function(e,i,s){var n=t("body"),o=s.options;n.css("cursor")&&(o._cursor=n.css("cursor")),n.css("cursor",o.cursor)},stop:function(e,i,s){var n=s.options;n._cursor&&t("body").css("cursor",n._cursor)}}),t.ui.plugin.add("draggable","opacity",{start:function(e,i,s){var n=t(i.helper),o=s.options;n.css("opacity")&&(o._opacity=n.css("opacity")),n.css("opacity",o.opacity)},stop:function(e,i,s){var n=s.options;n._opacity&&t(i.helper).css("opacity",n._opacity)}}),t.ui.plugin.add("draggable","scroll",{start:function(t,e,i){i.scrollParentNotHidden||(i.scrollParentNotHidden=i.helper.scrollParent(!1)),i.scrollParentNotHidden[0]!==i.document[0]&&"HTML"!==i.scrollParentNotHidden[0].tagName&&(i.overflowOffset=i.scrollParentNotHidden.offset())},drag:function(e,i,s){var n=s.options,o=!1,a=s.scrollParentNotHidden[0],r=s.document[0];a!==r&&"HTML"!==a.tagName?(n.axis&&"x"===n.axis||(s.overflowOffset.top+a.offsetHeight-e.pageY<n.scrollSensitivity?a.scrollTop=o=a.scrollTop+n.scrollSpeed:e.pageY-s.overflowOffset.top<n.scrollSensitivity&&(a.scrollTop=o=a.scrollTop-n.scrollSpeed)),n.axis&&"y"===n.axis||(s.overflowOffset.left+a.offsetWidth-e.pageX<n.scrollSensitivity?a.scrollLeft=o=a.scrollLeft+n.scrollSpeed:e.pageX-s.overflowOffset.left<n.scrollSensitivity&&(a.scrollLeft=o=a.scrollLeft-n.scrollSpeed))):(n.axis&&"x"===n.axis||(e.pageY-t(r).scrollTop()<n.scrollSensitivity?o=t(r).scrollTop(t(r).scrollTop()-n.scrollSpeed):t(window).height()-(e.pageY-t(r).scrollTop())<n.scrollSensitivity&&(o=t(r).scrollTop(t(r).scrollTop()+n.scrollSpeed))),n.axis&&"y"===n.axis||(e.pageX-t(r).scrollLeft()<n.scrollSensitivity?o=t(r).scrollLeft(t(r).scrollLeft()-n.scrollSpeed):t(window).width()-(e.pageX-t(r).scrollLeft())<n.scrollSensitivity&&(o=t(r).scrollLeft(t(r).scrollLeft()+n.scrollSpeed)))),o!==!1&&t.ui.ddmanager&&!n.dropBehaviour&&t.ui.ddmanager.prepareOffsets(s,e)}}),t.ui.plugin.add("draggable","snap",{start:function(e,i,s){var n=s.options;s.snapElements=[],t(n.snap.constructor!==String?n.snap.items||":data(ui-draggable)":n.snap).each(function(){var e=t(this),i=e.offset();this!==s.element[0]&&s.snapElements.push({item:this,width:e.outerWidth(),height:e.outerHeight(),top:i.top,left:i.left})})},drag:function(e,i,s){var n,o,a,r,h,l,c,u,d,p,f=s.options,g=f.snapTolerance,m=i.offset.left,_=m+s.helperProportions.width,v=i.offset.top,b=v+s.helperProportions.height;for(d=s.snapElements.length-1;d>=0;d--)h=s.snapElements[d].left-s.margins.left,l=h+s.snapElements[d].width,c=s.snapElements[d].top-s.margins.top,u=c+s.snapElements[d].height,h-g>_||m>l+g||c-g>b||v>u+g||!t.contains(s.snapElements[d].item.ownerDocument,s.snapElements[d].item)?(s.snapElements[d].snapping&&s.options.snap.release&&s.options.snap.release.call(s.element,e,t.extend(s._uiHash(),{snapItem:s.snapElements[d].item})),s.snapElements[d].snapping=!1):("inner"!==f.snapMode&&(n=g>=Math.abs(c-b),o=g>=Math.abs(u-v),a=g>=Math.abs(h-_),r=g>=Math.abs(l-m),n&&(i.position.top=s._convertPositionTo("relative",{top:c-s.helperProportions.height,left:0}).top),o&&(i.position.top=s._convertPositionTo("relative",{top:u,left:0}).top),a&&(i.position.left=s._convertPositionTo("relative",{top:0,left:h-s.helperProportions.width}).left),r&&(i.position.left=s._convertPositionTo("relative",{top:0,left:l}).left)),p=n||o||a||r,"outer"!==f.snapMode&&(n=g>=Math.abs(c-v),o=g>=Math.abs(u-b),a=g>=Math.abs(h-m),r=g>=Math.abs(l-_),n&&(i.position.top=s._convertPositionTo("relative",{top:c,left:0}).top),o&&(i.position.top=s._convertPositionTo("relative",{top:u-s.helperProportions.height,left:0}).top),a&&(i.position.left=s._convertPositionTo("relative",{top:0,left:h}).left),r&&(i.position.left=s._convertPositionTo("relative",{top:0,left:l-s.helperProportions.width}).left)),!s.snapElements[d].snapping&&(n||o||a||r||p)&&s.options.snap.snap&&s.options.snap.snap.call(s.element,e,t.extend(s._uiHash(),{snapItem:s.snapElements[d].item})),s.snapElements[d].snapping=n||o||a||r||p)}}),t.ui.plugin.add("draggable","stack",{start:function(e,i,s){var n,o=s.options,a=t.makeArray(t(o.stack)).sort(function(e,i){return(parseInt(t(e).css("zIndex"),10)||0)-(parseInt(t(i).css("zIndex"),10)||0)});a.length&&(n=parseInt(t(a[0]).css("zIndex"),10)||0,t(a).each(function(e){t(this).css("zIndex",n+e)}),this.css("zIndex",n+a.length))}}),t.ui.plugin.add("draggable","zIndex",{start:function(e,i,s){var n=t(i.helper),o=s.options;n.css("zIndex")&&(o._zIndex=n.css("zIndex")),n.css("zIndex",o.zIndex)},stop:function(e,i,s){var n=s.options;n._zIndex&&t(i.helper).css("zIndex",n._zIndex)}}),t.ui.draggable,t.widget("ui.droppable",{version:"1.12.1",widgetEventPrefix:"drop",options:{accept:"*",addClasses:!0,greedy:!1,scope:"default",tolerance:"intersect",activate:null,deactivate:null,drop:null,out:null,over:null},_create:function(){var e,i=this.options,s=i.accept;this.isover=!1,this.isout=!0,this.accept=t.isFunction(s)?s:function(t){return t.is(s)},this.proportions=function(){return arguments.length?(e=arguments[0],void 0):e?e:e={width:this.element[0].offsetWidth,height:this.element[0].offsetHeight}},this._addToManager(i.scope),i.addClasses&&this._addClass("ui-droppable")},_addToManager:function(e){t.ui.ddmanager.droppables[e]=t.ui.ddmanager.droppables[e]||[],t.ui.ddmanager.droppables[e].push(this)},_splice:function(t){for(var e=0;t.length>e;e++)t[e]===this&&t.splice(e,1)},_destroy:function(){var e=t.ui.ddmanager.droppables[this.options.scope];this._splice(e)},_setOption:function(e,i){if("accept"===e)this.accept=t.isFunction(i)?i:function(t){return t.is(i)};else if("scope"===e){var s=t.ui.ddmanager.droppables[this.options.scope];this._splice(s),this._addToManager(i)}this._super(e,i)},_activate:function(e){var i=t.ui.ddmanager.current;this._addActiveClass(),i&&this._trigger("activate",e,this.ui(i))},_deactivate:function(e){var i=t.ui.ddmanager.current;this._removeActiveClass(),i&&this._trigger("deactivate",e,this.ui(i))},_over:function(e){var i=t.ui.ddmanager.current;i&&(i.currentItem||i.element)[0]!==this.element[0]&&this.accept.call(this.element[0],i.currentItem||i.element)&&(this._addHoverClass(),this._trigger("over",e,this.ui(i)))},_out:function(e){var i=t.ui.ddmanager.current;i&&(i.currentItem||i.element)[0]!==this.element[0]&&this.accept.call(this.element[0],i.currentItem||i.element)&&(this._removeHoverClass(),this._trigger("out",e,this.ui(i)))},_drop:function(e,i){var s=i||t.ui.ddmanager.current,n=!1;return s&&(s.currentItem||s.element)[0]!==this.element[0]?(this.element.find(":data(ui-droppable)").not(".ui-draggable-dragging").each(function(){var i=t(this).droppable("instance");return i.options.greedy&&!i.options.disabled&&i.options.scope===s.options.scope&&i.accept.call(i.element[0],s.currentItem||s.element)&&u(s,t.extend(i,{offset:i.element.offset()}),i.options.tolerance,e)?(n=!0,!1):void 0}),n?!1:this.accept.call(this.element[0],s.currentItem||s.element)?(this._removeActiveClass(),this._removeHoverClass(),this._trigger("drop",e,this.ui(s)),this.element):!1):!1},ui:function(t){return{draggable:t.currentItem||t.element,helper:t.helper,position:t.position,offset:t.positionAbs}},_addHoverClass:function(){this._addClass("ui-droppable-hover")},_removeHoverClass:function(){this._removeClass("ui-droppable-hover")},_addActiveClass:function(){this._addClass("ui-droppable-active")},_removeActiveClass:function(){this._removeClass("ui-droppable-active")}});var u=t.ui.intersect=function(){function t(t,e,i){return t>=e&&e+i>t}return function(e,i,s,n){if(!i.offset)return!1;var o=(e.positionAbs||e.position.absolute).left+e.margins.left,a=(e.positionAbs||e.position.absolute).top+e.margins.top,r=o+e.helperProportions.width,h=a+e.helperProportions.height,l=i.offset.left,c=i.offset.top,u=l+i.proportions().width,d=c+i.proportions().height;switch(s){case"fit":return o>=l&&u>=r&&a>=c&&d>=h;case"intersect":return o+e.helperProportions.width/2>l&&u>r-e.helperProportions.width/2&&a+e.helperProportions.height/2>c&&d>h-e.helperProportions.height/2;case"pointer":return t(n.pageY,c,i.proportions().height)&&t(n.pageX,l,i.proportions().width);case"touch":return(a>=c&&d>=a||h>=c&&d>=h||c>a&&h>d)&&(o>=l&&u>=o||r>=l&&u>=r||l>o&&r>u);default:return!1}}}();t.ui.ddmanager={current:null,droppables:{"default":[]},prepareOffsets:function(e,i){var s,n,o=t.ui.ddmanager.droppables[e.options.scope]||[],a=i?i.type:null,r=(e.currentItem||e.element).find(":data(ui-droppable)").addBack();t:for(s=0;o.length>s;s++)if(!(o[s].options.disabled||e&&!o[s].accept.call(o[s].element[0],e.currentItem||e.element))){for(n=0;r.length>n;n++)if(r[n]===o[s].element[0]){o[s].proportions().height=0;continue t}o[s].visible="none"!==o[s].element.css("display"),o[s].visible&&("mousedown"===a&&o[s]._activate.call(o[s],i),o[s].offset=o[s].element.offset(),o[s].proportions({width:o[s].element[0].offsetWidth,height:o[s].element[0].offsetHeight}))}},drop:function(e,i){var s=!1;return t.each((t.ui.ddmanager.droppables[e.options.scope]||[]).slice(),function(){this.options&&(!this.options.disabled&&this.visible&&u(e,this,this.options.tolerance,i)&&(s=this._drop.call(this,i)||s),!this.options.disabled&&this.visible&&this.accept.call(this.element[0],e.currentItem||e.element)&&(this.isout=!0,this.isover=!1,this._deactivate.call(this,i)))}),s},dragStart:function(e,i){e.element.parentsUntil("body").on("scroll.droppable",function(){e.options.refreshPositions||t.ui.ddmanager.prepareOffsets(e,i)})},drag:function(e,i){e.options.refreshPositions&&t.ui.ddmanager.prepareOffsets(e,i),t.each(t.ui.ddmanager.droppables[e.options.scope]||[],function(){if(!this.options.disabled&&!this.greedyChild&&this.visible){var s,n,o,a=u(e,this,this.options.tolerance,i),r=!a&&this.isover?"isout":a&&!this.isover?"isover":null;r&&(this.options.greedy&&(n=this.options.scope,o=this.element.parents(":data(ui-droppable)").filter(function(){return t(this).droppable("instance").options.scope===n}),o.length&&(s=t(o[0]).droppable("instance"),s.greedyChild="isover"===r)),s&&"isover"===r&&(s.isover=!1,s.isout=!0,s._out.call(s,i)),this[r]=!0,this["isout"===r?"isover":"isout"]=!1,this["isover"===r?"_over":"_out"].call(this,i),s&&"isout"===r&&(s.isout=!1,s.isover=!0,s._over.call(s,i)))}})},dragStop:function(e,i){e.element.parentsUntil("body").off("scroll.droppable"),e.options.refreshPositions||t.ui.ddmanager.prepareOffsets(e,i)}},t.uiBackCompat!==!1&&t.widget("ui.droppable",t.ui.droppable,{options:{hoverClass:!1,activeClass:!1},_addActiveClass:function(){this._super(),this.options.activeClass&&this.element.addClass(this.options.activeClass)},_removeActiveClass:function(){this._super(),this.options.activeClass&&this.element.removeClass(this.options.activeClass)},_addHoverClass:function(){this._super(),this.options.hoverClass&&this.element.addClass(this.options.hoverClass)},_removeHoverClass:function(){this._super(),this.options.hoverClass&&this.element.removeClass(this.options.hoverClass)}}),t.ui.droppable,t.widget("ui.resizable",t.ui.mouse,{version:"1.12.1",widgetEventPrefix:"resize",options:{alsoResize:!1,animate:!1,animateDuration:"slow",animateEasing:"swing",aspectRatio:!1,autoHide:!1,classes:{"ui-resizable-se":"ui-icon ui-icon-gripsmall-diagonal-se"},containment:!1,ghost:!1,grid:!1,handles:"e,s,se",helper:!1,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:90,resize:null,start:null,stop:null},_num:function(t){return parseFloat(t)||0},_isNumber:function(t){return!isNaN(parseFloat(t))},_hasScroll:function(e,i){if("hidden"===t(e).css("overflow"))return!1;var s=i&&"left"===i?"scrollLeft":"scrollTop",n=!1;return e[s]>0?!0:(e[s]=1,n=e[s]>0,e[s]=0,n)},_create:function(){var e,i=this.options,s=this;this._addClass("ui-resizable"),t.extend(this,{_aspectRatio:!!i.aspectRatio,aspectRatio:i.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:i.helper||i.ghost||i.animate?i.helper||"ui-resizable-helper":null}),this.element[0].nodeName.match(/^(canvas|textarea|input|select|button|img)$/i)&&(this.element.wrap(t("<div class='ui-wrapper' style='overflow: hidden;'></div>").css({position:this.element.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left:this.element.css("left")})),this.element=this.element.parent().data("ui-resizable",this.element.resizable("instance")),this.elementIsWrapper=!0,e={marginTop:this.originalElement.css("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom"),marginLeft:this.originalElement.css("marginLeft")},this.element.css(e),this.originalElement.css("margin",0),this.originalResizeStyle=this.originalElement.css("resize"),this.originalElement.css("resize","none"),this._proportionallyResizeElements.push(this.originalElement.css({position:"static",zoom:1,display:"block"})),this.originalElement.css(e),this._proportionallyResize()),this._setupHandles(),i.autoHide&&t(this.element).on("mouseenter",function(){i.disabled||(s._removeClass("ui-resizable-autohide"),s._handles.show())}).on("mouseleave",function(){i.disabled||s.resizing||(s._addClass("ui-resizable-autohide"),s._handles.hide())}),this._mouseInit()},_destroy:function(){this._mouseDestroy();var e,i=function(e){t(e).removeData("resizable").removeData("ui-resizable").off(".resizable").find(".ui-resizable-handle").remove()};return this.elementIsWrapper&&(i(this.element),e=this.element,this.originalElement.css({position:e.css("position"),width:e.outerWidth(),height:e.outerHeight(),top:e.css("top"),left:e.css("left")}).insertAfter(e),e.remove()),this.originalElement.css("resize",this.originalResizeStyle),i(this.originalElement),this},_setOption:function(t,e){switch(this._super(t,e),t){case"handles":this._removeHandles(),this._setupHandles();break;default:}},_setupHandles:function(){var e,i,s,n,o,a=this.options,r=this;if(this.handles=a.handles||(t(".ui-resizable-handle",this.element).length?{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",ne:".ui-resizable-ne",nw:".ui-resizable-nw"}:"e,s,se"),this._handles=t(),this.handles.constructor===String)for("all"===this.handles&&(this.handles="n,e,s,w,se,sw,ne,nw"),s=this.handles.split(","),this.handles={},i=0;s.length>i;i++)e=t.trim(s[i]),n="ui-resizable-"+e,o=t("<div>"),this._addClass(o,"ui-resizable-handle "+n),o.css({zIndex:a.zIndex}),this.handles[e]=".ui-resizable-"+e,this.element.append(o);this._renderAxis=function(e){var i,s,n,o;e=e||this.element;for(i in this.handles)this.handles[i].constructor===String?this.handles[i]=this.element.children(this.handles[i]).first().show():(this.handles[i].jquery||this.handles[i].nodeType)&&(this.handles[i]=t(this.handles[i]),this._on(this.handles[i],{mousedown:r._mouseDown})),this.elementIsWrapper&&this.originalElement[0].nodeName.match(/^(textarea|input|select|button)$/i)&&(s=t(this.handles[i],this.element),o=/sw|ne|nw|se|n|s/.test(i)?s.outerHeight():s.outerWidth(),n=["padding",/ne|nw|n/.test(i)?"Top":/se|sw|s/.test(i)?"Bottom":/^e$/.test(i)?"Right":"Left"].join(""),e.css(n,o),this._proportionallyResize()),this._handles=this._handles.add(this.handles[i])},this._renderAxis(this.element),this._handles=this._handles.add(this.element.find(".ui-resizable-handle")),this._handles.disableSelection(),this._handles.on("mouseover",function(){r.resizing||(this.className&&(o=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i)),r.axis=o&&o[1]?o[1]:"se")}),a.autoHide&&(this._handles.hide(),this._addClass("ui-resizable-autohide"))},_removeHandles:function(){this._handles.remove()},_mouseCapture:function(e){var i,s,n=!1;for(i in this.handles)s=t(this.handles[i])[0],(s===e.target||t.contains(s,e.target))&&(n=!0);return!this.options.disabled&&n},_mouseStart:function(e){var i,s,n,o=this.options,a=this.element;return this.resizing=!0,this._renderProxy(),i=this._num(this.helper.css("left")),s=this._num(this.helper.css("top")),o.containment&&(i+=t(o.containment).scrollLeft()||0,s+=t(o.containment).scrollTop()||0),this.offset=this.helper.offset(),this.position={left:i,top:s},this.size=this._helper?{width:this.helper.width(),height:this.helper.height()}:{width:a.width(),height:a.height()},this.originalSize=this._helper?{width:a.outerWidth(),height:a.outerHeight()}:{width:a.width(),height:a.height()},this.sizeDiff={width:a.outerWidth()-a.width(),height:a.outerHeight()-a.height()},this.originalPosition={left:i,top:s},this.originalMousePosition={left:e.pageX,top:e.pageY},this.aspectRatio="number"==typeof o.aspectRatio?o.aspectRatio:this.originalSize.width/this.originalSize.height||1,n=t(".ui-resizable-"+this.axis).css("cursor"),t("body").css("cursor","auto"===n?this.axis+"-resize":n),this._addClass("ui-resizable-resizing"),this._propagate("start",e),!0},_mouseDrag:function(e){var i,s,n=this.originalMousePosition,o=this.axis,a=e.pageX-n.left||0,r=e.pageY-n.top||0,h=this._change[o];return this._updatePrevProperties(),h?(i=h.apply(this,[e,a,r]),this._updateVirtualBoundaries(e.shiftKey),(this._aspectRatio||e.shiftKey)&&(i=this._updateRatio(i,e)),i=this._respectSize(i,e),this._updateCache(i),this._propagate("resize",e),s=this._applyChanges(),!this._helper&&this._proportionallyResizeElements.length&&this._proportionallyResize(),t.isEmptyObject(s)||(this._updatePrevProperties(),this._trigger("resize",e,this.ui()),this._applyChanges()),!1):!1},_mouseStop:function(e){this.resizing=!1;var i,s,n,o,a,r,h,l=this.options,c=this;return this._helper&&(i=this._proportionallyResizeElements,s=i.length&&/textarea/i.test(i[0].nodeName),n=s&&this._hasScroll(i[0],"left")?0:c.sizeDiff.height,o=s?0:c.sizeDiff.width,a={width:c.helper.width()-o,height:c.helper.height()-n},r=parseFloat(c.element.css("left"))+(c.position.left-c.originalPosition.left)||null,h=parseFloat(c.element.css("top"))+(c.position.top-c.originalPosition.top)||null,l.animate||this.element.css(t.extend(a,{top:h,left:r})),c.helper.height(c.size.height),c.helper.width(c.size.width),this._helper&&!l.animate&&this._proportionallyResize()),t("body").css("cursor","auto"),this._removeClass("ui-resizable-resizing"),this._propagate("stop",e),this._helper&&this.helper.remove(),!1},_updatePrevProperties:function(){this.prevPosition={top:this.position.top,left:this.position.left},this.prevSize={width:this.size.width,height:this.size.height}},_applyChanges:function(){var t={};return this.position.top!==this.prevPosition.top&&(t.top=this.position.top+"px"),this.position.left!==this.prevPosition.left&&(t.left=this.position.left+"px"),this.size.width!==this.prevSize.width&&(t.width=this.size.width+"px"),this.size.height!==this.prevSize.height&&(t.height=this.size.height+"px"),this.helper.css(t),t},_updateVirtualBoundaries:function(t){var e,i,s,n,o,a=this.options;o={minWidth:this._isNumber(a.minWidth)?a.minWidth:0,maxWidth:this._isNumber(a.maxWidth)?a.maxWidth:1/0,minHeight:this._isNumber(a.minHeight)?a.minHeight:0,maxHeight:this._isNumber(a.maxHeight)?a.maxHeight:1/0},(this._aspectRatio||t)&&(e=o.minHeight*this.aspectRatio,s=o.minWidth/this.aspectRatio,i=o.maxHeight*this.aspectRatio,n=o.maxWidth/this.aspectRatio,e>o.minWidth&&(o.minWidth=e),s>o.minHeight&&(o.minHeight=s),o.maxWidth>i&&(o.maxWidth=i),o.maxHeight>n&&(o.maxHeight=n)),this._vBoundaries=o},_updateCache:function(t){this.offset=this.helper.offset(),this._isNumber(t.left)&&(this.position.left=t.left),this._isNumber(t.top)&&(this.position.top=t.top),this._isNumber(t.height)&&(this.size.height=t.height),this._isNumber(t.width)&&(this.size.width=t.width)},_updateRatio:function(t){var e=this.position,i=this.size,s=this.axis;return this._isNumber(t.height)?t.width=t.height*this.aspectRatio:this._isNumber(t.width)&&(t.height=t.width/this.aspectRatio),"sw"===s&&(t.left=e.left+(i.width-t.width),t.top=null),"nw"===s&&(t.top=e.top+(i.height-t.height),t.left=e.left+(i.width-t.width)),t},_respectSize:function(t){var e=this._vBoundaries,i=this.axis,s=this._isNumber(t.width)&&e.maxWidth&&e.maxWidth<t.width,n=this._isNumber(t.height)&&e.maxHeight&&e.maxHeight<t.height,o=this._isNumber(t.width)&&e.minWidth&&e.minWidth>t.width,a=this._isNumber(t.height)&&e.minHeight&&e.minHeight>t.height,r=this.originalPosition.left+this.originalSize.width,h=this.originalPosition.top+this.originalSize.height,l=/sw|nw|w/.test(i),c=/nw|ne|n/.test(i);return o&&(t.width=e.minWidth),a&&(t.height=e.minHeight),s&&(t.width=e.maxWidth),n&&(t.height=e.maxHeight),o&&l&&(t.left=r-e.minWidth),s&&l&&(t.left=r-e.maxWidth),a&&c&&(t.top=h-e.minHeight),n&&c&&(t.top=h-e.maxHeight),t.width||t.height||t.left||!t.top?t.width||t.height||t.top||!t.left||(t.left=null):t.top=null,t},_getPaddingPlusBorderDimensions:function(t){for(var e=0,i=[],s=[t.css("borderTopWidth"),t.css("borderRightWidth"),t.css("borderBottomWidth"),t.css("borderLeftWidth")],n=[t.css("paddingTop"),t.css("paddingRight"),t.css("paddingBottom"),t.css("paddingLeft")];4>e;e++)i[e]=parseFloat(s[e])||0,i[e]+=parseFloat(n[e])||0;return{height:i[0]+i[2],width:i[1]+i[3]}},_proportionallyResize:function(){if(this._proportionallyResizeElements.length)for(var t,e=0,i=this.helper||this.element;this._proportionallyResizeElements.length>e;e++)t=this._proportionallyResizeElements[e],this.outerDimensions||(this.outerDimensions=this._getPaddingPlusBorderDimensions(t)),t.css({height:i.height()-this.outerDimensions.height||0,width:i.width()-this.outerDimensions.width||0})},_renderProxy:function(){var e=this.element,i=this.options;this.elementOffset=e.offset(),this._helper?(this.helper=this.helper||t("<div style='overflow:hidden;'></div>"),this._addClass(this.helper,this._helper),this.helper.css({width:this.element.outerWidth(),height:this.element.outerHeight(),position:"absolute",left:this.elementOffset.left+"px",top:this.elementOffset.top+"px",zIndex:++i.zIndex}),this.helper.appendTo("body").disableSelection()):this.helper=this.element},_change:{e:function(t,e){return{width:this.originalSize.width+e}},w:function(t,e){var i=this.originalSize,s=this.originalPosition;return{left:s.left+e,width:i.width-e}},n:function(t,e,i){var s=this.originalSize,n=this.originalPosition;return{top:n.top+i,height:s.height-i}},s:function(t,e,i){return{height:this.originalSize.height+i}},se:function(e,i,s){return t.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[e,i,s]))},sw:function(e,i,s){return t.extend(this._change.s.apply(this,arguments),this._change.w.apply(this,[e,i,s]))},ne:function(e,i,s){return t.extend(this._change.n.apply(this,arguments),this._change.e.apply(this,[e,i,s]))},nw:function(e,i,s){return t.extend(this._change.n.apply(this,arguments),this._change.w.apply(this,[e,i,s]))}},_propagate:function(e,i){t.ui.plugin.call(this,e,[i,this.ui()]),"resize"!==e&&this._trigger(e,i,this.ui())},plugins:{},ui:function(){return{originalElement:this.originalElement,element:this.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:this.originalPosition}}}),t.ui.plugin.add("resizable","animate",{stop:function(e){var i=t(this).resizable("instance"),s=i.options,n=i._proportionallyResizeElements,o=n.length&&/textarea/i.test(n[0].nodeName),a=o&&i._hasScroll(n[0],"left")?0:i.sizeDiff.height,r=o?0:i.sizeDiff.width,h={width:i.size.width-r,height:i.size.height-a},l=parseFloat(i.element.css("left"))+(i.position.left-i.originalPosition.left)||null,c=parseFloat(i.element.css("top"))+(i.position.top-i.originalPosition.top)||null;i.element.animate(t.extend(h,c&&l?{top:c,left:l}:{}),{duration:s.animateDuration,easing:s.animateEasing,step:function(){var s={width:parseFloat(i.element.css("width")),height:parseFloat(i.element.css("height")),top:parseFloat(i.element.css("top")),left:parseFloat(i.element.css("left"))};n&&n.length&&t(n[0]).css({width:s.width,height:s.height}),i._updateCache(s),i._propagate("resize",e)}})}}),t.ui.plugin.add("resizable","containment",{start:function(){var e,i,s,n,o,a,r,h=t(this).resizable("instance"),l=h.options,c=h.element,u=l.containment,d=u instanceof t?u.get(0):/parent/.test(u)?c.parent().get(0):u;d&&(h.containerElement=t(d),/document/.test(u)||u===document?(h.containerOffset={left:0,top:0},h.containerPosition={left:0,top:0},h.parentData={element:t(document),left:0,top:0,width:t(document).width(),height:t(document).height()||document.body.parentNode.scrollHeight}):(e=t(d),i=[],t(["Top","Right","Left","Bottom"]).each(function(t,s){i[t]=h._num(e.css("padding"+s))}),h.containerOffset=e.offset(),h.containerPosition=e.position(),h.containerSize={height:e.innerHeight()-i[3],width:e.innerWidth()-i[1]},s=h.containerOffset,n=h.containerSize.height,o=h.containerSize.width,a=h._hasScroll(d,"left")?d.scrollWidth:o,r=h._hasScroll(d)?d.scrollHeight:n,h.parentData={element:d,left:s.left,top:s.top,width:a,height:r}))},resize:function(e){var i,s,n,o,a=t(this).resizable("instance"),r=a.options,h=a.containerOffset,l=a.position,c=a._aspectRatio||e.shiftKey,u={top:0,left:0},d=a.containerElement,p=!0;d[0]!==document&&/static/.test(d.css("position"))&&(u=h),l.left<(a._helper?h.left:0)&&(a.size.width=a.size.width+(a._helper?a.position.left-h.left:a.position.left-u.left),c&&(a.size.height=a.size.width/a.aspectRatio,p=!1),a.position.left=r.helper?h.left:0),l.top<(a._helper?h.top:0)&&(a.size.height=a.size.height+(a._helper?a.position.top-h.top:a.position.top),c&&(a.size.width=a.size.height*a.aspectRatio,p=!1),a.position.top=a._helper?h.top:0),n=a.containerElement.get(0)===a.element.parent().get(0),o=/relative|absolute/.test(a.containerElement.css("position")),n&&o?(a.offset.left=a.parentData.left+a.position.left,a.offset.top=a.parentData.top+a.position.top):(a.offset.left=a.element.offset().left,a.offset.top=a.element.offset().top),i=Math.abs(a.sizeDiff.width+(a._helper?a.offset.left-u.left:a.offset.left-h.left)),s=Math.abs(a.sizeDiff.height+(a._helper?a.offset.top-u.top:a.offset.top-h.top)),i+a.size.width>=a.parentData.width&&(a.size.width=a.parentData.width-i,c&&(a.size.height=a.size.width/a.aspectRatio,p=!1)),s+a.size.height>=a.parentData.height&&(a.size.height=a.parentData.height-s,c&&(a.size.width=a.size.height*a.aspectRatio,p=!1)),p||(a.position.left=a.prevPosition.left,a.position.top=a.prevPosition.top,a.size.width=a.prevSize.width,a.size.height=a.prevSize.height)},stop:function(){var e=t(this).resizable("instance"),i=e.options,s=e.containerOffset,n=e.containerPosition,o=e.containerElement,a=t(e.helper),r=a.offset(),h=a.outerWidth()-e.sizeDiff.width,l=a.outerHeight()-e.sizeDiff.height;e._helper&&!i.animate&&/relative/.test(o.css("position"))&&t(this).css({left:r.left-n.left-s.left,width:h,height:l}),e._helper&&!i.animate&&/static/.test(o.css("position"))&&t(this).css({left:r.left-n.left-s.left,width:h,height:l})}}),t.ui.plugin.add("resizable","alsoResize",{start:function(){var e=t(this).resizable("instance"),i=e.options;t(i.alsoResize).each(function(){var e=t(this);e.data("ui-resizable-alsoresize",{width:parseFloat(e.width()),height:parseFloat(e.height()),left:parseFloat(e.css("left")),top:parseFloat(e.css("top"))})})},resize:function(e,i){var s=t(this).resizable("instance"),n=s.options,o=s.originalSize,a=s.originalPosition,r={height:s.size.height-o.height||0,width:s.size.width-o.width||0,top:s.position.top-a.top||0,left:s.position.left-a.left||0};
t(n.alsoResize).each(function(){var e=t(this),s=t(this).data("ui-resizable-alsoresize"),n={},o=e.parents(i.originalElement[0]).length?["width","height"]:["width","height","top","left"];t.each(o,function(t,e){var i=(s[e]||0)+(r[e]||0);i&&i>=0&&(n[e]=i||null)}),e.css(n)})},stop:function(){t(this).removeData("ui-resizable-alsoresize")}}),t.ui.plugin.add("resizable","ghost",{start:function(){var e=t(this).resizable("instance"),i=e.size;e.ghost=e.originalElement.clone(),e.ghost.css({opacity:.25,display:"block",position:"relative",height:i.height,width:i.width,margin:0,left:0,top:0}),e._addClass(e.ghost,"ui-resizable-ghost"),t.uiBackCompat!==!1&&"string"==typeof e.options.ghost&&e.ghost.addClass(this.options.ghost),e.ghost.appendTo(e.helper)},resize:function(){var e=t(this).resizable("instance");e.ghost&&e.ghost.css({position:"relative",height:e.size.height,width:e.size.width})},stop:function(){var e=t(this).resizable("instance");e.ghost&&e.helper&&e.helper.get(0).removeChild(e.ghost.get(0))}}),t.ui.plugin.add("resizable","grid",{resize:function(){var e,i=t(this).resizable("instance"),s=i.options,n=i.size,o=i.originalSize,a=i.originalPosition,r=i.axis,h="number"==typeof s.grid?[s.grid,s.grid]:s.grid,l=h[0]||1,c=h[1]||1,u=Math.round((n.width-o.width)/l)*l,d=Math.round((n.height-o.height)/c)*c,p=o.width+u,f=o.height+d,g=s.maxWidth&&p>s.maxWidth,m=s.maxHeight&&f>s.maxHeight,_=s.minWidth&&s.minWidth>p,v=s.minHeight&&s.minHeight>f;s.grid=h,_&&(p+=l),v&&(f+=c),g&&(p-=l),m&&(f-=c),/^(se|s|e)$/.test(r)?(i.size.width=p,i.size.height=f):/^(ne)$/.test(r)?(i.size.width=p,i.size.height=f,i.position.top=a.top-d):/^(sw)$/.test(r)?(i.size.width=p,i.size.height=f,i.position.left=a.left-u):((0>=f-c||0>=p-l)&&(e=i._getPaddingPlusBorderDimensions(this)),f-c>0?(i.size.height=f,i.position.top=a.top-d):(f=c-e.height,i.size.height=f,i.position.top=a.top+o.height-f),p-l>0?(i.size.width=p,i.position.left=a.left-u):(p=l-e.width,i.size.width=p,i.position.left=a.left+o.width-p))}}),t.ui.resizable,t.widget("ui.selectable",t.ui.mouse,{version:"1.12.1",options:{appendTo:"body",autoRefresh:!0,distance:0,filter:"*",tolerance:"touch",selected:null,selecting:null,start:null,stop:null,unselected:null,unselecting:null},_create:function(){var e=this;this._addClass("ui-selectable"),this.dragged=!1,this.refresh=function(){e.elementPos=t(e.element[0]).offset(),e.selectees=t(e.options.filter,e.element[0]),e._addClass(e.selectees,"ui-selectee"),e.selectees.each(function(){var i=t(this),s=i.offset(),n={left:s.left-e.elementPos.left,top:s.top-e.elementPos.top};t.data(this,"selectable-item",{element:this,$element:i,left:n.left,top:n.top,right:n.left+i.outerWidth(),bottom:n.top+i.outerHeight(),startselected:!1,selected:i.hasClass("ui-selected"),selecting:i.hasClass("ui-selecting"),unselecting:i.hasClass("ui-unselecting")})})},this.refresh(),this._mouseInit(),this.helper=t("<div>"),this._addClass(this.helper,"ui-selectable-helper")},_destroy:function(){this.selectees.removeData("selectable-item"),this._mouseDestroy()},_mouseStart:function(e){var i=this,s=this.options;this.opos=[e.pageX,e.pageY],this.elementPos=t(this.element[0]).offset(),this.options.disabled||(this.selectees=t(s.filter,this.element[0]),this._trigger("start",e),t(s.appendTo).append(this.helper),this.helper.css({left:e.pageX,top:e.pageY,width:0,height:0}),s.autoRefresh&&this.refresh(),this.selectees.filter(".ui-selected").each(function(){var s=t.data(this,"selectable-item");s.startselected=!0,e.metaKey||e.ctrlKey||(i._removeClass(s.$element,"ui-selected"),s.selected=!1,i._addClass(s.$element,"ui-unselecting"),s.unselecting=!0,i._trigger("unselecting",e,{unselecting:s.element}))}),t(e.target).parents().addBack().each(function(){var s,n=t.data(this,"selectable-item");return n?(s=!e.metaKey&&!e.ctrlKey||!n.$element.hasClass("ui-selected"),i._removeClass(n.$element,s?"ui-unselecting":"ui-selected")._addClass(n.$element,s?"ui-selecting":"ui-unselecting"),n.unselecting=!s,n.selecting=s,n.selected=s,s?i._trigger("selecting",e,{selecting:n.element}):i._trigger("unselecting",e,{unselecting:n.element}),!1):void 0}))},_mouseDrag:function(e){if(this.dragged=!0,!this.options.disabled){var i,s=this,n=this.options,o=this.opos[0],a=this.opos[1],r=e.pageX,h=e.pageY;return o>r&&(i=r,r=o,o=i),a>h&&(i=h,h=a,a=i),this.helper.css({left:o,top:a,width:r-o,height:h-a}),this.selectees.each(function(){var i=t.data(this,"selectable-item"),l=!1,c={};i&&i.element!==s.element[0]&&(c.left=i.left+s.elementPos.left,c.right=i.right+s.elementPos.left,c.top=i.top+s.elementPos.top,c.bottom=i.bottom+s.elementPos.top,"touch"===n.tolerance?l=!(c.left>r||o>c.right||c.top>h||a>c.bottom):"fit"===n.tolerance&&(l=c.left>o&&r>c.right&&c.top>a&&h>c.bottom),l?(i.selected&&(s._removeClass(i.$element,"ui-selected"),i.selected=!1),i.unselecting&&(s._removeClass(i.$element,"ui-unselecting"),i.unselecting=!1),i.selecting||(s._addClass(i.$element,"ui-selecting"),i.selecting=!0,s._trigger("selecting",e,{selecting:i.element}))):(i.selecting&&((e.metaKey||e.ctrlKey)&&i.startselected?(s._removeClass(i.$element,"ui-selecting"),i.selecting=!1,s._addClass(i.$element,"ui-selected"),i.selected=!0):(s._removeClass(i.$element,"ui-selecting"),i.selecting=!1,i.startselected&&(s._addClass(i.$element,"ui-unselecting"),i.unselecting=!0),s._trigger("unselecting",e,{unselecting:i.element}))),i.selected&&(e.metaKey||e.ctrlKey||i.startselected||(s._removeClass(i.$element,"ui-selected"),i.selected=!1,s._addClass(i.$element,"ui-unselecting"),i.unselecting=!0,s._trigger("unselecting",e,{unselecting:i.element})))))}),!1}},_mouseStop:function(e){var i=this;return this.dragged=!1,t(".ui-unselecting",this.element[0]).each(function(){var s=t.data(this,"selectable-item");i._removeClass(s.$element,"ui-unselecting"),s.unselecting=!1,s.startselected=!1,i._trigger("unselected",e,{unselected:s.element})}),t(".ui-selecting",this.element[0]).each(function(){var s=t.data(this,"selectable-item");i._removeClass(s.$element,"ui-selecting")._addClass(s.$element,"ui-selected"),s.selecting=!1,s.selected=!0,s.startselected=!0,i._trigger("selected",e,{selected:s.element})}),this._trigger("stop",e),this.helper.remove(),!1}}),t.widget("ui.sortable",t.ui.mouse,{version:"1.12.1",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3,activate:null,beforeStop:null,change:null,deactivate:null,out:null,over:null,receive:null,remove:null,sort:null,start:null,stop:null,update:null},_isOverAxis:function(t,e,i){return t>=e&&e+i>t},_isFloating:function(t){return/left|right/.test(t.css("float"))||/inline|table-cell/.test(t.css("display"))},_create:function(){this.containerCache={},this._addClass("ui-sortable"),this.refresh(),this.offset=this.element.offset(),this._mouseInit(),this._setHandleClassName(),this.ready=!0},_setOption:function(t,e){this._super(t,e),"handle"===t&&this._setHandleClassName()},_setHandleClassName:function(){var e=this;this._removeClass(this.element.find(".ui-sortable-handle"),"ui-sortable-handle"),t.each(this.items,function(){e._addClass(this.instance.options.handle?this.item.find(this.instance.options.handle):this.item,"ui-sortable-handle")})},_destroy:function(){this._mouseDestroy();for(var t=this.items.length-1;t>=0;t--)this.items[t].item.removeData(this.widgetName+"-item");return this},_mouseCapture:function(e,i){var s=null,n=!1,o=this;return this.reverting?!1:this.options.disabled||"static"===this.options.type?!1:(this._refreshItems(e),t(e.target).parents().each(function(){return t.data(this,o.widgetName+"-item")===o?(s=t(this),!1):void 0}),t.data(e.target,o.widgetName+"-item")===o&&(s=t(e.target)),s?!this.options.handle||i||(t(this.options.handle,s).find("*").addBack().each(function(){this===e.target&&(n=!0)}),n)?(this.currentItem=s,this._removeCurrentsFromItems(),!0):!1:!1)},_mouseStart:function(e,i,s){var n,o,a=this.options;if(this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(e),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},t.extend(this.offset,{click:{left:e.pageX-this.offset.left,top:e.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(e),this.originalPageX=e.pageX,this.originalPageY=e.pageY,a.cursorAt&&this._adjustOffsetFromHelper(a.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!==this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),a.containment&&this._setContainment(),a.cursor&&"auto"!==a.cursor&&(o=this.document.find("body"),this.storedCursor=o.css("cursor"),o.css("cursor",a.cursor),this.storedStylesheet=t("<style>*{ cursor: "+a.cursor+" !important; }</style>").appendTo(o)),a.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",a.opacity)),a.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",a.zIndex)),this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",e,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions(),!s)for(n=this.containers.length-1;n>=0;n--)this.containers[n]._trigger("activate",e,this._uiHash(this));return t.ui.ddmanager&&(t.ui.ddmanager.current=this),t.ui.ddmanager&&!a.dropBehaviour&&t.ui.ddmanager.prepareOffsets(this,e),this.dragging=!0,this._addClass(this.helper,"ui-sortable-helper"),this._mouseDrag(e),!0},_mouseDrag:function(e){var i,s,n,o,a=this.options,r=!1;for(this.position=this._generatePosition(e),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs),this.options.scroll&&(this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-e.pageY<a.scrollSensitivity?this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop+a.scrollSpeed:e.pageY-this.overflowOffset.top<a.scrollSensitivity&&(this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop-a.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-e.pageX<a.scrollSensitivity?this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft+a.scrollSpeed:e.pageX-this.overflowOffset.left<a.scrollSensitivity&&(this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft-a.scrollSpeed)):(e.pageY-this.document.scrollTop()<a.scrollSensitivity?r=this.document.scrollTop(this.document.scrollTop()-a.scrollSpeed):this.window.height()-(e.pageY-this.document.scrollTop())<a.scrollSensitivity&&(r=this.document.scrollTop(this.document.scrollTop()+a.scrollSpeed)),e.pageX-this.document.scrollLeft()<a.scrollSensitivity?r=this.document.scrollLeft(this.document.scrollLeft()-a.scrollSpeed):this.window.width()-(e.pageX-this.document.scrollLeft())<a.scrollSensitivity&&(r=this.document.scrollLeft(this.document.scrollLeft()+a.scrollSpeed))),r!==!1&&t.ui.ddmanager&&!a.dropBehaviour&&t.ui.ddmanager.prepareOffsets(this,e)),this.positionAbs=this._convertPositionTo("absolute"),this.options.axis&&"y"===this.options.axis||(this.helper[0].style.left=this.position.left+"px"),this.options.axis&&"x"===this.options.axis||(this.helper[0].style.top=this.position.top+"px"),i=this.items.length-1;i>=0;i--)if(s=this.items[i],n=s.item[0],o=this._intersectsWithPointer(s),o&&s.instance===this.currentContainer&&n!==this.currentItem[0]&&this.placeholder[1===o?"next":"prev"]()[0]!==n&&!t.contains(this.placeholder[0],n)&&("semi-dynamic"===this.options.type?!t.contains(this.element[0],n):!0)){if(this.direction=1===o?"down":"up","pointer"!==this.options.tolerance&&!this._intersectsWithSides(s))break;this._rearrange(e,s),this._trigger("change",e,this._uiHash());break}return this._contactContainers(e),t.ui.ddmanager&&t.ui.ddmanager.drag(this,e),this._trigger("sort",e,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(e,i){if(e){if(t.ui.ddmanager&&!this.options.dropBehaviour&&t.ui.ddmanager.drop(this,e),this.options.revert){var s=this,n=this.placeholder.offset(),o=this.options.axis,a={};o&&"x"!==o||(a.left=n.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollLeft)),o&&"y"!==o||(a.top=n.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollTop)),this.reverting=!0,t(this.helper).animate(a,parseInt(this.options.revert,10)||500,function(){s._clear(e)})}else this._clear(e,i);return!1}},cancel:function(){if(this.dragging){this._mouseUp(new t.Event("mouseup",{target:null})),"original"===this.options.helper?(this.currentItem.css(this._storedCSS),this._removeClass(this.currentItem,"ui-sortable-helper")):this.currentItem.show();for(var e=this.containers.length-1;e>=0;e--)this.containers[e]._trigger("deactivate",null,this._uiHash(this)),this.containers[e].containerCache.over&&(this.containers[e]._trigger("out",null,this._uiHash(this)),this.containers[e].containerCache.over=0)}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),"original"!==this.options.helper&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),t.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?t(this.domPosition.prev).after(this.currentItem):t(this.domPosition.parent).prepend(this.currentItem)),this},serialize:function(e){var i=this._getItemsAsjQuery(e&&e.connected),s=[];return e=e||{},t(i).each(function(){var i=(t(e.item||this).attr(e.attribute||"id")||"").match(e.expression||/(.+)[\-=_](.+)/);i&&s.push((e.key||i[1]+"[]")+"="+(e.key&&e.expression?i[1]:i[2]))}),!s.length&&e.key&&s.push(e.key+"="),s.join("&")},toArray:function(e){var i=this._getItemsAsjQuery(e&&e.connected),s=[];return e=e||{},i.each(function(){s.push(t(e.item||this).attr(e.attribute||"id")||"")}),s},_intersectsWith:function(t){var e=this.positionAbs.left,i=e+this.helperProportions.width,s=this.positionAbs.top,n=s+this.helperProportions.height,o=t.left,a=o+t.width,r=t.top,h=r+t.height,l=this.offset.click.top,c=this.offset.click.left,u="x"===this.options.axis||s+l>r&&h>s+l,d="y"===this.options.axis||e+c>o&&a>e+c,p=u&&d;return"pointer"===this.options.tolerance||this.options.forcePointerForContainers||"pointer"!==this.options.tolerance&&this.helperProportions[this.floating?"width":"height"]>t[this.floating?"width":"height"]?p:e+this.helperProportions.width/2>o&&a>i-this.helperProportions.width/2&&s+this.helperProportions.height/2>r&&h>n-this.helperProportions.height/2},_intersectsWithPointer:function(t){var e,i,s="x"===this.options.axis||this._isOverAxis(this.positionAbs.top+this.offset.click.top,t.top,t.height),n="y"===this.options.axis||this._isOverAxis(this.positionAbs.left+this.offset.click.left,t.left,t.width),o=s&&n;return o?(e=this._getDragVerticalDirection(),i=this._getDragHorizontalDirection(),this.floating?"right"===i||"down"===e?2:1:e&&("down"===e?2:1)):!1},_intersectsWithSides:function(t){var e=this._isOverAxis(this.positionAbs.top+this.offset.click.top,t.top+t.height/2,t.height),i=this._isOverAxis(this.positionAbs.left+this.offset.click.left,t.left+t.width/2,t.width),s=this._getDragVerticalDirection(),n=this._getDragHorizontalDirection();return this.floating&&n?"right"===n&&i||"left"===n&&!i:s&&("down"===s&&e||"up"===s&&!e)},_getDragVerticalDirection:function(){var t=this.positionAbs.top-this.lastPositionAbs.top;return 0!==t&&(t>0?"down":"up")},_getDragHorizontalDirection:function(){var t=this.positionAbs.left-this.lastPositionAbs.left;return 0!==t&&(t>0?"right":"left")},refresh:function(t){return this._refreshItems(t),this._setHandleClassName(),this.refreshPositions(),this},_connectWith:function(){var t=this.options;return t.connectWith.constructor===String?[t.connectWith]:t.connectWith},_getItemsAsjQuery:function(e){function i(){r.push(this)}var s,n,o,a,r=[],h=[],l=this._connectWith();if(l&&e)for(s=l.length-1;s>=0;s--)for(o=t(l[s],this.document[0]),n=o.length-1;n>=0;n--)a=t.data(o[n],this.widgetFullName),a&&a!==this&&!a.options.disabled&&h.push([t.isFunction(a.options.items)?a.options.items.call(a.element):t(a.options.items,a.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),a]);for(h.push([t.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):t(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]),s=h.length-1;s>=0;s--)h[s][0].each(i);return t(r)},_removeCurrentsFromItems:function(){var e=this.currentItem.find(":data("+this.widgetName+"-item)");this.items=t.grep(this.items,function(t){for(var i=0;e.length>i;i++)if(e[i]===t.item[0])return!1;return!0})},_refreshItems:function(e){this.items=[],this.containers=[this];var i,s,n,o,a,r,h,l,c=this.items,u=[[t.isFunction(this.options.items)?this.options.items.call(this.element[0],e,{item:this.currentItem}):t(this.options.items,this.element),this]],d=this._connectWith();if(d&&this.ready)for(i=d.length-1;i>=0;i--)for(n=t(d[i],this.document[0]),s=n.length-1;s>=0;s--)o=t.data(n[s],this.widgetFullName),o&&o!==this&&!o.options.disabled&&(u.push([t.isFunction(o.options.items)?o.options.items.call(o.element[0],e,{item:this.currentItem}):t(o.options.items,o.element),o]),this.containers.push(o));for(i=u.length-1;i>=0;i--)for(a=u[i][1],r=u[i][0],s=0,l=r.length;l>s;s++)h=t(r[s]),h.data(this.widgetName+"-item",a),c.push({item:h,instance:a,width:0,height:0,left:0,top:0})},refreshPositions:function(e){this.floating=this.items.length?"x"===this.options.axis||this._isFloating(this.items[0].item):!1,this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());var i,s,n,o;for(i=this.items.length-1;i>=0;i--)s=this.items[i],s.instance!==this.currentContainer&&this.currentContainer&&s.item[0]!==this.currentItem[0]||(n=this.options.toleranceElement?t(this.options.toleranceElement,s.item):s.item,e||(s.width=n.outerWidth(),s.height=n.outerHeight()),o=n.offset(),s.left=o.left,s.top=o.top);if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContainers.call(this);else for(i=this.containers.length-1;i>=0;i--)o=this.containers[i].element.offset(),this.containers[i].containerCache.left=o.left,this.containers[i].containerCache.top=o.top,this.containers[i].containerCache.width=this.containers[i].element.outerWidth(),this.containers[i].containerCache.height=this.containers[i].element.outerHeight();return this},_createPlaceholder:function(e){e=e||this;var i,s=e.options;s.placeholder&&s.placeholder.constructor!==String||(i=s.placeholder,s.placeholder={element:function(){var s=e.currentItem[0].nodeName.toLowerCase(),n=t("<"+s+">",e.document[0]);return e._addClass(n,"ui-sortable-placeholder",i||e.currentItem[0].className)._removeClass(n,"ui-sortable-helper"),"tbody"===s?e._createTrPlaceholder(e.currentItem.find("tr").eq(0),t("<tr>",e.document[0]).appendTo(n)):"tr"===s?e._createTrPlaceholder(e.currentItem,n):"img"===s&&n.attr("src",e.currentItem.attr("src")),i||n.css("visibility","hidden"),n},update:function(t,n){(!i||s.forcePlaceholderSize)&&(n.height()||n.height(e.currentItem.innerHeight()-parseInt(e.currentItem.css("paddingTop")||0,10)-parseInt(e.currentItem.css("paddingBottom")||0,10)),n.width()||n.width(e.currentItem.innerWidth()-parseInt(e.currentItem.css("paddingLeft")||0,10)-parseInt(e.currentItem.css("paddingRight")||0,10)))}}),e.placeholder=t(s.placeholder.element.call(e.element,e.currentItem)),e.currentItem.after(e.placeholder),s.placeholder.update(e,e.placeholder)},_createTrPlaceholder:function(e,i){var s=this;e.children().each(function(){t("<td>&#160;</td>",s.document[0]).attr("colspan",t(this).attr("colspan")||1).appendTo(i)})},_contactContainers:function(e){var i,s,n,o,a,r,h,l,c,u,d=null,p=null;for(i=this.containers.length-1;i>=0;i--)if(!t.contains(this.currentItem[0],this.containers[i].element[0]))if(this._intersectsWith(this.containers[i].containerCache)){if(d&&t.contains(this.containers[i].element[0],d.element[0]))continue;d=this.containers[i],p=i}else this.containers[i].containerCache.over&&(this.containers[i]._trigger("out",e,this._uiHash(this)),this.containers[i].containerCache.over=0);if(d)if(1===this.containers.length)this.containers[p].containerCache.over||(this.containers[p]._trigger("over",e,this._uiHash(this)),this.containers[p].containerCache.over=1);else{for(n=1e4,o=null,c=d.floating||this._isFloating(this.currentItem),a=c?"left":"top",r=c?"width":"height",u=c?"pageX":"pageY",s=this.items.length-1;s>=0;s--)t.contains(this.containers[p].element[0],this.items[s].item[0])&&this.items[s].item[0]!==this.currentItem[0]&&(h=this.items[s].item.offset()[a],l=!1,e[u]-h>this.items[s][r]/2&&(l=!0),n>Math.abs(e[u]-h)&&(n=Math.abs(e[u]-h),o=this.items[s],this.direction=l?"up":"down"));if(!o&&!this.options.dropOnEmpty)return;if(this.currentContainer===this.containers[p])return this.currentContainer.containerCache.over||(this.containers[p]._trigger("over",e,this._uiHash()),this.currentContainer.containerCache.over=1),void 0;o?this._rearrange(e,o,null,!0):this._rearrange(e,null,this.containers[p].element,!0),this._trigger("change",e,this._uiHash()),this.containers[p]._trigger("change",e,this._uiHash(this)),this.currentContainer=this.containers[p],this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[p]._trigger("over",e,this._uiHash(this)),this.containers[p].containerCache.over=1}},_createHelper:function(e){var i=this.options,s=t.isFunction(i.helper)?t(i.helper.apply(this.element[0],[e,this.currentItem])):"clone"===i.helper?this.currentItem.clone():this.currentItem;return s.parents("body").length||t("parent"!==i.appendTo?i.appendTo:this.currentItem[0].parentNode)[0].appendChild(s[0]),s[0]===this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(!s[0].style.width||i.forceHelperSize)&&s.width(this.currentItem.width()),(!s[0].style.height||i.forceHelperSize)&&s.height(this.currentItem.height()),s},_adjustOffsetFromHelper:function(e){"string"==typeof e&&(e=e.split(" ")),t.isArray(e)&&(e={left:+e[0],top:+e[1]||0}),"left"in e&&(this.offset.click.left=e.left+this.margins.left),"right"in e&&(this.offset.click.left=this.helperProportions.width-e.right+this.margins.left),"top"in e&&(this.offset.click.top=e.top+this.margins.top),"bottom"in e&&(this.offset.click.top=this.helperProportions.height-e.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var e=this.offsetParent.offset();return"absolute"===this.cssPosition&&this.scrollParent[0]!==this.document[0]&&t.contains(this.scrollParent[0],this.offsetParent[0])&&(e.left+=this.scrollParent.scrollLeft(),e.top+=this.scrollParent.scrollTop()),(this.offsetParent[0]===this.document[0].body||this.offsetParent[0].tagName&&"html"===this.offsetParent[0].tagName.toLowerCase()&&t.ui.ie)&&(e={top:0,left:0}),{top:e.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:e.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if("relative"===this.cssPosition){var t=this.currentItem.position();return{top:t.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:t.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e,i,s,n=this.options;"parent"===n.containment&&(n.containment=this.helper[0].parentNode),("document"===n.containment||"window"===n.containment)&&(this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,"document"===n.containment?this.document.width():this.window.width()-this.helperProportions.width-this.margins.left,("document"===n.containment?this.document.height()||document.body.parentNode.scrollHeight:this.window.height()||this.document[0].body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]),/^(document|window|parent)$/.test(n.containment)||(e=t(n.containment)[0],i=t(n.containment).offset(),s="hidden"!==t(e).css("overflow"),this.containment=[i.left+(parseInt(t(e).css("borderLeftWidth"),10)||0)+(parseInt(t(e).css("paddingLeft"),10)||0)-this.margins.left,i.top+(parseInt(t(e).css("borderTopWidth"),10)||0)+(parseInt(t(e).css("paddingTop"),10)||0)-this.margins.top,i.left+(s?Math.max(e.scrollWidth,e.offsetWidth):e.offsetWidth)-(parseInt(t(e).css("borderLeftWidth"),10)||0)-(parseInt(t(e).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,i.top+(s?Math.max(e.scrollHeight,e.offsetHeight):e.offsetHeight)-(parseInt(t(e).css("borderTopWidth"),10)||0)-(parseInt(t(e).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top])},_convertPositionTo:function(e,i){i||(i=this.position);var s="absolute"===e?1:-1,n="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&t.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,o=/(html|body)/i.test(n[0].tagName);return{top:i.top+this.offset.relative.top*s+this.offset.parent.top*s-("fixed"===this.cssPosition?-this.scrollParent.scrollTop():o?0:n.scrollTop())*s,left:i.left+this.offset.relative.left*s+this.offset.parent.left*s-("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():o?0:n.scrollLeft())*s}},_generatePosition:function(e){var i,s,n=this.options,o=e.pageX,a=e.pageY,r="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&t.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,h=/(html|body)/i.test(r[0].tagName);return"relative"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&this.scrollParent[0]!==this.offsetParent[0]||(this.offset.relative=this._getRelativeOffset()),this.originalPosition&&(this.containment&&(e.pageX-this.offset.click.left<this.containment[0]&&(o=this.containment[0]+this.offset.click.left),e.pageY-this.offset.click.top<this.containment[1]&&(a=this.containment[1]+this.offset.click.top),e.pageX-this.offset.click.left>this.containment[2]&&(o=this.containment[2]+this.offset.click.left),e.pageY-this.offset.click.top>this.containment[3]&&(a=this.containment[3]+this.offset.click.top)),n.grid&&(i=this.originalPageY+Math.round((a-this.originalPageY)/n.grid[1])*n.grid[1],a=this.containment?i-this.offset.click.top>=this.containment[1]&&i-this.offset.click.top<=this.containment[3]?i:i-this.offset.click.top>=this.containment[1]?i-n.grid[1]:i+n.grid[1]:i,s=this.originalPageX+Math.round((o-this.originalPageX)/n.grid[0])*n.grid[0],o=this.containment?s-this.offset.click.left>=this.containment[0]&&s-this.offset.click.left<=this.containment[2]?s:s-this.offset.click.left>=this.containment[0]?s-n.grid[0]:s+n.grid[0]:s)),{top:a-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+("fixed"===this.cssPosition?-this.scrollParent.scrollTop():h?0:r.scrollTop()),left:o-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():h?0:r.scrollLeft())}},_rearrange:function(t,e,i,s){i?i[0].appendChild(this.placeholder[0]):e.item[0].parentNode.insertBefore(this.placeholder[0],"down"===this.direction?e.item[0]:e.item[0].nextSibling),this.counter=this.counter?++this.counter:1;var n=this.counter;this._delay(function(){n===this.counter&&this.refreshPositions(!s)})},_clear:function(t,e){function i(t,e,i){return function(s){i._trigger(t,s,e._uiHash(e))}}this.reverting=!1;var s,n=[];if(!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null,this.helper[0]===this.currentItem[0]){for(s in this._storedCSS)("auto"===this._storedCSS[s]||"static"===this._storedCSS[s])&&(this._storedCSS[s]="");this.currentItem.css(this._storedCSS),this._removeClass(this.currentItem,"ui-sortable-helper")}else this.currentItem.show();for(this.fromOutside&&!e&&n.push(function(t){this._trigger("receive",t,this._uiHash(this.fromOutside))}),!this.fromOutside&&this.domPosition.prev===this.currentItem.prev().not(".ui-sortable-helper")[0]&&this.domPosition.parent===this.currentItem.parent()[0]||e||n.push(function(t){this._trigger("update",t,this._uiHash())}),this!==this.currentContainer&&(e||(n.push(function(t){this._trigger("remove",t,this._uiHash())}),n.push(function(t){return function(e){t._trigger("receive",e,this._uiHash(this))}}.call(this,this.currentContainer)),n.push(function(t){return function(e){t._trigger("update",e,this._uiHash(this))}}.call(this,this.currentContainer)))),s=this.containers.length-1;s>=0;s--)e||n.push(i("deactivate",this,this.containers[s])),this.containers[s].containerCache.over&&(n.push(i("out",this,this.containers[s])),this.containers[s].containerCache.over=0);if(this.storedCursor&&(this.document.find("body").css("cursor",this.storedCursor),this.storedStylesheet.remove()),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex","auto"===this._storedZIndex?"":this._storedZIndex),this.dragging=!1,e||this._trigger("beforeStop",t,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.cancelHelperRemoval||(this.helper[0]!==this.currentItem[0]&&this.helper.remove(),this.helper=null),!e){for(s=0;n.length>s;s++)n[s].call(this,t);this._trigger("stop",t,this._uiHash())}return this.fromOutside=!1,!this.cancelHelperRemoval},_trigger:function(){t.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()},_uiHash:function(e){var i=e||this;return{helper:i.helper,placeholder:i.placeholder||t([]),position:i.position,originalPosition:i.originalPosition,offset:i.positionAbs,item:i.currentItem,sender:e?e.element:null}}}),t.widget("ui.accordion",{version:"1.12.1",options:{active:0,animate:{},classes:{"ui-accordion-header":"ui-corner-top","ui-accordion-header-collapsed":"ui-corner-all","ui-accordion-content":"ui-corner-bottom"},collapsible:!1,event:"click",header:"> li > :first-child, > :not(li):even",heightStyle:"auto",icons:{activeHeader:"ui-icon-triangle-1-s",header:"ui-icon-triangle-1-e"},activate:null,beforeActivate:null},hideProps:{borderTopWidth:"hide",borderBottomWidth:"hide",paddingTop:"hide",paddingBottom:"hide",height:"hide"},showProps:{borderTopWidth:"show",borderBottomWidth:"show",paddingTop:"show",paddingBottom:"show",height:"show"},_create:function(){var e=this.options;this.prevShow=this.prevHide=t(),this._addClass("ui-accordion","ui-widget ui-helper-reset"),this.element.attr("role","tablist"),e.collapsible||e.active!==!1&&null!=e.active||(e.active=0),this._processPanels(),0>e.active&&(e.active+=this.headers.length),this._refresh()},_getCreateEventData:function(){return{header:this.active,panel:this.active.length?this.active.next():t()}},_createIcons:function(){var e,i,s=this.options.icons;s&&(e=t("<span>"),this._addClass(e,"ui-accordion-header-icon","ui-icon "+s.header),e.prependTo(this.headers),i=this.active.children(".ui-accordion-header-icon"),this._removeClass(i,s.header)._addClass(i,null,s.activeHeader)._addClass(this.headers,"ui-accordion-icons"))
},_destroyIcons:function(){this._removeClass(this.headers,"ui-accordion-icons"),this.headers.children(".ui-accordion-header-icon").remove()},_destroy:function(){var t;this.element.removeAttr("role"),this.headers.removeAttr("role aria-expanded aria-selected aria-controls tabIndex").removeUniqueId(),this._destroyIcons(),t=this.headers.next().css("display","").removeAttr("role aria-hidden aria-labelledby").removeUniqueId(),"content"!==this.options.heightStyle&&t.css("height","")},_setOption:function(t,e){return"active"===t?(this._activate(e),void 0):("event"===t&&(this.options.event&&this._off(this.headers,this.options.event),this._setupEvents(e)),this._super(t,e),"collapsible"!==t||e||this.options.active!==!1||this._activate(0),"icons"===t&&(this._destroyIcons(),e&&this._createIcons()),void 0)},_setOptionDisabled:function(t){this._super(t),this.element.attr("aria-disabled",t),this._toggleClass(null,"ui-state-disabled",!!t),this._toggleClass(this.headers.add(this.headers.next()),null,"ui-state-disabled",!!t)},_keydown:function(e){if(!e.altKey&&!e.ctrlKey){var i=t.ui.keyCode,s=this.headers.length,n=this.headers.index(e.target),o=!1;switch(e.keyCode){case i.RIGHT:case i.DOWN:o=this.headers[(n+1)%s];break;case i.LEFT:case i.UP:o=this.headers[(n-1+s)%s];break;case i.SPACE:case i.ENTER:this._eventHandler(e);break;case i.HOME:o=this.headers[0];break;case i.END:o=this.headers[s-1]}o&&(t(e.target).attr("tabIndex",-1),t(o).attr("tabIndex",0),t(o).trigger("focus"),e.preventDefault())}},_panelKeyDown:function(e){e.keyCode===t.ui.keyCode.UP&&e.ctrlKey&&t(e.currentTarget).prev().trigger("focus")},refresh:function(){var e=this.options;this._processPanels(),e.active===!1&&e.collapsible===!0||!this.headers.length?(e.active=!1,this.active=t()):e.active===!1?this._activate(0):this.active.length&&!t.contains(this.element[0],this.active[0])?this.headers.length===this.headers.find(".ui-state-disabled").length?(e.active=!1,this.active=t()):this._activate(Math.max(0,e.active-1)):e.active=this.headers.index(this.active),this._destroyIcons(),this._refresh()},_processPanels:function(){var t=this.headers,e=this.panels;this.headers=this.element.find(this.options.header),this._addClass(this.headers,"ui-accordion-header ui-accordion-header-collapsed","ui-state-default"),this.panels=this.headers.next().filter(":not(.ui-accordion-content-active)").hide(),this._addClass(this.panels,"ui-accordion-content","ui-helper-reset ui-widget-content"),e&&(this._off(t.not(this.headers)),this._off(e.not(this.panels)))},_refresh:function(){var e,i=this.options,s=i.heightStyle,n=this.element.parent();this.active=this._findActive(i.active),this._addClass(this.active,"ui-accordion-header-active","ui-state-active")._removeClass(this.active,"ui-accordion-header-collapsed"),this._addClass(this.active.next(),"ui-accordion-content-active"),this.active.next().show(),this.headers.attr("role","tab").each(function(){var e=t(this),i=e.uniqueId().attr("id"),s=e.next(),n=s.uniqueId().attr("id");e.attr("aria-controls",n),s.attr("aria-labelledby",i)}).next().attr("role","tabpanel"),this.headers.not(this.active).attr({"aria-selected":"false","aria-expanded":"false",tabIndex:-1}).next().attr({"aria-hidden":"true"}).hide(),this.active.length?this.active.attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0}).next().attr({"aria-hidden":"false"}):this.headers.eq(0).attr("tabIndex",0),this._createIcons(),this._setupEvents(i.event),"fill"===s?(e=n.height(),this.element.siblings(":visible").each(function(){var i=t(this),s=i.css("position");"absolute"!==s&&"fixed"!==s&&(e-=i.outerHeight(!0))}),this.headers.each(function(){e-=t(this).outerHeight(!0)}),this.headers.next().each(function(){t(this).height(Math.max(0,e-t(this).innerHeight()+t(this).height()))}).css("overflow","auto")):"auto"===s&&(e=0,this.headers.next().each(function(){var i=t(this).is(":visible");i||t(this).show(),e=Math.max(e,t(this).css("height","").height()),i||t(this).hide()}).height(e))},_activate:function(e){var i=this._findActive(e)[0];i!==this.active[0]&&(i=i||this.active[0],this._eventHandler({target:i,currentTarget:i,preventDefault:t.noop}))},_findActive:function(e){return"number"==typeof e?this.headers.eq(e):t()},_setupEvents:function(e){var i={keydown:"_keydown"};e&&t.each(e.split(" "),function(t,e){i[e]="_eventHandler"}),this._off(this.headers.add(this.headers.next())),this._on(this.headers,i),this._on(this.headers.next(),{keydown:"_panelKeyDown"}),this._hoverable(this.headers),this._focusable(this.headers)},_eventHandler:function(e){var i,s,n=this.options,o=this.active,a=t(e.currentTarget),r=a[0]===o[0],h=r&&n.collapsible,l=h?t():a.next(),c=o.next(),u={oldHeader:o,oldPanel:c,newHeader:h?t():a,newPanel:l};e.preventDefault(),r&&!n.collapsible||this._trigger("beforeActivate",e,u)===!1||(n.active=h?!1:this.headers.index(a),this.active=r?t():a,this._toggle(u),this._removeClass(o,"ui-accordion-header-active","ui-state-active"),n.icons&&(i=o.children(".ui-accordion-header-icon"),this._removeClass(i,null,n.icons.activeHeader)._addClass(i,null,n.icons.header)),r||(this._removeClass(a,"ui-accordion-header-collapsed")._addClass(a,"ui-accordion-header-active","ui-state-active"),n.icons&&(s=a.children(".ui-accordion-header-icon"),this._removeClass(s,null,n.icons.header)._addClass(s,null,n.icons.activeHeader)),this._addClass(a.next(),"ui-accordion-content-active")))},_toggle:function(e){var i=e.newPanel,s=this.prevShow.length?this.prevShow:e.oldPanel;this.prevShow.add(this.prevHide).stop(!0,!0),this.prevShow=i,this.prevHide=s,this.options.animate?this._animate(i,s,e):(s.hide(),i.show(),this._toggleComplete(e)),s.attr({"aria-hidden":"true"}),s.prev().attr({"aria-selected":"false","aria-expanded":"false"}),i.length&&s.length?s.prev().attr({tabIndex:-1,"aria-expanded":"false"}):i.length&&this.headers.filter(function(){return 0===parseInt(t(this).attr("tabIndex"),10)}).attr("tabIndex",-1),i.attr("aria-hidden","false").prev().attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0})},_animate:function(t,e,i){var s,n,o,a=this,r=0,h=t.css("box-sizing"),l=t.length&&(!e.length||t.index()<e.index()),c=this.options.animate||{},u=l&&c.down||c,d=function(){a._toggleComplete(i)};return"number"==typeof u&&(o=u),"string"==typeof u&&(n=u),n=n||u.easing||c.easing,o=o||u.duration||c.duration,e.length?t.length?(s=t.show().outerHeight(),e.animate(this.hideProps,{duration:o,easing:n,step:function(t,e){e.now=Math.round(t)}}),t.hide().animate(this.showProps,{duration:o,easing:n,complete:d,step:function(t,i){i.now=Math.round(t),"height"!==i.prop?"content-box"===h&&(r+=i.now):"content"!==a.options.heightStyle&&(i.now=Math.round(s-e.outerHeight()-r),r=0)}}),void 0):e.animate(this.hideProps,o,n,d):t.animate(this.showProps,o,n,d)},_toggleComplete:function(t){var e=t.oldPanel,i=e.prev();this._removeClass(e,"ui-accordion-content-active"),this._removeClass(i,"ui-accordion-header-active")._addClass(i,"ui-accordion-header-collapsed"),e.length&&(e.parent()[0].className=e.parent()[0].className),this._trigger("activate",null,t)}}),t.widget("ui.menu",{version:"1.12.1",defaultElement:"<ul>",delay:300,options:{icons:{submenu:"ui-icon-caret-1-e"},items:"> *",menus:"ul",position:{my:"left top",at:"right top"},role:"menu",blur:null,focus:null,select:null},_create:function(){this.activeMenu=this.element,this.mouseHandled=!1,this.element.uniqueId().attr({role:this.options.role,tabIndex:0}),this._addClass("ui-menu","ui-widget ui-widget-content"),this._on({"mousedown .ui-menu-item":function(t){t.preventDefault()},"click .ui-menu-item":function(e){var i=t(e.target),s=t(t.ui.safeActiveElement(this.document[0]));!this.mouseHandled&&i.not(".ui-state-disabled").length&&(this.select(e),e.isPropagationStopped()||(this.mouseHandled=!0),i.has(".ui-menu").length?this.expand(e):!this.element.is(":focus")&&s.closest(".ui-menu").length&&(this.element.trigger("focus",[!0]),this.active&&1===this.active.parents(".ui-menu").length&&clearTimeout(this.timer)))},"mouseenter .ui-menu-item":function(e){if(!this.previousFilter){var i=t(e.target).closest(".ui-menu-item"),s=t(e.currentTarget);i[0]===s[0]&&(this._removeClass(s.siblings().children(".ui-state-active"),null,"ui-state-active"),this.focus(e,s))}},mouseleave:"collapseAll","mouseleave .ui-menu":"collapseAll",focus:function(t,e){var i=this.active||this.element.find(this.options.items).eq(0);e||this.focus(t,i)},blur:function(e){this._delay(function(){var i=!t.contains(this.element[0],t.ui.safeActiveElement(this.document[0]));i&&this.collapseAll(e)})},keydown:"_keydown"}),this.refresh(),this._on(this.document,{click:function(t){this._closeOnDocumentClick(t)&&this.collapseAll(t),this.mouseHandled=!1}})},_destroy:function(){var e=this.element.find(".ui-menu-item").removeAttr("role aria-disabled"),i=e.children(".ui-menu-item-wrapper").removeUniqueId().removeAttr("tabIndex role aria-haspopup");this.element.removeAttr("aria-activedescendant").find(".ui-menu").addBack().removeAttr("role aria-labelledby aria-expanded aria-hidden aria-disabled tabIndex").removeUniqueId().show(),i.children().each(function(){var e=t(this);e.data("ui-menu-submenu-caret")&&e.remove()})},_keydown:function(e){var i,s,n,o,a=!0;switch(e.keyCode){case t.ui.keyCode.PAGE_UP:this.previousPage(e);break;case t.ui.keyCode.PAGE_DOWN:this.nextPage(e);break;case t.ui.keyCode.HOME:this._move("first","first",e);break;case t.ui.keyCode.END:this._move("last","last",e);break;case t.ui.keyCode.UP:this.previous(e);break;case t.ui.keyCode.DOWN:this.next(e);break;case t.ui.keyCode.LEFT:this.collapse(e);break;case t.ui.keyCode.RIGHT:this.active&&!this.active.is(".ui-state-disabled")&&this.expand(e);break;case t.ui.keyCode.ENTER:case t.ui.keyCode.SPACE:this._activate(e);break;case t.ui.keyCode.ESCAPE:this.collapse(e);break;default:a=!1,s=this.previousFilter||"",o=!1,n=e.keyCode>=96&&105>=e.keyCode?""+(e.keyCode-96):String.fromCharCode(e.keyCode),clearTimeout(this.filterTimer),n===s?o=!0:n=s+n,i=this._filterMenuItems(n),i=o&&-1!==i.index(this.active.next())?this.active.nextAll(".ui-menu-item"):i,i.length||(n=String.fromCharCode(e.keyCode),i=this._filterMenuItems(n)),i.length?(this.focus(e,i),this.previousFilter=n,this.filterTimer=this._delay(function(){delete this.previousFilter},1e3)):delete this.previousFilter}a&&e.preventDefault()},_activate:function(t){this.active&&!this.active.is(".ui-state-disabled")&&(this.active.children("[aria-haspopup='true']").length?this.expand(t):this.select(t))},refresh:function(){var e,i,s,n,o,a=this,r=this.options.icons.submenu,h=this.element.find(this.options.menus);this._toggleClass("ui-menu-icons",null,!!this.element.find(".ui-icon").length),s=h.filter(":not(.ui-menu)").hide().attr({role:this.options.role,"aria-hidden":"true","aria-expanded":"false"}).each(function(){var e=t(this),i=e.prev(),s=t("<span>").data("ui-menu-submenu-caret",!0);a._addClass(s,"ui-menu-icon","ui-icon "+r),i.attr("aria-haspopup","true").prepend(s),e.attr("aria-labelledby",i.attr("id"))}),this._addClass(s,"ui-menu","ui-widget ui-widget-content ui-front"),e=h.add(this.element),i=e.find(this.options.items),i.not(".ui-menu-item").each(function(){var e=t(this);a._isDivider(e)&&a._addClass(e,"ui-menu-divider","ui-widget-content")}),n=i.not(".ui-menu-item, .ui-menu-divider"),o=n.children().not(".ui-menu").uniqueId().attr({tabIndex:-1,role:this._itemRole()}),this._addClass(n,"ui-menu-item")._addClass(o,"ui-menu-item-wrapper"),i.filter(".ui-state-disabled").attr("aria-disabled","true"),this.active&&!t.contains(this.element[0],this.active[0])&&this.blur()},_itemRole:function(){return{menu:"menuitem",listbox:"option"}[this.options.role]},_setOption:function(t,e){if("icons"===t){var i=this.element.find(".ui-menu-icon");this._removeClass(i,null,this.options.icons.submenu)._addClass(i,null,e.submenu)}this._super(t,e)},_setOptionDisabled:function(t){this._super(t),this.element.attr("aria-disabled",t+""),this._toggleClass(null,"ui-state-disabled",!!t)},focus:function(t,e){var i,s,n;this.blur(t,t&&"focus"===t.type),this._scrollIntoView(e),this.active=e.first(),s=this.active.children(".ui-menu-item-wrapper"),this._addClass(s,null,"ui-state-active"),this.options.role&&this.element.attr("aria-activedescendant",s.attr("id")),n=this.active.parent().closest(".ui-menu-item").children(".ui-menu-item-wrapper"),this._addClass(n,null,"ui-state-active"),t&&"keydown"===t.type?this._close():this.timer=this._delay(function(){this._close()},this.delay),i=e.children(".ui-menu"),i.length&&t&&/^mouse/.test(t.type)&&this._startOpening(i),this.activeMenu=e.parent(),this._trigger("focus",t,{item:e})},_scrollIntoView:function(e){var i,s,n,o,a,r;this._hasScroll()&&(i=parseFloat(t.css(this.activeMenu[0],"borderTopWidth"))||0,s=parseFloat(t.css(this.activeMenu[0],"paddingTop"))||0,n=e.offset().top-this.activeMenu.offset().top-i-s,o=this.activeMenu.scrollTop(),a=this.activeMenu.height(),r=e.outerHeight(),0>n?this.activeMenu.scrollTop(o+n):n+r>a&&this.activeMenu.scrollTop(o+n-a+r))},blur:function(t,e){e||clearTimeout(this.timer),this.active&&(this._removeClass(this.active.children(".ui-menu-item-wrapper"),null,"ui-state-active"),this._trigger("blur",t,{item:this.active}),this.active=null)},_startOpening:function(t){clearTimeout(this.timer),"true"===t.attr("aria-hidden")&&(this.timer=this._delay(function(){this._close(),this._open(t)},this.delay))},_open:function(e){var i=t.extend({of:this.active},this.options.position);clearTimeout(this.timer),this.element.find(".ui-menu").not(e.parents(".ui-menu")).hide().attr("aria-hidden","true"),e.show().removeAttr("aria-hidden").attr("aria-expanded","true").position(i)},collapseAll:function(e,i){clearTimeout(this.timer),this.timer=this._delay(function(){var s=i?this.element:t(e&&e.target).closest(this.element.find(".ui-menu"));s.length||(s=this.element),this._close(s),this.blur(e),this._removeClass(s.find(".ui-state-active"),null,"ui-state-active"),this.activeMenu=s},this.delay)},_close:function(t){t||(t=this.active?this.active.parent():this.element),t.find(".ui-menu").hide().attr("aria-hidden","true").attr("aria-expanded","false")},_closeOnDocumentClick:function(e){return!t(e.target).closest(".ui-menu").length},_isDivider:function(t){return!/[^\-\u2014\u2013\s]/.test(t.text())},collapse:function(t){var e=this.active&&this.active.parent().closest(".ui-menu-item",this.element);e&&e.length&&(this._close(),this.focus(t,e))},expand:function(t){var e=this.active&&this.active.children(".ui-menu ").find(this.options.items).first();e&&e.length&&(this._open(e.parent()),this._delay(function(){this.focus(t,e)}))},next:function(t){this._move("next","first",t)},previous:function(t){this._move("prev","last",t)},isFirstItem:function(){return this.active&&!this.active.prevAll(".ui-menu-item").length},isLastItem:function(){return this.active&&!this.active.nextAll(".ui-menu-item").length},_move:function(t,e,i){var s;this.active&&(s="first"===t||"last"===t?this.active["first"===t?"prevAll":"nextAll"](".ui-menu-item").eq(-1):this.active[t+"All"](".ui-menu-item").eq(0)),s&&s.length&&this.active||(s=this.activeMenu.find(this.options.items)[e]()),this.focus(i,s)},nextPage:function(e){var i,s,n;return this.active?(this.isLastItem()||(this._hasScroll()?(s=this.active.offset().top,n=this.element.height(),this.active.nextAll(".ui-menu-item").each(function(){return i=t(this),0>i.offset().top-s-n}),this.focus(e,i)):this.focus(e,this.activeMenu.find(this.options.items)[this.active?"last":"first"]())),void 0):(this.next(e),void 0)},previousPage:function(e){var i,s,n;return this.active?(this.isFirstItem()||(this._hasScroll()?(s=this.active.offset().top,n=this.element.height(),this.active.prevAll(".ui-menu-item").each(function(){return i=t(this),i.offset().top-s+n>0}),this.focus(e,i)):this.focus(e,this.activeMenu.find(this.options.items).first())),void 0):(this.next(e),void 0)},_hasScroll:function(){return this.element.outerHeight()<this.element.prop("scrollHeight")},select:function(e){this.active=this.active||t(e.target).closest(".ui-menu-item");var i={item:this.active};this.active.has(".ui-menu").length||this.collapseAll(e,!0),this._trigger("select",e,i)},_filterMenuItems:function(e){var i=e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&"),s=RegExp("^"+i,"i");return this.activeMenu.find(this.options.items).filter(".ui-menu-item").filter(function(){return s.test(t.trim(t(this).children(".ui-menu-item-wrapper").text()))})}}),t.widget("ui.autocomplete",{version:"1.12.1",defaultElement:"<input>",options:{appendTo:null,autoFocus:!1,delay:300,minLength:1,position:{my:"left top",at:"left bottom",collision:"none"},source:null,change:null,close:null,focus:null,open:null,response:null,search:null,select:null},requestIndex:0,pending:0,_create:function(){var e,i,s,n=this.element[0].nodeName.toLowerCase(),o="textarea"===n,a="input"===n;this.isMultiLine=o||!a&&this._isContentEditable(this.element),this.valueMethod=this.element[o||a?"val":"text"],this.isNewMenu=!0,this._addClass("ui-autocomplete-input"),this.element.attr("autocomplete","off"),this._on(this.element,{keydown:function(n){if(this.element.prop("readOnly"))return e=!0,s=!0,i=!0,void 0;e=!1,s=!1,i=!1;var o=t.ui.keyCode;switch(n.keyCode){case o.PAGE_UP:e=!0,this._move("previousPage",n);break;case o.PAGE_DOWN:e=!0,this._move("nextPage",n);break;case o.UP:e=!0,this._keyEvent("previous",n);break;case o.DOWN:e=!0,this._keyEvent("next",n);break;case o.ENTER:this.menu.active&&(e=!0,n.preventDefault(),this.menu.select(n));break;case o.TAB:this.menu.active&&this.menu.select(n);break;case o.ESCAPE:this.menu.element.is(":visible")&&(this.isMultiLine||this._value(this.term),this.close(n),n.preventDefault());break;default:i=!0,this._searchTimeout(n)}},keypress:function(s){if(e)return e=!1,(!this.isMultiLine||this.menu.element.is(":visible"))&&s.preventDefault(),void 0;if(!i){var n=t.ui.keyCode;switch(s.keyCode){case n.PAGE_UP:this._move("previousPage",s);break;case n.PAGE_DOWN:this._move("nextPage",s);break;case n.UP:this._keyEvent("previous",s);break;case n.DOWN:this._keyEvent("next",s)}}},input:function(t){return s?(s=!1,t.preventDefault(),void 0):(this._searchTimeout(t),void 0)},focus:function(){this.selectedItem=null,this.previous=this._value()},blur:function(t){return this.cancelBlur?(delete this.cancelBlur,void 0):(clearTimeout(this.searching),this.close(t),this._change(t),void 0)}}),this._initSource(),this.menu=t("<ul>").appendTo(this._appendTo()).menu({role:null}).hide().menu("instance"),this._addClass(this.menu.element,"ui-autocomplete","ui-front"),this._on(this.menu.element,{mousedown:function(e){e.preventDefault(),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur,this.element[0]!==t.ui.safeActiveElement(this.document[0])&&this.element.trigger("focus")})},menufocus:function(e,i){var s,n;return this.isNewMenu&&(this.isNewMenu=!1,e.originalEvent&&/^mouse/.test(e.originalEvent.type))?(this.menu.blur(),this.document.one("mousemove",function(){t(e.target).trigger(e.originalEvent)}),void 0):(n=i.item.data("ui-autocomplete-item"),!1!==this._trigger("focus",e,{item:n})&&e.originalEvent&&/^key/.test(e.originalEvent.type)&&this._value(n.value),s=i.item.attr("aria-label")||n.value,s&&t.trim(s).length&&(this.liveRegion.children().hide(),t("<div>").text(s).appendTo(this.liveRegion)),void 0)},menuselect:function(e,i){var s=i.item.data("ui-autocomplete-item"),n=this.previous;this.element[0]!==t.ui.safeActiveElement(this.document[0])&&(this.element.trigger("focus"),this.previous=n,this._delay(function(){this.previous=n,this.selectedItem=s})),!1!==this._trigger("select",e,{item:s})&&this._value(s.value),this.term=this._value(),this.close(e),this.selectedItem=s}}),this.liveRegion=t("<div>",{role:"status","aria-live":"assertive","aria-relevant":"additions"}).appendTo(this.document[0].body),this._addClass(this.liveRegion,null,"ui-helper-hidden-accessible"),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")}})},_destroy:function(){clearTimeout(this.searching),this.element.removeAttr("autocomplete"),this.menu.element.remove(),this.liveRegion.remove()},_setOption:function(t,e){this._super(t,e),"source"===t&&this._initSource(),"appendTo"===t&&this.menu.element.appendTo(this._appendTo()),"disabled"===t&&e&&this.xhr&&this.xhr.abort()},_isEventTargetInWidget:function(e){var i=this.menu.element[0];return e.target===this.element[0]||e.target===i||t.contains(i,e.target)},_closeOnClickOutside:function(t){this._isEventTargetInWidget(t)||this.close()},_appendTo:function(){var e=this.options.appendTo;return e&&(e=e.jquery||e.nodeType?t(e):this.document.find(e).eq(0)),e&&e[0]||(e=this.element.closest(".ui-front, dialog")),e.length||(e=this.document[0].body),e},_initSource:function(){var e,i,s=this;t.isArray(this.options.source)?(e=this.options.source,this.source=function(i,s){s(t.ui.autocomplete.filter(e,i.term))}):"string"==typeof this.options.source?(i=this.options.source,this.source=function(e,n){s.xhr&&s.xhr.abort(),s.xhr=t.ajax({url:i,data:e,dataType:"json",success:function(t){n(t)},error:function(){n([])}})}):this.source=this.options.source},_searchTimeout:function(t){clearTimeout(this.searching),this.searching=this._delay(function(){var e=this.term===this._value(),i=this.menu.element.is(":visible"),s=t.altKey||t.ctrlKey||t.metaKey||t.shiftKey;(!e||e&&!i&&!s)&&(this.selectedItem=null,this.search(null,t))},this.options.delay)},search:function(t,e){return t=null!=t?t:this._value(),this.term=this._value(),t.length<this.options.minLength?this.close(e):this._trigger("search",e)!==!1?this._search(t):void 0},_search:function(t){this.pending++,this._addClass("ui-autocomplete-loading"),this.cancelSearch=!1,this.source({term:t},this._response())},_response:function(){var e=++this.requestIndex;return t.proxy(function(t){e===this.requestIndex&&this.__response(t),this.pending--,this.pending||this._removeClass("ui-autocomplete-loading")},this)},__response:function(t){t&&(t=this._normalize(t)),this._trigger("response",null,{content:t}),!this.options.disabled&&t&&t.length&&!this.cancelSearch?(this._suggest(t),this._trigger("open")):this._close()},close:function(t){this.cancelSearch=!0,this._close(t)},_close:function(t){this._off(this.document,"mousedown"),this.menu.element.is(":visible")&&(this.menu.element.hide(),this.menu.blur(),this.isNewMenu=!0,this._trigger("close",t))},_change:function(t){this.previous!==this._value()&&this._trigger("change",t,{item:this.selectedItem})},_normalize:function(e){return e.length&&e[0].label&&e[0].value?e:t.map(e,function(e){return"string"==typeof e?{label:e,value:e}:t.extend({},e,{label:e.label||e.value,value:e.value||e.label})})},_suggest:function(e){var i=this.menu.element.empty();this._renderMenu(i,e),this.isNewMenu=!0,this.menu.refresh(),i.show(),this._resizeMenu(),i.position(t.extend({of:this.element},this.options.position)),this.options.autoFocus&&this.menu.next(),this._on(this.document,{mousedown:"_closeOnClickOutside"})},_resizeMenu:function(){var t=this.menu.element;t.outerWidth(Math.max(t.width("").outerWidth()+1,this.element.outerWidth()))},_renderMenu:function(e,i){var s=this;t.each(i,function(t,i){s._renderItemData(e,i)})},_renderItemData:function(t,e){return this._renderItem(t,e).data("ui-autocomplete-item",e)},_renderItem:function(e,i){return t("<li>").append(t("<div>").text(i.label)).appendTo(e)},_move:function(t,e){return this.menu.element.is(":visible")?this.menu.isFirstItem()&&/^previous/.test(t)||this.menu.isLastItem()&&/^next/.test(t)?(this.isMultiLine||this._value(this.term),this.menu.blur(),void 0):(this.menu[t](e),void 0):(this.search(null,e),void 0)},widget:function(){return this.menu.element},_value:function(){return this.valueMethod.apply(this.element,arguments)},_keyEvent:function(t,e){(!this.isMultiLine||this.menu.element.is(":visible"))&&(this._move(t,e),e.preventDefault())},_isContentEditable:function(t){if(!t.length)return!1;var e=t.prop("contentEditable");return"inherit"===e?this._isContentEditable(t.parent()):"true"===e}}),t.extend(t.ui.autocomplete,{escapeRegex:function(t){return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")},filter:function(e,i){var s=RegExp(t.ui.autocomplete.escapeRegex(i),"i");return t.grep(e,function(t){return s.test(t.label||t.value||t)})}}),t.widget("ui.autocomplete",t.ui.autocomplete,{options:{messages:{noResults:"No search results.",results:function(t){return t+(t>1?" results are":" result is")+" available, use up and down arrow keys to navigate."}}},__response:function(e){var i;this._superApply(arguments),this.options.disabled||this.cancelSearch||(i=e&&e.length?this.options.messages.results(e.length):this.options.messages.noResults,this.liveRegion.children().hide(),t("<div>").text(i).appendTo(this.liveRegion))}}),t.ui.autocomplete;var d=/ui-corner-([a-z]){2,6}/g;t.widget("ui.controlgroup",{version:"1.12.1",defaultElement:"<div>",options:{direction:"horizontal",disabled:null,onlyVisible:!0,items:{button:"input[type=button], input[type=submit], input[type=reset], button, a",controlgroupLabel:".ui-controlgroup-label",checkboxradio:"input[type='checkbox'], input[type='radio']",selectmenu:"select",spinner:".ui-spinner-input"}},_create:function(){this._enhance()},_enhance:function(){this.element.attr("role","toolbar"),this.refresh()},_destroy:function(){this._callChildMethod("destroy"),this.childWidgets.removeData("ui-controlgroup-data"),this.element.removeAttr("role"),this.options.items.controlgroupLabel&&this.element.find(this.options.items.controlgroupLabel).find(".ui-controlgroup-label-contents").contents().unwrap()},_initWidgets:function(){var e=this,i=[];t.each(this.options.items,function(s,n){var o,a={};return n?"controlgroupLabel"===s?(o=e.element.find(n),o.each(function(){var e=t(this);e.children(".ui-controlgroup-label-contents").length||e.contents().wrapAll("<span class='ui-controlgroup-label-contents'></span>")}),e._addClass(o,null,"ui-widget ui-widget-content ui-state-default"),i=i.concat(o.get()),void 0):(t.fn[s]&&(a=e["_"+s+"Options"]?e["_"+s+"Options"]("middle"):{classes:{}},e.element.find(n).each(function(){var n=t(this),o=n[s]("instance"),r=t.widget.extend({},a);if("button"!==s||!n.parent(".ui-spinner").length){o||(o=n[s]()[s]("instance")),o&&(r.classes=e._resolveClassesValues(r.classes,o)),n[s](r);var h=n[s]("widget");t.data(h[0],"ui-controlgroup-data",o?o:n[s]("instance")),i.push(h[0])}})),void 0):void 0}),this.childWidgets=t(t.unique(i)),this._addClass(this.childWidgets,"ui-controlgroup-item")},_callChildMethod:function(e){this.childWidgets.each(function(){var i=t(this),s=i.data("ui-controlgroup-data");s&&s[e]&&s[e]()})},_updateCornerClass:function(t,e){var i="ui-corner-top ui-corner-bottom ui-corner-left ui-corner-right ui-corner-all",s=this._buildSimpleOptions(e,"label").classes.label;this._removeClass(t,null,i),this._addClass(t,null,s)},_buildSimpleOptions:function(t,e){var i="vertical"===this.options.direction,s={classes:{}};return s.classes[e]={middle:"",first:"ui-corner-"+(i?"top":"left"),last:"ui-corner-"+(i?"bottom":"right"),only:"ui-corner-all"}[t],s},_spinnerOptions:function(t){var e=this._buildSimpleOptions(t,"ui-spinner");return e.classes["ui-spinner-up"]="",e.classes["ui-spinner-down"]="",e},_buttonOptions:function(t){return this._buildSimpleOptions(t,"ui-button")},_checkboxradioOptions:function(t){return this._buildSimpleOptions(t,"ui-checkboxradio-label")},_selectmenuOptions:function(t){var e="vertical"===this.options.direction;return{width:e?"auto":!1,classes:{middle:{"ui-selectmenu-button-open":"","ui-selectmenu-button-closed":""},first:{"ui-selectmenu-button-open":"ui-corner-"+(e?"top":"tl"),"ui-selectmenu-button-closed":"ui-corner-"+(e?"top":"left")},last:{"ui-selectmenu-button-open":e?"":"ui-corner-tr","ui-selectmenu-button-closed":"ui-corner-"+(e?"bottom":"right")},only:{"ui-selectmenu-button-open":"ui-corner-top","ui-selectmenu-button-closed":"ui-corner-all"}}[t]}},_resolveClassesValues:function(e,i){var s={};return t.each(e,function(n){var o=i.options.classes[n]||"";o=t.trim(o.replace(d,"")),s[n]=(o+" "+e[n]).replace(/\s+/g," ")}),s},_setOption:function(t,e){return"direction"===t&&this._removeClass("ui-controlgroup-"+this.options.direction),this._super(t,e),"disabled"===t?(this._callChildMethod(e?"disable":"enable"),void 0):(this.refresh(),void 0)},refresh:function(){var e,i=this;this._addClass("ui-controlgroup ui-controlgroup-"+this.options.direction),"horizontal"===this.options.direction&&this._addClass(null,"ui-helper-clearfix"),this._initWidgets(),e=this.childWidgets,this.options.onlyVisible&&(e=e.filter(":visible")),e.length&&(t.each(["first","last"],function(t,s){var n=e[s]().data("ui-controlgroup-data");if(n&&i["_"+n.widgetName+"Options"]){var o=i["_"+n.widgetName+"Options"](1===e.length?"only":s);o.classes=i._resolveClassesValues(o.classes,n),n.element[n.widgetName](o)}else i._updateCornerClass(e[s](),s)}),this._callChildMethod("refresh"))}}),t.widget("ui.checkboxradio",[t.ui.formResetMixin,{version:"1.12.1",options:{disabled:null,label:null,icon:!0,classes:{"ui-checkboxradio-label":"ui-corner-all","ui-checkboxradio-icon":"ui-corner-all"}},_getCreateOptions:function(){var e,i,s=this,n=this._super()||{};return this._readType(),i=this.element.labels(),this.label=t(i[i.length-1]),this.label.length||t.error("No label found for checkboxradio widget"),this.originalLabel="",this.label.contents().not(this.element[0]).each(function(){s.originalLabel+=3===this.nodeType?t(this).text():this.outerHTML}),this.originalLabel&&(n.label=this.originalLabel),e=this.element[0].disabled,null!=e&&(n.disabled=e),n},_create:function(){var t=this.element[0].checked;this._bindFormResetHandler(),null==this.options.disabled&&(this.options.disabled=this.element[0].disabled),this._setOption("disabled",this.options.disabled),this._addClass("ui-checkboxradio","ui-helper-hidden-accessible"),this._addClass(this.label,"ui-checkboxradio-label","ui-button ui-widget"),"radio"===this.type&&this._addClass(this.label,"ui-checkboxradio-radio-label"),this.options.label&&this.options.label!==this.originalLabel?this._updateLabel():this.originalLabel&&(this.options.label=this.originalLabel),this._enhance(),t&&(this._addClass(this.label,"ui-checkboxradio-checked","ui-state-active"),this.icon&&this._addClass(this.icon,null,"ui-state-hover")),this._on({change:"_toggleClasses",focus:function(){this._addClass(this.label,null,"ui-state-focus ui-visual-focus")},blur:function(){this._removeClass(this.label,null,"ui-state-focus ui-visual-focus")}})},_readType:function(){var e=this.element[0].nodeName.toLowerCase();this.type=this.element[0].type,"input"===e&&/radio|checkbox/.test(this.type)||t.error("Can't create checkboxradio on element.nodeName="+e+" and element.type="+this.type)},_enhance:function(){this._updateIcon(this.element[0].checked)},widget:function(){return this.label},_getRadioGroup:function(){var e,i=this.element[0].name,s="input[name='"+t.ui.escapeSelector(i)+"']";return i?(e=this.form.length?t(this.form[0].elements).filter(s):t(s).filter(function(){return 0===t(this).form().length}),e.not(this.element)):t([])},_toggleClasses:function(){var e=this.element[0].checked;this._toggleClass(this.label,"ui-checkboxradio-checked","ui-state-active",e),this.options.icon&&"checkbox"===this.type&&this._toggleClass(this.icon,null,"ui-icon-check ui-state-checked",e)._toggleClass(this.icon,null,"ui-icon-blank",!e),"radio"===this.type&&this._getRadioGroup().each(function(){var e=t(this).checkboxradio("instance");e&&e._removeClass(e.label,"ui-checkboxradio-checked","ui-state-active")})},_destroy:function(){this._unbindFormResetHandler(),this.icon&&(this.icon.remove(),this.iconSpace.remove())},_setOption:function(t,e){return"label"!==t||e?(this._super(t,e),"disabled"===t?(this._toggleClass(this.label,null,"ui-state-disabled",e),this.element[0].disabled=e,void 0):(this.refresh(),void 0)):void 0},_updateIcon:function(e){var i="ui-icon ui-icon-background ";this.options.icon?(this.icon||(this.icon=t("<span>"),this.iconSpace=t("<span> </span>"),this._addClass(this.iconSpace,"ui-checkboxradio-icon-space")),"checkbox"===this.type?(i+=e?"ui-icon-check ui-state-checked":"ui-icon-blank",this._removeClass(this.icon,null,e?"ui-icon-blank":"ui-icon-check")):i+="ui-icon-blank",this._addClass(this.icon,"ui-checkboxradio-icon",i),e||this._removeClass(this.icon,null,"ui-icon-check ui-state-checked"),this.icon.prependTo(this.label).after(this.iconSpace)):void 0!==this.icon&&(this.icon.remove(),this.iconSpace.remove(),delete this.icon)
},_updateLabel:function(){var t=this.label.contents().not(this.element[0]);this.icon&&(t=t.not(this.icon[0])),this.iconSpace&&(t=t.not(this.iconSpace[0])),t.remove(),this.label.append(this.options.label)},refresh:function(){var t=this.element[0].checked,e=this.element[0].disabled;this._updateIcon(t),this._toggleClass(this.label,"ui-checkboxradio-checked","ui-state-active",t),null!==this.options.label&&this._updateLabel(),e!==this.options.disabled&&this._setOptions({disabled:e})}}]),t.ui.checkboxradio,t.widget("ui.button",{version:"1.12.1",defaultElement:"<button>",options:{classes:{"ui-button":"ui-corner-all"},disabled:null,icon:null,iconPosition:"beginning",label:null,showLabel:!0},_getCreateOptions:function(){var t,e=this._super()||{};return this.isInput=this.element.is("input"),t=this.element[0].disabled,null!=t&&(e.disabled=t),this.originalLabel=this.isInput?this.element.val():this.element.html(),this.originalLabel&&(e.label=this.originalLabel),e},_create:function(){!this.option.showLabel&!this.options.icon&&(this.options.showLabel=!0),null==this.options.disabled&&(this.options.disabled=this.element[0].disabled||!1),this.hasTitle=!!this.element.attr("title"),this.options.label&&this.options.label!==this.originalLabel&&(this.isInput?this.element.val(this.options.label):this.element.html(this.options.label)),this._addClass("ui-button","ui-widget"),this._setOption("disabled",this.options.disabled),this._enhance(),this.element.is("a")&&this._on({keyup:function(e){e.keyCode===t.ui.keyCode.SPACE&&(e.preventDefault(),this.element[0].click?this.element[0].click():this.element.trigger("click"))}})},_enhance:function(){this.element.is("button")||this.element.attr("role","button"),this.options.icon&&(this._updateIcon("icon",this.options.icon),this._updateTooltip())},_updateTooltip:function(){this.title=this.element.attr("title"),this.options.showLabel||this.title||this.element.attr("title",this.options.label)},_updateIcon:function(e,i){var s="iconPosition"!==e,n=s?this.options.iconPosition:i,o="top"===n||"bottom"===n;this.icon?s&&this._removeClass(this.icon,null,this.options.icon):(this.icon=t("<span>"),this._addClass(this.icon,"ui-button-icon","ui-icon"),this.options.showLabel||this._addClass("ui-button-icon-only")),s&&this._addClass(this.icon,null,i),this._attachIcon(n),o?(this._addClass(this.icon,null,"ui-widget-icon-block"),this.iconSpace&&this.iconSpace.remove()):(this.iconSpace||(this.iconSpace=t("<span> </span>"),this._addClass(this.iconSpace,"ui-button-icon-space")),this._removeClass(this.icon,null,"ui-wiget-icon-block"),this._attachIconSpace(n))},_destroy:function(){this.element.removeAttr("role"),this.icon&&this.icon.remove(),this.iconSpace&&this.iconSpace.remove(),this.hasTitle||this.element.removeAttr("title")},_attachIconSpace:function(t){this.icon[/^(?:end|bottom)/.test(t)?"before":"after"](this.iconSpace)},_attachIcon:function(t){this.element[/^(?:end|bottom)/.test(t)?"append":"prepend"](this.icon)},_setOptions:function(t){var e=void 0===t.showLabel?this.options.showLabel:t.showLabel,i=void 0===t.icon?this.options.icon:t.icon;e||i||(t.showLabel=!0),this._super(t)},_setOption:function(t,e){"icon"===t&&(e?this._updateIcon(t,e):this.icon&&(this.icon.remove(),this.iconSpace&&this.iconSpace.remove())),"iconPosition"===t&&this._updateIcon(t,e),"showLabel"===t&&(this._toggleClass("ui-button-icon-only",null,!e),this._updateTooltip()),"label"===t&&(this.isInput?this.element.val(e):(this.element.html(e),this.icon&&(this._attachIcon(this.options.iconPosition),this._attachIconSpace(this.options.iconPosition)))),this._super(t,e),"disabled"===t&&(this._toggleClass(null,"ui-state-disabled",e),this.element[0].disabled=e,e&&this.element.blur())},refresh:function(){var t=this.element.is("input, button")?this.element[0].disabled:this.element.hasClass("ui-button-disabled");t!==this.options.disabled&&this._setOptions({disabled:t}),this._updateTooltip()}}),t.uiBackCompat!==!1&&(t.widget("ui.button",t.ui.button,{options:{text:!0,icons:{primary:null,secondary:null}},_create:function(){this.options.showLabel&&!this.options.text&&(this.options.showLabel=this.options.text),!this.options.showLabel&&this.options.text&&(this.options.text=this.options.showLabel),this.options.icon||!this.options.icons.primary&&!this.options.icons.secondary?this.options.icon&&(this.options.icons.primary=this.options.icon):this.options.icons.primary?this.options.icon=this.options.icons.primary:(this.options.icon=this.options.icons.secondary,this.options.iconPosition="end"),this._super()},_setOption:function(t,e){return"text"===t?(this._super("showLabel",e),void 0):("showLabel"===t&&(this.options.text=e),"icon"===t&&(this.options.icons.primary=e),"icons"===t&&(e.primary?(this._super("icon",e.primary),this._super("iconPosition","beginning")):e.secondary&&(this._super("icon",e.secondary),this._super("iconPosition","end"))),this._superApply(arguments),void 0)}}),t.fn.button=function(e){return function(){return!this.length||this.length&&"INPUT"!==this[0].tagName||this.length&&"INPUT"===this[0].tagName&&"checkbox"!==this.attr("type")&&"radio"!==this.attr("type")?e.apply(this,arguments):(t.ui.checkboxradio||t.error("Checkboxradio widget missing"),0===arguments.length?this.checkboxradio({icon:!1}):this.checkboxradio.apply(this,arguments))}}(t.fn.button),t.fn.buttonset=function(){return t.ui.controlgroup||t.error("Controlgroup widget missing"),"option"===arguments[0]&&"items"===arguments[1]&&arguments[2]?this.controlgroup.apply(this,[arguments[0],"items.button",arguments[2]]):"option"===arguments[0]&&"items"===arguments[1]?this.controlgroup.apply(this,[arguments[0],"items.button"]):("object"==typeof arguments[0]&&arguments[0].items&&(arguments[0].items={button:arguments[0].items}),this.controlgroup.apply(this,arguments))}),t.ui.button,t.extend(t.ui,{datepicker:{version:"1.12.1"}});var p;t.extend(s.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(t){return a(this._defaults,t||{}),this},_attachDatepicker:function(e,i){var s,n,o;s=e.nodeName.toLowerCase(),n="div"===s||"span"===s,e.id||(this.uuid+=1,e.id="dp"+this.uuid),o=this._newInst(t(e),n),o.settings=t.extend({},i||{}),"input"===s?this._connectDatepicker(e,o):n&&this._inlineDatepicker(e,o)},_newInst:function(e,i){var s=e[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1");return{id:s,input:e,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:i,dpDiv:i?n(t("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(e,i){var s=t(e);i.append=t([]),i.trigger=t([]),s.hasClass(this.markerClassName)||(this._attachments(s,i),s.addClass(this.markerClassName).on("keydown",this._doKeyDown).on("keypress",this._doKeyPress).on("keyup",this._doKeyUp),this._autoSize(i),t.data(e,"datepicker",i),i.settings.disabled&&this._disableDatepicker(e))},_attachments:function(e,i){var s,n,o,a=this._get(i,"appendText"),r=this._get(i,"isRTL");i.append&&i.append.remove(),a&&(i.append=t("<span class='"+this._appendClass+"'>"+a+"</span>"),e[r?"before":"after"](i.append)),e.off("focus",this._showDatepicker),i.trigger&&i.trigger.remove(),s=this._get(i,"showOn"),("focus"===s||"both"===s)&&e.on("focus",this._showDatepicker),("button"===s||"both"===s)&&(n=this._get(i,"buttonText"),o=this._get(i,"buttonImage"),i.trigger=t(this._get(i,"buttonImageOnly")?t("<img/>").addClass(this._triggerClass).attr({src:o,alt:n,title:n}):t("<button type='button'></button>").addClass(this._triggerClass).html(o?t("<img/>").attr({src:o,alt:n,title:n}):n)),e[r?"before":"after"](i.trigger),i.trigger.on("click",function(){return t.datepicker._datepickerShowing&&t.datepicker._lastInput===e[0]?t.datepicker._hideDatepicker():t.datepicker._datepickerShowing&&t.datepicker._lastInput!==e[0]?(t.datepicker._hideDatepicker(),t.datepicker._showDatepicker(e[0])):t.datepicker._showDatepicker(e[0]),!1}))},_autoSize:function(t){if(this._get(t,"autoSize")&&!t.inline){var e,i,s,n,o=new Date(2009,11,20),a=this._get(t,"dateFormat");a.match(/[DM]/)&&(e=function(t){for(i=0,s=0,n=0;t.length>n;n++)t[n].length>i&&(i=t[n].length,s=n);return s},o.setMonth(e(this._get(t,a.match(/MM/)?"monthNames":"monthNamesShort"))),o.setDate(e(this._get(t,a.match(/DD/)?"dayNames":"dayNamesShort"))+20-o.getDay())),t.input.attr("size",this._formatDate(t,o).length)}},_inlineDatepicker:function(e,i){var s=t(e);s.hasClass(this.markerClassName)||(s.addClass(this.markerClassName).append(i.dpDiv),t.data(e,"datepicker",i),this._setDate(i,this._getDefaultDate(i),!0),this._updateDatepicker(i),this._updateAlternate(i),i.settings.disabled&&this._disableDatepicker(e),i.dpDiv.css("display","block"))},_dialogDatepicker:function(e,i,s,n,o){var r,h,l,c,u,d=this._dialogInst;return d||(this.uuid+=1,r="dp"+this.uuid,this._dialogInput=t("<input type='text' id='"+r+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.on("keydown",this._doKeyDown),t("body").append(this._dialogInput),d=this._dialogInst=this._newInst(this._dialogInput,!1),d.settings={},t.data(this._dialogInput[0],"datepicker",d)),a(d.settings,n||{}),i=i&&i.constructor===Date?this._formatDate(d,i):i,this._dialogInput.val(i),this._pos=o?o.length?o:[o.pageX,o.pageY]:null,this._pos||(h=document.documentElement.clientWidth,l=document.documentElement.clientHeight,c=document.documentElement.scrollLeft||document.body.scrollLeft,u=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[h/2-100+c,l/2-150+u]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),d.settings.onSelect=s,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),t.blockUI&&t.blockUI(this.dpDiv),t.data(this._dialogInput[0],"datepicker",d),this},_destroyDatepicker:function(e){var i,s=t(e),n=t.data(e,"datepicker");s.hasClass(this.markerClassName)&&(i=e.nodeName.toLowerCase(),t.removeData(e,"datepicker"),"input"===i?(n.append.remove(),n.trigger.remove(),s.removeClass(this.markerClassName).off("focus",this._showDatepicker).off("keydown",this._doKeyDown).off("keypress",this._doKeyPress).off("keyup",this._doKeyUp)):("div"===i||"span"===i)&&s.removeClass(this.markerClassName).empty(),p===n&&(p=null))},_enableDatepicker:function(e){var i,s,n=t(e),o=t.data(e,"datepicker");n.hasClass(this.markerClassName)&&(i=e.nodeName.toLowerCase(),"input"===i?(e.disabled=!1,o.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().removeClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=t.map(this._disabledInputs,function(t){return t===e?null:t}))},_disableDatepicker:function(e){var i,s,n=t(e),o=t.data(e,"datepicker");n.hasClass(this.markerClassName)&&(i=e.nodeName.toLowerCase(),"input"===i?(e.disabled=!0,o.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().addClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=t.map(this._disabledInputs,function(t){return t===e?null:t}),this._disabledInputs[this._disabledInputs.length]=e)},_isDisabledDatepicker:function(t){if(!t)return!1;for(var e=0;this._disabledInputs.length>e;e++)if(this._disabledInputs[e]===t)return!0;return!1},_getInst:function(e){try{return t.data(e,"datepicker")}catch(i){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(e,i,s){var n,o,r,h,l=this._getInst(e);return 2===arguments.length&&"string"==typeof i?"defaults"===i?t.extend({},t.datepicker._defaults):l?"all"===i?t.extend({},l.settings):this._get(l,i):null:(n=i||{},"string"==typeof i&&(n={},n[i]=s),l&&(this._curInst===l&&this._hideDatepicker(),o=this._getDateDatepicker(e,!0),r=this._getMinMaxDate(l,"min"),h=this._getMinMaxDate(l,"max"),a(l.settings,n),null!==r&&void 0!==n.dateFormat&&void 0===n.minDate&&(l.settings.minDate=this._formatDate(l,r)),null!==h&&void 0!==n.dateFormat&&void 0===n.maxDate&&(l.settings.maxDate=this._formatDate(l,h)),"disabled"in n&&(n.disabled?this._disableDatepicker(e):this._enableDatepicker(e)),this._attachments(t(e),l),this._autoSize(l),this._setDate(l,o),this._updateAlternate(l),this._updateDatepicker(l)),void 0)},_changeDatepicker:function(t,e,i){this._optionDatepicker(t,e,i)},_refreshDatepicker:function(t){var e=this._getInst(t);e&&this._updateDatepicker(e)},_setDateDatepicker:function(t,e){var i=this._getInst(t);i&&(this._setDate(i,e),this._updateDatepicker(i),this._updateAlternate(i))},_getDateDatepicker:function(t,e){var i=this._getInst(t);return i&&!i.inline&&this._setDateFromField(i,e),i?this._getDate(i):null},_doKeyDown:function(e){var i,s,n,o=t.datepicker._getInst(e.target),a=!0,r=o.dpDiv.is(".ui-datepicker-rtl");if(o._keyEvent=!0,t.datepicker._datepickerShowing)switch(e.keyCode){case 9:t.datepicker._hideDatepicker(),a=!1;break;case 13:return n=t("td."+t.datepicker._dayOverClass+":not(."+t.datepicker._currentClass+")",o.dpDiv),n[0]&&t.datepicker._selectDay(e.target,o.selectedMonth,o.selectedYear,n[0]),i=t.datepicker._get(o,"onSelect"),i?(s=t.datepicker._formatDate(o),i.apply(o.input?o.input[0]:null,[s,o])):t.datepicker._hideDatepicker(),!1;case 27:t.datepicker._hideDatepicker();break;case 33:t.datepicker._adjustDate(e.target,e.ctrlKey?-t.datepicker._get(o,"stepBigMonths"):-t.datepicker._get(o,"stepMonths"),"M");break;case 34:t.datepicker._adjustDate(e.target,e.ctrlKey?+t.datepicker._get(o,"stepBigMonths"):+t.datepicker._get(o,"stepMonths"),"M");break;case 35:(e.ctrlKey||e.metaKey)&&t.datepicker._clearDate(e.target),a=e.ctrlKey||e.metaKey;break;case 36:(e.ctrlKey||e.metaKey)&&t.datepicker._gotoToday(e.target),a=e.ctrlKey||e.metaKey;break;case 37:(e.ctrlKey||e.metaKey)&&t.datepicker._adjustDate(e.target,r?1:-1,"D"),a=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&t.datepicker._adjustDate(e.target,e.ctrlKey?-t.datepicker._get(o,"stepBigMonths"):-t.datepicker._get(o,"stepMonths"),"M");break;case 38:(e.ctrlKey||e.metaKey)&&t.datepicker._adjustDate(e.target,-7,"D"),a=e.ctrlKey||e.metaKey;break;case 39:(e.ctrlKey||e.metaKey)&&t.datepicker._adjustDate(e.target,r?-1:1,"D"),a=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&t.datepicker._adjustDate(e.target,e.ctrlKey?+t.datepicker._get(o,"stepBigMonths"):+t.datepicker._get(o,"stepMonths"),"M");break;case 40:(e.ctrlKey||e.metaKey)&&t.datepicker._adjustDate(e.target,7,"D"),a=e.ctrlKey||e.metaKey;break;default:a=!1}else 36===e.keyCode&&e.ctrlKey?t.datepicker._showDatepicker(this):a=!1;a&&(e.preventDefault(),e.stopPropagation())},_doKeyPress:function(e){var i,s,n=t.datepicker._getInst(e.target);return t.datepicker._get(n,"constrainInput")?(i=t.datepicker._possibleChars(t.datepicker._get(n,"dateFormat")),s=String.fromCharCode(null==e.charCode?e.keyCode:e.charCode),e.ctrlKey||e.metaKey||" ">s||!i||i.indexOf(s)>-1):void 0},_doKeyUp:function(e){var i,s=t.datepicker._getInst(e.target);if(s.input.val()!==s.lastVal)try{i=t.datepicker.parseDate(t.datepicker._get(s,"dateFormat"),s.input?s.input.val():null,t.datepicker._getFormatConfig(s)),i&&(t.datepicker._setDateFromField(s),t.datepicker._updateAlternate(s),t.datepicker._updateDatepicker(s))}catch(n){}return!0},_showDatepicker:function(e){if(e=e.target||e,"input"!==e.nodeName.toLowerCase()&&(e=t("input",e.parentNode)[0]),!t.datepicker._isDisabledDatepicker(e)&&t.datepicker._lastInput!==e){var s,n,o,r,h,l,c;s=t.datepicker._getInst(e),t.datepicker._curInst&&t.datepicker._curInst!==s&&(t.datepicker._curInst.dpDiv.stop(!0,!0),s&&t.datepicker._datepickerShowing&&t.datepicker._hideDatepicker(t.datepicker._curInst.input[0])),n=t.datepicker._get(s,"beforeShow"),o=n?n.apply(e,[e,s]):{},o!==!1&&(a(s.settings,o),s.lastVal=null,t.datepicker._lastInput=e,t.datepicker._setDateFromField(s),t.datepicker._inDialog&&(e.value=""),t.datepicker._pos||(t.datepicker._pos=t.datepicker._findPos(e),t.datepicker._pos[1]+=e.offsetHeight),r=!1,t(e).parents().each(function(){return r|="fixed"===t(this).css("position"),!r}),h={left:t.datepicker._pos[0],top:t.datepicker._pos[1]},t.datepicker._pos=null,s.dpDiv.empty(),s.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),t.datepicker._updateDatepicker(s),h=t.datepicker._checkOffset(s,h,r),s.dpDiv.css({position:t.datepicker._inDialog&&t.blockUI?"static":r?"fixed":"absolute",display:"none",left:h.left+"px",top:h.top+"px"}),s.inline||(l=t.datepicker._get(s,"showAnim"),c=t.datepicker._get(s,"duration"),s.dpDiv.css("z-index",i(t(e))+1),t.datepicker._datepickerShowing=!0,t.effects&&t.effects.effect[l]?s.dpDiv.show(l,t.datepicker._get(s,"showOptions"),c):s.dpDiv[l||"show"](l?c:null),t.datepicker._shouldFocusInput(s)&&s.input.trigger("focus"),t.datepicker._curInst=s))}},_updateDatepicker:function(e){this.maxRows=4,p=e,e.dpDiv.empty().append(this._generateHTML(e)),this._attachHandlers(e);var i,s=this._getNumberOfMonths(e),n=s[1],a=17,r=e.dpDiv.find("."+this._dayOverClass+" a");r.length>0&&o.apply(r.get(0)),e.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),n>1&&e.dpDiv.addClass("ui-datepicker-multi-"+n).css("width",a*n+"em"),e.dpDiv[(1!==s[0]||1!==s[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),e.dpDiv[(this._get(e,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),e===t.datepicker._curInst&&t.datepicker._datepickerShowing&&t.datepicker._shouldFocusInput(e)&&e.input.trigger("focus"),e.yearshtml&&(i=e.yearshtml,setTimeout(function(){i===e.yearshtml&&e.yearshtml&&e.dpDiv.find("select.ui-datepicker-year:first").replaceWith(e.yearshtml),i=e.yearshtml=null},0))},_shouldFocusInput:function(t){return t.input&&t.input.is(":visible")&&!t.input.is(":disabled")&&!t.input.is(":focus")},_checkOffset:function(e,i,s){var n=e.dpDiv.outerWidth(),o=e.dpDiv.outerHeight(),a=e.input?e.input.outerWidth():0,r=e.input?e.input.outerHeight():0,h=document.documentElement.clientWidth+(s?0:t(document).scrollLeft()),l=document.documentElement.clientHeight+(s?0:t(document).scrollTop());return i.left-=this._get(e,"isRTL")?n-a:0,i.left-=s&&i.left===e.input.offset().left?t(document).scrollLeft():0,i.top-=s&&i.top===e.input.offset().top+r?t(document).scrollTop():0,i.left-=Math.min(i.left,i.left+n>h&&h>n?Math.abs(i.left+n-h):0),i.top-=Math.min(i.top,i.top+o>l&&l>o?Math.abs(o+r):0),i},_findPos:function(e){for(var i,s=this._getInst(e),n=this._get(s,"isRTL");e&&("hidden"===e.type||1!==e.nodeType||t.expr.filters.hidden(e));)e=e[n?"previousSibling":"nextSibling"];return i=t(e).offset(),[i.left,i.top]},_hideDatepicker:function(e){var i,s,n,o,a=this._curInst;!a||e&&a!==t.data(e,"datepicker")||this._datepickerShowing&&(i=this._get(a,"showAnim"),s=this._get(a,"duration"),n=function(){t.datepicker._tidyDialog(a)},t.effects&&(t.effects.effect[i]||t.effects[i])?a.dpDiv.hide(i,t.datepicker._get(a,"showOptions"),s,n):a.dpDiv["slideDown"===i?"slideUp":"fadeIn"===i?"fadeOut":"hide"](i?s:null,n),i||n(),this._datepickerShowing=!1,o=this._get(a,"onClose"),o&&o.apply(a.input?a.input[0]:null,[a.input?a.input.val():"",a]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),t.blockUI&&(t.unblockUI(),t("body").append(this.dpDiv))),this._inDialog=!1)},_tidyDialog:function(t){t.dpDiv.removeClass(this._dialogClass).off(".ui-datepicker-calendar")},_checkExternalClick:function(e){if(t.datepicker._curInst){var i=t(e.target),s=t.datepicker._getInst(i[0]);(i[0].id!==t.datepicker._mainDivId&&0===i.parents("#"+t.datepicker._mainDivId).length&&!i.hasClass(t.datepicker.markerClassName)&&!i.closest("."+t.datepicker._triggerClass).length&&t.datepicker._datepickerShowing&&(!t.datepicker._inDialog||!t.blockUI)||i.hasClass(t.datepicker.markerClassName)&&t.datepicker._curInst!==s)&&t.datepicker._hideDatepicker()}},_adjustDate:function(e,i,s){var n=t(e),o=this._getInst(n[0]);this._isDisabledDatepicker(n[0])||(this._adjustInstDate(o,i+("M"===s?this._get(o,"showCurrentAtPos"):0),s),this._updateDatepicker(o))},_gotoToday:function(e){var i,s=t(e),n=this._getInst(s[0]);this._get(n,"gotoCurrent")&&n.currentDay?(n.selectedDay=n.currentDay,n.drawMonth=n.selectedMonth=n.currentMonth,n.drawYear=n.selectedYear=n.currentYear):(i=new Date,n.selectedDay=i.getDate(),n.drawMonth=n.selectedMonth=i.getMonth(),n.drawYear=n.selectedYear=i.getFullYear()),this._notifyChange(n),this._adjustDate(s)},_selectMonthYear:function(e,i,s){var n=t(e),o=this._getInst(n[0]);o["selected"+("M"===s?"Month":"Year")]=o["draw"+("M"===s?"Month":"Year")]=parseInt(i.options[i.selectedIndex].value,10),this._notifyChange(o),this._adjustDate(n)},_selectDay:function(e,i,s,n){var o,a=t(e);t(n).hasClass(this._unselectableClass)||this._isDisabledDatepicker(a[0])||(o=this._getInst(a[0]),o.selectedDay=o.currentDay=t("a",n).html(),o.selectedMonth=o.currentMonth=i,o.selectedYear=o.currentYear=s,this._selectDate(e,this._formatDate(o,o.currentDay,o.currentMonth,o.currentYear)))},_clearDate:function(e){var i=t(e);this._selectDate(i,"")},_selectDate:function(e,i){var s,n=t(e),o=this._getInst(n[0]);i=null!=i?i:this._formatDate(o),o.input&&o.input.val(i),this._updateAlternate(o),s=this._get(o,"onSelect"),s?s.apply(o.input?o.input[0]:null,[i,o]):o.input&&o.input.trigger("change"),o.inline?this._updateDatepicker(o):(this._hideDatepicker(),this._lastInput=o.input[0],"object"!=typeof o.input[0]&&o.input.trigger("focus"),this._lastInput=null)},_updateAlternate:function(e){var i,s,n,o=this._get(e,"altField");o&&(i=this._get(e,"altFormat")||this._get(e,"dateFormat"),s=this._getDate(e),n=this.formatDate(i,s,this._getFormatConfig(e)),t(o).val(n))},noWeekends:function(t){var e=t.getDay();return[e>0&&6>e,""]},iso8601Week:function(t){var e,i=new Date(t.getTime());return i.setDate(i.getDate()+4-(i.getDay()||7)),e=i.getTime(),i.setMonth(0),i.setDate(1),Math.floor(Math.round((e-i)/864e5)/7)+1},parseDate:function(e,i,s){if(null==e||null==i)throw"Invalid arguments";if(i="object"==typeof i?""+i:i+"",""===i)return null;var n,o,a,r,h=0,l=(s?s.shortYearCutoff:null)||this._defaults.shortYearCutoff,c="string"!=typeof l?l:(new Date).getFullYear()%100+parseInt(l,10),u=(s?s.dayNamesShort:null)||this._defaults.dayNamesShort,d=(s?s.dayNames:null)||this._defaults.dayNames,p=(s?s.monthNamesShort:null)||this._defaults.monthNamesShort,f=(s?s.monthNames:null)||this._defaults.monthNames,g=-1,m=-1,_=-1,v=-1,b=!1,y=function(t){var i=e.length>n+1&&e.charAt(n+1)===t;return i&&n++,i},w=function(t){var e=y(t),s="@"===t?14:"!"===t?20:"y"===t&&e?4:"o"===t?3:2,n="y"===t?s:1,o=RegExp("^\\d{"+n+","+s+"}"),a=i.substring(h).match(o);if(!a)throw"Missing number at position "+h;return h+=a[0].length,parseInt(a[0],10)},k=function(e,s,n){var o=-1,a=t.map(y(e)?n:s,function(t,e){return[[e,t]]}).sort(function(t,e){return-(t[1].length-e[1].length)});if(t.each(a,function(t,e){var s=e[1];return i.substr(h,s.length).toLowerCase()===s.toLowerCase()?(o=e[0],h+=s.length,!1):void 0}),-1!==o)return o+1;throw"Unknown name at position "+h},x=function(){if(i.charAt(h)!==e.charAt(n))throw"Unexpected literal at position "+h;h++};for(n=0;e.length>n;n++)if(b)"'"!==e.charAt(n)||y("'")?x():b=!1;else switch(e.charAt(n)){case"d":_=w("d");break;case"D":k("D",u,d);break;case"o":v=w("o");break;case"m":m=w("m");break;case"M":m=k("M",p,f);break;case"y":g=w("y");break;case"@":r=new Date(w("@")),g=r.getFullYear(),m=r.getMonth()+1,_=r.getDate();break;case"!":r=new Date((w("!")-this._ticksTo1970)/1e4),g=r.getFullYear(),m=r.getMonth()+1,_=r.getDate();break;case"'":y("'")?x():b=!0;break;default:x()}if(i.length>h&&(a=i.substr(h),!/^\s+/.test(a)))throw"Extra/unparsed characters found in date: "+a;if(-1===g?g=(new Date).getFullYear():100>g&&(g+=(new Date).getFullYear()-(new Date).getFullYear()%100+(c>=g?0:-100)),v>-1)for(m=1,_=v;;){if(o=this._getDaysInMonth(g,m-1),o>=_)break;m++,_-=o}if(r=this._daylightSavingAdjust(new Date(g,m-1,_)),r.getFullYear()!==g||r.getMonth()+1!==m||r.getDate()!==_)throw"Invalid date";return r},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:1e7*60*60*24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925)),formatDate:function(t,e,i){if(!e)return"";var s,n=(i?i.dayNamesShort:null)||this._defaults.dayNamesShort,o=(i?i.dayNames:null)||this._defaults.dayNames,a=(i?i.monthNamesShort:null)||this._defaults.monthNamesShort,r=(i?i.monthNames:null)||this._defaults.monthNames,h=function(e){var i=t.length>s+1&&t.charAt(s+1)===e;return i&&s++,i},l=function(t,e,i){var s=""+e;if(h(t))for(;i>s.length;)s="0"+s;return s},c=function(t,e,i,s){return h(t)?s[e]:i[e]},u="",d=!1;if(e)for(s=0;t.length>s;s++)if(d)"'"!==t.charAt(s)||h("'")?u+=t.charAt(s):d=!1;else switch(t.charAt(s)){case"d":u+=l("d",e.getDate(),2);break;case"D":u+=c("D",e.getDay(),n,o);break;case"o":u+=l("o",Math.round((new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime()-new Date(e.getFullYear(),0,0).getTime())/864e5),3);break;case"m":u+=l("m",e.getMonth()+1,2);break;case"M":u+=c("M",e.getMonth(),a,r);break;case"y":u+=h("y")?e.getFullYear():(10>e.getFullYear()%100?"0":"")+e.getFullYear()%100;break;case"@":u+=e.getTime();break;case"!":u+=1e4*e.getTime()+this._ticksTo1970;break;case"'":h("'")?u+="'":d=!0;break;default:u+=t.charAt(s)}return u},_possibleChars:function(t){var e,i="",s=!1,n=function(i){var s=t.length>e+1&&t.charAt(e+1)===i;return s&&e++,s};for(e=0;t.length>e;e++)if(s)"'"!==t.charAt(e)||n("'")?i+=t.charAt(e):s=!1;else switch(t.charAt(e)){case"d":case"m":case"y":case"@":i+="0123456789";break;case"D":case"M":return null;case"'":n("'")?i+="'":s=!0;break;default:i+=t.charAt(e)}return i},_get:function(t,e){return void 0!==t.settings[e]?t.settings[e]:this._defaults[e]},_setDateFromField:function(t,e){if(t.input.val()!==t.lastVal){var i=this._get(t,"dateFormat"),s=t.lastVal=t.input?t.input.val():null,n=this._getDefaultDate(t),o=n,a=this._getFormatConfig(t);try{o=this.parseDate(i,s,a)||n}catch(r){s=e?"":s}t.selectedDay=o.getDate(),t.drawMonth=t.selectedMonth=o.getMonth(),t.drawYear=t.selectedYear=o.getFullYear(),t.currentDay=s?o.getDate():0,t.currentMonth=s?o.getMonth():0,t.currentYear=s?o.getFullYear():0,this._adjustInstDate(t)}},_getDefaultDate:function(t){return this._restrictMinMax(t,this._determineDate(t,this._get(t,"defaultDate"),new Date))},_determineDate:function(e,i,s){var n=function(t){var e=new Date;return e.setDate(e.getDate()+t),e},o=function(i){try{return t.datepicker.parseDate(t.datepicker._get(e,"dateFormat"),i,t.datepicker._getFormatConfig(e))}catch(s){}for(var n=(i.toLowerCase().match(/^c/)?t.datepicker._getDate(e):null)||new Date,o=n.getFullYear(),a=n.getMonth(),r=n.getDate(),h=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,l=h.exec(i);l;){switch(l[2]||"d"){case"d":case"D":r+=parseInt(l[1],10);break;case"w":case"W":r+=7*parseInt(l[1],10);break;case"m":case"M":a+=parseInt(l[1],10),r=Math.min(r,t.datepicker._getDaysInMonth(o,a));break;case"y":case"Y":o+=parseInt(l[1],10),r=Math.min(r,t.datepicker._getDaysInMonth(o,a))}l=h.exec(i)}return new Date(o,a,r)},a=null==i||""===i?s:"string"==typeof i?o(i):"number"==typeof i?isNaN(i)?s:n(i):new Date(i.getTime());return a=a&&"Invalid Date"==""+a?s:a,a&&(a.setHours(0),a.setMinutes(0),a.setSeconds(0),a.setMilliseconds(0)),this._daylightSavingAdjust(a)},_daylightSavingAdjust:function(t){return t?(t.setHours(t.getHours()>12?t.getHours()+2:0),t):null},_setDate:function(t,e,i){var s=!e,n=t.selectedMonth,o=t.selectedYear,a=this._restrictMinMax(t,this._determineDate(t,e,new Date));t.selectedDay=t.currentDay=a.getDate(),t.drawMonth=t.selectedMonth=t.currentMonth=a.getMonth(),t.drawYear=t.selectedYear=t.currentYear=a.getFullYear(),n===t.selectedMonth&&o===t.selectedYear||i||this._notifyChange(t),this._adjustInstDate(t),t.input&&t.input.val(s?"":this._formatDate(t))},_getDate:function(t){var e=!t.currentYear||t.input&&""===t.input.val()?null:this._daylightSavingAdjust(new Date(t.currentYear,t.currentMonth,t.currentDay));return e},_attachHandlers:function(e){var i=this._get(e,"stepMonths"),s="#"+e.id.replace(/\\\\/g,"\\");e.dpDiv.find("[data-handler]").map(function(){var e={prev:function(){t.datepicker._adjustDate(s,-i,"M")},next:function(){t.datepicker._adjustDate(s,+i,"M")},hide:function(){t.datepicker._hideDatepicker()},today:function(){t.datepicker._gotoToday(s)},selectDay:function(){return t.datepicker._selectDay(s,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return t.datepicker._selectMonthYear(s,this,"M"),!1},selectYear:function(){return t.datepicker._selectMonthYear(s,this,"Y"),!1}};t(this).on(this.getAttribute("data-event"),e[this.getAttribute("data-handler")])})},_generateHTML:function(t){var e,i,s,n,o,a,r,h,l,c,u,d,p,f,g,m,_,v,b,y,w,k,x,C,D,I,T,P,M,S,H,z,O,A,N,W,E,F,L,R=new Date,B=this._daylightSavingAdjust(new Date(R.getFullYear(),R.getMonth(),R.getDate())),Y=this._get(t,"isRTL"),j=this._get(t,"showButtonPanel"),q=this._get(t,"hideIfNoPrevNext"),K=this._get(t,"navigationAsDateFormat"),U=this._getNumberOfMonths(t),V=this._get(t,"showCurrentAtPos"),$=this._get(t,"stepMonths"),X=1!==U[0]||1!==U[1],G=this._daylightSavingAdjust(t.currentDay?new Date(t.currentYear,t.currentMonth,t.currentDay):new Date(9999,9,9)),Q=this._getMinMaxDate(t,"min"),J=this._getMinMaxDate(t,"max"),Z=t.drawMonth-V,te=t.drawYear;if(0>Z&&(Z+=12,te--),J)for(e=this._daylightSavingAdjust(new Date(J.getFullYear(),J.getMonth()-U[0]*U[1]+1,J.getDate())),e=Q&&Q>e?Q:e;this._daylightSavingAdjust(new Date(te,Z,1))>e;)Z--,0>Z&&(Z=11,te--);for(t.drawMonth=Z,t.drawYear=te,i=this._get(t,"prevText"),i=K?this.formatDate(i,this._daylightSavingAdjust(new Date(te,Z-$,1)),this._getFormatConfig(t)):i,s=this._canAdjustMonth(t,-1,te,Z)?"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>":q?"":"<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>",n=this._get(t,"nextText"),n=K?this.formatDate(n,this._daylightSavingAdjust(new Date(te,Z+$,1)),this._getFormatConfig(t)):n,o=this._canAdjustMonth(t,1,te,Z)?"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>":q?"":"<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>",a=this._get(t,"currentText"),r=this._get(t,"gotoCurrent")&&t.currentDay?G:B,a=K?this.formatDate(a,r,this._getFormatConfig(t)):a,h=t.inline?"":"<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>"+this._get(t,"closeText")+"</button>",l=j?"<div class='ui-datepicker-buttonpane ui-widget-content'>"+(Y?h:"")+(this._isInRange(t,r)?"<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'>"+a+"</button>":"")+(Y?"":h)+"</div>":"",c=parseInt(this._get(t,"firstDay"),10),c=isNaN(c)?0:c,u=this._get(t,"showWeek"),d=this._get(t,"dayNames"),p=this._get(t,"dayNamesMin"),f=this._get(t,"monthNames"),g=this._get(t,"monthNamesShort"),m=this._get(t,"beforeShowDay"),_=this._get(t,"showOtherMonths"),v=this._get(t,"selectOtherMonths"),b=this._getDefaultDate(t),y="",k=0;U[0]>k;k++){for(x="",this.maxRows=4,C=0;U[1]>C;C++){if(D=this._daylightSavingAdjust(new Date(te,Z,t.selectedDay)),I=" ui-corner-all",T="",X){if(T+="<div class='ui-datepicker-group",U[1]>1)switch(C){case 0:T+=" ui-datepicker-group-first",I=" ui-corner-"+(Y?"right":"left");
break;case U[1]-1:T+=" ui-datepicker-group-last",I=" ui-corner-"+(Y?"left":"right");break;default:T+=" ui-datepicker-group-middle",I=""}T+="'>"}for(T+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+I+"'>"+(/all|left/.test(I)&&0===k?Y?o:s:"")+(/all|right/.test(I)&&0===k?Y?s:o:"")+this._generateMonthYearHeader(t,Z,te,Q,J,k>0||C>0,f,g)+"</div><table class='ui-datepicker-calendar'><thead>"+"<tr>",P=u?"<th class='ui-datepicker-week-col'>"+this._get(t,"weekHeader")+"</th>":"",w=0;7>w;w++)M=(w+c)%7,P+="<th scope='col'"+((w+c+6)%7>=5?" class='ui-datepicker-week-end'":"")+">"+"<span title='"+d[M]+"'>"+p[M]+"</span></th>";for(T+=P+"</tr></thead><tbody>",S=this._getDaysInMonth(te,Z),te===t.selectedYear&&Z===t.selectedMonth&&(t.selectedDay=Math.min(t.selectedDay,S)),H=(this._getFirstDayOfMonth(te,Z)-c+7)%7,z=Math.ceil((H+S)/7),O=X?this.maxRows>z?this.maxRows:z:z,this.maxRows=O,A=this._daylightSavingAdjust(new Date(te,Z,1-H)),N=0;O>N;N++){for(T+="<tr>",W=u?"<td class='ui-datepicker-week-col'>"+this._get(t,"calculateWeek")(A)+"</td>":"",w=0;7>w;w++)E=m?m.apply(t.input?t.input[0]:null,[A]):[!0,""],F=A.getMonth()!==Z,L=F&&!v||!E[0]||Q&&Q>A||J&&A>J,W+="<td class='"+((w+c+6)%7>=5?" ui-datepicker-week-end":"")+(F?" ui-datepicker-other-month":"")+(A.getTime()===D.getTime()&&Z===t.selectedMonth&&t._keyEvent||b.getTime()===A.getTime()&&b.getTime()===D.getTime()?" "+this._dayOverClass:"")+(L?" "+this._unselectableClass+" ui-state-disabled":"")+(F&&!_?"":" "+E[1]+(A.getTime()===G.getTime()?" "+this._currentClass:"")+(A.getTime()===B.getTime()?" ui-datepicker-today":""))+"'"+(F&&!_||!E[2]?"":" title='"+E[2].replace(/'/g,"&#39;")+"'")+(L?"":" data-handler='selectDay' data-event='click' data-month='"+A.getMonth()+"' data-year='"+A.getFullYear()+"'")+">"+(F&&!_?"&#xa0;":L?"<span class='ui-state-default'>"+A.getDate()+"</span>":"<a class='ui-state-default"+(A.getTime()===B.getTime()?" ui-state-highlight":"")+(A.getTime()===G.getTime()?" ui-state-active":"")+(F?" ui-priority-secondary":"")+"' href='#'>"+A.getDate()+"</a>")+"</td>",A.setDate(A.getDate()+1),A=this._daylightSavingAdjust(A);T+=W+"</tr>"}Z++,Z>11&&(Z=0,te++),T+="</tbody></table>"+(X?"</div>"+(U[0]>0&&C===U[1]-1?"<div class='ui-datepicker-row-break'></div>":""):""),x+=T}y+=x}return y+=l,t._keyEvent=!1,y},_generateMonthYearHeader:function(t,e,i,s,n,o,a,r){var h,l,c,u,d,p,f,g,m=this._get(t,"changeMonth"),_=this._get(t,"changeYear"),v=this._get(t,"showMonthAfterYear"),b="<div class='ui-datepicker-title'>",y="";if(o||!m)y+="<span class='ui-datepicker-month'>"+a[e]+"</span>";else{for(h=s&&s.getFullYear()===i,l=n&&n.getFullYear()===i,y+="<select class='ui-datepicker-month' data-handler='selectMonth' data-event='change'>",c=0;12>c;c++)(!h||c>=s.getMonth())&&(!l||n.getMonth()>=c)&&(y+="<option value='"+c+"'"+(c===e?" selected='selected'":"")+">"+r[c]+"</option>");y+="</select>"}if(v||(b+=y+(!o&&m&&_?"":"&#xa0;")),!t.yearshtml)if(t.yearshtml="",o||!_)b+="<span class='ui-datepicker-year'>"+i+"</span>";else{for(u=this._get(t,"yearRange").split(":"),d=(new Date).getFullYear(),p=function(t){var e=t.match(/c[+\-].*/)?i+parseInt(t.substring(1),10):t.match(/[+\-].*/)?d+parseInt(t,10):parseInt(t,10);return isNaN(e)?d:e},f=p(u[0]),g=Math.max(f,p(u[1]||"")),f=s?Math.max(f,s.getFullYear()):f,g=n?Math.min(g,n.getFullYear()):g,t.yearshtml+="<select class='ui-datepicker-year' data-handler='selectYear' data-event='change'>";g>=f;f++)t.yearshtml+="<option value='"+f+"'"+(f===i?" selected='selected'":"")+">"+f+"</option>";t.yearshtml+="</select>",b+=t.yearshtml,t.yearshtml=null}return b+=this._get(t,"yearSuffix"),v&&(b+=(!o&&m&&_?"":"&#xa0;")+y),b+="</div>"},_adjustInstDate:function(t,e,i){var s=t.selectedYear+("Y"===i?e:0),n=t.selectedMonth+("M"===i?e:0),o=Math.min(t.selectedDay,this._getDaysInMonth(s,n))+("D"===i?e:0),a=this._restrictMinMax(t,this._daylightSavingAdjust(new Date(s,n,o)));t.selectedDay=a.getDate(),t.drawMonth=t.selectedMonth=a.getMonth(),t.drawYear=t.selectedYear=a.getFullYear(),("M"===i||"Y"===i)&&this._notifyChange(t)},_restrictMinMax:function(t,e){var i=this._getMinMaxDate(t,"min"),s=this._getMinMaxDate(t,"max"),n=i&&i>e?i:e;return s&&n>s?s:n},_notifyChange:function(t){var e=this._get(t,"onChangeMonthYear");e&&e.apply(t.input?t.input[0]:null,[t.selectedYear,t.selectedMonth+1,t])},_getNumberOfMonths:function(t){var e=this._get(t,"numberOfMonths");return null==e?[1,1]:"number"==typeof e?[1,e]:e},_getMinMaxDate:function(t,e){return this._determineDate(t,this._get(t,e+"Date"),null)},_getDaysInMonth:function(t,e){return 32-this._daylightSavingAdjust(new Date(t,e,32)).getDate()},_getFirstDayOfMonth:function(t,e){return new Date(t,e,1).getDay()},_canAdjustMonth:function(t,e,i,s){var n=this._getNumberOfMonths(t),o=this._daylightSavingAdjust(new Date(i,s+(0>e?e:n[0]*n[1]),1));return 0>e&&o.setDate(this._getDaysInMonth(o.getFullYear(),o.getMonth())),this._isInRange(t,o)},_isInRange:function(t,e){var i,s,n=this._getMinMaxDate(t,"min"),o=this._getMinMaxDate(t,"max"),a=null,r=null,h=this._get(t,"yearRange");return h&&(i=h.split(":"),s=(new Date).getFullYear(),a=parseInt(i[0],10),r=parseInt(i[1],10),i[0].match(/[+\-].*/)&&(a+=s),i[1].match(/[+\-].*/)&&(r+=s)),(!n||e.getTime()>=n.getTime())&&(!o||e.getTime()<=o.getTime())&&(!a||e.getFullYear()>=a)&&(!r||r>=e.getFullYear())},_getFormatConfig:function(t){var e=this._get(t,"shortYearCutoff");return e="string"!=typeof e?e:(new Date).getFullYear()%100+parseInt(e,10),{shortYearCutoff:e,dayNamesShort:this._get(t,"dayNamesShort"),dayNames:this._get(t,"dayNames"),monthNamesShort:this._get(t,"monthNamesShort"),monthNames:this._get(t,"monthNames")}},_formatDate:function(t,e,i,s){e||(t.currentDay=t.selectedDay,t.currentMonth=t.selectedMonth,t.currentYear=t.selectedYear);var n=e?"object"==typeof e?e:this._daylightSavingAdjust(new Date(s,i,e)):this._daylightSavingAdjust(new Date(t.currentYear,t.currentMonth,t.currentDay));return this.formatDate(this._get(t,"dateFormat"),n,this._getFormatConfig(t))}}),t.fn.datepicker=function(e){if(!this.length)return this;t.datepicker.initialized||(t(document).on("mousedown",t.datepicker._checkExternalClick),t.datepicker.initialized=!0),0===t("#"+t.datepicker._mainDivId).length&&t("body").append(t.datepicker.dpDiv);var i=Array.prototype.slice.call(arguments,1);return"string"!=typeof e||"isDisabled"!==e&&"getDate"!==e&&"widget"!==e?"option"===e&&2===arguments.length&&"string"==typeof arguments[1]?t.datepicker["_"+e+"Datepicker"].apply(t.datepicker,[this[0]].concat(i)):this.each(function(){"string"==typeof e?t.datepicker["_"+e+"Datepicker"].apply(t.datepicker,[this].concat(i)):t.datepicker._attachDatepicker(this,e)}):t.datepicker["_"+e+"Datepicker"].apply(t.datepicker,[this[0]].concat(i))},t.datepicker=new s,t.datepicker.initialized=!1,t.datepicker.uuid=(new Date).getTime(),t.datepicker.version="1.12.1",t.datepicker,t.widget("ui.dialog",{version:"1.12.1",options:{appendTo:"body",autoOpen:!0,buttons:[],classes:{"ui-dialog":"ui-corner-all","ui-dialog-titlebar":"ui-corner-all"},closeOnEscape:!0,closeText:"Close",draggable:!0,hide:null,height:"auto",maxHeight:null,maxWidth:null,minHeight:150,minWidth:150,modal:!1,position:{my:"center",at:"center",of:window,collision:"fit",using:function(e){var i=t(this).css(e).offset().top;0>i&&t(this).css("top",e.top-i)}},resizable:!0,show:null,title:null,width:300,beforeClose:null,close:null,drag:null,dragStart:null,dragStop:null,focus:null,open:null,resize:null,resizeStart:null,resizeStop:null},sizeRelatedOptions:{buttons:!0,height:!0,maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0,width:!0},resizableRelatedOptions:{maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0},_create:function(){this.originalCss={display:this.element[0].style.display,width:this.element[0].style.width,minHeight:this.element[0].style.minHeight,maxHeight:this.element[0].style.maxHeight,height:this.element[0].style.height},this.originalPosition={parent:this.element.parent(),index:this.element.parent().children().index(this.element)},this.originalTitle=this.element.attr("title"),null==this.options.title&&null!=this.originalTitle&&(this.options.title=this.originalTitle),this.options.disabled&&(this.options.disabled=!1),this._createWrapper(),this.element.show().removeAttr("title").appendTo(this.uiDialog),this._addClass("ui-dialog-content","ui-widget-content"),this._createTitlebar(),this._createButtonPane(),this.options.draggable&&t.fn.draggable&&this._makeDraggable(),this.options.resizable&&t.fn.resizable&&this._makeResizable(),this._isOpen=!1,this._trackFocus()},_init:function(){this.options.autoOpen&&this.open()},_appendTo:function(){var e=this.options.appendTo;return e&&(e.jquery||e.nodeType)?t(e):this.document.find(e||"body").eq(0)},_destroy:function(){var t,e=this.originalPosition;this._untrackInstance(),this._destroyOverlay(),this.element.removeUniqueId().css(this.originalCss).detach(),this.uiDialog.remove(),this.originalTitle&&this.element.attr("title",this.originalTitle),t=e.parent.children().eq(e.index),t.length&&t[0]!==this.element[0]?t.before(this.element):e.parent.append(this.element)},widget:function(){return this.uiDialog},disable:t.noop,enable:t.noop,close:function(e){var i=this;this._isOpen&&this._trigger("beforeClose",e)!==!1&&(this._isOpen=!1,this._focusedElement=null,this._destroyOverlay(),this._untrackInstance(),this.opener.filter(":focusable").trigger("focus").length||t.ui.safeBlur(t.ui.safeActiveElement(this.document[0])),this._hide(this.uiDialog,this.options.hide,function(){i._trigger("close",e)}))},isOpen:function(){return this._isOpen},moveToTop:function(){this._moveToTop()},_moveToTop:function(e,i){var s=!1,n=this.uiDialog.siblings(".ui-front:visible").map(function(){return+t(this).css("z-index")}).get(),o=Math.max.apply(null,n);return o>=+this.uiDialog.css("z-index")&&(this.uiDialog.css("z-index",o+1),s=!0),s&&!i&&this._trigger("focus",e),s},open:function(){var e=this;return this._isOpen?(this._moveToTop()&&this._focusTabbable(),void 0):(this._isOpen=!0,this.opener=t(t.ui.safeActiveElement(this.document[0])),this._size(),this._position(),this._createOverlay(),this._moveToTop(null,!0),this.overlay&&this.overlay.css("z-index",this.uiDialog.css("z-index")-1),this._show(this.uiDialog,this.options.show,function(){e._focusTabbable(),e._trigger("focus")}),this._makeFocusTarget(),this._trigger("open"),void 0)},_focusTabbable:function(){var t=this._focusedElement;t||(t=this.element.find("[autofocus]")),t.length||(t=this.element.find(":tabbable")),t.length||(t=this.uiDialogButtonPane.find(":tabbable")),t.length||(t=this.uiDialogTitlebarClose.filter(":tabbable")),t.length||(t=this.uiDialog),t.eq(0).trigger("focus")},_keepFocus:function(e){function i(){var e=t.ui.safeActiveElement(this.document[0]),i=this.uiDialog[0]===e||t.contains(this.uiDialog[0],e);i||this._focusTabbable()}e.preventDefault(),i.call(this),this._delay(i)},_createWrapper:function(){this.uiDialog=t("<div>").hide().attr({tabIndex:-1,role:"dialog"}).appendTo(this._appendTo()),this._addClass(this.uiDialog,"ui-dialog","ui-widget ui-widget-content ui-front"),this._on(this.uiDialog,{keydown:function(e){if(this.options.closeOnEscape&&!e.isDefaultPrevented()&&e.keyCode&&e.keyCode===t.ui.keyCode.ESCAPE)return e.preventDefault(),this.close(e),void 0;if(e.keyCode===t.ui.keyCode.TAB&&!e.isDefaultPrevented()){var i=this.uiDialog.find(":tabbable"),s=i.filter(":first"),n=i.filter(":last");e.target!==n[0]&&e.target!==this.uiDialog[0]||e.shiftKey?e.target!==s[0]&&e.target!==this.uiDialog[0]||!e.shiftKey||(this._delay(function(){n.trigger("focus")}),e.preventDefault()):(this._delay(function(){s.trigger("focus")}),e.preventDefault())}},mousedown:function(t){this._moveToTop(t)&&this._focusTabbable()}}),this.element.find("[aria-describedby]").length||this.uiDialog.attr({"aria-describedby":this.element.uniqueId().attr("id")})},_createTitlebar:function(){var e;this.uiDialogTitlebar=t("<div>"),this._addClass(this.uiDialogTitlebar,"ui-dialog-titlebar","ui-widget-header ui-helper-clearfix"),this._on(this.uiDialogTitlebar,{mousedown:function(e){t(e.target).closest(".ui-dialog-titlebar-close")||this.uiDialog.trigger("focus")}}),this.uiDialogTitlebarClose=t("<button type='button'></button>").button({label:t("<a>").text(this.options.closeText).html(),icon:"ui-icon-closethick",showLabel:!1}).appendTo(this.uiDialogTitlebar),this._addClass(this.uiDialogTitlebarClose,"ui-dialog-titlebar-close"),this._on(this.uiDialogTitlebarClose,{click:function(t){t.preventDefault(),this.close(t)}}),e=t("<span>").uniqueId().prependTo(this.uiDialogTitlebar),this._addClass(e,"ui-dialog-title"),this._title(e),this.uiDialogTitlebar.prependTo(this.uiDialog),this.uiDialog.attr({"aria-labelledby":e.attr("id")})},_title:function(t){this.options.title?t.text(this.options.title):t.html("&#160;")},_createButtonPane:function(){this.uiDialogButtonPane=t("<div>"),this._addClass(this.uiDialogButtonPane,"ui-dialog-buttonpane","ui-widget-content ui-helper-clearfix"),this.uiButtonSet=t("<div>").appendTo(this.uiDialogButtonPane),this._addClass(this.uiButtonSet,"ui-dialog-buttonset"),this._createButtons()},_createButtons:function(){var e=this,i=this.options.buttons;return this.uiDialogButtonPane.remove(),this.uiButtonSet.empty(),t.isEmptyObject(i)||t.isArray(i)&&!i.length?(this._removeClass(this.uiDialog,"ui-dialog-buttons"),void 0):(t.each(i,function(i,s){var n,o;s=t.isFunction(s)?{click:s,text:i}:s,s=t.extend({type:"button"},s),n=s.click,o={icon:s.icon,iconPosition:s.iconPosition,showLabel:s.showLabel,icons:s.icons,text:s.text},delete s.click,delete s.icon,delete s.iconPosition,delete s.showLabel,delete s.icons,"boolean"==typeof s.text&&delete s.text,t("<button></button>",s).button(o).appendTo(e.uiButtonSet).on("click",function(){n.apply(e.element[0],arguments)})}),this._addClass(this.uiDialog,"ui-dialog-buttons"),this.uiDialogButtonPane.appendTo(this.uiDialog),void 0)},_makeDraggable:function(){function e(t){return{position:t.position,offset:t.offset}}var i=this,s=this.options;this.uiDialog.draggable({cancel:".ui-dialog-content, .ui-dialog-titlebar-close",handle:".ui-dialog-titlebar",containment:"document",start:function(s,n){i._addClass(t(this),"ui-dialog-dragging"),i._blockFrames(),i._trigger("dragStart",s,e(n))},drag:function(t,s){i._trigger("drag",t,e(s))},stop:function(n,o){var a=o.offset.left-i.document.scrollLeft(),r=o.offset.top-i.document.scrollTop();s.position={my:"left top",at:"left"+(a>=0?"+":"")+a+" "+"top"+(r>=0?"+":"")+r,of:i.window},i._removeClass(t(this),"ui-dialog-dragging"),i._unblockFrames(),i._trigger("dragStop",n,e(o))}})},_makeResizable:function(){function e(t){return{originalPosition:t.originalPosition,originalSize:t.originalSize,position:t.position,size:t.size}}var i=this,s=this.options,n=s.resizable,o=this.uiDialog.css("position"),a="string"==typeof n?n:"n,e,s,w,se,sw,ne,nw";this.uiDialog.resizable({cancel:".ui-dialog-content",containment:"document",alsoResize:this.element,maxWidth:s.maxWidth,maxHeight:s.maxHeight,minWidth:s.minWidth,minHeight:this._minHeight(),handles:a,start:function(s,n){i._addClass(t(this),"ui-dialog-resizing"),i._blockFrames(),i._trigger("resizeStart",s,e(n))},resize:function(t,s){i._trigger("resize",t,e(s))},stop:function(n,o){var a=i.uiDialog.offset(),r=a.left-i.document.scrollLeft(),h=a.top-i.document.scrollTop();s.height=i.uiDialog.height(),s.width=i.uiDialog.width(),s.position={my:"left top",at:"left"+(r>=0?"+":"")+r+" "+"top"+(h>=0?"+":"")+h,of:i.window},i._removeClass(t(this),"ui-dialog-resizing"),i._unblockFrames(),i._trigger("resizeStop",n,e(o))}}).css("position",o)},_trackFocus:function(){this._on(this.widget(),{focusin:function(e){this._makeFocusTarget(),this._focusedElement=t(e.target)}})},_makeFocusTarget:function(){this._untrackInstance(),this._trackingInstances().unshift(this)},_untrackInstance:function(){var e=this._trackingInstances(),i=t.inArray(this,e);-1!==i&&e.splice(i,1)},_trackingInstances:function(){var t=this.document.data("ui-dialog-instances");return t||(t=[],this.document.data("ui-dialog-instances",t)),t},_minHeight:function(){var t=this.options;return"auto"===t.height?t.minHeight:Math.min(t.minHeight,t.height)},_position:function(){var t=this.uiDialog.is(":visible");t||this.uiDialog.show(),this.uiDialog.position(this.options.position),t||this.uiDialog.hide()},_setOptions:function(e){var i=this,s=!1,n={};t.each(e,function(t,e){i._setOption(t,e),t in i.sizeRelatedOptions&&(s=!0),t in i.resizableRelatedOptions&&(n[t]=e)}),s&&(this._size(),this._position()),this.uiDialog.is(":data(ui-resizable)")&&this.uiDialog.resizable("option",n)},_setOption:function(e,i){var s,n,o=this.uiDialog;"disabled"!==e&&(this._super(e,i),"appendTo"===e&&this.uiDialog.appendTo(this._appendTo()),"buttons"===e&&this._createButtons(),"closeText"===e&&this.uiDialogTitlebarClose.button({label:t("<a>").text(""+this.options.closeText).html()}),"draggable"===e&&(s=o.is(":data(ui-draggable)"),s&&!i&&o.draggable("destroy"),!s&&i&&this._makeDraggable()),"position"===e&&this._position(),"resizable"===e&&(n=o.is(":data(ui-resizable)"),n&&!i&&o.resizable("destroy"),n&&"string"==typeof i&&o.resizable("option","handles",i),n||i===!1||this._makeResizable()),"title"===e&&this._title(this.uiDialogTitlebar.find(".ui-dialog-title")))},_size:function(){var t,e,i,s=this.options;this.element.show().css({width:"auto",minHeight:0,maxHeight:"none",height:0}),s.minWidth>s.width&&(s.width=s.minWidth),t=this.uiDialog.css({height:"auto",width:s.width}).outerHeight(),e=Math.max(0,s.minHeight-t),i="number"==typeof s.maxHeight?Math.max(0,s.maxHeight-t):"none","auto"===s.height?this.element.css({minHeight:e,maxHeight:i,height:"auto"}):this.element.height(Math.max(0,s.height-t)),this.uiDialog.is(":data(ui-resizable)")&&this.uiDialog.resizable("option","minHeight",this._minHeight())},_blockFrames:function(){this.iframeBlocks=this.document.find("iframe").map(function(){var e=t(this);return t("<div>").css({position:"absolute",width:e.outerWidth(),height:e.outerHeight()}).appendTo(e.parent()).offset(e.offset())[0]})},_unblockFrames:function(){this.iframeBlocks&&(this.iframeBlocks.remove(),delete this.iframeBlocks)},_allowInteraction:function(e){return t(e.target).closest(".ui-dialog").length?!0:!!t(e.target).closest(".ui-datepicker").length},_createOverlay:function(){if(this.options.modal){var e=!0;this._delay(function(){e=!1}),this.document.data("ui-dialog-overlays")||this._on(this.document,{focusin:function(t){e||this._allowInteraction(t)||(t.preventDefault(),this._trackingInstances()[0]._focusTabbable())}}),this.overlay=t("<div>").appendTo(this._appendTo()),this._addClass(this.overlay,null,"ui-widget-overlay ui-front"),this._on(this.overlay,{mousedown:"_keepFocus"}),this.document.data("ui-dialog-overlays",(this.document.data("ui-dialog-overlays")||0)+1)}},_destroyOverlay:function(){if(this.options.modal&&this.overlay){var t=this.document.data("ui-dialog-overlays")-1;t?this.document.data("ui-dialog-overlays",t):(this._off(this.document,"focusin"),this.document.removeData("ui-dialog-overlays")),this.overlay.remove(),this.overlay=null}}}),t.uiBackCompat!==!1&&t.widget("ui.dialog",t.ui.dialog,{options:{dialogClass:""},_createWrapper:function(){this._super(),this.uiDialog.addClass(this.options.dialogClass)},_setOption:function(t,e){"dialogClass"===t&&this.uiDialog.removeClass(this.options.dialogClass).addClass(e),this._superApply(arguments)}}),t.ui.dialog,t.widget("ui.progressbar",{version:"1.12.1",options:{classes:{"ui-progressbar":"ui-corner-all","ui-progressbar-value":"ui-corner-left","ui-progressbar-complete":"ui-corner-right"},max:100,value:0,change:null,complete:null},min:0,_create:function(){this.oldValue=this.options.value=this._constrainedValue(),this.element.attr({role:"progressbar","aria-valuemin":this.min}),this._addClass("ui-progressbar","ui-widget ui-widget-content"),this.valueDiv=t("<div>").appendTo(this.element),this._addClass(this.valueDiv,"ui-progressbar-value","ui-widget-header"),this._refreshValue()},_destroy:function(){this.element.removeAttr("role aria-valuemin aria-valuemax aria-valuenow"),this.valueDiv.remove()},value:function(t){return void 0===t?this.options.value:(this.options.value=this._constrainedValue(t),this._refreshValue(),void 0)},_constrainedValue:function(t){return void 0===t&&(t=this.options.value),this.indeterminate=t===!1,"number"!=typeof t&&(t=0),this.indeterminate?!1:Math.min(this.options.max,Math.max(this.min,t))},_setOptions:function(t){var e=t.value;delete t.value,this._super(t),this.options.value=this._constrainedValue(e),this._refreshValue()},_setOption:function(t,e){"max"===t&&(e=Math.max(this.min,e)),this._super(t,e)},_setOptionDisabled:function(t){this._super(t),this.element.attr("aria-disabled",t),this._toggleClass(null,"ui-state-disabled",!!t)},_percentage:function(){return this.indeterminate?100:100*(this.options.value-this.min)/(this.options.max-this.min)},_refreshValue:function(){var e=this.options.value,i=this._percentage();this.valueDiv.toggle(this.indeterminate||e>this.min).width(i.toFixed(0)+"%"),this._toggleClass(this.valueDiv,"ui-progressbar-complete",null,e===this.options.max)._toggleClass("ui-progressbar-indeterminate",null,this.indeterminate),this.indeterminate?(this.element.removeAttr("aria-valuenow"),this.overlayDiv||(this.overlayDiv=t("<div>").appendTo(this.valueDiv),this._addClass(this.overlayDiv,"ui-progressbar-overlay"))):(this.element.attr({"aria-valuemax":this.options.max,"aria-valuenow":e}),this.overlayDiv&&(this.overlayDiv.remove(),this.overlayDiv=null)),this.oldValue!==e&&(this.oldValue=e,this._trigger("change")),e===this.options.max&&this._trigger("complete")}}),t.widget("ui.selectmenu",[t.ui.formResetMixin,{version:"1.12.1",defaultElement:"<select>",options:{appendTo:null,classes:{"ui-selectmenu-button-open":"ui-corner-top","ui-selectmenu-button-closed":"ui-corner-all"},disabled:null,icons:{button:"ui-icon-triangle-1-s"},position:{my:"left top",at:"left bottom",collision:"none"},width:!1,change:null,close:null,focus:null,open:null,select:null},_create:function(){var e=this.element.uniqueId().attr("id");this.ids={element:e,button:e+"-button",menu:e+"-menu"},this._drawButton(),this._drawMenu(),this._bindFormResetHandler(),this._rendered=!1,this.menuItems=t()},_drawButton:function(){var e,i=this,s=this._parseOption(this.element.find("option:selected"),this.element[0].selectedIndex);this.labels=this.element.labels().attr("for",this.ids.button),this._on(this.labels,{click:function(t){this.button.focus(),t.preventDefault()}}),this.element.hide(),this.button=t("<span>",{tabindex:this.options.disabled?-1:0,id:this.ids.button,role:"combobox","aria-expanded":"false","aria-autocomplete":"list","aria-owns":this.ids.menu,"aria-haspopup":"true",title:this.element.attr("title")}).insertAfter(this.element),this._addClass(this.button,"ui-selectmenu-button ui-selectmenu-button-closed","ui-button ui-widget"),e=t("<span>").appendTo(this.button),this._addClass(e,"ui-selectmenu-icon","ui-icon "+this.options.icons.button),this.buttonItem=this._renderButtonItem(s).appendTo(this.button),this.options.width!==!1&&this._resizeButton(),this._on(this.button,this._buttonEvents),this.button.one("focusin",function(){i._rendered||i._refreshMenu()})},_drawMenu:function(){var e=this;this.menu=t("<ul>",{"aria-hidden":"true","aria-labelledby":this.ids.button,id:this.ids.menu}),this.menuWrap=t("<div>").append(this.menu),this._addClass(this.menuWrap,"ui-selectmenu-menu","ui-front"),this.menuWrap.appendTo(this._appendTo()),this.menuInstance=this.menu.menu({classes:{"ui-menu":"ui-corner-bottom"},role:"listbox",select:function(t,i){t.preventDefault(),e._setSelection(),e._select(i.item.data("ui-selectmenu-item"),t)},focus:function(t,i){var s=i.item.data("ui-selectmenu-item");null!=e.focusIndex&&s.index!==e.focusIndex&&(e._trigger("focus",t,{item:s}),e.isOpen||e._select(s,t)),e.focusIndex=s.index,e.button.attr("aria-activedescendant",e.menuItems.eq(s.index).attr("id"))}}).menu("instance"),this.menuInstance._off(this.menu,"mouseleave"),this.menuInstance._closeOnDocumentClick=function(){return!1},this.menuInstance._isDivider=function(){return!1}},refresh:function(){this._refreshMenu(),this.buttonItem.replaceWith(this.buttonItem=this._renderButtonItem(this._getSelectedItem().data("ui-selectmenu-item")||{})),null===this.options.width&&this._resizeButton()},_refreshMenu:function(){var t,e=this.element.find("option");this.menu.empty(),this._parseOptions(e),this._renderMenu(this.menu,this.items),this.menuInstance.refresh(),this.menuItems=this.menu.find("li").not(".ui-selectmenu-optgroup").find(".ui-menu-item-wrapper"),this._rendered=!0,e.length&&(t=this._getSelectedItem(),this.menuInstance.focus(null,t),this._setAria(t.data("ui-selectmenu-item")),this._setOption("disabled",this.element.prop("disabled")))},open:function(t){this.options.disabled||(this._rendered?(this._removeClass(this.menu.find(".ui-state-active"),null,"ui-state-active"),this.menuInstance.focus(null,this._getSelectedItem())):this._refreshMenu(),this.menuItems.length&&(this.isOpen=!0,this._toggleAttr(),this._resizeMenu(),this._position(),this._on(this.document,this._documentClick),this._trigger("open",t)))},_position:function(){this.menuWrap.position(t.extend({of:this.button},this.options.position))},close:function(t){this.isOpen&&(this.isOpen=!1,this._toggleAttr(),this.range=null,this._off(this.document),this._trigger("close",t))},widget:function(){return this.button},menuWidget:function(){return this.menu},_renderButtonItem:function(e){var i=t("<span>");return this._setText(i,e.label),this._addClass(i,"ui-selectmenu-text"),i},_renderMenu:function(e,i){var s=this,n="";t.each(i,function(i,o){var a;o.optgroup!==n&&(a=t("<li>",{text:o.optgroup}),s._addClass(a,"ui-selectmenu-optgroup","ui-menu-divider"+(o.element.parent("optgroup").prop("disabled")?" ui-state-disabled":"")),a.appendTo(e),n=o.optgroup),s._renderItemData(e,o)})},_renderItemData:function(t,e){return this._renderItem(t,e).data("ui-selectmenu-item",e)},_renderItem:function(e,i){var s=t("<li>"),n=t("<div>",{title:i.element.attr("title")});return i.disabled&&this._addClass(s,null,"ui-state-disabled"),this._setText(n,i.label),s.append(n).appendTo(e)},_setText:function(t,e){e?t.text(e):t.html("&#160;")},_move:function(t,e){var i,s,n=".ui-menu-item";this.isOpen?i=this.menuItems.eq(this.focusIndex).parent("li"):(i=this.menuItems.eq(this.element[0].selectedIndex).parent("li"),n+=":not(.ui-state-disabled)"),s="first"===t||"last"===t?i["first"===t?"prevAll":"nextAll"](n).eq(-1):i[t+"All"](n).eq(0),s.length&&this.menuInstance.focus(e,s)},_getSelectedItem:function(){return this.menuItems.eq(this.element[0].selectedIndex).parent("li")},_toggle:function(t){this[this.isOpen?"close":"open"](t)},_setSelection:function(){var t;this.range&&(window.getSelection?(t=window.getSelection(),t.removeAllRanges(),t.addRange(this.range)):this.range.select(),this.button.focus())},_documentClick:{mousedown:function(e){this.isOpen&&(t(e.target).closest(".ui-selectmenu-menu, #"+t.ui.escapeSelector(this.ids.button)).length||this.close(e))}},_buttonEvents:{mousedown:function(){var t;window.getSelection?(t=window.getSelection(),t.rangeCount&&(this.range=t.getRangeAt(0))):this.range=document.selection.createRange()},click:function(t){this._setSelection(),this._toggle(t)},keydown:function(e){var i=!0;switch(e.keyCode){case t.ui.keyCode.TAB:case t.ui.keyCode.ESCAPE:this.close(e),i=!1;break;case t.ui.keyCode.ENTER:this.isOpen&&this._selectFocusedItem(e);break;case t.ui.keyCode.UP:e.altKey?this._toggle(e):this._move("prev",e);break;case t.ui.keyCode.DOWN:e.altKey?this._toggle(e):this._move("next",e);break;case t.ui.keyCode.SPACE:this.isOpen?this._selectFocusedItem(e):this._toggle(e);break;case t.ui.keyCode.LEFT:this._move("prev",e);break;case t.ui.keyCode.RIGHT:this._move("next",e);break;case t.ui.keyCode.HOME:case t.ui.keyCode.PAGE_UP:this._move("first",e);break;case t.ui.keyCode.END:case t.ui.keyCode.PAGE_DOWN:this._move("last",e);break;default:this.menu.trigger(e),i=!1}i&&e.preventDefault()}},_selectFocusedItem:function(t){var e=this.menuItems.eq(this.focusIndex).parent("li");e.hasClass("ui-state-disabled")||this._select(e.data("ui-selectmenu-item"),t)},_select:function(t,e){var i=this.element[0].selectedIndex;this.element[0].selectedIndex=t.index,this.buttonItem.replaceWith(this.buttonItem=this._renderButtonItem(t)),this._setAria(t),this._trigger("select",e,{item:t}),t.index!==i&&this._trigger("change",e,{item:t}),this.close(e)},_setAria:function(t){var e=this.menuItems.eq(t.index).attr("id");this.button.attr({"aria-labelledby":e,"aria-activedescendant":e}),this.menu.attr("aria-activedescendant",e)},_setOption:function(t,e){if("icons"===t){var i=this.button.find("span.ui-icon");this._removeClass(i,null,this.options.icons.button)._addClass(i,null,e.button)}this._super(t,e),"appendTo"===t&&this.menuWrap.appendTo(this._appendTo()),"width"===t&&this._resizeButton()},_setOptionDisabled:function(t){this._super(t),this.menuInstance.option("disabled",t),this.button.attr("aria-disabled",t),this._toggleClass(this.button,null,"ui-state-disabled",t),this.element.prop("disabled",t),t?(this.button.attr("tabindex",-1),this.close()):this.button.attr("tabindex",0)},_appendTo:function(){var e=this.options.appendTo;return e&&(e=e.jquery||e.nodeType?t(e):this.document.find(e).eq(0)),e&&e[0]||(e=this.element.closest(".ui-front, dialog")),e.length||(e=this.document[0].body),e},_toggleAttr:function(){this.button.attr("aria-expanded",this.isOpen),this._removeClass(this.button,"ui-selectmenu-button-"+(this.isOpen?"closed":"open"))._addClass(this.button,"ui-selectmenu-button-"+(this.isOpen?"open":"closed"))._toggleClass(this.menuWrap,"ui-selectmenu-open",null,this.isOpen),this.menu.attr("aria-hidden",!this.isOpen)},_resizeButton:function(){var t=this.options.width;return t===!1?(this.button.css("width",""),void 0):(null===t&&(t=this.element.show().outerWidth(),this.element.hide()),this.button.outerWidth(t),void 0)},_resizeMenu:function(){this.menu.outerWidth(Math.max(this.button.outerWidth(),this.menu.width("").outerWidth()+1))},_getCreateOptions:function(){var t=this._super();return t.disabled=this.element.prop("disabled"),t},_parseOptions:function(e){var i=this,s=[];e.each(function(e,n){s.push(i._parseOption(t(n),e))}),this.items=s},_parseOption:function(t,e){var i=t.parent("optgroup");return{element:t,index:e,value:t.val(),label:t.text(),optgroup:i.attr("label")||"",disabled:i.prop("disabled")||t.prop("disabled")}},_destroy:function(){this._unbindFormResetHandler(),this.menuWrap.remove(),this.button.remove(),this.element.show(),this.element.removeUniqueId(),this.labels.attr("for",this.ids.element)}}]),t.widget("ui.slider",t.ui.mouse,{version:"1.12.1",widgetEventPrefix:"slide",options:{animate:!1,classes:{"ui-slider":"ui-corner-all","ui-slider-handle":"ui-corner-all","ui-slider-range":"ui-corner-all ui-widget-header"},distance:0,max:100,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null,change:null,slide:null,start:null,stop:null},numPages:5,_create:function(){this._keySliding=!1,this._mouseSliding=!1,this._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this._calculateNewMax(),this._addClass("ui-slider ui-slider-"+this.orientation,"ui-widget ui-widget-content"),this._refresh(),this._animateOff=!1},_refresh:function(){this._createRange(),this._createHandles(),this._setupEvents(),this._refreshValue()},_createHandles:function(){var e,i,s=this.options,n=this.element.find(".ui-slider-handle"),o="<span tabindex='0'></span>",a=[];for(i=s.values&&s.values.length||1,n.length>i&&(n.slice(i).remove(),n=n.slice(0,i)),e=n.length;i>e;e++)a.push(o);this.handles=n.add(t(a.join("")).appendTo(this.element)),this._addClass(this.handles,"ui-slider-handle","ui-state-default"),this.handle=this.handles.eq(0),this.handles.each(function(e){t(this).data("ui-slider-handle-index",e).attr("tabIndex",0)})},_createRange:function(){var e=this.options;e.range?(e.range===!0&&(e.values?e.values.length&&2!==e.values.length?e.values=[e.values[0],e.values[0]]:t.isArray(e.values)&&(e.values=e.values.slice(0)):e.values=[this._valueMin(),this._valueMin()]),this.range&&this.range.length?(this._removeClass(this.range,"ui-slider-range-min ui-slider-range-max"),this.range.css({left:"",bottom:""})):(this.range=t("<div>").appendTo(this.element),this._addClass(this.range,"ui-slider-range")),("min"===e.range||"max"===e.range)&&this._addClass(this.range,"ui-slider-range-"+e.range)):(this.range&&this.range.remove(),this.range=null)
},_setupEvents:function(){this._off(this.handles),this._on(this.handles,this._handleEvents),this._hoverable(this.handles),this._focusable(this.handles)},_destroy:function(){this.handles.remove(),this.range&&this.range.remove(),this._mouseDestroy()},_mouseCapture:function(e){var i,s,n,o,a,r,h,l,c=this,u=this.options;return u.disabled?!1:(this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()},this.elementOffset=this.element.offset(),i={x:e.pageX,y:e.pageY},s=this._normValueFromMouse(i),n=this._valueMax()-this._valueMin()+1,this.handles.each(function(e){var i=Math.abs(s-c.values(e));(n>i||n===i&&(e===c._lastChangedValue||c.values(e)===u.min))&&(n=i,o=t(this),a=e)}),r=this._start(e,a),r===!1?!1:(this._mouseSliding=!0,this._handleIndex=a,this._addClass(o,null,"ui-state-active"),o.trigger("focus"),h=o.offset(),l=!t(e.target).parents().addBack().is(".ui-slider-handle"),this._clickOffset=l?{left:0,top:0}:{left:e.pageX-h.left-o.width()/2,top:e.pageY-h.top-o.height()/2-(parseInt(o.css("borderTopWidth"),10)||0)-(parseInt(o.css("borderBottomWidth"),10)||0)+(parseInt(o.css("marginTop"),10)||0)},this.handles.hasClass("ui-state-hover")||this._slide(e,a,s),this._animateOff=!0,!0))},_mouseStart:function(){return!0},_mouseDrag:function(t){var e={x:t.pageX,y:t.pageY},i=this._normValueFromMouse(e);return this._slide(t,this._handleIndex,i),!1},_mouseStop:function(t){return this._removeClass(this.handles,null,"ui-state-active"),this._mouseSliding=!1,this._stop(t,this._handleIndex),this._change(t,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1,!1},_detectOrientation:function(){this.orientation="vertical"===this.options.orientation?"vertical":"horizontal"},_normValueFromMouse:function(t){var e,i,s,n,o;return"horizontal"===this.orientation?(e=this.elementSize.width,i=t.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)):(e=this.elementSize.height,i=t.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)),s=i/e,s>1&&(s=1),0>s&&(s=0),"vertical"===this.orientation&&(s=1-s),n=this._valueMax()-this._valueMin(),o=this._valueMin()+s*n,this._trimAlignValue(o)},_uiHash:function(t,e,i){var s={handle:this.handles[t],handleIndex:t,value:void 0!==e?e:this.value()};return this._hasMultipleValues()&&(s.value=void 0!==e?e:this.values(t),s.values=i||this.values()),s},_hasMultipleValues:function(){return this.options.values&&this.options.values.length},_start:function(t,e){return this._trigger("start",t,this._uiHash(e))},_slide:function(t,e,i){var s,n,o=this.value(),a=this.values();this._hasMultipleValues()&&(n=this.values(e?0:1),o=this.values(e),2===this.options.values.length&&this.options.range===!0&&(i=0===e?Math.min(n,i):Math.max(n,i)),a[e]=i),i!==o&&(s=this._trigger("slide",t,this._uiHash(e,i,a)),s!==!1&&(this._hasMultipleValues()?this.values(e,i):this.value(i)))},_stop:function(t,e){this._trigger("stop",t,this._uiHash(e))},_change:function(t,e){this._keySliding||this._mouseSliding||(this._lastChangedValue=e,this._trigger("change",t,this._uiHash(e)))},value:function(t){return arguments.length?(this.options.value=this._trimAlignValue(t),this._refreshValue(),this._change(null,0),void 0):this._value()},values:function(e,i){var s,n,o;if(arguments.length>1)return this.options.values[e]=this._trimAlignValue(i),this._refreshValue(),this._change(null,e),void 0;if(!arguments.length)return this._values();if(!t.isArray(arguments[0]))return this._hasMultipleValues()?this._values(e):this.value();for(s=this.options.values,n=arguments[0],o=0;s.length>o;o+=1)s[o]=this._trimAlignValue(n[o]),this._change(null,o);this._refreshValue()},_setOption:function(e,i){var s,n=0;switch("range"===e&&this.options.range===!0&&("min"===i?(this.options.value=this._values(0),this.options.values=null):"max"===i&&(this.options.value=this._values(this.options.values.length-1),this.options.values=null)),t.isArray(this.options.values)&&(n=this.options.values.length),this._super(e,i),e){case"orientation":this._detectOrientation(),this._removeClass("ui-slider-horizontal ui-slider-vertical")._addClass("ui-slider-"+this.orientation),this._refreshValue(),this.options.range&&this._refreshRange(i),this.handles.css("horizontal"===i?"bottom":"left","");break;case"value":this._animateOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;break;case"values":for(this._animateOff=!0,this._refreshValue(),s=n-1;s>=0;s--)this._change(null,s);this._animateOff=!1;break;case"step":case"min":case"max":this._animateOff=!0,this._calculateNewMax(),this._refreshValue(),this._animateOff=!1;break;case"range":this._animateOff=!0,this._refresh(),this._animateOff=!1}},_setOptionDisabled:function(t){this._super(t),this._toggleClass(null,"ui-state-disabled",!!t)},_value:function(){var t=this.options.value;return t=this._trimAlignValue(t)},_values:function(t){var e,i,s;if(arguments.length)return e=this.options.values[t],e=this._trimAlignValue(e);if(this._hasMultipleValues()){for(i=this.options.values.slice(),s=0;i.length>s;s+=1)i[s]=this._trimAlignValue(i[s]);return i}return[]},_trimAlignValue:function(t){if(this._valueMin()>=t)return this._valueMin();if(t>=this._valueMax())return this._valueMax();var e=this.options.step>0?this.options.step:1,i=(t-this._valueMin())%e,s=t-i;return 2*Math.abs(i)>=e&&(s+=i>0?e:-e),parseFloat(s.toFixed(5))},_calculateNewMax:function(){var t=this.options.max,e=this._valueMin(),i=this.options.step,s=Math.round((t-e)/i)*i;t=s+e,t>this.options.max&&(t-=i),this.max=parseFloat(t.toFixed(this._precision()))},_precision:function(){var t=this._precisionOf(this.options.step);return null!==this.options.min&&(t=Math.max(t,this._precisionOf(this.options.min))),t},_precisionOf:function(t){var e=""+t,i=e.indexOf(".");return-1===i?0:e.length-i-1},_valueMin:function(){return this.options.min},_valueMax:function(){return this.max},_refreshRange:function(t){"vertical"===t&&this.range.css({width:"",left:""}),"horizontal"===t&&this.range.css({height:"",bottom:""})},_refreshValue:function(){var e,i,s,n,o,a=this.options.range,r=this.options,h=this,l=this._animateOff?!1:r.animate,c={};this._hasMultipleValues()?this.handles.each(function(s){i=100*((h.values(s)-h._valueMin())/(h._valueMax()-h._valueMin())),c["horizontal"===h.orientation?"left":"bottom"]=i+"%",t(this).stop(1,1)[l?"animate":"css"](c,r.animate),h.options.range===!0&&("horizontal"===h.orientation?(0===s&&h.range.stop(1,1)[l?"animate":"css"]({left:i+"%"},r.animate),1===s&&h.range[l?"animate":"css"]({width:i-e+"%"},{queue:!1,duration:r.animate})):(0===s&&h.range.stop(1,1)[l?"animate":"css"]({bottom:i+"%"},r.animate),1===s&&h.range[l?"animate":"css"]({height:i-e+"%"},{queue:!1,duration:r.animate}))),e=i}):(s=this.value(),n=this._valueMin(),o=this._valueMax(),i=o!==n?100*((s-n)/(o-n)):0,c["horizontal"===this.orientation?"left":"bottom"]=i+"%",this.handle.stop(1,1)[l?"animate":"css"](c,r.animate),"min"===a&&"horizontal"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({width:i+"%"},r.animate),"max"===a&&"horizontal"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({width:100-i+"%"},r.animate),"min"===a&&"vertical"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({height:i+"%"},r.animate),"max"===a&&"vertical"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({height:100-i+"%"},r.animate))},_handleEvents:{keydown:function(e){var i,s,n,o,a=t(e.target).data("ui-slider-handle-index");switch(e.keyCode){case t.ui.keyCode.HOME:case t.ui.keyCode.END:case t.ui.keyCode.PAGE_UP:case t.ui.keyCode.PAGE_DOWN:case t.ui.keyCode.UP:case t.ui.keyCode.RIGHT:case t.ui.keyCode.DOWN:case t.ui.keyCode.LEFT:if(e.preventDefault(),!this._keySliding&&(this._keySliding=!0,this._addClass(t(e.target),null,"ui-state-active"),i=this._start(e,a),i===!1))return}switch(o=this.options.step,s=n=this._hasMultipleValues()?this.values(a):this.value(),e.keyCode){case t.ui.keyCode.HOME:n=this._valueMin();break;case t.ui.keyCode.END:n=this._valueMax();break;case t.ui.keyCode.PAGE_UP:n=this._trimAlignValue(s+(this._valueMax()-this._valueMin())/this.numPages);break;case t.ui.keyCode.PAGE_DOWN:n=this._trimAlignValue(s-(this._valueMax()-this._valueMin())/this.numPages);break;case t.ui.keyCode.UP:case t.ui.keyCode.RIGHT:if(s===this._valueMax())return;n=this._trimAlignValue(s+o);break;case t.ui.keyCode.DOWN:case t.ui.keyCode.LEFT:if(s===this._valueMin())return;n=this._trimAlignValue(s-o)}this._slide(e,a,n)},keyup:function(e){var i=t(e.target).data("ui-slider-handle-index");this._keySliding&&(this._keySliding=!1,this._stop(e,i),this._change(e,i),this._removeClass(t(e.target),null,"ui-state-active"))}}}),t.widget("ui.spinner",{version:"1.12.1",defaultElement:"<input>",widgetEventPrefix:"spin",options:{classes:{"ui-spinner":"ui-corner-all","ui-spinner-down":"ui-corner-br","ui-spinner-up":"ui-corner-tr"},culture:null,icons:{down:"ui-icon-triangle-1-s",up:"ui-icon-triangle-1-n"},incremental:!0,max:null,min:null,numberFormat:null,page:10,step:1,change:null,spin:null,start:null,stop:null},_create:function(){this._setOption("max",this.options.max),this._setOption("min",this.options.min),this._setOption("step",this.options.step),""!==this.value()&&this._value(this.element.val(),!0),this._draw(),this._on(this._events),this._refresh(),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")}})},_getCreateOptions:function(){var e=this._super(),i=this.element;return t.each(["min","max","step"],function(t,s){var n=i.attr(s);null!=n&&n.length&&(e[s]=n)}),e},_events:{keydown:function(t){this._start(t)&&this._keydown(t)&&t.preventDefault()},keyup:"_stop",focus:function(){this.previous=this.element.val()},blur:function(t){return this.cancelBlur?(delete this.cancelBlur,void 0):(this._stop(),this._refresh(),this.previous!==this.element.val()&&this._trigger("change",t),void 0)},mousewheel:function(t,e){if(e){if(!this.spinning&&!this._start(t))return!1;this._spin((e>0?1:-1)*this.options.step,t),clearTimeout(this.mousewheelTimer),this.mousewheelTimer=this._delay(function(){this.spinning&&this._stop(t)},100),t.preventDefault()}},"mousedown .ui-spinner-button":function(e){function i(){var e=this.element[0]===t.ui.safeActiveElement(this.document[0]);e||(this.element.trigger("focus"),this.previous=s,this._delay(function(){this.previous=s}))}var s;s=this.element[0]===t.ui.safeActiveElement(this.document[0])?this.previous:this.element.val(),e.preventDefault(),i.call(this),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur,i.call(this)}),this._start(e)!==!1&&this._repeat(null,t(e.currentTarget).hasClass("ui-spinner-up")?1:-1,e)},"mouseup .ui-spinner-button":"_stop","mouseenter .ui-spinner-button":function(e){return t(e.currentTarget).hasClass("ui-state-active")?this._start(e)===!1?!1:(this._repeat(null,t(e.currentTarget).hasClass("ui-spinner-up")?1:-1,e),void 0):void 0},"mouseleave .ui-spinner-button":"_stop"},_enhance:function(){this.uiSpinner=this.element.attr("autocomplete","off").wrap("<span>").parent().append("<a></a><a></a>")},_draw:function(){this._enhance(),this._addClass(this.uiSpinner,"ui-spinner","ui-widget ui-widget-content"),this._addClass("ui-spinner-input"),this.element.attr("role","spinbutton"),this.buttons=this.uiSpinner.children("a").attr("tabIndex",-1).attr("aria-hidden",!0).button({classes:{"ui-button":""}}),this._removeClass(this.buttons,"ui-corner-all"),this._addClass(this.buttons.first(),"ui-spinner-button ui-spinner-up"),this._addClass(this.buttons.last(),"ui-spinner-button ui-spinner-down"),this.buttons.first().button({icon:this.options.icons.up,showLabel:!1}),this.buttons.last().button({icon:this.options.icons.down,showLabel:!1}),this.buttons.height()>Math.ceil(.5*this.uiSpinner.height())&&this.uiSpinner.height()>0&&this.uiSpinner.height(this.uiSpinner.height())},_keydown:function(e){var i=this.options,s=t.ui.keyCode;switch(e.keyCode){case s.UP:return this._repeat(null,1,e),!0;case s.DOWN:return this._repeat(null,-1,e),!0;case s.PAGE_UP:return this._repeat(null,i.page,e),!0;case s.PAGE_DOWN:return this._repeat(null,-i.page,e),!0}return!1},_start:function(t){return this.spinning||this._trigger("start",t)!==!1?(this.counter||(this.counter=1),this.spinning=!0,!0):!1},_repeat:function(t,e,i){t=t||500,clearTimeout(this.timer),this.timer=this._delay(function(){this._repeat(40,e,i)},t),this._spin(e*this.options.step,i)},_spin:function(t,e){var i=this.value()||0;this.counter||(this.counter=1),i=this._adjustValue(i+t*this._increment(this.counter)),this.spinning&&this._trigger("spin",e,{value:i})===!1||(this._value(i),this.counter++)},_increment:function(e){var i=this.options.incremental;return i?t.isFunction(i)?i(e):Math.floor(e*e*e/5e4-e*e/500+17*e/200+1):1},_precision:function(){var t=this._precisionOf(this.options.step);return null!==this.options.min&&(t=Math.max(t,this._precisionOf(this.options.min))),t},_precisionOf:function(t){var e=""+t,i=e.indexOf(".");return-1===i?0:e.length-i-1},_adjustValue:function(t){var e,i,s=this.options;return e=null!==s.min?s.min:0,i=t-e,i=Math.round(i/s.step)*s.step,t=e+i,t=parseFloat(t.toFixed(this._precision())),null!==s.max&&t>s.max?s.max:null!==s.min&&s.min>t?s.min:t},_stop:function(t){this.spinning&&(clearTimeout(this.timer),clearTimeout(this.mousewheelTimer),this.counter=0,this.spinning=!1,this._trigger("stop",t))},_setOption:function(t,e){var i,s,n;return"culture"===t||"numberFormat"===t?(i=this._parse(this.element.val()),this.options[t]=e,this.element.val(this._format(i)),void 0):(("max"===t||"min"===t||"step"===t)&&"string"==typeof e&&(e=this._parse(e)),"icons"===t&&(s=this.buttons.first().find(".ui-icon"),this._removeClass(s,null,this.options.icons.up),this._addClass(s,null,e.up),n=this.buttons.last().find(".ui-icon"),this._removeClass(n,null,this.options.icons.down),this._addClass(n,null,e.down)),this._super(t,e),void 0)},_setOptionDisabled:function(t){this._super(t),this._toggleClass(this.uiSpinner,null,"ui-state-disabled",!!t),this.element.prop("disabled",!!t),this.buttons.button(t?"disable":"enable")},_setOptions:r(function(t){this._super(t)}),_parse:function(t){return"string"==typeof t&&""!==t&&(t=window.Globalize&&this.options.numberFormat?Globalize.parseFloat(t,10,this.options.culture):+t),""===t||isNaN(t)?null:t},_format:function(t){return""===t?"":window.Globalize&&this.options.numberFormat?Globalize.format(t,this.options.numberFormat,this.options.culture):t},_refresh:function(){this.element.attr({"aria-valuemin":this.options.min,"aria-valuemax":this.options.max,"aria-valuenow":this._parse(this.element.val())})},isValid:function(){var t=this.value();return null===t?!1:t===this._adjustValue(t)},_value:function(t,e){var i;""!==t&&(i=this._parse(t),null!==i&&(e||(i=this._adjustValue(i)),t=this._format(i))),this.element.val(t),this._refresh()},_destroy:function(){this.element.prop("disabled",!1).removeAttr("autocomplete role aria-valuemin aria-valuemax aria-valuenow"),this.uiSpinner.replaceWith(this.element)},stepUp:r(function(t){this._stepUp(t)}),_stepUp:function(t){this._start()&&(this._spin((t||1)*this.options.step),this._stop())},stepDown:r(function(t){this._stepDown(t)}),_stepDown:function(t){this._start()&&(this._spin((t||1)*-this.options.step),this._stop())},pageUp:r(function(t){this._stepUp((t||1)*this.options.page)}),pageDown:r(function(t){this._stepDown((t||1)*this.options.page)}),value:function(t){return arguments.length?(r(this._value).call(this,t),void 0):this._parse(this.element.val())},widget:function(){return this.uiSpinner}}),t.uiBackCompat!==!1&&t.widget("ui.spinner",t.ui.spinner,{_enhance:function(){this.uiSpinner=this.element.attr("autocomplete","off").wrap(this._uiSpinnerHtml()).parent().append(this._buttonHtml())},_uiSpinnerHtml:function(){return"<span>"},_buttonHtml:function(){return"<a></a><a></a>"}}),t.ui.spinner,t.widget("ui.tabs",{version:"1.12.1",delay:300,options:{active:null,classes:{"ui-tabs":"ui-corner-all","ui-tabs-nav":"ui-corner-all","ui-tabs-panel":"ui-corner-bottom","ui-tabs-tab":"ui-corner-top"},collapsible:!1,event:"click",heightStyle:"content",hide:null,show:null,activate:null,beforeActivate:null,beforeLoad:null,load:null},_isLocal:function(){var t=/#.*$/;return function(e){var i,s;i=e.href.replace(t,""),s=location.href.replace(t,"");try{i=decodeURIComponent(i)}catch(n){}try{s=decodeURIComponent(s)}catch(n){}return e.hash.length>1&&i===s}}(),_create:function(){var e=this,i=this.options;this.running=!1,this._addClass("ui-tabs","ui-widget ui-widget-content"),this._toggleClass("ui-tabs-collapsible",null,i.collapsible),this._processTabs(),i.active=this._initialActive(),t.isArray(i.disabled)&&(i.disabled=t.unique(i.disabled.concat(t.map(this.tabs.filter(".ui-state-disabled"),function(t){return e.tabs.index(t)}))).sort()),this.active=this.options.active!==!1&&this.anchors.length?this._findActive(i.active):t(),this._refresh(),this.active.length&&this.load(i.active)},_initialActive:function(){var e=this.options.active,i=this.options.collapsible,s=location.hash.substring(1);return null===e&&(s&&this.tabs.each(function(i,n){return t(n).attr("aria-controls")===s?(e=i,!1):void 0}),null===e&&(e=this.tabs.index(this.tabs.filter(".ui-tabs-active"))),(null===e||-1===e)&&(e=this.tabs.length?0:!1)),e!==!1&&(e=this.tabs.index(this.tabs.eq(e)),-1===e&&(e=i?!1:0)),!i&&e===!1&&this.anchors.length&&(e=0),e},_getCreateEventData:function(){return{tab:this.active,panel:this.active.length?this._getPanelForTab(this.active):t()}},_tabKeydown:function(e){var i=t(t.ui.safeActiveElement(this.document[0])).closest("li"),s=this.tabs.index(i),n=!0;if(!this._handlePageNav(e)){switch(e.keyCode){case t.ui.keyCode.RIGHT:case t.ui.keyCode.DOWN:s++;break;case t.ui.keyCode.UP:case t.ui.keyCode.LEFT:n=!1,s--;break;case t.ui.keyCode.END:s=this.anchors.length-1;break;case t.ui.keyCode.HOME:s=0;break;case t.ui.keyCode.SPACE:return e.preventDefault(),clearTimeout(this.activating),this._activate(s),void 0;case t.ui.keyCode.ENTER:return e.preventDefault(),clearTimeout(this.activating),this._activate(s===this.options.active?!1:s),void 0;default:return}e.preventDefault(),clearTimeout(this.activating),s=this._focusNextTab(s,n),e.ctrlKey||e.metaKey||(i.attr("aria-selected","false"),this.tabs.eq(s).attr("aria-selected","true"),this.activating=this._delay(function(){this.option("active",s)},this.delay))}},_panelKeydown:function(e){this._handlePageNav(e)||e.ctrlKey&&e.keyCode===t.ui.keyCode.UP&&(e.preventDefault(),this.active.trigger("focus"))},_handlePageNav:function(e){return e.altKey&&e.keyCode===t.ui.keyCode.PAGE_UP?(this._activate(this._focusNextTab(this.options.active-1,!1)),!0):e.altKey&&e.keyCode===t.ui.keyCode.PAGE_DOWN?(this._activate(this._focusNextTab(this.options.active+1,!0)),!0):void 0},_findNextTab:function(e,i){function s(){return e>n&&(e=0),0>e&&(e=n),e}for(var n=this.tabs.length-1;-1!==t.inArray(s(),this.options.disabled);)e=i?e+1:e-1;return e},_focusNextTab:function(t,e){return t=this._findNextTab(t,e),this.tabs.eq(t).trigger("focus"),t},_setOption:function(t,e){return"active"===t?(this._activate(e),void 0):(this._super(t,e),"collapsible"===t&&(this._toggleClass("ui-tabs-collapsible",null,e),e||this.options.active!==!1||this._activate(0)),"event"===t&&this._setupEvents(e),"heightStyle"===t&&this._setupHeightStyle(e),void 0)},_sanitizeSelector:function(t){return t?t.replace(/[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g,"\\$&"):""},refresh:function(){var e=this.options,i=this.tablist.children(":has(a[href])");e.disabled=t.map(i.filter(".ui-state-disabled"),function(t){return i.index(t)}),this._processTabs(),e.active!==!1&&this.anchors.length?this.active.length&&!t.contains(this.tablist[0],this.active[0])?this.tabs.length===e.disabled.length?(e.active=!1,this.active=t()):this._activate(this._findNextTab(Math.max(0,e.active-1),!1)):e.active=this.tabs.index(this.active):(e.active=!1,this.active=t()),this._refresh()},_refresh:function(){this._setOptionDisabled(this.options.disabled),this._setupEvents(this.options.event),this._setupHeightStyle(this.options.heightStyle),this.tabs.not(this.active).attr({"aria-selected":"false","aria-expanded":"false",tabIndex:-1}),this.panels.not(this._getPanelForTab(this.active)).hide().attr({"aria-hidden":"true"}),this.active.length?(this.active.attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0}),this._addClass(this.active,"ui-tabs-active","ui-state-active"),this._getPanelForTab(this.active).show().attr({"aria-hidden":"false"})):this.tabs.eq(0).attr("tabIndex",0)},_processTabs:function(){var e=this,i=this.tabs,s=this.anchors,n=this.panels;this.tablist=this._getList().attr("role","tablist"),this._addClass(this.tablist,"ui-tabs-nav","ui-helper-reset ui-helper-clearfix ui-widget-header"),this.tablist.on("mousedown"+this.eventNamespace,"> li",function(e){t(this).is(".ui-state-disabled")&&e.preventDefault()}).on("focus"+this.eventNamespace,".ui-tabs-anchor",function(){t(this).closest("li").is(".ui-state-disabled")&&this.blur()}),this.tabs=this.tablist.find("> li:has(a[href])").attr({role:"tab",tabIndex:-1}),this._addClass(this.tabs,"ui-tabs-tab","ui-state-default"),this.anchors=this.tabs.map(function(){return t("a",this)[0]}).attr({role:"presentation",tabIndex:-1}),this._addClass(this.anchors,"ui-tabs-anchor"),this.panels=t(),this.anchors.each(function(i,s){var n,o,a,r=t(s).uniqueId().attr("id"),h=t(s).closest("li"),l=h.attr("aria-controls");e._isLocal(s)?(n=s.hash,a=n.substring(1),o=e.element.find(e._sanitizeSelector(n))):(a=h.attr("aria-controls")||t({}).uniqueId()[0].id,n="#"+a,o=e.element.find(n),o.length||(o=e._createPanel(a),o.insertAfter(e.panels[i-1]||e.tablist)),o.attr("aria-live","polite")),o.length&&(e.panels=e.panels.add(o)),l&&h.data("ui-tabs-aria-controls",l),h.attr({"aria-controls":a,"aria-labelledby":r}),o.attr("aria-labelledby",r)}),this.panels.attr("role","tabpanel"),this._addClass(this.panels,"ui-tabs-panel","ui-widget-content"),i&&(this._off(i.not(this.tabs)),this._off(s.not(this.anchors)),this._off(n.not(this.panels)))},_getList:function(){return this.tablist||this.element.find("ol, ul").eq(0)},_createPanel:function(e){return t("<div>").attr("id",e).data("ui-tabs-destroy",!0)},_setOptionDisabled:function(e){var i,s,n;for(t.isArray(e)&&(e.length?e.length===this.anchors.length&&(e=!0):e=!1),n=0;s=this.tabs[n];n++)i=t(s),e===!0||-1!==t.inArray(n,e)?(i.attr("aria-disabled","true"),this._addClass(i,null,"ui-state-disabled")):(i.removeAttr("aria-disabled"),this._removeClass(i,null,"ui-state-disabled"));this.options.disabled=e,this._toggleClass(this.widget(),this.widgetFullName+"-disabled",null,e===!0)},_setupEvents:function(e){var i={};e&&t.each(e.split(" "),function(t,e){i[e]="_eventHandler"}),this._off(this.anchors.add(this.tabs).add(this.panels)),this._on(!0,this.anchors,{click:function(t){t.preventDefault()}}),this._on(this.anchors,i),this._on(this.tabs,{keydown:"_tabKeydown"}),this._on(this.panels,{keydown:"_panelKeydown"}),this._focusable(this.tabs),this._hoverable(this.tabs)},_setupHeightStyle:function(e){var i,s=this.element.parent();"fill"===e?(i=s.height(),i-=this.element.outerHeight()-this.element.height(),this.element.siblings(":visible").each(function(){var e=t(this),s=e.css("position");"absolute"!==s&&"fixed"!==s&&(i-=e.outerHeight(!0))}),this.element.children().not(this.panels).each(function(){i-=t(this).outerHeight(!0)}),this.panels.each(function(){t(this).height(Math.max(0,i-t(this).innerHeight()+t(this).height()))}).css("overflow","auto")):"auto"===e&&(i=0,this.panels.each(function(){i=Math.max(i,t(this).height("").height())}).height(i))},_eventHandler:function(e){var i=this.options,s=this.active,n=t(e.currentTarget),o=n.closest("li"),a=o[0]===s[0],r=a&&i.collapsible,h=r?t():this._getPanelForTab(o),l=s.length?this._getPanelForTab(s):t(),c={oldTab:s,oldPanel:l,newTab:r?t():o,newPanel:h};e.preventDefault(),o.hasClass("ui-state-disabled")||o.hasClass("ui-tabs-loading")||this.running||a&&!i.collapsible||this._trigger("beforeActivate",e,c)===!1||(i.active=r?!1:this.tabs.index(o),this.active=a?t():o,this.xhr&&this.xhr.abort(),l.length||h.length||t.error("jQuery UI Tabs: Mismatching fragment identifier."),h.length&&this.load(this.tabs.index(o),e),this._toggle(e,c))},_toggle:function(e,i){function s(){o.running=!1,o._trigger("activate",e,i)}function n(){o._addClass(i.newTab.closest("li"),"ui-tabs-active","ui-state-active"),a.length&&o.options.show?o._show(a,o.options.show,s):(a.show(),s())}var o=this,a=i.newPanel,r=i.oldPanel;this.running=!0,r.length&&this.options.hide?this._hide(r,this.options.hide,function(){o._removeClass(i.oldTab.closest("li"),"ui-tabs-active","ui-state-active"),n()}):(this._removeClass(i.oldTab.closest("li"),"ui-tabs-active","ui-state-active"),r.hide(),n()),r.attr("aria-hidden","true"),i.oldTab.attr({"aria-selected":"false","aria-expanded":"false"}),a.length&&r.length?i.oldTab.attr("tabIndex",-1):a.length&&this.tabs.filter(function(){return 0===t(this).attr("tabIndex")}).attr("tabIndex",-1),a.attr("aria-hidden","false"),i.newTab.attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0})},_activate:function(e){var i,s=this._findActive(e);s[0]!==this.active[0]&&(s.length||(s=this.active),i=s.find(".ui-tabs-anchor")[0],this._eventHandler({target:i,currentTarget:i,preventDefault:t.noop}))},_findActive:function(e){return e===!1?t():this.tabs.eq(e)},_getIndex:function(e){return"string"==typeof e&&(e=this.anchors.index(this.anchors.filter("[href$='"+t.ui.escapeSelector(e)+"']"))),e},_destroy:function(){this.xhr&&this.xhr.abort(),this.tablist.removeAttr("role").off(this.eventNamespace),this.anchors.removeAttr("role tabIndex").removeUniqueId(),this.tabs.add(this.panels).each(function(){t.data(this,"ui-tabs-destroy")?t(this).remove():t(this).removeAttr("role tabIndex aria-live aria-busy aria-selected aria-labelledby aria-hidden aria-expanded")}),this.tabs.each(function(){var e=t(this),i=e.data("ui-tabs-aria-controls");i?e.attr("aria-controls",i).removeData("ui-tabs-aria-controls"):e.removeAttr("aria-controls")}),this.panels.show(),"content"!==this.options.heightStyle&&this.panels.css("height","")},enable:function(e){var i=this.options.disabled;i!==!1&&(void 0===e?i=!1:(e=this._getIndex(e),i=t.isArray(i)?t.map(i,function(t){return t!==e?t:null}):t.map(this.tabs,function(t,i){return i!==e?i:null})),this._setOptionDisabled(i))},disable:function(e){var i=this.options.disabled;if(i!==!0){if(void 0===e)i=!0;else{if(e=this._getIndex(e),-1!==t.inArray(e,i))return;i=t.isArray(i)?t.merge([e],i).sort():[e]}this._setOptionDisabled(i)}},load:function(e,i){e=this._getIndex(e);var s=this,n=this.tabs.eq(e),o=n.find(".ui-tabs-anchor"),a=this._getPanelForTab(n),r={tab:n,panel:a},h=function(t,e){"abort"===e&&s.panels.stop(!1,!0),s._removeClass(n,"ui-tabs-loading"),a.removeAttr("aria-busy"),t===s.xhr&&delete s.xhr};this._isLocal(o[0])||(this.xhr=t.ajax(this._ajaxSettings(o,i,r)),this.xhr&&"canceled"!==this.xhr.statusText&&(this._addClass(n,"ui-tabs-loading"),a.attr("aria-busy","true"),this.xhr.done(function(t,e,n){setTimeout(function(){a.html(t),s._trigger("load",i,r),h(n,e)},1)}).fail(function(t,e){setTimeout(function(){h(t,e)},1)})))},_ajaxSettings:function(e,i,s){var n=this;return{url:e.attr("href").replace(/#.*$/,""),beforeSend:function(e,o){return n._trigger("beforeLoad",i,t.extend({jqXHR:e,ajaxSettings:o},s))}}},_getPanelForTab:function(e){var i=t(e).attr("aria-controls");return this.element.find(this._sanitizeSelector("#"+i))}}),t.uiBackCompat!==!1&&t.widget("ui.tabs",t.ui.tabs,{_processTabs:function(){this._superApply(arguments),this._addClass(this.tabs,"ui-tab")}}),t.ui.tabs,t.widget("ui.tooltip",{version:"1.12.1",options:{classes:{"ui-tooltip":"ui-corner-all ui-widget-shadow"},content:function(){var e=t(this).attr("title")||"";return t("<a>").text(e).html()},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,track:!1,close:null,open:null},_addDescribedBy:function(e,i){var s=(e.attr("aria-describedby")||"").split(/\s+/);s.push(i),e.data("ui-tooltip-id",i).attr("aria-describedby",t.trim(s.join(" ")))},_removeDescribedBy:function(e){var i=e.data("ui-tooltip-id"),s=(e.attr("aria-describedby")||"").split(/\s+/),n=t.inArray(i,s);-1!==n&&s.splice(n,1),e.removeData("ui-tooltip-id"),s=t.trim(s.join(" ")),s?e.attr("aria-describedby",s):e.removeAttr("aria-describedby")},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.liveRegion=t("<div>").attr({role:"log","aria-live":"assertive","aria-relevant":"additions"}).appendTo(this.document[0].body),this._addClass(this.liveRegion,null,"ui-helper-hidden-accessible"),this.disabledTitles=t([])},_setOption:function(e,i){var s=this;this._super(e,i),"content"===e&&t.each(this.tooltips,function(t,e){s._updateContent(e.element)})},_setOptionDisabled:function(t){this[t?"_disable":"_enable"]()},_disable:function(){var e=this;t.each(this.tooltips,function(i,s){var n=t.Event("blur");n.target=n.currentTarget=s.element[0],e.close(n,!0)}),this.disabledTitles=this.disabledTitles.add(this.element.find(this.options.items).addBack().filter(function(){var e=t(this);return e.is("[title]")?e.data("ui-tooltip-title",e.attr("title")).removeAttr("title"):void 0}))},_enable:function(){this.disabledTitles.each(function(){var e=t(this);e.data("ui-tooltip-title")&&e.attr("title",e.data("ui-tooltip-title"))}),this.disabledTitles=t([])},open:function(e){var i=this,s=t(e?e.target:this.element).closest(this.options.items);s.length&&!s.data("ui-tooltip-id")&&(s.attr("title")&&s.data("ui-tooltip-title",s.attr("title")),s.data("ui-tooltip-open",!0),e&&"mouseover"===e.type&&s.parents().each(function(){var e,s=t(this);s.data("ui-tooltip-open")&&(e=t.Event("blur"),e.target=e.currentTarget=this,i.close(e,!0)),s.attr("title")&&(s.uniqueId(),i.parents[this.id]={element:this,title:s.attr("title")},s.attr("title",""))}),this._registerCloseHandlers(e,s),this._updateContent(s,e))},_updateContent:function(t,e){var i,s=this.options.content,n=this,o=e?e.type:null;return"string"==typeof s||s.nodeType||s.jquery?this._open(e,t,s):(i=s.call(t[0],function(i){n._delay(function(){t.data("ui-tooltip-open")&&(e&&(e.type=o),this._open(e,t,i))})}),i&&this._open(e,t,i),void 0)},_open:function(e,i,s){function n(t){l.of=t,a.is(":hidden")||a.position(l)}var o,a,r,h,l=t.extend({},this.options.position);if(s){if(o=this._find(i))return o.tooltip.find(".ui-tooltip-content").html(s),void 0;i.is("[title]")&&(e&&"mouseover"===e.type?i.attr("title",""):i.removeAttr("title")),o=this._tooltip(i),a=o.tooltip,this._addDescribedBy(i,a.attr("id")),a.find(".ui-tooltip-content").html(s),this.liveRegion.children().hide(),h=t("<div>").html(a.find(".ui-tooltip-content").html()),h.removeAttr("name").find("[name]").removeAttr("name"),h.removeAttr("id").find("[id]").removeAttr("id"),h.appendTo(this.liveRegion),this.options.track&&e&&/^mouse/.test(e.type)?(this._on(this.document,{mousemove:n}),n(e)):a.position(t.extend({of:i},this.options.position)),a.hide(),this._show(a,this.options.show),this.options.track&&this.options.show&&this.options.show.delay&&(r=this.delayedShow=setInterval(function(){a.is(":visible")&&(n(l.of),clearInterval(r))},t.fx.interval)),this._trigger("open",e,{tooltip:a})}},_registerCloseHandlers:function(e,i){var s={keyup:function(e){if(e.keyCode===t.ui.keyCode.ESCAPE){var s=t.Event(e);s.currentTarget=i[0],this.close(s,!0)}}};i[0]!==this.element[0]&&(s.remove=function(){this._removeTooltip(this._find(i).tooltip)}),e&&"mouseover"!==e.type||(s.mouseleave="close"),e&&"focusin"!==e.type||(s.focusout="close"),this._on(!0,i,s)},close:function(e){var i,s=this,n=t(e?e.currentTarget:this.element),o=this._find(n);return o?(i=o.tooltip,o.closing||(clearInterval(this.delayedShow),n.data("ui-tooltip-title")&&!n.attr("title")&&n.attr("title",n.data("ui-tooltip-title")),this._removeDescribedBy(n),o.hiding=!0,i.stop(!0),this._hide(i,this.options.hide,function(){s._removeTooltip(t(this))}),n.removeData("ui-tooltip-open"),this._off(n,"mouseleave focusout keyup"),n[0]!==this.element[0]&&this._off(n,"remove"),this._off(this.document,"mousemove"),e&&"mouseleave"===e.type&&t.each(this.parents,function(e,i){t(i.element).attr("title",i.title),delete s.parents[e]
}),o.closing=!0,this._trigger("close",e,{tooltip:i}),o.hiding||(o.closing=!1)),void 0):(n.removeData("ui-tooltip-open"),void 0)},_tooltip:function(e){var i=t("<div>").attr("role","tooltip"),s=t("<div>").appendTo(i),n=i.uniqueId().attr("id");return this._addClass(s,"ui-tooltip-content"),this._addClass(i,"ui-tooltip","ui-widget ui-widget-content"),i.appendTo(this._appendTo(e)),this.tooltips[n]={element:e,tooltip:i}},_find:function(t){var e=t.data("ui-tooltip-id");return e?this.tooltips[e]:null},_removeTooltip:function(t){t.remove(),delete this.tooltips[t.attr("id")]},_appendTo:function(t){var e=t.closest(".ui-front, dialog");return e.length||(e=this.document[0].body),e},_destroy:function(){var e=this;t.each(this.tooltips,function(i,s){var n=t.Event("blur"),o=s.element;n.target=n.currentTarget=o[0],e.close(n,!0),t("#"+i).remove(),o.data("ui-tooltip-title")&&(o.attr("title")||o.attr("title",o.data("ui-tooltip-title")),o.removeData("ui-tooltip-title"))}),this.liveRegion.remove()}}),t.uiBackCompat!==!1&&t.widget("ui.tooltip",t.ui.tooltip,{options:{tooltipClass:null},_tooltip:function(){var t=this._superApply(arguments);return this.options.tooltipClass&&t.tooltip.addClass(this.options.tooltipClass),t}}),t.ui.tooltip;var f="ui-effects-",g="ui-effects-style",m="ui-effects-animated",_=t;t.effects={effect:{}},function(t,e){function i(t,e,i){var s=u[e.type]||{};return null==t?i||!e.def?null:e.def:(t=s.floor?~~t:parseFloat(t),isNaN(t)?e.def:s.mod?(t+s.mod)%s.mod:0>t?0:t>s.max?s.max:t)}function s(i){var s=l(),n=s._rgba=[];return i=i.toLowerCase(),f(h,function(t,o){var a,r=o.re.exec(i),h=r&&o.parse(r),l=o.space||"rgba";return h?(a=s[l](h),s[c[l].cache]=a[c[l].cache],n=s._rgba=a._rgba,!1):e}),n.length?("0,0,0,0"===n.join()&&t.extend(n,o.transparent),s):o[i]}function n(t,e,i){return i=(i+1)%1,1>6*i?t+6*(e-t)*i:1>2*i?e:2>3*i?t+6*(e-t)*(2/3-i):t}var o,a="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",r=/^([\-+])=\s*(\d+\.?\d*)/,h=[{re:/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,parse:function(t){return[t[1],t[2],t[3],t[4]]}},{re:/rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,parse:function(t){return[2.55*t[1],2.55*t[2],2.55*t[3],t[4]]}},{re:/#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,parse:function(t){return[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]}},{re:/#([a-f0-9])([a-f0-9])([a-f0-9])/,parse:function(t){return[parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16),parseInt(t[3]+t[3],16)]}},{re:/hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,space:"hsla",parse:function(t){return[t[1],t[2]/100,t[3]/100,t[4]]}}],l=t.Color=function(e,i,s,n){return new t.Color.fn.parse(e,i,s,n)},c={rgba:{props:{red:{idx:0,type:"byte"},green:{idx:1,type:"byte"},blue:{idx:2,type:"byte"}}},hsla:{props:{hue:{idx:0,type:"degrees"},saturation:{idx:1,type:"percent"},lightness:{idx:2,type:"percent"}}}},u={"byte":{floor:!0,max:255},percent:{max:1},degrees:{mod:360,floor:!0}},d=l.support={},p=t("<p>")[0],f=t.each;p.style.cssText="background-color:rgba(1,1,1,.5)",d.rgba=p.style.backgroundColor.indexOf("rgba")>-1,f(c,function(t,e){e.cache="_"+t,e.props.alpha={idx:3,type:"percent",def:1}}),l.fn=t.extend(l.prototype,{parse:function(n,a,r,h){if(n===e)return this._rgba=[null,null,null,null],this;(n.jquery||n.nodeType)&&(n=t(n).css(a),a=e);var u=this,d=t.type(n),p=this._rgba=[];return a!==e&&(n=[n,a,r,h],d="array"),"string"===d?this.parse(s(n)||o._default):"array"===d?(f(c.rgba.props,function(t,e){p[e.idx]=i(n[e.idx],e)}),this):"object"===d?(n instanceof l?f(c,function(t,e){n[e.cache]&&(u[e.cache]=n[e.cache].slice())}):f(c,function(e,s){var o=s.cache;f(s.props,function(t,e){if(!u[o]&&s.to){if("alpha"===t||null==n[t])return;u[o]=s.to(u._rgba)}u[o][e.idx]=i(n[t],e,!0)}),u[o]&&0>t.inArray(null,u[o].slice(0,3))&&(u[o][3]=1,s.from&&(u._rgba=s.from(u[o])))}),this):e},is:function(t){var i=l(t),s=!0,n=this;return f(c,function(t,o){var a,r=i[o.cache];return r&&(a=n[o.cache]||o.to&&o.to(n._rgba)||[],f(o.props,function(t,i){return null!=r[i.idx]?s=r[i.idx]===a[i.idx]:e})),s}),s},_space:function(){var t=[],e=this;return f(c,function(i,s){e[s.cache]&&t.push(i)}),t.pop()},transition:function(t,e){var s=l(t),n=s._space(),o=c[n],a=0===this.alpha()?l("transparent"):this,r=a[o.cache]||o.to(a._rgba),h=r.slice();return s=s[o.cache],f(o.props,function(t,n){var o=n.idx,a=r[o],l=s[o],c=u[n.type]||{};null!==l&&(null===a?h[o]=l:(c.mod&&(l-a>c.mod/2?a+=c.mod:a-l>c.mod/2&&(a-=c.mod)),h[o]=i((l-a)*e+a,n)))}),this[n](h)},blend:function(e){if(1===this._rgba[3])return this;var i=this._rgba.slice(),s=i.pop(),n=l(e)._rgba;return l(t.map(i,function(t,e){return(1-s)*n[e]+s*t}))},toRgbaString:function(){var e="rgba(",i=t.map(this._rgba,function(t,e){return null==t?e>2?1:0:t});return 1===i[3]&&(i.pop(),e="rgb("),e+i.join()+")"},toHslaString:function(){var e="hsla(",i=t.map(this.hsla(),function(t,e){return null==t&&(t=e>2?1:0),e&&3>e&&(t=Math.round(100*t)+"%"),t});return 1===i[3]&&(i.pop(),e="hsl("),e+i.join()+")"},toHexString:function(e){var i=this._rgba.slice(),s=i.pop();return e&&i.push(~~(255*s)),"#"+t.map(i,function(t){return t=(t||0).toString(16),1===t.length?"0"+t:t}).join("")},toString:function(){return 0===this._rgba[3]?"transparent":this.toRgbaString()}}),l.fn.parse.prototype=l.fn,c.hsla.to=function(t){if(null==t[0]||null==t[1]||null==t[2])return[null,null,null,t[3]];var e,i,s=t[0]/255,n=t[1]/255,o=t[2]/255,a=t[3],r=Math.max(s,n,o),h=Math.min(s,n,o),l=r-h,c=r+h,u=.5*c;return e=h===r?0:s===r?60*(n-o)/l+360:n===r?60*(o-s)/l+120:60*(s-n)/l+240,i=0===l?0:.5>=u?l/c:l/(2-c),[Math.round(e)%360,i,u,null==a?1:a]},c.hsla.from=function(t){if(null==t[0]||null==t[1]||null==t[2])return[null,null,null,t[3]];var e=t[0]/360,i=t[1],s=t[2],o=t[3],a=.5>=s?s*(1+i):s+i-s*i,r=2*s-a;return[Math.round(255*n(r,a,e+1/3)),Math.round(255*n(r,a,e)),Math.round(255*n(r,a,e-1/3)),o]},f(c,function(s,n){var o=n.props,a=n.cache,h=n.to,c=n.from;l.fn[s]=function(s){if(h&&!this[a]&&(this[a]=h(this._rgba)),s===e)return this[a].slice();var n,r=t.type(s),u="array"===r||"object"===r?s:arguments,d=this[a].slice();return f(o,function(t,e){var s=u["object"===r?t:e.idx];null==s&&(s=d[e.idx]),d[e.idx]=i(s,e)}),c?(n=l(c(d)),n[a]=d,n):l(d)},f(o,function(e,i){l.fn[e]||(l.fn[e]=function(n){var o,a=t.type(n),h="alpha"===e?this._hsla?"hsla":"rgba":s,l=this[h](),c=l[i.idx];return"undefined"===a?c:("function"===a&&(n=n.call(this,c),a=t.type(n)),null==n&&i.empty?this:("string"===a&&(o=r.exec(n),o&&(n=c+parseFloat(o[2])*("+"===o[1]?1:-1))),l[i.idx]=n,this[h](l)))})})}),l.hook=function(e){var i=e.split(" ");f(i,function(e,i){t.cssHooks[i]={set:function(e,n){var o,a,r="";if("transparent"!==n&&("string"!==t.type(n)||(o=s(n)))){if(n=l(o||n),!d.rgba&&1!==n._rgba[3]){for(a="backgroundColor"===i?e.parentNode:e;(""===r||"transparent"===r)&&a&&a.style;)try{r=t.css(a,"backgroundColor"),a=a.parentNode}catch(h){}n=n.blend(r&&"transparent"!==r?r:"_default")}n=n.toRgbaString()}try{e.style[i]=n}catch(h){}}},t.fx.step[i]=function(e){e.colorInit||(e.start=l(e.elem,i),e.end=l(e.end),e.colorInit=!0),t.cssHooks[i].set(e.elem,e.start.transition(e.end,e.pos))}})},l.hook(a),t.cssHooks.borderColor={expand:function(t){var e={};return f(["Top","Right","Bottom","Left"],function(i,s){e["border"+s+"Color"]=t}),e}},o=t.Color.names={aqua:"#00ffff",black:"#000000",blue:"#0000ff",fuchsia:"#ff00ff",gray:"#808080",green:"#008000",lime:"#00ff00",maroon:"#800000",navy:"#000080",olive:"#808000",purple:"#800080",red:"#ff0000",silver:"#c0c0c0",teal:"#008080",white:"#ffffff",yellow:"#ffff00",transparent:[null,null,null,0],_default:"#ffffff"}}(_),function(){function e(e){var i,s,n=e.ownerDocument.defaultView?e.ownerDocument.defaultView.getComputedStyle(e,null):e.currentStyle,o={};if(n&&n.length&&n[0]&&n[n[0]])for(s=n.length;s--;)i=n[s],"string"==typeof n[i]&&(o[t.camelCase(i)]=n[i]);else for(i in n)"string"==typeof n[i]&&(o[i]=n[i]);return o}function i(e,i){var s,o,a={};for(s in i)o=i[s],e[s]!==o&&(n[s]||(t.fx.step[s]||!isNaN(parseFloat(o)))&&(a[s]=o));return a}var s=["add","remove","toggle"],n={border:1,borderBottom:1,borderColor:1,borderLeft:1,borderRight:1,borderTop:1,borderWidth:1,margin:1,padding:1};t.each(["borderLeftStyle","borderRightStyle","borderBottomStyle","borderTopStyle"],function(e,i){t.fx.step[i]=function(t){("none"!==t.end&&!t.setAttr||1===t.pos&&!t.setAttr)&&(_.style(t.elem,i,t.end),t.setAttr=!0)}}),t.fn.addBack||(t.fn.addBack=function(t){return this.add(null==t?this.prevObject:this.prevObject.filter(t))}),t.effects.animateClass=function(n,o,a,r){var h=t.speed(o,a,r);return this.queue(function(){var o,a=t(this),r=a.attr("class")||"",l=h.children?a.find("*").addBack():a;l=l.map(function(){var i=t(this);return{el:i,start:e(this)}}),o=function(){t.each(s,function(t,e){n[e]&&a[e+"Class"](n[e])})},o(),l=l.map(function(){return this.end=e(this.el[0]),this.diff=i(this.start,this.end),this}),a.attr("class",r),l=l.map(function(){var e=this,i=t.Deferred(),s=t.extend({},h,{queue:!1,complete:function(){i.resolve(e)}});return this.el.animate(this.diff,s),i.promise()}),t.when.apply(t,l.get()).done(function(){o(),t.each(arguments,function(){var e=this.el;t.each(this.diff,function(t){e.css(t,"")})}),h.complete.call(a[0])})})},t.fn.extend({addClass:function(e){return function(i,s,n,o){return s?t.effects.animateClass.call(this,{add:i},s,n,o):e.apply(this,arguments)}}(t.fn.addClass),removeClass:function(e){return function(i,s,n,o){return arguments.length>1?t.effects.animateClass.call(this,{remove:i},s,n,o):e.apply(this,arguments)}}(t.fn.removeClass),toggleClass:function(e){return function(i,s,n,o,a){return"boolean"==typeof s||void 0===s?n?t.effects.animateClass.call(this,s?{add:i}:{remove:i},n,o,a):e.apply(this,arguments):t.effects.animateClass.call(this,{toggle:i},s,n,o)}}(t.fn.toggleClass),switchClass:function(e,i,s,n,o){return t.effects.animateClass.call(this,{add:i,remove:e},s,n,o)}})}(),function(){function e(e,i,s,n){return t.isPlainObject(e)&&(i=e,e=e.effect),e={effect:e},null==i&&(i={}),t.isFunction(i)&&(n=i,s=null,i={}),("number"==typeof i||t.fx.speeds[i])&&(n=s,s=i,i={}),t.isFunction(s)&&(n=s,s=null),i&&t.extend(e,i),s=s||i.duration,e.duration=t.fx.off?0:"number"==typeof s?s:s in t.fx.speeds?t.fx.speeds[s]:t.fx.speeds._default,e.complete=n||i.complete,e}function i(e){return!e||"number"==typeof e||t.fx.speeds[e]?!0:"string"!=typeof e||t.effects.effect[e]?t.isFunction(e)?!0:"object"!=typeof e||e.effect?!1:!0:!0}function s(t,e){var i=e.outerWidth(),s=e.outerHeight(),n=/^rect\((-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto)\)$/,o=n.exec(t)||["",0,i,s,0];return{top:parseFloat(o[1])||0,right:"auto"===o[2]?i:parseFloat(o[2]),bottom:"auto"===o[3]?s:parseFloat(o[3]),left:parseFloat(o[4])||0}}t.expr&&t.expr.filters&&t.expr.filters.animated&&(t.expr.filters.animated=function(e){return function(i){return!!t(i).data(m)||e(i)}}(t.expr.filters.animated)),t.uiBackCompat!==!1&&t.extend(t.effects,{save:function(t,e){for(var i=0,s=e.length;s>i;i++)null!==e[i]&&t.data(f+e[i],t[0].style[e[i]])},restore:function(t,e){for(var i,s=0,n=e.length;n>s;s++)null!==e[s]&&(i=t.data(f+e[s]),t.css(e[s],i))},setMode:function(t,e){return"toggle"===e&&(e=t.is(":hidden")?"show":"hide"),e},createWrapper:function(e){if(e.parent().is(".ui-effects-wrapper"))return e.parent();var i={width:e.outerWidth(!0),height:e.outerHeight(!0),"float":e.css("float")},s=t("<div></div>").addClass("ui-effects-wrapper").css({fontSize:"100%",background:"transparent",border:"none",margin:0,padding:0}),n={width:e.width(),height:e.height()},o=document.activeElement;try{o.id}catch(a){o=document.body}return e.wrap(s),(e[0]===o||t.contains(e[0],o))&&t(o).trigger("focus"),s=e.parent(),"static"===e.css("position")?(s.css({position:"relative"}),e.css({position:"relative"})):(t.extend(i,{position:e.css("position"),zIndex:e.css("z-index")}),t.each(["top","left","bottom","right"],function(t,s){i[s]=e.css(s),isNaN(parseInt(i[s],10))&&(i[s]="auto")}),e.css({position:"relative",top:0,left:0,right:"auto",bottom:"auto"})),e.css(n),s.css(i).show()},removeWrapper:function(e){var i=document.activeElement;return e.parent().is(".ui-effects-wrapper")&&(e.parent().replaceWith(e),(e[0]===i||t.contains(e[0],i))&&t(i).trigger("focus")),e}}),t.extend(t.effects,{version:"1.12.1",define:function(e,i,s){return s||(s=i,i="effect"),t.effects.effect[e]=s,t.effects.effect[e].mode=i,s},scaledDimensions:function(t,e,i){if(0===e)return{height:0,width:0,outerHeight:0,outerWidth:0};var s="horizontal"!==i?(e||100)/100:1,n="vertical"!==i?(e||100)/100:1;return{height:t.height()*n,width:t.width()*s,outerHeight:t.outerHeight()*n,outerWidth:t.outerWidth()*s}},clipToBox:function(t){return{width:t.clip.right-t.clip.left,height:t.clip.bottom-t.clip.top,left:t.clip.left,top:t.clip.top}},unshift:function(t,e,i){var s=t.queue();e>1&&s.splice.apply(s,[1,0].concat(s.splice(e,i))),t.dequeue()},saveStyle:function(t){t.data(g,t[0].style.cssText)},restoreStyle:function(t){t[0].style.cssText=t.data(g)||"",t.removeData(g)},mode:function(t,e){var i=t.is(":hidden");return"toggle"===e&&(e=i?"show":"hide"),(i?"hide"===e:"show"===e)&&(e="none"),e},getBaseline:function(t,e){var i,s;switch(t[0]){case"top":i=0;break;case"middle":i=.5;break;case"bottom":i=1;break;default:i=t[0]/e.height}switch(t[1]){case"left":s=0;break;case"center":s=.5;break;case"right":s=1;break;default:s=t[1]/e.width}return{x:s,y:i}},createPlaceholder:function(e){var i,s=e.css("position"),n=e.position();return e.css({marginTop:e.css("marginTop"),marginBottom:e.css("marginBottom"),marginLeft:e.css("marginLeft"),marginRight:e.css("marginRight")}).outerWidth(e.outerWidth()).outerHeight(e.outerHeight()),/^(static|relative)/.test(s)&&(s="absolute",i=t("<"+e[0].nodeName+">").insertAfter(e).css({display:/^(inline|ruby)/.test(e.css("display"))?"inline-block":"block",visibility:"hidden",marginTop:e.css("marginTop"),marginBottom:e.css("marginBottom"),marginLeft:e.css("marginLeft"),marginRight:e.css("marginRight"),"float":e.css("float")}).outerWidth(e.outerWidth()).outerHeight(e.outerHeight()).addClass("ui-effects-placeholder"),e.data(f+"placeholder",i)),e.css({position:s,left:n.left,top:n.top}),i},removePlaceholder:function(t){var e=f+"placeholder",i=t.data(e);i&&(i.remove(),t.removeData(e))},cleanUp:function(e){t.effects.restoreStyle(e),t.effects.removePlaceholder(e)},setTransition:function(e,i,s,n){return n=n||{},t.each(i,function(t,i){var o=e.cssUnit(i);o[0]>0&&(n[i]=o[0]*s+o[1])}),n}}),t.fn.extend({effect:function(){function i(e){function i(){r.removeData(m),t.effects.cleanUp(r),"hide"===s.mode&&r.hide(),a()}function a(){t.isFunction(h)&&h.call(r[0]),t.isFunction(e)&&e()}var r=t(this);s.mode=c.shift(),t.uiBackCompat===!1||o?"none"===s.mode?(r[l](),a()):n.call(r[0],s,i):(r.is(":hidden")?"hide"===l:"show"===l)?(r[l](),a()):n.call(r[0],s,a)}var s=e.apply(this,arguments),n=t.effects.effect[s.effect],o=n.mode,a=s.queue,r=a||"fx",h=s.complete,l=s.mode,c=[],u=function(e){var i=t(this),s=t.effects.mode(i,l)||o;i.data(m,!0),c.push(s),o&&("show"===s||s===o&&"hide"===s)&&i.show(),o&&"none"===s||t.effects.saveStyle(i),t.isFunction(e)&&e()};return t.fx.off||!n?l?this[l](s.duration,h):this.each(function(){h&&h.call(this)}):a===!1?this.each(u).each(i):this.queue(r,u).queue(r,i)},show:function(t){return function(s){if(i(s))return t.apply(this,arguments);var n=e.apply(this,arguments);return n.mode="show",this.effect.call(this,n)}}(t.fn.show),hide:function(t){return function(s){if(i(s))return t.apply(this,arguments);var n=e.apply(this,arguments);return n.mode="hide",this.effect.call(this,n)}}(t.fn.hide),toggle:function(t){return function(s){if(i(s)||"boolean"==typeof s)return t.apply(this,arguments);var n=e.apply(this,arguments);return n.mode="toggle",this.effect.call(this,n)}}(t.fn.toggle),cssUnit:function(e){var i=this.css(e),s=[];return t.each(["em","px","%","pt"],function(t,e){i.indexOf(e)>0&&(s=[parseFloat(i),e])}),s},cssClip:function(t){return t?this.css("clip","rect("+t.top+"px "+t.right+"px "+t.bottom+"px "+t.left+"px)"):s(this.css("clip"),this)},transfer:function(e,i){var s=t(this),n=t(e.to),o="fixed"===n.css("position"),a=t("body"),r=o?a.scrollTop():0,h=o?a.scrollLeft():0,l=n.offset(),c={top:l.top-r,left:l.left-h,height:n.innerHeight(),width:n.innerWidth()},u=s.offset(),d=t("<div class='ui-effects-transfer'></div>").appendTo("body").addClass(e.className).css({top:u.top-r,left:u.left-h,height:s.innerHeight(),width:s.innerWidth(),position:o?"fixed":"absolute"}).animate(c,e.duration,e.easing,function(){d.remove(),t.isFunction(i)&&i()})}}),t.fx.step.clip=function(e){e.clipInit||(e.start=t(e.elem).cssClip(),"string"==typeof e.end&&(e.end=s(e.end,e.elem)),e.clipInit=!0),t(e.elem).cssClip({top:e.pos*(e.end.top-e.start.top)+e.start.top,right:e.pos*(e.end.right-e.start.right)+e.start.right,bottom:e.pos*(e.end.bottom-e.start.bottom)+e.start.bottom,left:e.pos*(e.end.left-e.start.left)+e.start.left})}}(),function(){var e={};t.each(["Quad","Cubic","Quart","Quint","Expo"],function(t,i){e[i]=function(e){return Math.pow(e,t+2)}}),t.extend(e,{Sine:function(t){return 1-Math.cos(t*Math.PI/2)},Circ:function(t){return 1-Math.sqrt(1-t*t)},Elastic:function(t){return 0===t||1===t?t:-Math.pow(2,8*(t-1))*Math.sin((80*(t-1)-7.5)*Math.PI/15)},Back:function(t){return t*t*(3*t-2)},Bounce:function(t){for(var e,i=4;((e=Math.pow(2,--i))-1)/11>t;);return 1/Math.pow(4,3-i)-7.5625*Math.pow((3*e-2)/22-t,2)}}),t.each(e,function(e,i){t.easing["easeIn"+e]=i,t.easing["easeOut"+e]=function(t){return 1-i(1-t)},t.easing["easeInOut"+e]=function(t){return.5>t?i(2*t)/2:1-i(-2*t+2)/2}})}();var v=t.effects;t.effects.define("blind","hide",function(e,i){var s={up:["bottom","top"],vertical:["bottom","top"],down:["top","bottom"],left:["right","left"],horizontal:["right","left"],right:["left","right"]},n=t(this),o=e.direction||"up",a=n.cssClip(),r={clip:t.extend({},a)},h=t.effects.createPlaceholder(n);r.clip[s[o][0]]=r.clip[s[o][1]],"show"===e.mode&&(n.cssClip(r.clip),h&&h.css(t.effects.clipToBox(r)),r.clip=a),h&&h.animate(t.effects.clipToBox(r),e.duration,e.easing),n.animate(r,{queue:!1,duration:e.duration,easing:e.easing,complete:i})}),t.effects.define("bounce",function(e,i){var s,n,o,a=t(this),r=e.mode,h="hide"===r,l="show"===r,c=e.direction||"up",u=e.distance,d=e.times||5,p=2*d+(l||h?1:0),f=e.duration/p,g=e.easing,m="up"===c||"down"===c?"top":"left",_="up"===c||"left"===c,v=0,b=a.queue().length;for(t.effects.createPlaceholder(a),o=a.css(m),u||(u=a["top"===m?"outerHeight":"outerWidth"]()/3),l&&(n={opacity:1},n[m]=o,a.css("opacity",0).css(m,_?2*-u:2*u).animate(n,f,g)),h&&(u/=Math.pow(2,d-1)),n={},n[m]=o;d>v;v++)s={},s[m]=(_?"-=":"+=")+u,a.animate(s,f,g).animate(n,f,g),u=h?2*u:u/2;h&&(s={opacity:0},s[m]=(_?"-=":"+=")+u,a.animate(s,f,g)),a.queue(i),t.effects.unshift(a,b,p+1)}),t.effects.define("clip","hide",function(e,i){var s,n={},o=t(this),a=e.direction||"vertical",r="both"===a,h=r||"horizontal"===a,l=r||"vertical"===a;s=o.cssClip(),n.clip={top:l?(s.bottom-s.top)/2:s.top,right:h?(s.right-s.left)/2:s.right,bottom:l?(s.bottom-s.top)/2:s.bottom,left:h?(s.right-s.left)/2:s.left},t.effects.createPlaceholder(o),"show"===e.mode&&(o.cssClip(n.clip),n.clip=s),o.animate(n,{queue:!1,duration:e.duration,easing:e.easing,complete:i})}),t.effects.define("drop","hide",function(e,i){var s,n=t(this),o=e.mode,a="show"===o,r=e.direction||"left",h="up"===r||"down"===r?"top":"left",l="up"===r||"left"===r?"-=":"+=",c="+="===l?"-=":"+=",u={opacity:0};t.effects.createPlaceholder(n),s=e.distance||n["top"===h?"outerHeight":"outerWidth"](!0)/2,u[h]=l+s,a&&(n.css(u),u[h]=c+s,u.opacity=1),n.animate(u,{queue:!1,duration:e.duration,easing:e.easing,complete:i})}),t.effects.define("explode","hide",function(e,i){function s(){b.push(this),b.length===u*d&&n()}function n(){p.css({visibility:"visible"}),t(b).remove(),i()}var o,a,r,h,l,c,u=e.pieces?Math.round(Math.sqrt(e.pieces)):3,d=u,p=t(this),f=e.mode,g="show"===f,m=p.show().css("visibility","hidden").offset(),_=Math.ceil(p.outerWidth()/d),v=Math.ceil(p.outerHeight()/u),b=[];for(o=0;u>o;o++)for(h=m.top+o*v,c=o-(u-1)/2,a=0;d>a;a++)r=m.left+a*_,l=a-(d-1)/2,p.clone().appendTo("body").wrap("<div></div>").css({position:"absolute",visibility:"visible",left:-a*_,top:-o*v}).parent().addClass("ui-effects-explode").css({position:"absolute",overflow:"hidden",width:_,height:v,left:r+(g?l*_:0),top:h+(g?c*v:0),opacity:g?0:1}).animate({left:r+(g?0:l*_),top:h+(g?0:c*v),opacity:g?1:0},e.duration||500,e.easing,s)}),t.effects.define("fade","toggle",function(e,i){var s="show"===e.mode;t(this).css("opacity",s?0:1).animate({opacity:s?1:0},{queue:!1,duration:e.duration,easing:e.easing,complete:i})}),t.effects.define("fold","hide",function(e,i){var s=t(this),n=e.mode,o="show"===n,a="hide"===n,r=e.size||15,h=/([0-9]+)%/.exec(r),l=!!e.horizFirst,c=l?["right","bottom"]:["bottom","right"],u=e.duration/2,d=t.effects.createPlaceholder(s),p=s.cssClip(),f={clip:t.extend({},p)},g={clip:t.extend({},p)},m=[p[c[0]],p[c[1]]],_=s.queue().length;h&&(r=parseInt(h[1],10)/100*m[a?0:1]),f.clip[c[0]]=r,g.clip[c[0]]=r,g.clip[c[1]]=0,o&&(s.cssClip(g.clip),d&&d.css(t.effects.clipToBox(g)),g.clip=p),s.queue(function(i){d&&d.animate(t.effects.clipToBox(f),u,e.easing).animate(t.effects.clipToBox(g),u,e.easing),i()}).animate(f,u,e.easing).animate(g,u,e.easing).queue(i),t.effects.unshift(s,_,4)}),t.effects.define("highlight","show",function(e,i){var s=t(this),n={backgroundColor:s.css("backgroundColor")};"hide"===e.mode&&(n.opacity=0),t.effects.saveStyle(s),s.css({backgroundImage:"none",backgroundColor:e.color||"#ffff99"}).animate(n,{queue:!1,duration:e.duration,easing:e.easing,complete:i})}),t.effects.define("size",function(e,i){var s,n,o,a=t(this),r=["fontSize"],h=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"],l=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"],c=e.mode,u="effect"!==c,d=e.scale||"both",p=e.origin||["middle","center"],f=a.css("position"),g=a.position(),m=t.effects.scaledDimensions(a),_=e.from||m,v=e.to||t.effects.scaledDimensions(a,0);t.effects.createPlaceholder(a),"show"===c&&(o=_,_=v,v=o),n={from:{y:_.height/m.height,x:_.width/m.width},to:{y:v.height/m.height,x:v.width/m.width}},("box"===d||"both"===d)&&(n.from.y!==n.to.y&&(_=t.effects.setTransition(a,h,n.from.y,_),v=t.effects.setTransition(a,h,n.to.y,v)),n.from.x!==n.to.x&&(_=t.effects.setTransition(a,l,n.from.x,_),v=t.effects.setTransition(a,l,n.to.x,v))),("content"===d||"both"===d)&&n.from.y!==n.to.y&&(_=t.effects.setTransition(a,r,n.from.y,_),v=t.effects.setTransition(a,r,n.to.y,v)),p&&(s=t.effects.getBaseline(p,m),_.top=(m.outerHeight-_.outerHeight)*s.y+g.top,_.left=(m.outerWidth-_.outerWidth)*s.x+g.left,v.top=(m.outerHeight-v.outerHeight)*s.y+g.top,v.left=(m.outerWidth-v.outerWidth)*s.x+g.left),a.css(_),("content"===d||"both"===d)&&(h=h.concat(["marginTop","marginBottom"]).concat(r),l=l.concat(["marginLeft","marginRight"]),a.find("*[width]").each(function(){var i=t(this),s=t.effects.scaledDimensions(i),o={height:s.height*n.from.y,width:s.width*n.from.x,outerHeight:s.outerHeight*n.from.y,outerWidth:s.outerWidth*n.from.x},a={height:s.height*n.to.y,width:s.width*n.to.x,outerHeight:s.height*n.to.y,outerWidth:s.width*n.to.x};n.from.y!==n.to.y&&(o=t.effects.setTransition(i,h,n.from.y,o),a=t.effects.setTransition(i,h,n.to.y,a)),n.from.x!==n.to.x&&(o=t.effects.setTransition(i,l,n.from.x,o),a=t.effects.setTransition(i,l,n.to.x,a)),u&&t.effects.saveStyle(i),i.css(o),i.animate(a,e.duration,e.easing,function(){u&&t.effects.restoreStyle(i)})})),a.animate(v,{queue:!1,duration:e.duration,easing:e.easing,complete:function(){var e=a.offset();0===v.opacity&&a.css("opacity",_.opacity),u||(a.css("position","static"===f?"relative":f).offset(e),t.effects.saveStyle(a)),i()}})}),t.effects.define("scale",function(e,i){var s=t(this),n=e.mode,o=parseInt(e.percent,10)||(0===parseInt(e.percent,10)?0:"effect"!==n?0:100),a=t.extend(!0,{from:t.effects.scaledDimensions(s),to:t.effects.scaledDimensions(s,o,e.direction||"both"),origin:e.origin||["middle","center"]},e);e.fade&&(a.from.opacity=1,a.to.opacity=0),t.effects.effect.size.call(this,a,i)}),t.effects.define("puff","hide",function(e,i){var s=t.extend(!0,{},e,{fade:!0,percent:parseInt(e.percent,10)||150});t.effects.effect.scale.call(this,s,i)}),t.effects.define("pulsate","show",function(e,i){var s=t(this),n=e.mode,o="show"===n,a="hide"===n,r=o||a,h=2*(e.times||5)+(r?1:0),l=e.duration/h,c=0,u=1,d=s.queue().length;for((o||!s.is(":visible"))&&(s.css("opacity",0).show(),c=1);h>u;u++)s.animate({opacity:c},l,e.easing),c=1-c;s.animate({opacity:c},l,e.easing),s.queue(i),t.effects.unshift(s,d,h+1)}),t.effects.define("shake",function(e,i){var s=1,n=t(this),o=e.direction||"left",a=e.distance||20,r=e.times||3,h=2*r+1,l=Math.round(e.duration/h),c="up"===o||"down"===o?"top":"left",u="up"===o||"left"===o,d={},p={},f={},g=n.queue().length;for(t.effects.createPlaceholder(n),d[c]=(u?"-=":"+=")+a,p[c]=(u?"+=":"-=")+2*a,f[c]=(u?"-=":"+=")+2*a,n.animate(d,l,e.easing);r>s;s++)n.animate(p,l,e.easing).animate(f,l,e.easing);n.animate(p,l,e.easing).animate(d,l/2,e.easing).queue(i),t.effects.unshift(n,g,h+1)}),t.effects.define("slide","show",function(e,i){var s,n,o=t(this),a={up:["bottom","top"],down:["top","bottom"],left:["right","left"],right:["left","right"]},r=e.mode,h=e.direction||"left",l="up"===h||"down"===h?"top":"left",c="up"===h||"left"===h,u=e.distance||o["top"===l?"outerHeight":"outerWidth"](!0),d={};t.effects.createPlaceholder(o),s=o.cssClip(),n=o.position()[l],d[l]=(c?-1:1)*u+n,d.clip=o.cssClip(),d.clip[a[h][1]]=d.clip[a[h][0]],"show"===r&&(o.cssClip(d.clip),o.css(l,d[l]),d.clip=s,d[l]=n),o.animate(d,{queue:!1,duration:e.duration,easing:e.easing,complete:i})});var v;t.uiBackCompat!==!1&&(v=t.effects.define("transfer",function(e,i){t(this).transfer(e,i)}))});
/*!
 * jQuery Validation Plugin v1.16.0
 *
 * http://jqueryvalidation.org/
 *
 * Copyright (c) 2016 Jörn Zaefferer
 * Released under the MIT license
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

$.extend( $.fn, {

	// http://jqueryvalidation.org/validate/
	validate: function( options ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// Check if a validator for this form was already created
		var validator = $.data( this[ 0 ], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[ 0 ] );
		$.data( this[ 0 ], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.on( "click.validate", ":submit", function( event ) {
				if ( validator.settings.submitHandler ) {
					validator.submitButton = event.target;
				}

				// Allow suppressing validation by adding a cancel class to the submit button
				if ( $( this ).hasClass( "cancel" ) ) {
					validator.cancelSubmit = true;
				}

				// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
				if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
					validator.cancelSubmit = true;
				}
			} );

			// Validate the form on submit
			this.on( "submit.validate", function( event ) {
				if ( validator.settings.debug ) {

					// Prevent form submit to be able to see console output
					event.preventDefault();
				}
				function handle() {
					var hidden, result;
					if ( validator.settings.submitHandler ) {
						if ( validator.submitButton ) {

							// Insert a hidden input as a replacement for the missing submit button
							hidden = $( "<input type='hidden'/>" )
								.attr( "name", validator.submitButton.name )
								.val( $( validator.submitButton ).val() )
								.appendTo( validator.currentForm );
						}
						result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( validator.submitButton ) {

							// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						if ( result !== undefined ) {
							return result;
						}
						return false;
					}
					return true;
				}

				// Prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			} );
		}

		return validator;
	},

	// http://jqueryvalidation.org/valid/
	valid: function() {
		var valid, validator, errorList;

		if ( $( this[ 0 ] ).is( "form" ) ) {
			valid = this.validate().form();
		} else {
			errorList = [];
			valid = true;
			validator = $( this[ 0 ].form ).validate();
			this.each( function() {
				valid = validator.element( this ) && valid;
				if ( !valid ) {
					errorList = errorList.concat( validator.errorList );
				}
			} );
			validator.errorList = errorList;
		}
		return valid;
	},

	// http://jqueryvalidation.org/rules/
	rules: function( command, argument ) {
		var element = this[ 0 ],
			settings, staticRules, existingRules, data, param, filtered;

		// If nothing is selected, return empty object; can't chain anyway
		if ( element == null || element.form == null ) {
			return;
		}

		if ( command ) {
			settings = $.data( element.form, "validator" ).settings;
			staticRules = settings.rules;
			existingRules = $.validator.staticRules( element );
			switch ( command ) {
			case "add":
				$.extend( existingRules, $.validator.normalizeRule( argument ) );

				// Remove messages from rules, but allow them to be set separately
				delete existingRules.messages;
				staticRules[ element.name ] = existingRules;
				if ( argument.messages ) {
					settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[ element.name ];
					return existingRules;
				}
				filtered = {};
				$.each( argument.split( /\s/ ), function( index, method ) {
					filtered[ method ] = existingRules[ method ];
					delete existingRules[ method ];
					if ( method === "required" ) {
						$( element ).removeAttr( "aria-required" );
					}
				} );
				return filtered;
			}
		}

		data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules( element ),
			$.validator.attributeRules( element ),
			$.validator.dataRules( element ),
			$.validator.staticRules( element )
		), element );

		// Make sure required is at front
		if ( data.required ) {
			param = data.required;
			delete data.required;
			data = $.extend( { required: param }, data );
			$( element ).attr( "aria-required", "true" );
		}

		// Make sure remote is at back
		if ( data.remote ) {
			param = data.remote;
			delete data.remote;
			data = $.extend( data, { remote: param } );
		}

		return data;
	}
} );

// Custom selectors
$.extend( $.expr.pseudos || $.expr[ ":" ], {		// '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support

	// http://jqueryvalidation.org/blank-selector/
	blank: function( a ) {
		return !$.trim( "" + $( a ).val() );
	},

	// http://jqueryvalidation.org/filled-selector/
	filled: function( a ) {
		var val = $( a ).val();
		return val !== null && !!$.trim( "" + val );
	},

	// http://jqueryvalidation.org/unchecked-selector/
	unchecked: function( a ) {
		return !$( a ).prop( "checked" );
	}
} );

// Constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

// http://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray( arguments );
			args.unshift( source );
			return $.validator.format.apply( this, args );
		};
	}
	if ( params === undefined ) {
		return source;
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray( arguments ).slice( 1 );
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each( params, function( i, n ) {
		source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
			return n;
		} );
	} );
	return source;
};

$.extend( $.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		pendingClass: "pending",
		validClass: "valid",
		errorElement: "label",
		focusCleanup: false,
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function( element ) {
			this.lastActive = element;

			// Hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.hideThese( this.errorsFor( element ) );
			}
		},
		onfocusout: function( element ) {
			if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
				this.element( element );
			}
		},
		onkeyup: function( element, event ) {

			// Avoid revalidate the field when pressing one of the following keys
			// Shift       => 16
			// Ctrl        => 17
			// Alt         => 18
			// Caps lock   => 20
			// End         => 35
			// Home        => 36
			// Left arrow  => 37
			// Up arrow    => 38
			// Right arrow => 39
			// Down arrow  => 40
			// Insert      => 45
			// Num lock    => 144
			// AltGr key   => 225
			var excludedKeys = [
				16, 17, 18, 20, 35, 36, 37,
				38, 39, 40, 45, 144, 225
			];

			if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
				return;
			} else if ( element.name in this.submitted || element.name in this.invalid ) {
				this.element( element );
			}
		},
		onclick: function( element ) {

			// Click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element( element );

			// Or option elements, check parent select in that case
			} else if ( element.parentNode.name in this.submitted ) {
				this.element( element.parentNode );
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
			} else {
				$( element ).addClass( errorClass ).removeClass( validClass );
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
			} else {
				$( element ).removeClass( errorClass ).addClass( validClass );
			}
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.setDefaults/
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format( "Please enter no more than {0} characters." ),
		minlength: $.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range: $.validator.format( "Please enter a value between {0} and {1}." ),
		max: $.validator.format( "Please enter a value less than or equal to {0}." ),
		min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
		step: $.validator.format( "Please enter a multiple of {0}." )
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $( this.settings.errorLabelContainer );
			this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
			this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = ( this.groups = {} ),
				rules;
			$.each( this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split( /\s/ );
				}
				$.each( value, function( index, name ) {
					groups[ name ] = key;
				} );
			} );
			rules = this.settings.rules;
			$.each( rules, function( key, value ) {
				rules[ key ] = $.validator.normalizeRule( value );
			} );

			function delegate( event ) {

				// Set form expando on contenteditable
				if ( !this.form && this.hasAttribute( "contenteditable" ) ) {
					this.form = $( this ).closest( "form" )[ 0 ];
				}

				var validator = $.data( this.form, "validator" ),
					eventType = "on" + event.type.replace( /^validate/, "" ),
					settings = validator.settings;
				if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
					settings[ eventType ].call( validator, this, event );
				}
			}

			$( this.currentForm )
				.on( "focusin.validate focusout.validate keyup.validate",
					":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
					"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
					"[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate )

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.validate", "select, option, [type='radio'], [type='checkbox']", delegate );

			if ( this.settings.invalidHandler ) {
				$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
			}

			// Add aria-required to any Static/Data/Class required fields before first validation
			// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
			$( this.currentForm ).find( "[required], [data-rule-required], .required" ).attr( "aria-required", "true" );
		},

		// http://jqueryvalidation.org/Validator.form/
		form: function() {
			this.checkForm();
			$.extend( this.submitted, this.errorMap );
			this.invalid = $.extend( {}, this.errorMap );
			if ( !this.valid() ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
				this.check( elements[ i ] );
			}
			return this.valid();
		},

		// http://jqueryvalidation.org/Validator.element/
		element: function( element ) {
			var cleanElement = this.clean( element ),
				checkElement = this.validationTargetFor( cleanElement ),
				v = this,
				result = true,
				rs, group;

			if ( checkElement === undefined ) {
				delete this.invalid[ cleanElement.name ];
			} else {
				this.prepareElement( checkElement );
				this.currentElements = $( checkElement );

				// If this element is grouped, then validate all group elements already
				// containing a value
				group = this.groups[ checkElement.name ];
				if ( group ) {
					$.each( this.groups, function( name, testgroup ) {
						if ( testgroup === group && name !== checkElement.name ) {
							cleanElement = v.validationTargetFor( v.clean( v.findByName( name ) ) );
							if ( cleanElement && cleanElement.name in v.invalid ) {
								v.currentElements.push( cleanElement );
								result = v.check( cleanElement ) && result;
							}
						}
					} );
				}

				rs = this.check( checkElement ) !== false;
				result = result && rs;
				if ( rs ) {
					this.invalid[ checkElement.name ] = false;
				} else {
					this.invalid[ checkElement.name ] = true;
				}

				if ( !this.numberOfInvalids() ) {

					// Hide error containers on last error
					this.toHide = this.toHide.add( this.containers );
				}
				this.showErrors();

				// Add aria-invalid status for screen readers
				$( element ).attr( "aria-invalid", !rs );
			}

			return result;
		},

		// http://jqueryvalidation.org/Validator.showErrors/
		showErrors: function( errors ) {
			if ( errors ) {
				var validator = this;

				// Add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = $.map( this.errorMap, function( message, name ) {
					return {
						message: message,
						element: validator.findByName( name )[ 0 ]
					};
				} );

				// Remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !( element.name in errors );
				} );
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// http://jqueryvalidation.org/Validator.resetForm/
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.invalid = {};
			this.submitted = {};
			this.prepareForm();
			this.hideErrors();
			var elements = this.elements()
				.removeData( "previousValue" )
				.removeAttr( "aria-invalid" );

			this.resetElements( elements );
		},

		resetElements: function( elements ) {
			var i;

			if ( this.settings.unhighlight ) {
				for ( i = 0; elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ],
						this.settings.errorClass, "" );
					this.findByName( elements[ i ].name ).removeClass( this.settings.validClass );
				}
			} else {
				elements
					.removeClass( this.settings.errorClass )
					.removeClass( this.settings.validClass );
			}
		},

		numberOfInvalids: function() {
			return this.objectLength( this.invalid );
		},

		objectLength: function( obj ) {
			/* jshint unused: false */
			var count = 0,
				i;
			for ( i in obj ) {
				if ( obj[ i ] ) {
					count++;
				}
			}
			return count;
		},

		hideErrors: function() {
			this.hideThese( this.toHide );
		},

		hideThese: function( errors ) {
			errors.not( this.containers ).text( "" );
			this.addWrapper( errors ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [] )
					.filter( ":visible" )
					.focus()

					// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger( "focusin" );
				} catch ( e ) {

					// Ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep( this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			} ).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// Select all valid inputs inside the form (no submit or reset buttons)
			return $( this.currentForm )
			.find( "input, select, textarea, [contenteditable]" )
			.not( ":submit, :reset, :image, :disabled" )
			.not( this.settings.ignore )
			.filter( function() {
				var name = this.name || $( this ).attr( "name" ); // For contenteditable
				if ( !name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this );
				}

				// Set form expando on contenteditable
				if ( this.hasAttribute( "contenteditable" ) ) {
					this.form = $( this ).closest( "form" )[ 0 ];
				}

				// Select only the first element for each name, and only those with rules specified
				if ( name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
					return false;
				}

				rulesCache[ name ] = true;
				return true;
			} );
		},

		clean: function( selector ) {
			return $( selector )[ 0 ];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.split( " " ).join( "." );
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		resetInternals: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $( [] );
			this.toHide = $( [] );
		},

		reset: function() {
			this.resetInternals();
			this.currentElements = $( [] );
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor( element );
		},

		elementValue: function( element ) {
			var $element = $( element ),
				type = element.type,
				val, idx;

			if ( type === "radio" || type === "checkbox" ) {
				return this.findByName( element.name ).filter( ":checked" ).val();
			} else if ( type === "number" && typeof element.validity !== "undefined" ) {
				return element.validity.badInput ? "NaN" : $element.val();
			}

			if ( element.hasAttribute( "contenteditable" ) ) {
				val = $element.text();
			} else {
				val = $element.val();
			}

			if ( type === "file" ) {

				// Modern browser (chrome & safari)
				if ( val.substr( 0, 12 ) === "C:\\fakepath\\" ) {
					return val.substr( 12 );
				}

				// Legacy browsers
				// Unix-based path
				idx = val.lastIndexOf( "/" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Windows-based path
				idx = val.lastIndexOf( "\\" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Just the file name
				return val;
			}

			if ( typeof val === "string" ) {
				return val.replace( /\r/g, "" );
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $( element ).rules(),
				rulesCount = $.map( rules, function( n, i ) {
					return i;
				} ).length,
				dependencyMismatch = false,
				val = this.elementValue( element ),
				result, method, rule;

			// If a normalizer is defined for this element, then
			// call it to retreive the changed value instead
			// of using the real one.
			// Note that `this` in the normalizer is `element`.
			if ( typeof rules.normalizer === "function" ) {
				val = rules.normalizer.call( element, val );

				if ( typeof val !== "string" ) {
					throw new TypeError( "The normalizer should return a string value." );
				}

				// Delete the normalizer from rules to avoid treating
				// it as a pre-defined method.
				delete rules.normalizer;
			}

			for ( method in rules ) {
				rule = { method: method, parameters: rules[ method ] };
				try {
					result = $.validator.methods[ method ].call( this, val, element, rule.parameters );

					// If a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" && rulesCount === 1 ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor( element ) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch ( e ) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					if ( e instanceof TypeError ) {
						e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
					}

					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength( rules ) ) {
				this.successList.push( element );
			}
			return true;
		},

		// Return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		// return the generic message if present and no method specific message is present
		customDataMessage: function( element, method ) {
			return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
				method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
		},

		// Return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[ name ];
			return m && ( m.constructor === String ? m : m[ method ] );
		},

		// Return the first defined argument, allowing empty strings
		findDefined: function() {
			for ( var i = 0; i < arguments.length; i++ ) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		// The second parameter 'rule' used to be a string, and extended to an object literal
		// of the following form:
		// rule = {
		//     method: "method name",
		//     parameters: "the given method parameters"
		// }
		//
		// The old behavior still supported, kept to maintain backward compatibility with
		// old code, and will be removed in the next major release.
		defaultMessage: function( element, rule ) {
			if ( typeof rule === "string" ) {
				rule = { method: rule };
			}

			var message = this.findDefined(
					this.customMessage( element.name, rule.method ),
					this.customDataMessage( element, rule.method ),

					// 'title' is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					$.validator.messages[ rule.method ],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call( this, rule.parameters, element );
			} else if ( theregex.test( message ) ) {
				message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
			}

			return message;
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule );

			this.errorList.push( {
				message: message,
				element: element,
				method: rule.method
			} );

			this.errorMap[ element.name ] = message;
			this.submitted[ element.name ] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements, error;
			for ( i = 0; this.errorList[ i ]; i++ ) {
				error = this.errorList[ i ];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if ( this.settings.success ) {
				for ( i = 0; this.successList[ i ]; i++ ) {
					this.showLabel( this.successList[ i ] );
				}
			}
			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not( this.invalidElements() );
		},

		invalidElements: function() {
			return $( this.errorList ).map( function() {
				return this.element;
			} );
		},

		showLabel: function( element, message ) {
			var place, group, errorID, v,
				error = this.errorsFor( element ),
				elementID = this.idOrName( element ),
				describedBy = $( element ).attr( "aria-describedby" );

			if ( error.length ) {

				// Refresh error/success class
				error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// Replace message on existing label
				error.html( message );
			} else {

				// Create error element
				error = $( "<" + this.settings.errorElement + ">" )
					.attr( "id", elementID + "-error" )
					.addClass( this.settings.errorClass )
					.html( message || "" );

				// Maintain reference to the element to be placed into the DOM
				place = error;
				if ( this.settings.wrapper ) {

					// Make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
				}
				if ( this.labelContainer.length ) {
					this.labelContainer.append( place );
				} else if ( this.settings.errorPlacement ) {
					this.settings.errorPlacement.call( this, place, $( element ) );
				} else {
					place.insertAfter( element );
				}

				// Link error back to the element
				if ( error.is( "label" ) ) {

					// If the error is a label, then associate using 'for'
					error.attr( "for", elementID );

					// If the element is not a child of an associated label, then it's necessary
					// to explicitly apply aria-describedby
				} else if ( error.parents( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 ) {
					errorID = error.attr( "id" );

					// Respect existing non-error aria-describedby
					if ( !describedBy ) {
						describedBy = errorID;
					} else if ( !describedBy.match( new RegExp( "\\b" + this.escapeCssMeta( errorID ) + "\\b" ) ) ) {

						// Add to end of list if not already present
						describedBy += " " + errorID;
					}
					$( element ).attr( "aria-describedby", describedBy );

					// If this element is grouped, then assign to all elements in the same group
					group = this.groups[ element.name ];
					if ( group ) {
						v = this;
						$.each( v.groups, function( name, testgroup ) {
							if ( testgroup === group ) {
								$( "[name='" + v.escapeCssMeta( name ) + "']", v.currentForm )
									.attr( "aria-describedby", error.attr( "id" ) );
							}
						} );
					}
				}
			}
			if ( !message && this.settings.success ) {
				error.text( "" );
				if ( typeof this.settings.success === "string" ) {
					error.addClass( this.settings.success );
				} else {
					this.settings.success( error, element );
				}
			}
			this.toShow = this.toShow.add( error );
		},

		errorsFor: function( element ) {
			var name = this.escapeCssMeta( this.idOrName( element ) ),
				describer = $( element ).attr( "aria-describedby" ),
				selector = "label[for='" + name + "'], label[for='" + name + "'] *";

			// 'aria-describedby' should directly reference the error element
			if ( describer ) {
				selector = selector + ", #" + this.escapeCssMeta( describer )
					.replace( /\s+/g, ", #" );
			}

			return this
				.errors()
				.filter( selector );
		},

		// See https://api.jquery.com/category/selectors/, for CSS
		// meta-characters that should be escaped in order to be used with JQuery
		// as a literal part of a name/id or any selector.
		escapeCssMeta: function( string ) {
			return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
		},

		idOrName: function( element ) {
			return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
		},

		validationTargetFor: function( element ) {

			// If radio/checkbox, validate first element in group instead
			if ( this.checkable( element ) ) {
				element = this.findByName( element.name );
			}

			// Always apply ignore filter
			return $( element ).not( this.settings.ignore )[ 0 ];
		},

		checkable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		findByName: function( name ) {
			return $( this.currentForm ).find( "[name='" + this.escapeCssMeta( name ) + "']" );
		},

		getLength: function( value, element ) {
			switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[ typeof param ] ? this.dependTypes[ typeof param ]( param, element ) : true;
		},

		dependTypes: {
			"boolean": function( param ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$( param, element.form ).length;
			},
			"function": function( param, element ) {
				return param( element );
			}
		},

		optional: function( element ) {
			var val = this.elementValue( element );
			return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		startRequest: function( element ) {
			if ( !this.pending[ element.name ] ) {
				this.pendingRequest++;
				$( element ).addClass( this.settings.pendingClass );
				this.pending[ element.name ] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;

			// Sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[ element.name ];
			$( element ).removeClass( this.settings.pendingClass );
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$( this.currentForm ).submit();
				this.formSubmitted = false;
			} else if ( !valid && this.pendingRequest === 0 && this.formSubmitted ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
				this.formSubmitted = false;
			}
		},

		previousValue: function( element, method ) {
			method = typeof method === "string" && method || "remote";

			return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, { method: method } )
			} );
		},

		// Cleans up all forms and elements, removes validator-specific events
		destroy: function() {
			this.resetForm();

			$( this.currentForm )
				.off( ".validate" )
				.removeData( "validator" )
				.find( ".validate-equalTo-blur" )
					.off( ".validate-equalTo" )
					.removeClass( "validate-equalTo-blur" );
		}

	},

	classRuleSettings: {
		required: { required: true },
		email: { email: true },
		url: { url: true },
		date: { date: true },
		dateISO: { dateISO: true },
		number: { number: true },
		digits: { digits: true },
		creditcard: { creditcard: true }
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[ className ] = rules;
		} else {
			$.extend( this.classRuleSettings, className );
		}
	},

	classRules: function( element ) {
		var rules = {},
			classes = $( element ).attr( "class" );

		if ( classes ) {
			$.each( classes.split( " " ), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend( rules, $.validator.classRuleSettings[ this ] );
				}
			} );
		}
		return rules;
	},

	normalizeAttributeRule: function( rules, type, method, value ) {

		// Convert the value to a number for number inputs, and for text for backwards compability
		// allows type="date" and others to be compared as strings
		if ( /min|max|step/.test( method ) && ( type === null || /number|range|text/.test( type ) ) ) {
			value = Number( value );

			// Support Opera Mini, which returns NaN for undefined minlength
			if ( isNaN( value ) ) {
				value = undefined;
			}
		}

		if ( value || value === 0 ) {
			rules[ method ] = value;
		} else if ( type === method && type !== "range" ) {

			// Exception: the jquery validate 'range' method
			// does not test for the html5 'range' type
			rules[ method ] = true;
		}
	},

	attributeRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {

			// Support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = element.getAttribute( method );

				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}

				// Force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr( method );
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}

		// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test( rules.maxlength ) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {
			value = $element.data( "rule" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() );
			this.normalizeAttributeRule( rules, type, method, value );
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {},
			validator = $.data( element.form, "validator" );

		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule( validator.settings.rules[ element.name ] ) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {

		// Handle dependency check
		$.each( rules, function( prop, val ) {

			// Ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[ prop ];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch ( typeof val.depends ) {
				case "string":
					keepRule = !!$( val.depends, element.form ).length;
					break;
				case "function":
					keepRule = val.depends.call( element, element );
					break;
				}
				if ( keepRule ) {
					rules[ prop ] = val.param !== undefined ? val.param : true;
				} else {
					$.data( element.form, "validator" ).resetElements( $( element ) );
					delete rules[ prop ];
				}
			}
		} );

		// Evaluate parameters
		$.each( rules, function( rule, parameter ) {
			rules[ rule ] = $.isFunction( parameter ) && rule !== "normalizer" ? parameter( element ) : parameter;
		} );

		// Clean number parameters
		$.each( [ "minlength", "maxlength" ], function() {
			if ( rules[ this ] ) {
				rules[ this ] = Number( rules[ this ] );
			}
		} );
		$.each( [ "rangelength", "range" ], function() {
			var parts;
			if ( rules[ this ] ) {
				if ( $.isArray( rules[ this ] ) ) {
					rules[ this ] = [ Number( rules[ this ][ 0 ] ), Number( rules[ this ][ 1 ] ) ];
				} else if ( typeof rules[ this ] === "string" ) {
					parts = rules[ this ].replace( /[\[\]]/g, "" ).split( /[\s,]+/ );
					rules[ this ] = [ Number( parts[ 0 ] ), Number( parts[ 1 ] ) ];
				}
			}
		} );

		if ( $.validator.autoCreateRanges ) {

			// Auto-create ranges
			if ( rules.min != null && rules.max != null ) {
				rules.range = [ rules.min, rules.max ];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength != null && rules.maxlength != null ) {
				rules.rangelength = [ rules.minlength, rules.maxlength ];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			} );
			data = transformed;
		}
		return data;
	},

	// http://jqueryvalidation.org/jQuery.validator.addMethod/
	addMethod: function( name, method, message ) {
		$.validator.methods[ name ] = method;
		$.validator.messages[ name ] = message !== undefined ? message : $.validator.messages[ name ];
		if ( method.length < 3 ) {
			$.validator.addClassRules( name, $.validator.normalizeRule( name ) );
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.methods/
	methods: {

		// http://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			// Check if dependency is met
			if ( !this.depend( param, element ) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {

				// Could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.checkable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value.length > 0;
		},

		// http://jqueryvalidation.org/email-method/
		email: function( value, element ) {

			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// http://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// http://jqueryvalidation.org/date-method/
		date: function( value, element ) {
			return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
		},

		// http://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// http://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
		},

		// http://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// http://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// http://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// http://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// http://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// http://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/step-method/
		step: function( value, element, param ) {
			var type = $( element ).attr( "type" ),
				errorMessage = "Step attribute on input type " + type + " is not supported.",
				supportedTypes = [ "text", "number", "range" ],
				re = new RegExp( "\\b" + type + "\\b" ),
				notSupported = type && !re.test( supportedTypes.join() ),
				decimalPlaces = function( num ) {
					var match = ( "" + num ).match( /(?:\.(\d+))?$/ );
					if ( !match ) {
						return 0;
					}

					// Number of digits right of decimal point.
					return match[ 1 ] ? match[ 1 ].length : 0;
				},
				toInt = function( num ) {
					return Math.round( num * Math.pow( 10, decimals ) );
				},
				valid = true,
				decimals;

			// Works only for text, number and range input types
			// TODO find a way to support input types date, datetime, datetime-local, month, time and week
			if ( notSupported ) {
				throw new Error( errorMessage );
			}

			decimals = decimalPlaces( param );

			// Value can't have too many decimals
			if ( decimalPlaces( value ) > decimals || toInt( value ) % toInt( param ) !== 0 ) {
				valid = false;
			}

			return this.optional( element ) || valid;
		},

		// http://jqueryvalidation.org/equalTo-method/
		equalTo: function( value, element, param ) {

			// Bind to the blur event of the target in order to revalidate whenever the target field is updated
			var target = $( param );
			if ( this.settings.onfocusout && target.not( ".validate-equalTo-blur" ).length ) {
				target.addClass( "validate-equalTo-blur" ).on( "blur.validate-equalTo", function() {
					$( element ).valid();
				} );
			}
			return value === target.val();
		},

		// http://jqueryvalidation.org/remote-method/
		remote: function( value, element, param, method ) {
			if ( this.optional( element ) ) {
				return "dependency-mismatch";
			}

			method = typeof method === "string" && method || "remote";

			var previous = this.previousValue( element, method ),
				validator, data, optionDataString;

			if ( !this.settings.messages[ element.name ] ) {
				this.settings.messages[ element.name ] = {};
			}
			previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
			this.settings.messages[ element.name ][ method ] = previous.message;

			param = typeof param === "string" && { url: param } || param;
			optionDataString = $.param( $.extend( { data: value }, param.data ) );
			if ( previous.old === optionDataString ) {
				return previous.valid;
			}

			previous.old = optionDataString;
			validator = this;
			this.startRequest( element );
			data = {};
			data[ element.name ] = value;
			$.ajax( $.extend( true, {
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				context: validator.currentForm,
				success: function( response ) {
					var valid = response === true || response === "true",
						errors, message, submitted;

					validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
					if ( valid ) {
						submitted = validator.formSubmitted;
						validator.resetInternals();
						validator.toHide = validator.errorsFor( element );
						validator.formSubmitted = submitted;
						validator.successList.push( element );
						validator.invalid[ element.name ] = false;
						validator.showErrors();
					} else {
						errors = {};
						message = response || validator.defaultMessage( element, { method: method, parameters: value } );
						errors[ element.name ] = previous.message = message;
						validator.invalid[ element.name ] = true;
						validator.showErrors( errors );
					}
					previous.valid = valid;
					validator.stopRequest( element, valid );
				}
			}, param ) );
			return "pending";
		}
	}

} );

// Ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

var pendingRequests = {},
	ajax;

// Use a prefilter if available (1.5+)
if ( $.ajaxPrefilter ) {
	$.ajaxPrefilter( function( settings, _, xhr ) {
		var port = settings.port;
		if ( settings.mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = xhr;
		}
	} );
} else {

	// Proxy ajax
	ajax = $.ajax;
	$.ajax = function( settings ) {
		var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
			port = ( "port" in settings ? settings : $.ajaxSettings ).port;
		if ( mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = ajax.apply( this, arguments );
			return pendingRequests[ port ];
		}
		return ajax.apply( this, arguments );
	};
}
return $;
}));
/**********************************
* jCounter Script v0.1.4 (beta)
* Author: Catalin Berta
* Official page and documentation: http://devingredients.com/jcounter
* Licensed under the MIT license
**********************************/
;(function($,document,window,undefined) {
	//once upon a time...
	$.fn.jCounter = function(options,callback) {
		var jCounterDirection = 'down'; // points out whether it should count down or up | handled via customRange setting
		
		var customRangeDownCount; //if true, it will tell countdown_proc() it's a down count and not an up count
		var days,hours,minutes,seconds;
		var endCounter = false; //stops jCounter if true
		var eventDate; //time target (holds a number of seconds)
		var pausedTime; //stores the time (in seconds) when pausing
		var thisEl = this; //custom 'this' selector
		var thisLength = this.length; //number of multiple elements per selector

		var pluralLabels = new Array('DAYS','HOURS','MINUTES','SECONDS'); //plural labels - used for localization
		var singularLabels = new Array('DAY','HOUR','MINUTE','SECOND');	//singular labels - used for localization

		this.options = options; //stores jCounter's options parameter to verify against specified methods
		this.version = '0.1.4';

		//default settings
		var settings = {
			animation: null,
			callback: null,
			customDuration: null,
			customRange: null,
			date: null,
			debugLog: false,
			serverDateSource: 'dateandtime.php', //path to dateandtime.php file (i.e. http://my-domain.com/dateandtime.php)
			format: 'dd:hh:mm:ss',
			timezone: 'Europe/London',
			twoDigits: 'on'
		};

		//merge the settings with the options values
		if (typeof options === 'object') {
			$.extend(settings,options);
			thisEl.data("userOptions", settings); //push the settings to applied elements (they're used by methods)
		}

		if(thisEl.data('userOptions').debugLog == true &&  window['console'] !== undefined ) {
			var consoleLog = true;	//shows debug messages via console.log() if true
		}

		//METHODS
		var jC_methods = {
			//initialize
			init : function() {
				thisEl.each(function(i,el) {
					initCounter(el);
				});
			},
			//pause method: $.jCounter('pause')
			pause : function() {
				if(consoleLog) { console.log("(jC) Activity: Counter paused."); }
				endCounter = true;
				return thisEl.each(function(i,el) {
					clearInterval($(el).data("jC_interval"));
				});
			},
			//stop method: $.jCounter('stop')
			stop : function() {
				if(consoleLog) { console.log("(jC) Activity: Counter stopped."); }
				endCounter = true;
				return thisEl.each(function(i,el) {
					clearInterval($(el).data("jC_interval"));
					$(el).removeData("jC_pausedTime");
					resetHTMLCounter(el);
				});
			},
			//reset method: $.jCounter('reset')
			reset : function() {
				if(consoleLog) { console.log("(jC) Activity: Counter reset."); }
				return thisEl.each(function(i,el) {
					clearInterval($(el).data("jC_interval"));
					resetHTMLCounter(el);
					initCounter(el);
				});
			},
			//start method: $.jCounter('start')
			
			start : function() {
				if(consoleLog) { console.log("(jC) Activity: Counter started."); }
				return thisEl.each(function(i,el) {
					pausedTime = $(el).data("jC_pausedTime");
					endCounter = false;
					clearInterval($(el).data("jC_interval"));
					initCounter(el);
				});
			}
		}
		
		//checks whether customDuration is used
		if(thisEl.data("userOptions").customDuration) {
			if(!isNaN(thisEl.data("userOptions").customDuration)) {
				var customDuration = true;
			} else {
				var customDuration = false;
				if(consoleLog) { console.log("(jC) Error: The customDuration value is not a number! NOTE: 'customDuration' accepts a number of seconds."); }
			}
		}
		
		//checks whether customRange is used
		if(thisEl.data("userOptions").customRange) {	
			var customRangeValues = thisEl.data("userOptions").customRange.split(":");
			var rangeVal0 = parseInt(customRangeValues[0]);
			var rangeVal1 = parseInt(customRangeValues[1]);
			if(!isNaN(rangeVal0) && !isNaN(rangeVal1)) {
				var customRange = true;
				if(rangeVal0 > rangeVal1) {
					var customRangeDownCount = true;
				} else {
					var customRangeDownCount = false;
					jCounterDirection = 'up';
				}
			} else {
				var customRange = false;
				if(consoleLog) { console.log("(jC) Error: The customRange value is not a valid range! Example: customRange: '0:30' or '30:0'"); }
			}
		}

		//checks whether animation is set to slide
		if(thisEl.data("userOptions").animation == 'slide') {	
			thisEl.data("jCanimation","slide");
		}

		//FUNCTIONS
		
		//jCounter initializer
		function initCounter(el) {
			if(customDuration) {
				if (pausedTime) {
					if (!isNaN(pausedTime)) {
						eventDate = Math.round(pausedTime);
					}
				} else {
					eventDate = Math.round($(el).data("userOptions").customDuration);
				}
				currentTime = 0;
				countdown_proc(currentTime,el);
				$(el).data("jC_interval", setInterval(function(){
					if(endCounter == false) {
						currentTime = parseInt(currentTime) + 1;
						countdown_proc(currentTime,el)
					}				
				},1000));
			} else if(customRange) {
				eventDate = Math.round(customRangeValues[1]);
				if (pausedTime) {
					if (!isNaN(pausedTime)) {
						var currentTime = eventDate - pausedTime;
					}
				} else {
					var currentTime = Math.round(customRangeValues[0]);
				}
				countdown_proc(currentTime,el);
				$(el).data("jC_interval", setInterval(function(){
					if(endCounter == false) {
						var ifRangeDownCount = (customRangeDownCount) ? currentTime = parseInt(currentTime) - 1 : currentTime = parseInt(currentTime) + 1;
						countdown_proc(currentTime,el);
					}				
				},1000));
			} else {
				eventDate = Date.parse($(el).data("userOptions").date) / 1000;
				dateSource = thisEl.data("userOptions").serverDateSource + '?timezone=' + thisEl.data("userOptions").timezone + '&callback=?';
				$.ajax({
                	url: dateSource,
	                dataType : 'json',
	                data : {},
	                success : function(data, textStatus){
						var currentDate = Date.parse(data.currentDate) / 1000;
						startCounter(currentDate,el);
	                },
	                error : function(){
						if(consoleLog) { console.log("(jC) Error: Couldn't find dateandtime.php from serverDateSource: " + thisEl.data('userOptions').serverDateSource + "\n(jC) - Make sure the path is correct! \n(jC) - Now using the client-side time (not recommended).") }
						var currentDate = Math.floor($.now() / 1000);
						startCounter(currentDate,el);
	                }
            	});
			}
		}

		function startCounter(currentDate,el) {
			countdown_proc(currentDate,el);
			if (eventDate > currentDate) {
				$(el).data("jC_interval", setInterval(function(){
					if(endCounter == false) {
						currentDate = parseInt(currentDate) + 1;
						countdown_proc(currentDate,el)
					}				
				},1000));
			} else {
				resetHTMLCounter(el)
			}
		}

		//jCslider - adds the slide effect layer
		//Note: this requires a jCounter slide-ready theme! (i.e. iOS dark or iOS light)
		function jCslider(el,unitClass,timeUnit,eventDate,duration) {
			$(el).find(unitClass + " u").each(function(i,el) {
				var twoDigits = (thisEl.data("userOptions").twoDigits == 'on') ? '0' : '';
				var newIndex = (jCounterDirection == 'up') ? newIndex = -i : newIndex = i;		
				currNo = parseInt(timeUnit,10) + (newIndex);
				if (String(parseInt(timeUnit,10)).length >= 2) { 
					$(el).text(parseInt(timeUnit,10) + (newIndex))
				} else if(String(parseInt(timeUnit,10)).length == 1 && currNo == 10) {
					$(el).text(parseInt(timeUnit,10) + (newIndex))
				} else {
					$(el).text(twoDigits + (parseInt(timeUnit,10) + (newIndex)));
				}
			})
			$(el).find(unitClass).animate({
				top: '0.15em'
			},200, function() {
				$(el).find(unitClass + " u:eq(1)").remove();
				$(el).find(unitClass).prepend('<u></u>');
				$(el).find(unitClass).css({'top':'-1.24em'})					
			});
		}

		//resets jCounter's HTML values to 0 or 00, based on the twoDigits setting
		function resetHTMLCounter(el) {
			if(thisEl.data("userOptions").twoDigits == 'on') {
				$(el).find(".days,.hours,.minutes,.seconds").text('00');
			} else if(thisEl.data("userOptions").twoDigits == 'off') {
				$(el).find(".days,.hours,.minutes,.seconds").text('0');
			}
			if(thisEl.data("jCanimation") == 'slide') {
				$(el).find(".daysSlider u,.hoursSlider u,.minutesSlider u,.secondsSlider u").text('00');
			}
		}

		//main jCounter processor
		function countdown_proc(duration,el) {
			//check if the counter needs to count down or up
			if(customRangeDownCount) {
				if(eventDate >= duration) {
					clearInterval($(el).data("jC_interval"));
					if(thisEl.data("userOptions").callback) {
						thisEl.data("userOptions").callback.call(this);
					}
				}

			} else {
				if(eventDate <= duration) {
					clearInterval($(el).data("jC_interval"));
					if(thisEl.data("userOptions").callback) {
						thisEl.data("userOptions").callback.call(this);
					}
				}
			}
			
			//if customRange is used, update the seconds variable
			var seconds = (customRange) ? duration : eventDate - duration;

			var thisInstanceFormat = thisEl.data("userOptions").format;
			
			//calculate seconds into days,hours,minutes,seconds
			//if dd (days) is specified in the format setting (i.e. format: 'dd:hh:mm:ss')
			if(thisInstanceFormat.indexOf('dd') != -1)  {
				var days = Math.floor(seconds / (60 * 60 * 24)); //calculate the number of days
				seconds -= days * 60 * 60 * 24; //update the seconds variable with no. of days removed
			}
			//if hh (hours) is specified
			if(thisInstanceFormat.indexOf('hh') != -1)  {
				var hours = Math.floor(seconds / (60 * 60));
				seconds -= hours * 60 * 60; //update the seconds variable with no. of hours removed
			}
			//if mm (minutes) is specified
			if(thisInstanceFormat.indexOf('mm') != -1)  {
				var minutes = Math.floor(seconds / 60);
				seconds -= minutes * 60; //update the seconds variable with no. of minutes removed
			}
			//if ss (seconds) is specified
			if(thisInstanceFormat.indexOf('ss') == -1)  {
				seconds -= seconds; //if ss is unspecified in format, update the seconds variable to 0;
			}

			//conditional Ss
			//updates the plural and singular labels accordingly
			if (days == 1) { $(el).find(".textDays").text(singularLabels[0]); } else { $(el).find(".textDays").text(pluralLabels[0]); }
			if (hours == 1) { $(el).find(".textHours").text(singularLabels[1]); } else { $(el).find(".textHours").text(pluralLabels[1]); }
			if (minutes == 1) { $(el).find(".textMinutes").text(singularLabels[2]); } else { $(el).find(".textMinutes").text(pluralLabels[2]); }
			if (seconds == 1) { $(el).find(".textSeconds").text(singularLabels[3]); } else { $(el).find(".textSeconds").text(pluralLabels[3]); }
			
			//twoDigits ON setting
			//if the twoDigits setting is set to ON, jCounter will always diplay a minimum number of 2 digits
			if(thisEl.data("userOptions").twoDigits == 'on') {
				days = (String(days).length >= 2) ? days : "0" + days;
				hours = (String(hours).length >= 2) ? hours : "0" + hours;
				minutes = (String(minutes).length >= 2) ? minutes : "0" + minutes;
				seconds = (String(seconds).length >= 2) ? seconds : "0" + seconds;
			}

			//updates the jCounter's html values
			if(!isNaN(eventDate)) {
				$(el).find(".days").text(days);
				$(el).find(".hours").text(hours);
				$(el).find(".minutes").text(minutes);
				$(el).find(".seconds").text(seconds);

				if(thisEl.data("jCanimation") == 'slide') {
					$(el).find(".daysSlider u:eq(1)").text(days);
					$(el).find(".hoursSlider u:eq(1)").text(hours);
					$(el).find(".minutesSlider u:eq(1)").text(minutes);
					$(el).find(".secondsSlider u:eq(1)").text(seconds);
					jCslider(el,'.secondsSlider',seconds,eventDate,duration); 
					if(parseInt(seconds,10) == 59) { 
						jCslider(el,'.minutesSlider',minutes,eventDate,duration) 
						if(parseInt(minutes,10) == 59) { 
							jCslider(el,'.hoursSlider',hours,eventDate,duration) 
							if(parseInt(hours,10) == 23) { 
								jCslider(el,'.daysSlider',days,eventDate,duration) 
							}
						}
					}	
				}
			} else { 
				if(consoleLog) { console.log("(jC) Error: Invalid date! Here's an example: 01 January 1970 12:00:00"); }
				clearInterval($(el).data("jC_interval"));
			}
			//stores the remaining time when pausing jCounter
			$(el).data("jC_pausedTime", eventDate-duration);
		}
		
		
		
		//method calling logic
		if ( jC_methods[this.options] ) {
			return jC_methods[ this.options ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof this.options === 'object' || ! this.options ) {
			return jC_methods.init.apply( this, arguments );
		} else {
			console.log('(jC) Error: Method >>> ' +  this.options + ' <<< does not exist.' );
		} 

	}
	//the end;
}) (jQuery,document,window);
/*!
* jquery.inputmask.bundle.js
* https://github.com/RobinHerbots/jquery.inputmask
* Copyright (c) 2010 - 2017 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 3.3.5-34
*/
!function($) {
    function Inputmask(alias, options, internal) {
        return this instanceof Inputmask ? (this.el = void 0, this.events = {}, this.maskset = void 0, 
        this.refreshValue = !1, void (internal !== !0 && ($.isPlainObject(alias) ? options = alias : (options = options || {}, 
        options.alias = alias), this.opts = $.extend(!0, {}, this.defaults, options), this.noMasksCache = options && void 0 !== options.definitions, 
        this.userOptions = options || {}, this.isRTL = this.opts.numericInput, resolveAlias(this.opts.alias, options, this.opts)))) : new Inputmask(alias, options, internal);
    }
    function resolveAlias(aliasStr, options, opts) {
        var aliasDefinition = Inputmask.prototype.aliases[aliasStr];
        return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, void 0, opts), 
        $.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr), 
        !1);
    }
    function generateMaskSet(opts, nocache) {
        function generateMask(mask, metadata, opts) {
            if (null !== mask && "" !== mask) {
                if (1 === mask.length && opts.greedy === !1 && 0 !== opts.repeat && (opts.placeholder = ""), 
                opts.repeat > 0 || "*" === opts.repeat || "+" === opts.repeat) {
                    var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;
                    mask = opts.groupmarker.start + mask + opts.groupmarker.end + opts.quantifiermarker.start + repeatStart + "," + opts.repeat + opts.quantifiermarker.end;
                }
                var masksetDefinition;
                return void 0 === Inputmask.prototype.masksCache[mask] || nocache === !0 ? (masksetDefinition = {
                    mask: mask,
                    maskToken: Inputmask.prototype.analyseMask(mask, opts),
                    validPositions: {},
                    _buffer: void 0,
                    buffer: void 0,
                    tests: {},
                    metadata: metadata,
                    maskLength: void 0
                }, nocache !== !0 && (Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask] = masksetDefinition, 
                masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]), 
                masksetDefinition;
            }
        }
        var ms;
        if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {
            if (opts.mask.length > 1) {
                opts.keepStatic = null === opts.keepStatic || opts.keepStatic;
                var altMask = opts.groupmarker.start;
                return $.each(opts.numericInput ? opts.mask.reverse() : opts.mask, function(ndx, msk) {
                    altMask.length > 1 && (altMask += opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start), 
                    altMask += void 0 === msk.mask || $.isFunction(msk.mask) ? msk : msk.mask;
                }), altMask += opts.groupmarker.end, generateMask(altMask, opts.mask, opts);
            }
            opts.mask = opts.mask.pop();
        }
        return opts.mask && (ms = void 0 === opts.mask.mask || $.isFunction(opts.mask.mask) ? generateMask(opts.mask, opts.mask, opts) : generateMask(opts.mask.mask, opts.mask, opts)), 
        ms;
    }
    function maskScope(actionObj, maskset, opts) {
        function getMaskTemplate(baseOnInput, minimalPos, includeMode) {
            minimalPos = minimalPos || 0;
            var ndxIntlzr, test, testPos, maskTemplate = [], pos = 0, lvp = getLastValidPosition();
            maxLength = void 0 !== el ? el.maxLength : void 0, maxLength === -1 && (maxLength = void 0);
            do baseOnInput === !0 && getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos], 
            test = testPos.match, ndxIntlzr = testPos.locator.slice(), maskTemplate.push(includeMode === !0 ? testPos.input : includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), 
            test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && maskTemplate.push(includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))), 
            pos++; while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || minimalPos > pos);
            return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), getMaskSet().maskLength = pos + 1, 
            maskTemplate;
        }
        function getMaskSet() {
            return maskset;
        }
        function resetMaskSet(soft) {
            var maskset = getMaskSet();
            maskset.buffer = void 0, soft !== !0 && (maskset._buffer = void 0, maskset.validPositions = {}, 
            maskset.p = 0);
        }
        function getLastValidPosition(closestTo, strict, validPositions) {
            var before = -1, after = -1, valids = validPositions || getMaskSet().validPositions;
            void 0 === closestTo && (closestTo = -1);
            for (var posNdx in valids) {
                var psNdx = parseInt(posNdx);
                valids[psNdx] && (strict || valids[psNdx].generatedInput !== !0) && (psNdx <= closestTo && (before = psNdx), 
                psNdx >= closestTo && (after = psNdx));
            }
            return before !== -1 && closestTo - before > 1 || after < closestTo ? before : after;
        }
        function stripValidPositions(start, end, nocheck, strict) {
            function IsEnclosedStatic(pos) {
                var posMatch = getMaskSet().validPositions[pos];
                if (void 0 !== posMatch && null === posMatch.match.fn) {
                    var prevMatch = getMaskSet().validPositions[pos - 1], nextMatch = getMaskSet().validPositions[pos + 1];
                    return void 0 !== prevMatch && void 0 !== nextMatch;
                }
                return !1;
            }
            var i, startPos = start, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), needsValidation = !1;
            for (getMaskSet().p = start, i = end - 1; i >= startPos; i--) void 0 !== getMaskSet().validPositions[i] && (nocheck !== !0 && (!getMaskSet().validPositions[i].match.optionality && IsEnclosedStatic(i) || opts.canClearPosition(getMaskSet(), i, getLastValidPosition(), strict, opts) === !1) || delete getMaskSet().validPositions[i]);
            for (resetMaskSet(!0), i = startPos + 1; i <= getLastValidPosition(); ) {
                for (;void 0 !== getMaskSet().validPositions[startPos]; ) startPos++;
                if (i < startPos && (i = startPos + 1), void 0 === getMaskSet().validPositions[i] && isMask(i)) i++; else {
                    var t = getTestTemplate(i);
                    needsValidation === !1 && positionsClone[startPos] && positionsClone[startPos].match.def === t.match.def ? (getMaskSet().validPositions[startPos] = $.extend(!0, {}, positionsClone[startPos]), 
                    getMaskSet().validPositions[startPos].input = t.input, delete getMaskSet().validPositions[i], 
                    i++) : positionCanMatchDefinition(startPos, t.match.def) ? isValid(startPos, t.input || getPlaceholder(i), !0) !== !1 && (delete getMaskSet().validPositions[i], 
                    i++, needsValidation = !0) : isMask(i) || (i++, startPos--), startPos++;
                }
            }
            resetMaskSet(!0);
        }
        function determineTestTemplate(tests, guessNextBest) {
            for (var testPos, testPositions = tests, lvp = getLastValidPosition(), lvTest = getMaskSet().validPositions[lvp] || getTests(0)[0], lvTestAltArr = void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation].toString().split(",") : [], ndx = 0; ndx < testPositions.length && (testPos = testPositions[ndx], 
            !(testPos.match && (opts.greedy && testPos.match.optionalQuantifier !== !0 || (testPos.match.optionality === !1 || testPos.match.newBlockMarker === !1) && testPos.match.optionalQuantifier !== !0) && (void 0 === lvTest.alternation || lvTest.alternation !== testPos.alternation || void 0 !== testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAltArr))) || guessNextBest === !0 && (null !== testPos.match.fn || /[0-9a-bA-Z]/.test(testPos.match.def))); ndx++) ;
            return testPos;
        }
        function getTestTemplate(pos, ndxIntlzr, tstPs) {
            return getMaskSet().validPositions[pos] || determineTestTemplate(getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));
        }
        function getTest(pos) {
            return getMaskSet().validPositions[pos] ? getMaskSet().validPositions[pos] : getTests(pos)[0];
        }
        function positionCanMatchDefinition(pos, def) {
            for (var valid = !1, tests = getTests(pos), tndx = 0; tndx < tests.length; tndx++) if (tests[tndx].match && tests[tndx].match.def === def) {
                valid = !0;
                break;
            }
            return valid;
        }
        function getTests(pos, ndxIntlzr, tstPs) {
            function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {
                function handleMatch(match, loopNdx, quantifierRecurse) {
                    function isFirstMatch(latestMatch, tokenGroup) {
                        var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);
                        return firstMatch || $.each(tokenGroup.matches, function(ndx, match) {
                            if (match.isQuantifier === !0 && (firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]))) return !1;
                        }), firstMatch;
                    }
                    function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {
                        var bestMatch, indexPos;
                        return (getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) && $.each(getMaskSet().tests[pos] || [ getMaskSet().validPositions[pos] ], function(ndx, lmnt) {
                            var alternation = void 0 !== targetAlternation ? targetAlternation : lmnt.alternation, ndxPos = void 0 !== lmnt.locator[alternation] ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;
                            (void 0 === indexPos || ndxPos < indexPos) && ndxPos !== -1 && (bestMatch = lmnt, 
                            indexPos = ndxPos);
                        }), bestMatch ? bestMatch.locator.slice((void 0 !== targetAlternation ? targetAlternation : bestMatch.alternation) + 1) : void 0 !== targetAlternation ? resolveNdxInitializer(pos, alternateNdx) : void 0;
                    }
                    function staticCanMatchDefinition(source, target) {
                        return null === source.match.fn && null !== target.match.fn && target.match.fn.test(source.match.def, getMaskSet(), pos, !1, opts, !1);
                    }
                    if (testPos > 1e4) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;
                    if (testPos === pos && void 0 === match.matches) return matches.push({
                        match: match,
                        locator: loopNdx.reverse(),
                        cd: cacheDependency
                    }), !0;
                    if (void 0 !== match.matches) {
                        if (match.isGroup && quantifierRecurse !== match) {
                            if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx)) return !0;
                        } else if (match.isOptional) {
                            var optionalToken = match;
                            if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) {
                                if (latestMatch = matches[matches.length - 1].match, !isFirstMatch(latestMatch, optionalToken)) return !0;
                                insertStop = !0, testPos = pos;
                            }
                        } else if (match.isAlternator) {
                            var maltMatches, alternateToken = match, malternateMatches = [], currentMatches = matches.slice(), loopNdxCnt = loopNdx.length, altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;
                            if (altIndex === -1 || "string" == typeof altIndex) {
                                var amndx, currentPos = testPos, ndxInitializerClone = ndxInitializer.slice(), altIndexArr = [];
                                if ("string" == typeof altIndex) altIndexArr = altIndex.split(","); else for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx);
                                for (var ndx = 0; ndx < altIndexArr.length; ndx++) {
                                    if (amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(), 
                                    match = handleMatch(alternateToken.matches[amndx] || maskToken.matches[amndx], [ amndx ].concat(loopNdx), quantifierRecurse) || match, 
                                    match !== !0 && void 0 !== match && altIndexArr[altIndexArr.length - 1] < alternateToken.matches.length) {
                                        var ntndx = $.inArray(match, maskToken.matches) + 1;
                                        maskToken.matches.length > ntndx && (match = handleMatch(maskToken.matches[ntndx], [ ntndx ].concat(loopNdx.slice(1, loopNdx.length)), quantifierRecurse), 
                                        match && (altIndexArr.push(ntndx.toString()), $.each(matches, function(ndx, lmnt) {
                                            lmnt.alternation = loopNdx.length - 1;
                                        })));
                                    }
                                    maltMatches = matches.slice(), testPos = currentPos, matches = [];
                                    for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
                                        var altMatch = maltMatches[ndx1], hasMatch = !1;
                                        altMatch.alternation = altMatch.alternation || loopNdxCnt;
                                        for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
                                            var altMatch2 = malternateMatches[ndx2];
                                            if (("string" != typeof altIndex || $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr) !== -1) && (altMatch.match.def === altMatch2.match.def || staticCanMatchDefinition(altMatch, altMatch2))) {
                                                hasMatch = altMatch.match.nativeDef === altMatch2.match.nativeDef, altMatch.alternation == altMatch2.alternation && altMatch2.locator[altMatch2.alternation].toString().indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.locator[altMatch2.alternation] = altMatch2.locator[altMatch2.alternation] + "," + altMatch.locator[altMatch.alternation], 
                                                altMatch2.alternation = altMatch.alternation, null == altMatch.match.fn && (altMatch2.na = altMatch2.na || altMatch.locator[altMatch.alternation].toString(), 
                                                altMatch2.na.indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.na = altMatch2.na + "," + altMatch.locator[altMatch.alternation])));
                                                break;
                                            }
                                        }
                                        hasMatch || malternateMatches.push(altMatch);
                                    }
                                }
                                "string" == typeof altIndex && (malternateMatches = $.map(malternateMatches, function(lmnt, ndx) {
                                    if (isFinite(ndx)) {
                                        var mamatch, alternation = lmnt.alternation, altLocArr = lmnt.locator[alternation].toString().split(",");
                                        lmnt.locator[alternation] = void 0, lmnt.alternation = void 0;
                                        for (var alndx = 0; alndx < altLocArr.length; alndx++) mamatch = $.inArray(altLocArr[alndx], altIndexArr) !== -1, 
                                        mamatch && (void 0 !== lmnt.locator[alternation] ? (lmnt.locator[alternation] += ",", 
                                        lmnt.locator[alternation] += altLocArr[alndx]) : lmnt.locator[alternation] = parseInt(altLocArr[alndx]), 
                                        lmnt.alternation = alternation);
                                        if (void 0 !== lmnt.locator[alternation]) return lmnt;
                                    }
                                })), matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = matches.length > 0, 
                                ndxInitializer = ndxInitializerClone.slice();
                            } else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [ altIndex ].concat(loopNdx), quantifierRecurse);
                            if (match) return !0;
                        } else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) for (var qt = match, qndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {
                            var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
                            if (match = handleMatch(tokenGroup, [ qndx ].concat(loopNdx), tokenGroup)) {
                                if (latestMatch = matches[matches.length - 1].match, latestMatch.optionalQuantifier = qndx > qt.quantifier.min - 1, 
                                isFirstMatch(latestMatch, tokenGroup)) {
                                    if (qndx > qt.quantifier.min - 1) {
                                        insertStop = !0, testPos = pos;
                                        break;
                                    }
                                    return !0;
                                }
                                return !0;
                            }
                        } else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) return !0;
                    } else testPos++;
                }
                for (var tndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++) if (maskToken.matches[tndx].isQuantifier !== !0) {
                    var match = handleMatch(maskToken.matches[tndx], [ tndx ].concat(loopNdx), quantifierRecurse);
                    if (match && testPos === pos) return match;
                    if (testPos > pos) break;
                }
            }
            function mergeLocators(tests) {
                var locator = [];
                return $.isArray(tests) || (tests = [ tests ]), tests.length > 0 && (void 0 === tests[0].alternation ? (locator = determineTestTemplate(tests.slice()).locator.slice(), 
                0 === locator.length && (locator = tests[0].locator.slice())) : $.each(tests, function(ndx, tst) {
                    if ("" !== tst.def) if (0 === locator.length) locator = tst.locator.slice(); else for (var i = 0; i < locator.length; i++) tst.locator[i] && locator[i].toString().indexOf(tst.locator[i]) === -1 && (locator[i] += "," + tst.locator[i]);
                })), locator;
            }
            function filterTests(tests) {
                return opts.keepStatic && pos > 0 && tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0) && tests[0].match.optionality !== !0 && tests[0].match.optionalQuantifier !== !0 && null === tests[0].match.fn && !/[0-9a-bA-Z]/.test(tests[0].match.def) ? [ determineTestTemplate(tests) ] : tests;
            }
            var latestMatch, maskTokens = getMaskSet().maskToken, testPos = ndxIntlzr ? tstPs : 0, ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [ 0 ], matches = [], insertStop = !1, cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";
            if (pos > -1) {
                if (void 0 === ndxIntlzr) {
                    for (var test, previousPos = pos - 1; void 0 === (test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) && previousPos > -1; ) previousPos--;
                    void 0 !== test && previousPos > -1 && (ndxInitializer = mergeLocators(test), cacheDependency = ndxInitializer.join(""), 
                    testPos = previousPos);
                }
                if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) return filterTests(getMaskSet().tests[pos]);
                for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
                    var match = resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [ mtndx ]);
                    if (match && testPos === pos || testPos > pos) break;
                }
            }
            return (0 === matches.length || insertStop) && matches.push({
                match: {
                    fn: null,
                    cardinality: 0,
                    optionality: !0,
                    casing: null,
                    def: "",
                    placeholder: ""
                },
                locator: [],
                cd: cacheDependency
            }), void 0 !== ndxIntlzr && getMaskSet().tests[pos] ? filterTests($.extend(!0, [], matches)) : (getMaskSet().tests[pos] = $.extend(!0, [], matches), 
            filterTests(getMaskSet().tests[pos]));
        }
        function getBufferTemplate() {
            return void 0 === getMaskSet()._buffer && (getMaskSet()._buffer = getMaskTemplate(!1, 1), 
            void 0 === getMaskSet().buffer && getMaskSet()._buffer.slice()), getMaskSet()._buffer;
        }
        function getBuffer(noCache) {
            return void 0 !== getMaskSet().buffer && noCache !== !0 || (getMaskSet().buffer = getMaskTemplate(!0, getLastValidPosition(), !0)), 
            getMaskSet().buffer;
        }
        function refreshFromBuffer(start, end, buffer) {
            var i;
            if (start === !0) resetMaskSet(), start = 0, end = buffer.length; else for (i = start; i < end; i++) delete getMaskSet().validPositions[i];
            for (i = start; i < end; i++) resetMaskSet(!0), buffer[i] !== opts.skipOptionalPartCharacter && isValid(i, buffer[i], !0, !0);
        }
        function casing(elem, test, pos) {
            switch (opts.casing || test.casing) {
              case "upper":
                elem = elem.toUpperCase();
                break;

              case "lower":
                elem = elem.toLowerCase();
                break;

              case "title":
                var posBefore = getMaskSet().validPositions[pos - 1];
                elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase();
            }
            return elem;
        }
        function checkAlternationMatch(altArr1, altArr2, na) {
            for (var naNdx, altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, naArr = void 0 !== na ? na.split(",") : [], i = 0; i < naArr.length; i++) (naNdx = altArr1.indexOf(naArr[i])) !== -1 && altArr1.splice(naNdx, 1);
            for (var alndx = 0; alndx < altArr1.length; alndx++) if ($.inArray(altArr1[alndx], altArrC) !== -1) {
                isMatch = !0;
                break;
            }
            return isMatch;
        }
        function isValid(pos, c, strict, fromSetValid, fromAlternate) {
            function isSelection(posObj) {
                var selection = isRTL ? posObj.begin - posObj.end > 1 || posObj.begin - posObj.end === 1 && opts.insertMode : posObj.end - posObj.begin > 1 || posObj.end - posObj.begin === 1 && opts.insertMode;
                return selection && 0 === posObj.begin && posObj.end === getMaskSet().maskLength ? "full" : selection;
            }
            function _isValid(position, c, strict) {
                var rslt = !1;
                return $.each(getTests(position), function(ndx, tst) {
                    for (var test = tst.match, loopend = c ? 1 : 0, chrs = "", i = test.cardinality; i > loopend; i--) chrs += getBufferElement(position - (i - 1));
                    if (c && (chrs += c), getBuffer(!0), rslt = null != test.fn ? test.fn.test(chrs, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {
                        c: getPlaceholder(position, test, !0) || test.def,
                        pos: position
                    }, rslt !== !1) {
                        var elem = void 0 !== rslt.c ? rslt.c : c;
                        elem = elem === opts.skipOptionalPartCharacter && null === test.fn ? getPlaceholder(position, test, !0) || test.def : elem;
                        var validatedPos = position, possibleModifiedBuffer = getBuffer();
                        if (void 0 !== rslt.remove && ($.isArray(rslt.remove) || (rslt.remove = [ rslt.remove ]), 
                        $.each(rslt.remove.sort(function(a, b) {
                            return b - a;
                        }), function(ndx, lmnt) {
                            stripValidPositions(lmnt, lmnt + 1, !0);
                        })), void 0 !== rslt.insert && ($.isArray(rslt.insert) || (rslt.insert = [ rslt.insert ]), 
                        $.each(rslt.insert.sort(function(a, b) {
                            return a - b;
                        }), function(ndx, lmnt) {
                            isValid(lmnt.pos, lmnt.c, !0, fromSetValid);
                        })), rslt.refreshFromBuffer) {
                            var refresh = rslt.refreshFromBuffer;
                            if (strict = !0, refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, possibleModifiedBuffer), 
                            void 0 === rslt.pos && void 0 === rslt.c) return rslt.pos = getLastValidPosition(), 
                            !1;
                            if (validatedPos = void 0 !== rslt.pos ? rslt.pos : position, validatedPos !== position) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0, fromSetValid)), 
                            !1;
                        } else if (rslt !== !0 && void 0 !== rslt.pos && rslt.pos !== position && (validatedPos = rslt.pos, 
                        refreshFromBuffer(position, validatedPos, getBuffer().slice()), validatedPos !== position)) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0)), 
                        !1;
                        return (rslt === !0 || void 0 !== rslt.pos || void 0 !== rslt.c) && (ndx > 0 && resetMaskSet(!0), 
                        setValidPosition(validatedPos, $.extend({}, tst, {
                            input: casing(elem, test, validatedPos)
                        }), fromSetValid, isSelection(pos)) || (rslt = !1), !1);
                    }
                }), rslt;
            }
            function alternate(pos, c, strict) {
                var lastAlt, alternation, altPos, prevAltPos, i, validPos, altNdxs, decisionPos, validPsClone = $.extend(!0, {}, getMaskSet().validPositions), isValidRslt = !1, lAltPos = getLastValidPosition();
                for (prevAltPos = getMaskSet().validPositions[lAltPos]; lAltPos >= 0; lAltPos--) if (altPos = getMaskSet().validPositions[lAltPos], 
                altPos && void 0 !== altPos.alternation) {
                    if (lastAlt = lAltPos, alternation = getMaskSet().validPositions[lastAlt].alternation, 
                    prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;
                    prevAltPos = altPos;
                }
                if (void 0 !== alternation) {
                    decisionPos = parseInt(lastAlt);
                    var decisionTaker = void 0 !== prevAltPos.locator[prevAltPos.alternation || alternation] ? prevAltPos.locator[prevAltPos.alternation || alternation] : altNdxs[0];
                    decisionTaker.length > 0 && (decisionTaker = decisionTaker.split(",")[0]);
                    var possibilityPos = getMaskSet().validPositions[decisionPos], prevPos = getMaskSet().validPositions[decisionPos - 1];
                    $.each(getTests(decisionPos, prevPos ? prevPos.locator : void 0, decisionPos - 1), function(ndx, test) {
                        altNdxs = test.locator[alternation] ? test.locator[alternation].toString().split(",") : [];
                        for (var mndx = 0; mndx < altNdxs.length; mndx++) {
                            var validInputs = [], staticInputsBeforePos = 0, staticInputsBeforePosAlternate = 0, verifyValidInput = !1;
                            if (decisionTaker < altNdxs[mndx] && (void 0 === test.na || $.inArray(altNdxs[mndx], test.na.split(",")) === -1)) {
                                getMaskSet().validPositions[decisionPos] = $.extend(!0, {}, test);
                                var possibilities = getMaskSet().validPositions[decisionPos].locator;
                                for (getMaskSet().validPositions[decisionPos].locator[alternation] = parseInt(altNdxs[mndx]), 
                                null == test.match.fn ? (possibilityPos.input !== test.match.def && (verifyValidInput = !0, 
                                possibilityPos.generatedInput !== !0 && validInputs.push(possibilityPos.input)), 
                                staticInputsBeforePosAlternate++, getMaskSet().validPositions[decisionPos].generatedInput = !/[0-9a-bA-Z]/.test(test.match.def), 
                                getMaskSet().validPositions[decisionPos].input = test.match.def) : getMaskSet().validPositions[decisionPos].input = possibilityPos.input, 
                                i = decisionPos + 1; i < getLastValidPosition(void 0, !0) + 1; i++) validPos = getMaskSet().validPositions[i], 
                                validPos && validPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(validPos.input) ? validInputs.push(validPos.input) : i < pos && staticInputsBeforePos++, 
                                delete getMaskSet().validPositions[i];
                                for (verifyValidInput && validInputs[0] === test.match.def && validInputs.shift(), 
                                resetMaskSet(!0), isValidRslt = !0; validInputs.length > 0; ) {
                                    var input = validInputs.shift();
                                    if (input !== opts.skipOptionalPartCharacter && !(isValidRslt = isValid(getLastValidPosition(void 0, !0) + 1, input, !1, fromSetValid, !0))) break;
                                }
                                if (isValidRslt) {
                                    getMaskSet().validPositions[decisionPos].locator = possibilities;
                                    var targetLvp = getLastValidPosition(pos) + 1;
                                    for (i = decisionPos + 1; i < getLastValidPosition() + 1; i++) validPos = getMaskSet().validPositions[i], 
                                    (void 0 === validPos || null == validPos.match.fn) && i < pos + (staticInputsBeforePosAlternate - staticInputsBeforePos) && staticInputsBeforePosAlternate++;
                                    pos += staticInputsBeforePosAlternate - staticInputsBeforePos, isValidRslt = isValid(pos > targetLvp ? targetLvp : pos, c, strict, fromSetValid, !0);
                                }
                                if (isValidRslt) return !1;
                                resetMaskSet(), getMaskSet().validPositions = $.extend(!0, {}, validPsClone);
                            }
                        }
                    });
                }
                return isValidRslt;
            }
            function trackbackAlternations(originalPos, newPos) {
                var vp = getMaskSet().validPositions[newPos];
                if (vp) for (var targetLocator = vp.locator, tll = targetLocator.length, ps = originalPos; ps < newPos; ps++) if (void 0 === getMaskSet().validPositions[ps] && !isMask(ps, !0)) {
                    var tests = getTests(ps).slice(), bestMatch = determineTestTemplate(tests, !0), equality = -1;
                    "" === tests[tests.length - 1].match.def && tests.pop(), $.each(tests, function(ndx, tst) {
                        for (var i = 0; i < tll; i++) {
                            if (void 0 === tst.locator[i] || !checkAlternationMatch(tst.locator[i].toString().split(","), targetLocator[i].toString().split(","), tst.na)) {
                                var targetAI = targetLocator[i], bestMatchAI = bestMatch.locator[i], tstAI = tst.locator[i];
                                targetAI - bestMatchAI > Math.abs(targetAI - tstAI) && (bestMatch = tst);
                                break;
                            }
                            equality < i && (equality = i, bestMatch = tst);
                        }
                    }), bestMatch = $.extend({}, bestMatch, {
                        input: getPlaceholder(ps, bestMatch.match, !0) || bestMatch.match.def
                    }), bestMatch.generatedInput = !0, setValidPosition(ps, bestMatch, !0), getMaskSet().validPositions[newPos] = void 0, 
                    _isValid(newPos, vp.input, !0);
                }
            }
            function setValidPosition(pos, validTest, fromSetValid, isSelection) {
                if (isSelection || opts.insertMode && void 0 !== getMaskSet().validPositions[pos] && void 0 === fromSetValid) {
                    var i, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), lvp = getLastValidPosition(void 0, !0);
                    for (i = pos; i <= lvp; i++) delete getMaskSet().validPositions[i];
                    getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                    var j, valid = !0, vps = getMaskSet().validPositions, needsValidation = !1, initialLength = getMaskSet().maskLength;
                    for (i = j = pos; i <= lvp; i++) {
                        var t = positionsClone[i];
                        if (void 0 !== t) for (var posMatch = j; posMatch < getMaskSet().maskLength && (null === t.match.fn && vps[i] && (vps[i].match.optionalQuantifier === !0 || vps[i].match.optionality === !0) || null != t.match.fn); ) {
                            if (posMatch++, needsValidation === !1 && positionsClone[posMatch] && positionsClone[posMatch].match.def === t.match.def) getMaskSet().validPositions[posMatch] = $.extend(!0, {}, positionsClone[posMatch]), 
                            getMaskSet().validPositions[posMatch].input = t.input, fillMissingNonMask(posMatch), 
                            j = posMatch, valid = !0; else if (positionCanMatchDefinition(posMatch, t.match.def)) {
                                var result = isValid(posMatch, t.input, !0, !0);
                                valid = result !== !1, j = result.caret || result.insert ? getLastValidPosition() : posMatch, 
                                needsValidation = !0;
                            } else if (valid = t.generatedInput === !0, !valid && posMatch >= getMaskSet().maskLength - 1) break;
                            if (getMaskSet().maskLength < initialLength && (getMaskSet().maskLength = initialLength), 
                            valid) break;
                        }
                        if (!valid) break;
                    }
                    if (!valid) return getMaskSet().validPositions = $.extend(!0, {}, positionsClone), 
                    resetMaskSet(!0), !1;
                } else getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                return resetMaskSet(!0), !0;
            }
            function fillMissingNonMask(maskPos) {
                for (var pndx = maskPos - 1; pndx > -1 && !getMaskSet().validPositions[pndx]; pndx--) ;
                var testTemplate, testsFromPos;
                for (pndx++; pndx < maskPos; pndx++) void 0 === getMaskSet().validPositions[pndx] && (opts.jitMasking === !1 || opts.jitMasking > pndx) && (testsFromPos = getTests(pndx, getTestTemplate(pndx - 1).locator, pndx - 1).slice(), 
                "" === testsFromPos[testsFromPos.length - 1].match.def && testsFromPos.pop(), testTemplate = determineTestTemplate(testsFromPos), 
                testTemplate && (testTemplate.match.def === opts.radixPointDefinitionSymbol || !isMask(pndx, !0) || $.inArray(opts.radixPoint, getBuffer()) < pndx && testTemplate.match.fn && testTemplate.match.fn.test(getPlaceholder(pndx), getMaskSet(), pndx, !1, opts)) && (result = _isValid(pndx, getPlaceholder(pndx, testTemplate.match, !0) || (null == testTemplate.match.fn ? testTemplate.match.def : "" !== getPlaceholder(pndx) ? getPlaceholder(pndx) : getBuffer()[pndx]), !0), 
                result !== !1 && (getMaskSet().validPositions[result.pos || pndx].generatedInput = !0)));
            }
            strict = strict === !0;
            var maskPos = pos;
            void 0 !== pos.begin && (maskPos = isRTL && !isSelection(pos) ? pos.end : pos.begin);
            var result = !1, positionsClone = $.extend(!0, {}, getMaskSet().validPositions);
            if (fillMissingNonMask(maskPos), isSelection(pos) && (handleRemove(void 0, Inputmask.keyCode.DELETE, pos), 
            maskPos = getMaskSet().p), maskPos < getMaskSet().maskLength && (result = _isValid(maskPos, c, strict), 
            (!strict || fromSetValid === !0) && result === !1)) {
                var currentPosValid = getMaskSet().validPositions[maskPos];
                if (!currentPosValid || null !== currentPosValid.match.fn || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {
                    if ((opts.insertMode || void 0 === getMaskSet().validPositions[seekNext(maskPos)]) && !isMask(maskPos, !0)) for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) if (result = _isValid(nPos, c, strict), 
                    result !== !1) {
                        trackbackAlternations(maskPos, void 0 !== result.pos ? result.pos : nPos), maskPos = nPos;
                        break;
                    }
                } else result = {
                    caret: seekNext(maskPos)
                };
            }
            return result === !1 && opts.keepStatic && !strict && fromAlternate !== !0 && (result = alternate(maskPos, c, strict)), 
            result === !0 && (result = {
                pos: maskPos
            }), $.isFunction(opts.postValidation) && result !== !1 && !strict && fromSetValid !== !0 && (result = !!opts.postValidation(getBuffer(!0), result, opts) && result), 
            void 0 === result.pos && (result.pos = maskPos), result === !1 && (resetMaskSet(!0), 
            getMaskSet().validPositions = $.extend(!0, {}, positionsClone)), result;
        }
        function isMask(pos, strict) {
            var test;
            if (strict ? (test = getTestTemplate(pos).match, "" === test.def && (test = getTest(pos).match)) : test = getTest(pos).match, 
            null != test.fn) return test.fn;
            if (strict !== !0 && pos > -1) {
                var tests = getTests(pos);
                return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0);
            }
            return !1;
        }
        function seekNext(pos, newBlock) {
            var maskL = getMaskSet().maskLength;
            if (pos >= maskL) return maskL;
            for (var position = pos; ++position < maskL && (newBlock === !0 && (getTest(position).match.newBlockMarker !== !0 || !isMask(position)) || newBlock !== !0 && !isMask(position)); ) ;
            return position;
        }
        function seekPrevious(pos, newBlock) {
            var tests, position = pos;
            if (position <= 0) return 0;
            for (;--position > 0 && (newBlock === !0 && getTest(position).match.newBlockMarker !== !0 || newBlock !== !0 && !isMask(position) && (tests = getTests(position), 
            tests.length < 2 || 2 === tests.length && "" === tests[1].match.def)); ) ;
            return position;
        }
        function getBufferElement(position) {
            return void 0 === getMaskSet().validPositions[position] ? getPlaceholder(position) : getMaskSet().validPositions[position].input;
        }
        function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {
            if (event && $.isFunction(opts.onBeforeWrite)) {
                var result = opts.onBeforeWrite(event, buffer, caretPos, opts);
                if (result) {
                    if (result.refreshFromBuffer) {
                        var refresh = result.refreshFromBuffer;
                        refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer || buffer), 
                        buffer = getBuffer(!0);
                    }
                    void 0 !== caretPos && (caretPos = void 0 !== result.caret ? result.caret : caretPos);
                }
            }
            input.inputmask._valueSet(buffer.join("")), void 0 === caretPos || void 0 !== event && "blur" === event.type ? renderColorMask(input, buffer, caretPos) : caret(input, caretPos), 
            triggerInputEvent === !0 && (skipInputEvent = !0, $(input).trigger("input"));
        }
        function getPlaceholder(pos, test, returnPL) {
            if (test = test || getTest(pos).match, void 0 !== test.placeholder || returnPL === !0) return $.isFunction(test.placeholder) ? test.placeholder(opts) : test.placeholder;
            if (null === test.fn) {
                if (pos > -1 && void 0 === getMaskSet().validPositions[pos]) {
                    var prevTest, tests = getTests(pos), staticAlternations = [];
                    if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)) for (var i = 0; i < tests.length; i++) if (tests[i].match.optionality !== !0 && tests[i].match.optionalQuantifier !== !0 && (null === tests[i].match.fn || void 0 === prevTest || tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, !0, opts) !== !1) && (staticAlternations.push(tests[i]), 
                    null === tests[i].match.fn && (prevTest = tests[i]), staticAlternations.length > 1 && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length);
                }
                return test.def;
            }
            return opts.placeholder.charAt(pos % opts.placeholder.length);
        }
        function checkVal(input, writeOut, strict, nptvl, initiatingEvent, stickyCaret) {
            function isTemplateMatch() {
                var isMatch = !1, charCodeNdx = getBufferTemplate().slice(initialNdx, seekNext(initialNdx)).join("").indexOf(charCodes);
                if (charCodeNdx !== -1 && !isMask(initialNdx)) {
                    isMatch = !0;
                    for (var bufferTemplateArr = getBufferTemplate().slice(initialNdx, initialNdx + charCodeNdx), i = 0; i < bufferTemplateArr.length; i++) if (" " !== bufferTemplateArr[i]) {
                        isMatch = !1;
                        break;
                    }
                }
                return isMatch;
            }
            var inputValue = nptvl.slice(), charCodes = "", initialNdx = 0, result = void 0;
            if (resetMaskSet(), getMaskSet().p = seekNext(-1), !strict) if (opts.autoUnmask !== !0) {
                var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""), matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));
                matches && matches.length > 0 && (inputValue.splice(0, matches.length * staticInput.length), 
                initialNdx = seekNext(initialNdx));
            } else initialNdx = seekNext(initialNdx);
            if ($.each(inputValue, function(ndx, charCode) {
                if (void 0 !== charCode) {
                    var keypress = new $.Event("keypress");
                    keypress.which = charCode.charCodeAt(0), charCodes += charCode;
                    var lvp = getLastValidPosition(void 0, !0), lvTest = getMaskSet().validPositions[lvp], nextTest = getTestTemplate(lvp + 1, lvTest ? lvTest.locator.slice() : void 0, lvp);
                    if (!isTemplateMatch() || strict || opts.autoUnmask) {
                        var pos = strict ? ndx : null == nextTest.match.fn && nextTest.match.optionality && lvp + 1 < getMaskSet().p ? lvp + 1 : getMaskSet().p;
                        result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, pos), 
                        initialNdx = pos + 1, charCodes = "";
                    } else result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, !0, lvp + 1);
                    if (!strict && $.isFunction(opts.onBeforeWrite) && (result = opts.onBeforeWrite(keypress, getBuffer(), result.forwardPosition, opts), 
                    result && result.refreshFromBuffer)) {
                        var refresh = result.refreshFromBuffer;
                        refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer), 
                        resetMaskSet(!0), result.caret && (getMaskSet().p = result.caret);
                    }
                }
            }), writeOut) {
                var caretPos = void 0, lvp = getLastValidPosition();
                document.activeElement === input && (initiatingEvent || result) && (caretPos = caret(input).begin, 
                initiatingEvent && result === !1 && (caretPos = seekNext(getLastValidPosition(caretPos))), 
                result && stickyCaret !== !0 && (caretPos < lvp + 1 || lvp === -1) && (caretPos = opts.numericInput && void 0 === result.caret ? seekPrevious(result.forwardPosition) : result.forwardPosition)), 
                writeBuffer(input, getBuffer(), caretPos, initiatingEvent || new $.Event("checkval"));
            }
        }
        function unmaskedvalue(input) {
            if (input) {
                if (void 0 === input.inputmask) return input.value;
                input.inputmask && input.inputmask.refreshValue && EventHandlers.setValueEvent.call(input);
            }
            var umValue = [], vps = getMaskSet().validPositions;
            for (var pndx in vps) vps[pndx].match && null != vps[pndx].match.fn && umValue.push(vps[pndx].input);
            var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");
            if ($.isFunction(opts.onUnMask)) {
                var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
                unmaskedValue = opts.onUnMask(bufferValue, unmaskedValue, opts) || unmaskedValue;
            }
            return unmaskedValue;
        }
        function caret(input, begin, end, notranslate) {
            function translatePosition(pos) {
                if (notranslate !== !0 && isRTL && "number" == typeof pos && (!opts.greedy || "" !== opts.placeholder)) {
                    var bffrLght = getBuffer().join("").length;
                    pos = bffrLght - pos;
                }
                return pos;
            }
            var range;
            if ("number" != typeof begin) return input.setSelectionRange ? (begin = input.selectionStart, 
            end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0), 
            range.commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset, 
            end = range.endOffset)) : document.selection && document.selection.createRange && (range = document.selection.createRange(), 
            begin = 0 - range.duplicate().moveStart("character", -input.inputmask._valueGet().length), 
            end = begin + range.text.length), {
                begin: translatePosition(begin),
                end: translatePosition(end)
            };
            begin = translatePosition(begin), end = translatePosition(end), end = "number" == typeof end ? end : begin;
            var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
            if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, mobile || opts.insertMode !== !1 || begin !== end || end++, 
            input.setSelectionRange) input.selectionStart = begin, input.selectionEnd = end; else if (window.getSelection) {
                if (range = document.createRange(), void 0 === input.firstChild || null === input.firstChild) {
                    var textNode = document.createTextNode("");
                    input.appendChild(textNode);
                }
                range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length), 
                range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length), 
                range.collapse(!0);
                var sel = window.getSelection();
                sel.removeAllRanges(), sel.addRange(range);
            } else input.createTextRange && (range = input.createTextRange(), range.collapse(!0), 
            range.moveEnd("character", end), range.moveStart("character", begin), range.select());
            renderColorMask(input, void 0, {
                begin: begin,
                end: end
            });
        }
        function determineLastRequiredPosition(returnDefinition) {
            var pos, testPos, buffer = getBuffer(), bl = buffer.length, lvp = getLastValidPosition(), positions = {}, lvTest = getMaskSet().validPositions[lvp], ndxIntlzr = void 0 !== lvTest ? lvTest.locator.slice() : void 0;
            for (pos = lvp + 1; pos < buffer.length; pos++) testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), 
            ndxIntlzr = testPos.locator.slice(), positions[pos] = $.extend(!0, {}, testPos);
            var lvTestAlt = lvTest && void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation] : void 0;
            for (pos = bl - 1; pos > lvp && (testPos = positions[pos], (testPos.match.optionality || testPos.match.optionalQuantifier || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && null != testPos.match.fn || null === testPos.match.fn && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;
            return returnDefinition ? {
                l: bl,
                def: positions[bl] ? positions[bl].match : void 0
            } : bl;
        }
        function clearOptionalTail(buffer) {
            for (var validPos, rl = determineLastRequiredPosition(), bl = buffer.length; rl < bl && !isMask(rl + 1) && (validPos = getTest(rl + 1)) && validPos.match.optionality !== !0 && validPos.match.optionalQuantifier !== !0; ) rl++;
            for (;(validPos = getTest(rl - 1)) && validPos.match.optionality && validPos.input === opts.skipOptionalPartCharacter; ) rl--;
            return buffer.splice(rl), buffer;
        }
        function isComplete(buffer) {
            if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
            if ("*" !== opts.repeat) {
                var complete = !1, lrp = determineLastRequiredPosition(!0), aml = seekPrevious(lrp.l);
                if (void 0 === lrp.def || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
                    complete = !0;
                    for (var i = 0; i <= aml; i++) {
                        var test = getTestTemplate(i).match;
                        if (null !== test.fn && void 0 === getMaskSet().validPositions[i] && test.optionality !== !0 && test.optionalQuantifier !== !0 || null === test.fn && buffer[i] !== getPlaceholder(i, test)) {
                            complete = !1;
                            break;
                        }
                    }
                }
                return complete;
            }
        }
        function handleRemove(input, k, pos, strict) {
            function generalize() {
                if (opts.keepStatic) {
                    for (var validInputs = [], lastAlt = getLastValidPosition(-1, !0), positionsClone = $.extend(!0, {}, getMaskSet().validPositions), prevAltPos = getMaskSet().validPositions[lastAlt]; lastAlt >= 0; lastAlt--) {
                        var altPos = getMaskSet().validPositions[lastAlt];
                        if (altPos) {
                            if (altPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(altPos.input) && validInputs.push(altPos.input), 
                            delete getMaskSet().validPositions[lastAlt], void 0 !== altPos.alternation && altPos.locator[altPos.alternation] !== prevAltPos.locator[altPos.alternation]) break;
                            prevAltPos = altPos;
                        }
                    }
                    if (lastAlt > -1) for (getMaskSet().p = seekNext(getLastValidPosition(-1, !0)); validInputs.length > 0; ) {
                        var keypress = new $.Event("keypress");
                        keypress.which = validInputs.pop().charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !1, !1, getMaskSet().p);
                    } else getMaskSet().validPositions = $.extend(!0, {}, positionsClone);
                }
            }
            if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE), 
            isRTL)) {
                var pend = pos.end;
                pos.end = pos.begin, pos.begin = pend;
            }
            k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || opts.insertMode === !1) ? (pos.begin = seekPrevious(pos.begin), 
            void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.begin--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0) ? pos.end + 1 : seekNext(pos.end) + 1, 
            void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.end++), 
            stripValidPositions(pos.begin, pos.end, !1, strict), strict !== !0 && generalize();
            var lvp = getLastValidPosition(pos.begin, !0);
            lvp < pos.begin ? getMaskSet().p = seekNext(lvp) : strict !== !0 && (getMaskSet().p = pos.begin);
        }
        function initializeColorMask(input) {
            function findCaretPos(clientx) {
                var caretPos, e = document.createElement("span");
                for (var style in computedStyle) isNaN(style) && style.indexOf("font") !== -1 && (e.style[style] = computedStyle[style]);
                e.style.textTransform = computedStyle.textTransform, e.style.letterSpacing = computedStyle.letterSpacing, 
                e.style.position = "absolute", e.style.height = "auto", e.style.width = "auto", 
                e.style.visibility = "hidden", e.style.whiteSpace = "nowrap", document.body.appendChild(e);
                var itl, inputText = input.inputmask._valueGet(), previousWidth = 0;
                for (caretPos = 0, itl = inputText.length; caretPos <= itl; caretPos++) {
                    if (e.innerHTML += inputText.charAt(caretPos) || "_", e.offsetWidth >= clientx) {
                        var offset1 = clientx - previousWidth, offset2 = e.offsetWidth - clientx;
                        e.innerHTML = inputText.charAt(caretPos), offset1 -= e.offsetWidth / 3, caretPos = offset1 < offset2 ? caretPos - 1 : caretPos;
                        break;
                    }
                    previousWidth = e.offsetWidth;
                }
                return document.body.removeChild(e), caretPos;
            }
            function position() {
                colorMask.style.position = "absolute", colorMask.style.top = offset.top + "px", 
                colorMask.style.left = offset.left + "px", colorMask.style.width = parseInt(input.offsetWidth) - parseInt(computedStyle.paddingLeft) - parseInt(computedStyle.paddingRight) - parseInt(computedStyle.borderLeftWidth) - parseInt(computedStyle.borderRightWidth) + "px", 
                colorMask.style.height = parseInt(input.offsetHeight) - parseInt(computedStyle.paddingTop) - parseInt(computedStyle.paddingBottom) - parseInt(computedStyle.borderTopWidth) - parseInt(computedStyle.borderBottomWidth) + "px", 
                colorMask.style.lineHeight = colorMask.style.height, colorMask.style.zIndex = isNaN(computedStyle.zIndex) ? -1 : computedStyle.zIndex - 1, 
                colorMask.style.webkitAppearance = "textfield", colorMask.style.mozAppearance = "textfield", 
                colorMask.style.Appearance = "textfield";
            }
            var offset = $(input).position(), computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null);
            input.parentNode;
            colorMask = document.createElement("div"), document.body.appendChild(colorMask);
            for (var style in computedStyle) isNaN(style) && "cssText" !== style && style.indexOf("webkit") == -1 && (colorMask.style[style] = computedStyle[style]);
            input.style.backgroundColor = "transparent", input.style.color = "transparent", 
            input.style.webkitAppearance = "caret", input.style.mozAppearance = "caret", input.style.Appearance = "caret", 
            position(), $(window).on("resize", function(e) {
                offset = $(input).position(), computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null), 
                position();
            }), $(input).on("click", function(e) {
                return caret(input, findCaretPos(e.clientX)), EventHandlers.clickEvent.call(this, [ e ]);
            }), $(input).on("keydown", function(e) {
                e.shiftKey || opts.insertMode === !1 || setTimeout(function() {
                    renderColorMask(input);
                }, 0);
            });
        }
        function renderColorMask(input, buffer, caretPos) {
            function handleStatic() {
                isStatic || null !== test.fn && void 0 !== testPos.input ? isStatic && null !== test.fn && void 0 !== testPos.input && (isStatic = !1, 
                maskTemplate += "</span>") : (isStatic = !0, maskTemplate += "<span class='im-static''>");
            }
            if (void 0 !== colorMask) {
                buffer = buffer || getBuffer(), void 0 === caretPos ? caretPos = caret(input) : void 0 === caretPos.begin && (caretPos = {
                    begin: caretPos,
                    end: caretPos
                });
                var maskTemplate = "", isStatic = !1;
                if ("" != buffer) {
                    var ndxIntlzr, test, testPos, pos = 0, lvp = getLastValidPosition();
                    do pos === caretPos.begin && document.activeElement === input && (maskTemplate += "<span class='im-caret' style='border-right-width: 1px;border-right-style: solid;'></span>"), 
                    getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos], 
                    test = testPos.match, ndxIntlzr = testPos.locator.slice(), handleStatic(), maskTemplate += testPos.input) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), 
                    test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && (handleStatic(), 
                    maskTemplate += getPlaceholder(pos, test))), pos++; while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || lvp > pos);
                }
                colorMask.innerHTML = maskTemplate;
            }
        }
        function mask(elem) {
            function isElementTypeSupported(input, opts) {
                function patchValueProperty(npt) {
                    function patchValhook(type) {
                        if ($.valHooks && (void 0 === $.valHooks[type] || $.valHooks[type].inputmaskpatch !== !0)) {
                            var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function(elem) {
                                return elem.value;
                            }, valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function(elem, value) {
                                return elem.value = value, elem;
                            };
                            $.valHooks[type] = {
                                get: function(elem) {
                                    if (elem.inputmask) {
                                        if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();
                                        var result = valhookGet(elem);
                                        return getLastValidPosition(void 0, void 0, elem.inputmask.maskset.validPositions) !== -1 || opts.nullable !== !0 ? result : "";
                                    }
                                    return valhookGet(elem);
                                },
                                set: function(elem, value) {
                                    var result, $elem = $(elem);
                                    return result = valhookSet(elem, value), elem.inputmask && $elem.trigger("setvalue"), 
                                    result;
                                },
                                inputmaskpatch: !0
                            };
                        }
                    }
                    function getter() {
                        return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : getLastValidPosition() !== -1 || opts.nullable !== !0 ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this);
                    }
                    function setter(value) {
                        valueSet.call(this, value), this.inputmask && $(this).trigger("setvalue");
                    }
                    function installNativeValueSetFallback(npt) {
                        EventRuler.on(npt, "mouseenter", function(event) {
                            var $input = $(this), input = this, value = input.inputmask._valueGet();
                            value !== getBuffer().join("") && $input.trigger("setvalue");
                        });
                    }
                    var valueGet, valueSet;
                    if (!npt.inputmask.__valueGet) {
                        if (opts.noValuePatching !== !0) {
                            if (Object.getOwnPropertyDescriptor) {
                                "function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" == typeof "test".__proto__ ? function(object) {
                                    return object.__proto__;
                                } : function(object) {
                                    return object.constructor.prototype;
                                });
                                var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : void 0;
                                valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get, 
                                valueSet = valueProperty.set, Object.defineProperty(npt, "value", {
                                    get: getter,
                                    set: setter,
                                    configurable: !0
                                })) : "INPUT" !== npt.tagName && (valueGet = function() {
                                    return this.textContent;
                                }, valueSet = function(value) {
                                    this.textContent = value;
                                }, Object.defineProperty(npt, "value", {
                                    get: getter,
                                    set: setter,
                                    configurable: !0
                                }));
                            } else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"), 
                            valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter), 
                            npt.__defineSetter__("value", setter));
                            npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet;
                        }
                        npt.inputmask._valueGet = function(overruleRTL) {
                            return isRTL && overruleRTL !== !0 ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);
                        }, npt.inputmask._valueSet = function(value, overruleRTL) {
                            valueSet.call(this.el, null === value || void 0 === value ? "" : overruleRTL !== !0 && isRTL ? value.split("").reverse().join("") : value);
                        }, void 0 === valueGet && (valueGet = function() {
                            return this.value;
                        }, valueSet = function(value) {
                            this.value = value;
                        }, patchValhook(npt.type), installNativeValueSetFallback(npt));
                    }
                }
                var elementType = input.getAttribute("type"), isSupported = "INPUT" === input.tagName && $.inArray(elementType, opts.supportsInputType) !== -1 || input.isContentEditable || "TEXTAREA" === input.tagName;
                if (!isSupported) if ("INPUT" === input.tagName) {
                    var el = document.createElement("input");
                    el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null;
                } else isSupported = "partial";
                return isSupported !== !1 && patchValueProperty(input), isSupported;
            }
            EventRuler.off(el);
            var isSupported = isElementTypeSupported(elem, opts);
            if (isSupported !== !1 && (el = elem, $el = $(el), ("rtl" === el.dir || opts.rightAlign) && (el.style.textAlign = "right"), 
            ("rtl" === el.dir || opts.numericInput) && (el.dir = "ltr", el.removeAttribute("dir"), 
            el.inputmask.isRTL = !0, isRTL = !0), opts.colorMask === !0 && initializeColorMask(el), 
            android && (el.hasOwnProperty("inputmode") && (el.inputmode = opts.inputmode, el.setAttribute("inputmode", opts.inputmode)), 
            "rtfm" === opts.androidHack && (opts.colorMask !== !0 && initializeColorMask(el), 
            el.type = "password")), isSupported === !0 && (EventRuler.on(el, "submit", EventHandlers.submitEvent), 
            EventRuler.on(el, "reset", EventHandlers.resetEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent), 
            EventRuler.on(el, "blur", EventHandlers.blurEvent), EventRuler.on(el, "focus", EventHandlers.focusEvent), 
            EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), opts.colorMask !== !0 && EventRuler.on(el, "click", EventHandlers.clickEvent), 
            EventRuler.on(el, "dblclick", EventHandlers.dblclickEvent), EventRuler.on(el, "paste", EventHandlers.pasteEvent), 
            EventRuler.on(el, "dragdrop", EventHandlers.pasteEvent), EventRuler.on(el, "drop", EventHandlers.pasteEvent), 
            EventRuler.on(el, "cut", EventHandlers.cutEvent), EventRuler.on(el, "complete", opts.oncomplete), 
            EventRuler.on(el, "incomplete", opts.onincomplete), EventRuler.on(el, "cleared", opts.oncleared), 
            android && opts.inputEventOnly === !0 || (EventRuler.on(el, "keydown", EventHandlers.keydownEvent), 
            EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "compositionstart", $.noop), 
            EventRuler.on(el, "compositionupdate", $.noop), EventRuler.on(el, "compositionend", $.noop), 
            EventRuler.on(el, "keyup", $.noop), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent), 
            EventRuler.on(el, "beforeinput", $.noop)), EventRuler.on(el, "setvalue", EventHandlers.setValueEvent), 
            getBufferTemplate(), "" !== el.inputmask._valueGet() || opts.clearMaskOnLostFocus === !1 || document.activeElement === el)) {
                var initialValue = $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(el.inputmask._valueGet(), opts) || el.inputmask._valueGet() : el.inputmask._valueGet();
                checkVal(el, !0, !1, initialValue.split(""));
                var buffer = getBuffer().slice();
                undoValue = buffer.join(""), isComplete(buffer) === !1 && opts.clearIncomplete && resetMaskSet(), 
                opts.clearMaskOnLostFocus && document.activeElement !== el && (getLastValidPosition() === -1 ? buffer = [] : clearOptionalTail(buffer)), 
                writeBuffer(el, buffer), document.activeElement === el && caret(el, seekNext(getLastValidPosition()));
            }
        }
        maskset = maskset || this.maskset, opts = opts || this.opts;
        var undoValue, $el, maxLength, colorMask, valueBuffer, el = this.el, isRTL = this.isRTL, skipKeyPressEvent = !1, skipInputEvent = !1, ignorable = !1, mouseEnter = !1, EventRuler = {
            on: function(input, eventName, eventHandler) {
                var ev = function(e) {
                    if (void 0 === this.inputmask && "FORM" !== this.nodeName) {
                        var imOpts = $.data(this, "_inputmask_opts");
                        imOpts ? new Inputmask(imOpts).mask(this) : EventRuler.off(this);
                    } else {
                        if ("setvalue" === e.type || "FORM" === this.nodeName || !(this.disabled || this.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || opts.tabThrough === !1 && e.keyCode === Inputmask.keyCode.TAB))) {
                            switch (e.type) {
                              case "input":
                                if (skipInputEvent === !0) return skipInputEvent = !1, e.preventDefault();
                                break;

                              case "keydown":
                                skipKeyPressEvent = !1, skipInputEvent = !1;
                                break;

                              case "keypress":
                                if (skipKeyPressEvent === !0) return e.preventDefault();
                                skipKeyPressEvent = !0;
                                break;

                              case "click":
                                if (iemobile || iphone) {
                                    var that = this, args = arguments;
                                    return setTimeout(function() {
                                        eventHandler.apply(that, args);
                                    }, 0), !1;
                                }
                            }
                            var returnVal = eventHandler.apply(this, arguments);
                            return returnVal === !1 && (e.preventDefault(), e.stopPropagation()), returnVal;
                        }
                        e.preventDefault();
                    }
                };
                input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev), 
                $.inArray(eventName, [ "submit", "reset" ]) !== -1 ? null != input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev);
            },
            off: function(input, event) {
                if (input.inputmask && input.inputmask.events) {
                    var events;
                    event ? (events = [], events[event] = input.inputmask.events[event]) : events = input.inputmask.events, 
                    $.each(events, function(eventName, evArr) {
                        for (;evArr.length > 0; ) {
                            var ev = evArr.pop();
                            $.inArray(eventName, [ "submit", "reset" ]) !== -1 ? null != input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev);
                        }
                        delete input.inputmask.events[eventName];
                    });
                }
            }
        }, EventHandlers = {
            keydownEvent: function(e) {
                function isInputEventSupported(eventName) {
                    var el = document.createElement("input"), evName = "on" + eventName, isSupported = evName in el;
                    return isSupported || (el.setAttribute(evName, "return;"), isSupported = "function" == typeof el[evName]), 
                    el = null, isSupported;
                }
                var input = this, $input = $(input), k = e.keyCode, pos = caret(input);
                if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut")) e.preventDefault(), 
                handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join("")), 
                input.inputmask._valueGet() === getBufferTemplate().join("") ? $input.trigger("cleared") : isComplete(getBuffer()) === !0 && $input.trigger("complete"); else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {
                    e.preventDefault();
                    var caretPos = seekNext(getLastValidPosition());
                    opts.insertMode || caretPos !== getMaskSet().maskLength || e.shiftKey || caretPos--, 
                    caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0);
                } else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(), 
                caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && e.altKey !== !0 ? (checkVal(input, !0, !1, undoValue.split("")), 
                $input.trigger("click")) : k !== Inputmask.keyCode.INSERT || e.shiftKey || e.ctrlKey ? opts.tabThrough === !0 && k === Inputmask.keyCode.TAB ? (e.shiftKey === !0 ? (null === getTest(pos.begin).match.fn && (pos.begin = seekNext(pos.begin)), 
                pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0), 
                pos.end = seekNext(pos.begin, !0), pos.end < getMaskSet().maskLength && pos.end--), 
                pos.begin < getMaskSet().maskLength && (e.preventDefault(), caret(input, pos.begin, pos.end))) : e.shiftKey || opts.insertMode === !1 && (k === Inputmask.keyCode.RIGHT ? setTimeout(function() {
                    var caretPos = caret(input);
                    caret(input, caretPos.begin);
                }, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function() {
                    var caretPos = caret(input);
                    caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1);
                }, 0)) : (opts.insertMode = !opts.insertMode, caret(input, opts.insertMode || pos.begin !== getMaskSet().maskLength ? pos.begin : pos.begin - 1));
                opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts), ignorable = $.inArray(k, opts.ignorables) !== -1;
            },
            keypressEvent: function(e, checkval, writeOut, strict, ndx) {
                var input = this, $input = $(input), k = e.which || e.charCode || e.keyCode;
                if (!(checkval === !0 || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""), 
                setTimeout(function() {
                    $input.trigger("change");
                }, 0)), !0;
                if (k) {
                    46 === k && e.shiftKey === !1 && "" !== opts.radixPoint && (k = opts.radixPoint.charCodeAt(0));
                    var forwardPosition, pos = checkval ? {
                        begin: ndx,
                        end: ndx
                    } : caret(input), c = String.fromCharCode(k);
                    getMaskSet().writeOutBuffer = !0;
                    var valResult = isValid(pos, c, strict);
                    if (valResult !== !1 && (resetMaskSet(!0), forwardPosition = void 0 !== valResult.caret ? valResult.caret : checkval ? valResult.pos + 1 : seekNext(valResult.pos), 
                    getMaskSet().p = forwardPosition), writeOut !== !1) {
                        var self = this;
                        if (setTimeout(function() {
                            opts.onKeyValidation.call(self, k, valResult, opts);
                        }, 0), getMaskSet().writeOutBuffer && valResult !== !1) {
                            var buffer = getBuffer();
                            writeBuffer(input, buffer, opts.numericInput && void 0 === valResult.caret ? seekPrevious(forwardPosition) : forwardPosition, e, checkval !== !0), 
                            checkval !== !0 && setTimeout(function() {
                                isComplete(buffer) === !0 && $input.trigger("complete");
                            }, 0);
                        }
                    }
                    if (e.preventDefault(), checkval) return valResult.forwardPosition = forwardPosition, 
                    valResult;
                }
            },
            pasteEvent: function(e) {
                var tempValue, input = this, ev = e.originalEvent || e, $input = $(input), inputValue = input.inputmask._valueGet(!0), caretPos = caret(input);
                isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);
                var valueBeforeCaret = inputValue.substr(0, caretPos.begin), valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);
                if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""), 
                valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""), 
                isRTL && (tempValue = valueBeforeCaret, valueBeforeCaret = valueAfterCaret, valueAfterCaret = tempValue), 
                window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret; else {
                    if (!ev.clipboardData || !ev.clipboardData.getData) return !0;
                    inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret;
                }
                var pasteValue = inputValue;
                if ($.isFunction(opts.onBeforePaste)) {
                    if (pasteValue = opts.onBeforePaste(inputValue, opts), pasteValue === !1) return e.preventDefault();
                    pasteValue || (pasteValue = inputValue);
                }
                return checkVal(input, !1, !1, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split("")), 
                writeBuffer(input, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")), 
                isComplete(getBuffer()) === !0 && $input.trigger("complete"), e.preventDefault();
            },
            inputFallBackEvent: function(e) {
                var input = this, inputValue = input.inputmask._valueGet();
                if (getBuffer().join("") !== inputValue) {
                    var caretPos = caret(input);
                    if (inputValue = inputValue.replace(new RegExp("(" + Inputmask.escapeRegex(getBufferTemplate().join("")) + ")*"), ""), 
                    iemobile) {
                        var inputChar = inputValue.replace(getBuffer().join(""), "");
                        if (1 === inputChar.length) {
                            var keypress = new $.Event("keypress");
                            return keypress.which = inputChar.charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !0, !1, getMaskSet().validPositions[caretPos.begin - 1] ? caretPos.begin : caretPos.begin - 1), 
                            !1;
                        }
                    }
                    if (caretPos.begin > inputValue.length && (caret(input, inputValue.length), caretPos = caret(input)), 
                    getBuffer().length - inputValue.length !== 1 || inputValue.charAt(caretPos.begin) === getBuffer()[caretPos.begin] || inputValue.charAt(caretPos.begin + 1) === getBuffer()[caretPos.begin] || isMask(caretPos.begin)) {
                        for (var lvp = getLastValidPosition() + 1, bufferTemplate = getBufferTemplate().join(""); null === inputValue.match(Inputmask.escapeRegex(bufferTemplate) + "$"); ) bufferTemplate = bufferTemplate.slice(1);
                        inputValue = inputValue.replace(bufferTemplate, ""), inputValue = inputValue.split(""), 
                        checkVal(input, !0, !1, inputValue, e, caretPos.begin < lvp), isComplete(getBuffer()) === !0 && $(input).trigger("complete");
                    } else e.keyCode = Inputmask.keyCode.BACKSPACE, EventHandlers.keydownEvent.call(input, e);
                    e.preventDefault();
                }
            },
            setValueEvent: function(e) {
                this.inputmask.refreshValue = !1;
                var input = this, value = input.inputmask._valueGet();
                checkVal(input, !0, !1, ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(value, opts) || value : value).split("")), 
                undoValue = getBuffer().join(""), (opts.clearMaskOnLostFocus || opts.clearIncomplete) && input.inputmask._valueGet() === getBufferTemplate().join("") && input.inputmask._valueSet("");
            },
            focusEvent: function(e) {
                var input = this, nptValue = input.inputmask._valueGet();
                opts.showMaskOnFocus && (!opts.showMaskOnHover || opts.showMaskOnHover && "" === nptValue) && (input.inputmask._valueGet() !== getBuffer().join("") ? writeBuffer(input, getBuffer(), seekNext(getLastValidPosition())) : mouseEnter === !1 && caret(input, seekNext(getLastValidPosition()))), 
                opts.positionCaretOnTab === !0 && EventHandlers.clickEvent.apply(input, [ e, !0 ]), 
                undoValue = getBuffer().join("");
            },
            mouseleaveEvent: function(e) {
                var input = this;
                if (mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== input) {
                    var buffer = getBuffer().slice(), nptValue = input.inputmask._valueGet();
                    nptValue !== input.getAttribute("placeholder") && "" !== nptValue && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer), 
                    writeBuffer(input, buffer));
                }
            },
            clickEvent: function(e, tabbed) {
                function doRadixFocus(clickPos) {
                    if ("" !== opts.radixPoint) {
                        var vps = getMaskSet().validPositions;
                        if (void 0 === vps[clickPos] || vps[clickPos].input === getPlaceholder(clickPos)) {
                            if (clickPos < seekNext(-1)) return !0;
                            var radixPos = $.inArray(opts.radixPoint, getBuffer());
                            if (radixPos !== -1) {
                                for (var vp in vps) if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;
                                return !0;
                            }
                        }
                    }
                    return !1;
                }
                var input = this;
                setTimeout(function() {
                    if (document.activeElement === input) {
                        var selectedCaret = caret(input);
                        if (tabbed && (selectedCaret.begin = selectedCaret.end), selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {
                          case "none":
                            break;

                          case "radixFocus":
                            if (doRadixFocus(selectedCaret.begin)) {
                                var radixPos = $.inArray(opts.radixPoint, getBuffer().join(""));
                                caret(input, opts.numericInput ? seekNext(radixPos) : radixPos);
                                break;
                            }

                          default:
                            var clickPosition = selectedCaret.begin, lvclickPosition = getLastValidPosition(clickPosition, !0), lastPosition = seekNext(lvclickPosition);
                            if (clickPosition < lastPosition) caret(input, isMask(clickPosition) || isMask(clickPosition - 1) ? clickPosition : seekNext(clickPosition)); else {
                                var placeholder = getPlaceholder(lastPosition);
                                ("" !== placeholder && getBuffer()[lastPosition] !== placeholder && getTest(lastPosition).match.optionalQuantifier !== !0 || !isMask(lastPosition) && getTest(lastPosition).match.def === placeholder) && (lastPosition = seekNext(lastPosition)), 
                                caret(input, lastPosition);
                            }
                        }
                    }
                }, 0);
            },
            dblclickEvent: function(e) {
                var input = this;
                setTimeout(function() {
                    caret(input, 0, seekNext(getLastValidPosition()));
                }, 0);
            },
            cutEvent: function(e) {
                var input = this, $input = $(input), pos = caret(input), ev = e.originalEvent || e, clipboardData = window.clipboardData || ev.clipboardData, clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
                clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")), 
                document.execCommand && document.execCommand("copy"), handleRemove(input, Inputmask.keyCode.DELETE, pos), 
                writeBuffer(input, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join("")), 
                input.inputmask._valueGet() === getBufferTemplate().join("") && $input.trigger("cleared");
            },
            blurEvent: function(e) {
                var $input = $(this), input = this;
                if (input.inputmask) {
                    var nptValue = input.inputmask._valueGet(), buffer = getBuffer().slice();
                    undoValue !== buffer.join("") && setTimeout(function() {
                        $input.trigger("change"), undoValue = buffer.join("");
                    }, 0), "" !== nptValue && (opts.clearMaskOnLostFocus && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)), 
                    isComplete(buffer) === !1 && (setTimeout(function() {
                        $input.trigger("incomplete");
                    }, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())), 
                    writeBuffer(input, buffer, void 0, e));
                }
            },
            mouseenterEvent: function(e) {
                var input = this;
                mouseEnter = !0, document.activeElement !== input && opts.showMaskOnHover && input.inputmask._valueGet() !== getBuffer().join("") && writeBuffer(input, getBuffer());
            },
            submitEvent: function(e) {
                undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && getLastValidPosition() === -1 && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""), 
                opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0), 
                setTimeout(function() {
                    writeBuffer(el, getBuffer());
                }, 0));
            },
            resetEvent: function(e) {
                el.inputmask.refreshValue = !0, setTimeout(function() {
                    $el.trigger("setvalue");
                }, 0);
            }
        };
        if (void 0 !== actionObj) switch (actionObj.action) {
          case "isComplete":
            return el = actionObj.el, isComplete(getBuffer());

          case "unmaskedvalue":
            return void 0 !== el && void 0 === actionObj.value || (valueBuffer = actionObj.value, 
            valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(valueBuffer, opts) || valueBuffer : valueBuffer).split(""), 
            checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts)), 
            unmaskedvalue(el);

          case "mask":
            mask(el);
            break;

          case "format":
            return valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(actionObj.value, opts) || actionObj.value : actionObj.value).split(""), 
            checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts), 
            actionObj.metadata ? {
                value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
                metadata: maskScope.call(this, {
                    action: "getmetadata"
                }, maskset, opts)
            } : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");

          case "isValid":
            actionObj.value ? (valueBuffer = actionObj.value.split(""), checkVal(void 0, !1, !0, isRTL ? valueBuffer.reverse() : valueBuffer)) : actionObj.value = getBuffer().join("");
            for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--) ;
            return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === getBuffer().join("");

          case "getemptymask":
            return getBufferTemplate().join("");

          case "remove":
            if (el) {
                $el = $(el), el.inputmask._valueSet(unmaskedvalue(el)), EventRuler.off(el);
                var valueProperty;
                Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? (valueProperty = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"), 
                valueProperty && el.inputmask.__valueGet && Object.defineProperty(el, "value", {
                    get: el.inputmask.__valueGet,
                    set: el.inputmask.__valueSet,
                    configurable: !0
                })) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet), 
                el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = void 0;
            }
            return el;

          case "getmetadata":
            if ($.isArray(maskset.metadata)) {
                var maskTarget = getMaskTemplate(!0, 0, !1).join("");
                return $.each(maskset.metadata, function(ndx, mtdt) {
                    if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1;
                }), maskTarget;
            }
            return maskset.metadata;
        }
    }
    var ua = navigator.userAgent, mobile = /mobile/i.test(ua), iemobile = /iemobile/i.test(ua), iphone = /iphone/i.test(ua) && !iemobile, android = /android/i.test(ua) && !iemobile;
    return Inputmask.prototype = {
        dataAttribute: "data-inputmask",
        defaults: {
            placeholder: "_",
            optionalmarker: {
                start: "[",
                end: "]"
            },
            quantifiermarker: {
                start: "{",
                end: "}"
            },
            groupmarker: {
                start: "(",
                end: ")"
            },
            alternatormarker: "|",
            escapeChar: "\\",
            mask: null,
            oncomplete: $.noop,
            onincomplete: $.noop,
            oncleared: $.noop,
            repeat: 0,
            greedy: !0,
            autoUnmask: !1,
            removeMaskOnSubmit: !1,
            clearMaskOnLostFocus: !0,
            insertMode: !0,
            clearIncomplete: !1,
            alias: null,
            onKeyDown: $.noop,
            onBeforeMask: null,
            onBeforePaste: function(pastedValue, opts) {
                return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(pastedValue, opts) : pastedValue;
            },
            onBeforeWrite: null,
            onUnMask: null,
            showMaskOnFocus: !0,
            showMaskOnHover: !0,
            onKeyValidation: $.noop,
            skipOptionalPartCharacter: " ",
            numericInput: !1,
            rightAlign: !1,
            undoOnEscape: !0,
            radixPoint: "",
            radixPointDefinitionSymbol: void 0,
            groupSeparator: "",
            keepStatic: null,
            positionCaretOnTab: !0,
            tabThrough: !1,
            supportsInputType: [ "text", "tel", "password" ],
            ignorables: [ 8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 0, 229 ],
            isComplete: null,
            canClearPosition: $.noop,
            postValidation: null,
            staticDefinitionSymbol: void 0,
            jitMasking: !1,
            nullable: !0,
            inputEventOnly: !1,
            noValuePatching: !1,
            positionCaretOnClick: "lvp",
            casing: null,
            inputmode: "verbatim",
            colorMask: !1,
            androidHack: !1
        },
        definitions: {
            "9": {
                validator: "[0-9]",
                cardinality: 1,
                definitionSymbol: "*"
            },
            a: {
                validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
                cardinality: 1,
                definitionSymbol: "*"
            },
            "*": {
                validator: "[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
                cardinality: 1
            }
        },
        aliases: {},
        masksCache: {},
        mask: function(elems) {
            function importAttributeOptions(npt, opts, userOptions, dataAttribute) {
                function importOption(option, optionData) {
                    optionData = void 0 !== optionData ? optionData : npt.getAttribute(dataAttribute + "-" + option), 
                    null !== optionData && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)), 
                    userOptions[option] = optionData);
                }
                var option, dataoptions, optionData, p, attrOptions = npt.getAttribute(dataAttribute);
                if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(new RegExp("'", "g"), '"'), 
                dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) {
                    optionData = void 0;
                    for (p in dataoptions) if ("alias" === p.toLowerCase()) {
                        optionData = dataoptions[p];
                        break;
                    }
                }
                importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts);
                for (option in opts) {
                    if (dataoptions) {
                        optionData = void 0;
                        for (p in dataoptions) if (p.toLowerCase() === option.toLowerCase()) {
                            optionData = dataoptions[p];
                            break;
                        }
                    }
                    importOption(option, optionData);
                }
                return $.extend(!0, opts, userOptions), opts;
            }
            var that = this;
            return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)), 
            elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {
                var scopedOpts = $.extend(!0, {}, that.opts);
                importAttributeOptions(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute);
                var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
                void 0 !== maskset && (void 0 !== el.inputmask && el.inputmask.remove(), el.inputmask = new Inputmask((void 0), (void 0), (!0)), 
                el.inputmask.opts = scopedOpts, el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions), 
                el.inputmask.isRTL = that.isRTL, el.inputmask.el = el, el.inputmask.maskset = maskset, 
                $.data(el, "_inputmask_opts", scopedOpts), maskScope.call(el.inputmask, {
                    action: "mask"
                }));
            }), elems && elems[0] ? elems[0].inputmask || this : this;
        },
        option: function(options, noremask) {
            return "string" == typeof options ? this.opts[options] : "object" == typeof options ? ($.extend(this.userOptions, options), 
            this.el && noremask !== !0 && this.mask(this.el), this) : void 0;
        },
        unmaskedvalue: function(value) {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "unmaskedvalue",
                value: value
            });
        },
        remove: function() {
            return maskScope.call(this, {
                action: "remove"
            });
        },
        getemptymask: function() {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "getemptymask"
            });
        },
        hasMaskedValue: function() {
            return !this.opts.autoUnmask;
        },
        isComplete: function() {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "isComplete"
            });
        },
        getmetadata: function() {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "getmetadata"
            });
        },
        isValid: function(value) {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "isValid",
                value: value
            });
        },
        format: function(value, metadata) {
            return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), 
            maskScope.call(this, {
                action: "format",
                value: value,
                metadata: metadata
            });
        },
        analyseMask: function(mask, opts) {
            function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
                this.matches = [], this.openGroup = isGroup || !1, this.isGroup = isGroup || !1, 
                this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1, 
                this.quantifier = {
                    min: 1,
                    max: 1
                };
            }
            function insertTestDefinition(mtoken, element, position) {
                var maskdef = (opts.definitions ? opts.definitions[element] : void 0) || Inputmask.prototype.definitions[element];
                position = void 0 !== position ? position : mtoken.matches.length;
                var prevMatch = mtoken.matches[position - 1];
                if (maskdef && !escaped) {
                    for (var prevalidators = maskdef.prevalidator, prevalidatorsL = prevalidators ? prevalidators.length : 0, i = 1; i < maskdef.cardinality; i++) {
                        var prevalidator = prevalidatorsL >= i ? prevalidators[i - 1] : [], validator = prevalidator.validator, cardinality = prevalidator.cardinality;
                        mtoken.matches.splice(position++, 0, {
                            fn: validator ? "string" == typeof validator ? new RegExp(validator) : new function() {
                                this.test = validator;
                            }() : new RegExp("."),
                            cardinality: cardinality ? cardinality : 1,
                            optionality: mtoken.isOptional,
                            newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),
                            casing: maskdef.casing,
                            def: maskdef.definitionSymbol || element,
                            placeholder: maskdef.placeholder,
                            nativeDef: element
                        }), prevMatch = mtoken.matches[position - 1];
                    }
                    mtoken.matches.splice(position++, 0, {
                        fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator) : new function() {
                            this.test = maskdef.validator;
                        }() : new RegExp("."),
                        cardinality: maskdef.cardinality,
                        optionality: mtoken.isOptional,
                        newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),
                        casing: maskdef.casing,
                        def: maskdef.definitionSymbol || element,
                        placeholder: maskdef.placeholder,
                        nativeDef: element
                    });
                } else mtoken.matches.splice(position++, 0, {
                    fn: null,
                    cardinality: 0,
                    optionality: mtoken.isOptional,
                    newBlockMarker: void 0 === prevMatch || prevMatch.def !== element,
                    casing: null,
                    def: opts.staticDefinitionSymbol || element,
                    placeholder: void 0 !== opts.staticDefinitionSymbol ? element : void 0,
                    nativeDef: element
                }), escaped = !1;
            }
            function verifyGroupMarker(maskToken) {
                maskToken && maskToken.matches && $.each(maskToken.matches, function(ndx, token) {
                    var nextToken = maskToken.matches[ndx + 1];
                    (void 0 === nextToken || void 0 === nextToken.matches || nextToken.isQuantifier === !1) && token && token.isGroup && (token.isGroup = !1, 
                    insertTestDefinition(token, opts.groupmarker.start, 0), token.openGroup !== !0 && insertTestDefinition(token, opts.groupmarker.end)), 
                    verifyGroupMarker(token);
                });
            }
            function defaultCase() {
                if (openenings.length > 0) {
                    if (currentOpeningToken = openenings[openenings.length - 1], insertTestDefinition(currentOpeningToken, m), 
                    currentOpeningToken.isAlternator) {
                        alternator = openenings.pop();
                        for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                        openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], 
                        currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);
                    }
                } else insertTestDefinition(currentToken, m);
            }
            function reverseTokens(maskToken) {
                function reverseStatic(st) {
                    return st === opts.optionalmarker.start ? st = opts.optionalmarker.end : st === opts.optionalmarker.end ? st = opts.optionalmarker.start : st === opts.groupmarker.start ? st = opts.groupmarker.end : st === opts.groupmarker.end && (st = opts.groupmarker.start), 
                    st;
                }
                maskToken.matches = maskToken.matches.reverse();
                for (var match in maskToken.matches) if (maskToken.matches.hasOwnProperty(match)) {
                    var intMatch = parseInt(match);
                    if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {
                        var qt = maskToken.matches[match];
                        maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt);
                    }
                    void 0 !== maskToken.matches[match].matches ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = reverseStatic(maskToken.matches[match]);
                }
                return maskToken;
            }
            for (var match, m, openingToken, currentOpeningToken, alternator, lastMatch, groupToken, tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g, escaped = !1, currentToken = new MaskToken(), openenings = [], maskTokens = []; match = tokenizer.exec(mask); ) if (m = match[0], 
            escaped) defaultCase(); else switch (m.charAt(0)) {
              case opts.escapeChar:
                escaped = !0;
                break;

              case opts.optionalmarker.end:
              case opts.groupmarker.end:
                if (openingToken = openenings.pop(), openingToken.openGroup = !1, void 0 !== openingToken) if (openenings.length > 0) {
                    if (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(openingToken), 
                    currentOpeningToken.isAlternator) {
                        alternator = openenings.pop();
                        for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                        openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], 
                        currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);
                    }
                } else currentToken.matches.push(openingToken); else defaultCase();
                break;

              case opts.optionalmarker.start:
                openenings.push(new MaskToken((!1), (!0)));
                break;

              case opts.groupmarker.start:
                openenings.push(new MaskToken((!0)));
                break;

              case opts.quantifiermarker.start:
                var quantifier = new MaskToken((!1), (!1), (!0));
                m = m.replace(/[{}]/g, "");
                var mq = m.split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                if ("*" !== mq1 && "+" !== mq1 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {
                    min: mq0,
                    max: mq1
                }, openenings.length > 0) {
                    var matches = openenings[openenings.length - 1].matches;
                    match = matches.pop(), match.isGroup || (groupToken = new MaskToken((!0)), groupToken.matches.push(match), 
                    match = groupToken), matches.push(match), matches.push(quantifier);
                } else match = currentToken.matches.pop(), match.isGroup || (groupToken = new MaskToken((!0)), 
                groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match), 
                currentToken.matches.push(quantifier);
                break;

              case opts.alternatormarker:
                openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], 
                lastMatch = currentOpeningToken.matches.pop()) : lastMatch = currentToken.matches.pop(), 
                lastMatch.isAlternator ? openenings.push(lastMatch) : (alternator = new MaskToken((!1), (!1), (!1), (!0)), 
                alternator.matches.push(lastMatch), openenings.push(alternator));
                break;

              default:
                defaultCase();
            }
            for (;openenings.length > 0; ) openingToken = openenings.pop(), currentToken.matches.push(openingToken);
            return currentToken.matches.length > 0 && (verifyGroupMarker(currentToken), maskTokens.push(currentToken)), 
            opts.numericInput && reverseTokens(maskTokens[0]), maskTokens;
        }
    }, Inputmask.extendDefaults = function(options) {
        $.extend(!0, Inputmask.prototype.defaults, options);
    }, Inputmask.extendDefinitions = function(definition) {
        $.extend(!0, Inputmask.prototype.definitions, definition);
    }, Inputmask.extendAliases = function(alias) {
        $.extend(!0, Inputmask.prototype.aliases, alias);
    }, Inputmask.format = function(value, options, metadata) {
        return Inputmask(options).format(value, metadata);
    }, Inputmask.unmask = function(value, options) {
        return Inputmask(options).unmaskedvalue(value);
    }, Inputmask.isValid = function(value, options) {
        return Inputmask(options).isValid(value);
    }, Inputmask.remove = function(elems) {
        $.each(elems, function(ndx, el) {
            el.inputmask && el.inputmask.remove();
        });
    }, Inputmask.escapeRegex = function(str) {
        var specials = [ "/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^" ];
        return str.replace(new RegExp("(\\" + specials.join("|\\") + ")", "gim"), "\\$1");
    }, Inputmask.keyCode = {
        ALT: 18,
        BACKSPACE: 8,
        BACKSPACE_SAFARI: 127,
        CAPS_LOCK: 20,
        COMMA: 188,
        COMMAND: 91,
        COMMAND_LEFT: 91,
        COMMAND_RIGHT: 93,
        CONTROL: 17,
        DELETE: 46,
        DOWN: 40,
        END: 35,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        INSERT: 45,
        LEFT: 37,
        MENU: 93,
        NUMPAD_ADD: 107,
        NUMPAD_DECIMAL: 110,
        NUMPAD_DIVIDE: 111,
        NUMPAD_ENTER: 108,
        NUMPAD_MULTIPLY: 106,
        NUMPAD_SUBTRACT: 109,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        PERIOD: 190,
        RIGHT: 39,
        SHIFT: 16,
        SPACE: 32,
        TAB: 9,
        UP: 38,
        WINDOWS: 91,
        X: 88
    }, window.Inputmask = Inputmask, Inputmask;
}(jQuery), function($, Inputmask) {
    return void 0 === $.fn.inputmask && ($.fn.inputmask = function(fn, options) {
        var nptmask, input = this[0];
        if (void 0 === options && (options = {}), "string" == typeof fn) switch (fn) {
          case "unmaskedvalue":
            return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();

          case "remove":
            return this.each(function() {
                this.inputmask && this.inputmask.remove();
            });

          case "getemptymask":
            return input && input.inputmask ? input.inputmask.getemptymask() : "";

          case "hasMaskedValue":
            return !(!input || !input.inputmask) && input.inputmask.hasMaskedValue();

          case "isComplete":
            return !input || !input.inputmask || input.inputmask.isComplete();

          case "getmetadata":
            return input && input.inputmask ? input.inputmask.getmetadata() : void 0;

          case "setvalue":
            $(input).val(options), input && void 0 === input.inputmask && $(input).triggerHandler("setvalue");
            break;

          case "option":
            if ("string" != typeof options) return this.each(function() {
                if (void 0 !== this.inputmask) return this.inputmask.option(options);
            });
            if (input && void 0 !== input.inputmask) return input.inputmask.option(options);
            break;

          default:
            return options.alias = fn, nptmask = new Inputmask(options), this.each(function() {
                nptmask.mask(this);
            });
        } else {
            if ("object" == typeof fn) return nptmask = new Inputmask(fn), void 0 === fn.mask && void 0 === fn.alias ? this.each(function() {
                return void 0 !== this.inputmask ? this.inputmask.option(fn) : void nptmask.mask(this);
            }) : this.each(function() {
                nptmask.mask(this);
            });
            if (void 0 === fn) return this.each(function() {
                nptmask = new Inputmask(options), nptmask.mask(this);
            });
        }
    }), $.fn.inputmask;
}(jQuery, Inputmask), function($, Inputmask) {
    function isLeapYear(year) {
        return isNaN(year) || 29 === new Date(year, 2, 0).getDate();
    }
    return Inputmask.extendAliases({
        "dd/mm/yyyy": {
            mask: "1/2/y",
            placeholder: "dd/mm/yyyy",
            regex: {
                val1pre: new RegExp("[0-3]"),
                val1: new RegExp("0[1-9]|[12][0-9]|3[01]"),
                val2pre: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|[12][0-9]|3[01])" + escapedSeparator + "[01])");
                },
                val2: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|[12][0-9])" + escapedSeparator + "(0[1-9]|1[012]))|(30" + escapedSeparator + "(0[13-9]|1[012]))|(31" + escapedSeparator + "(0[13578]|1[02]))");
                }
            },
            leapday: "29/02/",
            separator: "/",
            yearrange: {
                minyear: 1900,
                maxyear: 2099
            },
            isInYearRange: function(chrs, minyear, maxyear) {
                if (isNaN(chrs)) return !1;
                var enteredyear = parseInt(chrs.concat(minyear.toString().slice(chrs.length))), enteredyear2 = parseInt(chrs.concat(maxyear.toString().slice(chrs.length)));
                return !isNaN(enteredyear) && (minyear <= enteredyear && enteredyear <= maxyear) || !isNaN(enteredyear2) && (minyear <= enteredyear2 && enteredyear2 <= maxyear);
            },
            determinebaseyear: function(minyear, maxyear, hint) {
                var currentyear = new Date().getFullYear();
                if (minyear > currentyear) return minyear;
                if (maxyear < currentyear) {
                    for (var maxYearPrefix = maxyear.toString().slice(0, 2), maxYearPostfix = maxyear.toString().slice(2, 4); maxyear < maxYearPrefix + hint; ) maxYearPrefix--;
                    var maxxYear = maxYearPrefix + maxYearPostfix;
                    return minyear > maxxYear ? minyear : maxxYear;
                }
                if (minyear <= currentyear && currentyear <= maxyear) {
                    for (var currentYearPrefix = currentyear.toString().slice(0, 2); maxyear < currentYearPrefix + hint; ) currentYearPrefix--;
                    var currentYearAndHint = currentYearPrefix + hint;
                    return currentYearAndHint < minyear ? minyear : currentYearAndHint;
                }
                return currentyear;
            },
            onKeyDown: function(e, buffer, caretPos, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val(today.getDate().toString() + (today.getMonth() + 1).toString() + today.getFullYear().toString()), 
                    $input.trigger("setvalue");
                }
            },
            getFrontValue: function(mask, buffer, opts) {
                for (var start = 0, length = 0, i = 0; i < mask.length && "2" !== mask.charAt(i); i++) {
                    var definition = opts.definitions[mask.charAt(i)];
                    definition ? (start += length, length = definition.cardinality) : length++;
                }
                return buffer.join("").substr(start, length);
            },
            postValidation: function(buffer, currentResult, opts) {
                var dayMonthValue, year, bufferStr = buffer.join("");
                return 0 === opts.mask.indexOf("y") ? (year = bufferStr.substr(0, 4), dayMonthValue = bufferStr.substr(4, 11)) : (year = bufferStr.substr(6, 11), 
                dayMonthValue = bufferStr.substr(0, 6)), currentResult && (dayMonthValue !== opts.leapday || isLeapYear(year));
            },
            definitions: {
                "1": {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        var isValid = opts.regex.val1.test(chrs);
                        return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val1.test("0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0", 
                        {
                            refreshFromBuffer: {
                                start: pos - 1,
                                end: pos
                            },
                            pos: pos,
                            c: chrs.charAt(0)
                        });
                    },
                    cardinality: 2,
                    prevalidator: [ {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var pchrs = chrs;
                            isNaN(maskset.buffer[pos + 1]) || (pchrs += maskset.buffer[pos + 1]);
                            var isValid = 1 === pchrs.length ? opts.regex.val1pre.test(pchrs) : opts.regex.val1.test(pchrs);
                            if (!strict && !isValid) {
                                if (isValid = opts.regex.val1.test(chrs + "0")) return maskset.buffer[pos] = chrs, 
                                maskset.buffer[++pos] = "0", {
                                    pos: pos,
                                    c: "0"
                                };
                                if (isValid = opts.regex.val1.test("0" + chrs)) return maskset.buffer[pos] = "0", 
                                pos++, {
                                    pos: pos
                                };
                            }
                            return isValid;
                        },
                        cardinality: 1
                    } ]
                },
                "2": {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);
                        frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);
                        var isValid = opts.regex.val2(opts.separator).test(frontValue + chrs);
                        return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0", 
                        {
                            refreshFromBuffer: {
                                start: pos - 1,
                                end: pos
                            },
                            pos: pos,
                            c: chrs.charAt(0)
                        });
                    },
                    cardinality: 2,
                    prevalidator: [ {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            isNaN(maskset.buffer[pos + 1]) || (chrs += maskset.buffer[pos + 1]);
                            var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);
                            frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);
                            var isValid = 1 === chrs.length ? opts.regex.val2pre(opts.separator).test(frontValue + chrs) : opts.regex.val2(opts.separator).test(frontValue + chrs);
                            return strict || isValid || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", 
                            pos++, {
                                pos: pos
                            });
                        },
                        cardinality: 1
                    } ]
                },
                y: {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                    },
                    cardinality: 4,
                    prevalidator: [ {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                            if (!strict && !isValid) {
                                var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 1);
                                if (isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0), 
                                {
                                    pos: pos
                                };
                                if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 2), 
                                isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0), 
                                maskset.buffer[pos++] = yearPrefix.charAt(1), {
                                    pos: pos
                                };
                            }
                            return isValid;
                        },
                        cardinality: 1
                    }, {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                            if (!strict && !isValid) {
                                var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2);
                                if (isValid = opts.isInYearRange(chrs[0] + yearPrefix[1] + chrs[1], opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(1), 
                                {
                                    pos: pos
                                };
                                if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2), 
                                isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos - 1] = yearPrefix.charAt(0), 
                                maskset.buffer[pos++] = yearPrefix.charAt(1), maskset.buffer[pos++] = chrs.charAt(0), 
                                {
                                    refreshFromBuffer: {
                                        start: pos - 3,
                                        end: pos
                                    },
                                    pos: pos
                                };
                            }
                            return isValid;
                        },
                        cardinality: 2
                    }, {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                        },
                        cardinality: 3
                    } ]
                }
            },
            insertMode: !1,
            autoUnmask: !1
        },
        "mm/dd/yyyy": {
            placeholder: "mm/dd/yyyy",
            alias: "dd/mm/yyyy",
            regex: {
                val2pre: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");
                },
                val2: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");
                },
                val1pre: new RegExp("[01]"),
                val1: new RegExp("0[1-9]|1[012]")
            },
            leapday: "02/29/",
            onKeyDown: function(e, buffer, caretPos, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()), 
                    $input.trigger("setvalue");
                }
            }
        },
        "yyyy/mm/dd": {
            mask: "y/1/2",
            placeholder: "yyyy/mm/dd",
            alias: "mm/dd/yyyy",
            leapday: "/02/29",
            onKeyDown: function(e, buffer, caretPos, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val(today.getFullYear().toString() + (today.getMonth() + 1).toString() + today.getDate().toString()), 
                    $input.trigger("setvalue");
                }
            }
        },
        "dd.mm.yyyy": {
            mask: "1.2.y",
            placeholder: "dd.mm.yyyy",
            leapday: "29.02.",
            separator: ".",
            alias: "dd/mm/yyyy"
        },
        "dd-mm-yyyy": {
            mask: "1-2-y",
            placeholder: "dd-mm-yyyy",
            leapday: "29-02-",
            separator: "-",
            alias: "dd/mm/yyyy"
        },
        "mm.dd.yyyy": {
            mask: "1.2.y",
            placeholder: "mm.dd.yyyy",
            leapday: "02.29.",
            separator: ".",
            alias: "mm/dd/yyyy"
        },
        "mm-dd-yyyy": {
            mask: "1-2-y",
            placeholder: "mm-dd-yyyy",
            leapday: "02-29-",
            separator: "-",
            alias: "mm/dd/yyyy"
        },
        "yyyy.mm.dd": {
            mask: "y.1.2",
            placeholder: "yyyy.mm.dd",
            leapday: ".02.29",
            separator: ".",
            alias: "yyyy/mm/dd"
        },
        "yyyy-mm-dd": {
            mask: "y-1-2",
            placeholder: "yyyy-mm-dd",
            leapday: "-02-29",
            separator: "-",
            alias: "yyyy/mm/dd"
        },
        datetime: {
            mask: "1/2/y h:s",
            placeholder: "dd/mm/yyyy hh:mm",
            alias: "dd/mm/yyyy",
            regex: {
                hrspre: new RegExp("[012]"),
                hrs24: new RegExp("2[0-4]|1[3-9]"),
                hrs: new RegExp("[01][0-9]|2[0-4]"),
                ampm: new RegExp("^[a|p|A|P][m|M]"),
                mspre: new RegExp("[0-5]"),
                ms: new RegExp("[0-5][0-9]")
            },
            timeseparator: ":",
            hourFormat: "24",
            definitions: {
                h: {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        if ("24" === opts.hourFormat && 24 === parseInt(chrs, 10)) return maskset.buffer[pos - 1] = "0", 
                        maskset.buffer[pos] = "0", {
                            refreshFromBuffer: {
                                start: pos - 1,
                                end: pos
                            },
                            c: "0"
                        };
                        var isValid = opts.regex.hrs.test(chrs);
                        if (!strict && !isValid && (chrs.charAt(1) === opts.timeseparator || "-.:".indexOf(chrs.charAt(1)) !== -1) && (isValid = opts.regex.hrs.test("0" + chrs.charAt(0)))) return maskset.buffer[pos - 1] = "0", 
                        maskset.buffer[pos] = chrs.charAt(0), pos++, {
                            refreshFromBuffer: {
                                start: pos - 2,
                                end: pos
                            },
                            pos: pos,
                            c: opts.timeseparator
                        };
                        if (isValid && "24" !== opts.hourFormat && opts.regex.hrs24.test(chrs)) {
                            var tmp = parseInt(chrs, 10);
                            return 24 === tmp ? (maskset.buffer[pos + 5] = "a", maskset.buffer[pos + 6] = "m") : (maskset.buffer[pos + 5] = "p", 
                            maskset.buffer[pos + 6] = "m"), tmp -= 12, tmp < 10 ? (maskset.buffer[pos] = tmp.toString(), 
                            maskset.buffer[pos - 1] = "0") : (maskset.buffer[pos] = tmp.toString().charAt(1), 
                            maskset.buffer[pos - 1] = tmp.toString().charAt(0)), {
                                refreshFromBuffer: {
                                    start: pos - 1,
                                    end: pos + 6
                                },
                                c: maskset.buffer[pos]
                            };
                        }
                        return isValid;
                    },
                    cardinality: 2,
                    prevalidator: [ {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var isValid = opts.regex.hrspre.test(chrs);
                            return strict || isValid || !(isValid = opts.regex.hrs.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", 
                            pos++, {
                                pos: pos
                            });
                        },
                        cardinality: 1
                    } ]
                },
                s: {
                    validator: "[0-5][0-9]",
                    cardinality: 2,
                    prevalidator: [ {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var isValid = opts.regex.mspre.test(chrs);
                            return strict || isValid || !(isValid = opts.regex.ms.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", 
                            pos++, {
                                pos: pos
                            });
                        },
                        cardinality: 1
                    } ]
                },
                t: {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        return opts.regex.ampm.test(chrs + "m");
                    },
                    casing: "lower",
                    cardinality: 1
                }
            },
            insertMode: !1,
            autoUnmask: !1
        },
        datetime12: {
            mask: "1/2/y h:s t\\m",
            placeholder: "dd/mm/yyyy hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        "mm/dd/yyyy hh:mm xm": {
            mask: "1/2/y h:s t\\m",
            placeholder: "mm/dd/yyyy hh:mm xm",
            alias: "datetime12",
            regex: {
                val2pre: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");
                },
                val2: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");
                },
                val1pre: new RegExp("[01]"),
                val1: new RegExp("0[1-9]|1[012]")
            },
            leapday: "02/29/",
            onKeyDown: function(e, buffer, caretPos, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()), 
                    $input.trigger("setvalue");
                }
            }
        },
        "hh:mm t": {
            mask: "h:s t\\m",
            placeholder: "hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        "h:s t": {
            mask: "h:s t\\m",
            placeholder: "hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        "hh:mm:ss": {
            mask: "h:s:s",
            placeholder: "hh:mm:ss",
            alias: "datetime",
            autoUnmask: !1
        },
        "hh:mm": {
            mask: "h:s",
            placeholder: "hh:mm",
            alias: "datetime",
            autoUnmask: !1
        },
        date: {
            alias: "dd/mm/yyyy"
        },
        "mm/yyyy": {
            mask: "1/y",
            placeholder: "mm/yyyy",
            leapday: "donotuse",
            separator: "/",
            alias: "mm/dd/yyyy"
        },
        shamsi: {
            regex: {
                val2pre: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "[0-3])");
                },
                val2: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[1-9]|1[012])" + escapedSeparator + "30)|((0[1-6])" + escapedSeparator + "31)");
                },
                val1pre: new RegExp("[01]"),
                val1: new RegExp("0[1-9]|1[012]")
            },
            yearrange: {
                minyear: 1300,
                maxyear: 1499
            },
            mask: "y/1/2",
            leapday: "/12/30",
            placeholder: "yyyy/mm/dd",
            alias: "mm/dd/yyyy",
            clearIncomplete: !0
        },
        "yyyy-mm-dd hh:mm:ss": {
            mask: "y-1-2 h:s:s",
            placeholder: "yyyy-mm-dd hh:mm:ss",
            alias: "datetime",
            separator: "-",
            leapday: "-02-29",
            regex: {
                val2pre: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");
                },
                val2: function(separator) {
                    var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                    return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");
                },
                val1pre: new RegExp("[01]"),
                val1: new RegExp("0[1-9]|1[012]")
            },
            onKeyDown: function(e, buffer, caretPos, opts) {}
        }
    }), Inputmask;
}(jQuery, Inputmask), function($, Inputmask) {
    return Inputmask.extendDefinitions({
        A: {
            validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
            cardinality: 1,
            casing: "upper"
        },
        "&": {
            validator: "[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
            cardinality: 1,
            casing: "upper"
        },
        "#": {
            validator: "[0-9A-Fa-f]",
            cardinality: 1,
            casing: "upper"
        }
    }), Inputmask.extendAliases({
        url: {
            definitions: {
                i: {
                    validator: ".",
                    cardinality: 1
                }
            },
            mask: "(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",
            insertMode: !1,
            autoUnmask: !1,
            inputmode: "url"
        },
        ip: {
            mask: "i[i[i]].i[i[i]].i[i[i]].i[i[i]]",
            definitions: {
                i: {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        return pos - 1 > -1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs, 
                        chrs = pos - 2 > -1 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : chrs = "00" + chrs, 
                        new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);
                    },
                    cardinality: 1
                }
            },
            onUnMask: function(maskedValue, unmaskedValue, opts) {
                return maskedValue;
            },
            inputmode: "numeric"
        },
        email: {
            mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",
            greedy: !1,
            onBeforePaste: function(pastedValue, opts) {
                return pastedValue = pastedValue.toLowerCase(), pastedValue.replace("mailto:", "");
            },
            definitions: {
                "*": {
                    validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",
                    cardinality: 1,
                    casing: "lower"
                },
                "-": {
                    validator: "[0-9A-Za-z-]",
                    cardinality: 1,
                    casing: "lower"
                }
            },
            onUnMask: function(maskedValue, unmaskedValue, opts) {
                return maskedValue;
            },
            inputmode: "email"
        },
        mac: {
            mask: "##:##:##:##:##:##"
        },
        vin: {
            mask: "V{13}9{4}",
            definitions: {
                V: {
                    validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",
                    cardinality: 1,
                    casing: "upper"
                }
            },
            clearIncomplete: !0,
            autoUnmask: !0
        }
    }), Inputmask;
}(jQuery, Inputmask), function($, Inputmask) {
    return Inputmask.extendAliases({
        numeric: {
            mask: function(opts) {
                function autoEscape(txt) {
                    for (var escapedTxt = "", i = 0; i < txt.length; i++) escapedTxt += opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? "\\" + txt.charAt(i) : txt.charAt(i);
                    return escapedTxt;
                }
                if (0 !== opts.repeat && isNaN(opts.integerDigits) && (opts.integerDigits = opts.repeat), 
                opts.repeat = 0, opts.groupSeparator === opts.radixPoint && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""), 
                " " === opts.groupSeparator && (opts.skipOptionalPartCharacter = void 0), opts.autoGroup = opts.autoGroup && "" !== opts.groupSeparator, 
                opts.autoGroup && ("string" == typeof opts.groupSize && isFinite(opts.groupSize) && (opts.groupSize = parseInt(opts.groupSize)), 
                isFinite(opts.integerDigits))) {
                    var seps = Math.floor(opts.integerDigits / opts.groupSize), mod = opts.integerDigits % opts.groupSize;
                    opts.integerDigits = parseInt(opts.integerDigits) + (0 === mod ? seps - 1 : seps), 
                    opts.integerDigits < 1 && (opts.integerDigits = "*");
                }
                opts.placeholder.length > 1 && (opts.placeholder = opts.placeholder.charAt(0)), 
                "radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && opts.integerOptional === !1 && (opts.positionCaretOnClick = "lvp"), 
                opts.definitions[";"] = opts.definitions["~"], opts.definitions[";"].definitionSymbol = "~", 
                opts.numericInput === !0 && (opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick, 
                opts.digitsOptional = !1, isNaN(opts.digits) && (opts.digits = 2), opts.decimalProtect = !1);
                var mask = "[+]";
                if (mask += autoEscape(opts.prefix), mask += opts.integerOptional === !0 ? "~{1," + opts.integerDigits + "}" : "~{" + opts.integerDigits + "}", 
                void 0 !== opts.digits) {
                    opts.radixPointDefinitionSymbol = opts.decimalProtect ? ":" : opts.radixPoint;
                    var dq = opts.digits.toString().split(",");
                    isFinite(dq[0] && dq[1] && isFinite(dq[1])) ? mask += opts.radixPointDefinitionSymbol + ";{" + opts.digits + "}" : (isNaN(opts.digits) || parseInt(opts.digits) > 0) && (mask += opts.digitsOptional ? "[" + opts.radixPointDefinitionSymbol + ";{1," + opts.digits + "}]" : opts.radixPointDefinitionSymbol + ";{" + opts.digits + "}");
                }
                return mask += autoEscape(opts.suffix), mask += "[-]", opts.greedy = !1, null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                "," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, "."))), 
                null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                "," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, "."))), 
                mask;
            },
            placeholder: "",
            greedy: !1,
            digits: "*",
            digitsOptional: !0,
            radixPoint: ".",
            positionCaretOnClick: "radixFocus",
            groupSize: 3,
            groupSeparator: "",
            autoGroup: !1,
            allowPlus: !0,
            allowMinus: !0,
            negationSymbol: {
                front: "-",
                back: ""
            },
            integerDigits: "+",
            integerOptional: !0,
            prefix: "",
            suffix: "",
            rightAlign: !0,
            decimalProtect: !0,
            min: null,
            max: null,
            step: 1,
            insertMode: !0,
            autoUnmask: !1,
            unmaskAsNumber: !1,
            inputmode: "numeric",
            postFormat: function(buffer, pos, opts) {
                opts.numericInput === !0 && (buffer = buffer.reverse(), isFinite(pos) && (pos = buffer.join("").length - pos - 1));
                var i, l;
                pos = pos >= buffer.length ? buffer.length - 1 : pos < 0 ? 0 : pos;
                var charAtPos = buffer[pos], cbuf = buffer.slice();
                charAtPos === opts.groupSeparator && pos > opts.prefix.length && pos < buffer.length - opts.suffix.length && (cbuf.splice(pos--, 1), 
                charAtPos = cbuf[pos]);
                var isNegative = cbuf.join("").match(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)));
                isNegative = null !== isNegative && 1 === isNegative.length, pos > (isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length && pos < cbuf.length - opts.suffix.length && (cbuf[pos] = "!");
                var bufVal = cbuf.join(""), bufValOrigin = cbuf.join();
                if (isNegative && (bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), ""), 
                bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), "")), 
                bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.suffix) + "$"), ""), 
                bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.prefix)), ""), 
                bufVal.length > 0 && opts.autoGroup || bufVal.indexOf(opts.groupSeparator) !== -1) {
                    var escapedGroupSeparator = Inputmask.escapeRegex(opts.groupSeparator);
                    bufVal = bufVal.replace(new RegExp(escapedGroupSeparator, "g"), "");
                    var radixSplit = bufVal.split(charAtPos === opts.radixPoint ? "!" : opts.radixPoint);
                    if (bufVal = "" === opts.radixPoint ? bufVal : radixSplit[0], charAtPos !== opts.negationSymbol.front && (bufVal = bufVal.replace("!", "?")), 
                    bufVal.length > opts.groupSize) for (var reg = new RegExp("([-+]?[\\d?]+)([\\d?]{" + opts.groupSize + "})"); reg.test(bufVal) && "" !== opts.groupSeparator; ) bufVal = bufVal.replace(reg, "$1" + opts.groupSeparator + "$2"), 
                    bufVal = bufVal.replace(opts.groupSeparator + opts.groupSeparator, opts.groupSeparator);
                    bufVal = bufVal.replace("?", "!"), "" !== opts.radixPoint && radixSplit.length > 1 && (bufVal += (charAtPos === opts.radixPoint ? "!" : opts.radixPoint) + radixSplit[1]);
                }
                bufVal = opts.prefix + bufVal + opts.suffix, isNegative && (bufVal = opts.negationSymbol.front + bufVal + opts.negationSymbol.back);
                var needsRefresh = bufValOrigin !== bufVal.split("").join(), newPos = $.inArray("!", bufVal);
                if (newPos === -1 && (newPos = pos), needsRefresh) {
                    for (buffer.length = bufVal.length, i = 0, l = bufVal.length; i < l; i++) buffer[i] = bufVal.charAt(i);
                    buffer[newPos] = charAtPos;
                }
                return newPos = opts.numericInput && isFinite(pos) ? buffer.join("").length - newPos - 1 : newPos, 
                opts.numericInput && (buffer = buffer.reverse(), $.inArray(opts.radixPoint, buffer) < newPos && buffer.join("").length - opts.suffix.length !== newPos && (newPos -= 1)), 
                {
                    pos: newPos,
                    refreshFromBuffer: needsRefresh,
                    buffer: buffer,
                    isNegative: isNegative
                };
            },
            onBeforeWrite: function(e, buffer, caretPos, opts) {
                var rslt;
                if (e && ("blur" === e.type || "checkval" === e.type || "keydown" === e.type)) {
                    var maskedValue = opts.numericInput ? buffer.slice().reverse().join("") : buffer.join(""), processValue = maskedValue.replace(opts.prefix, "");
                    processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                    "," === opts.radixPoint && (processValue = processValue.replace(opts.radixPoint, "."));
                    var isNegative = processValue.match(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"));
                    if (isNegative = null !== isNegative && 1 === isNegative.length, processValue = processValue.replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), ""), 
                    processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""), 
                    isNaN(opts.placeholder) && (processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.placeholder), "g"), "")), 
                    processValue = processValue === opts.negationSymbol.front ? processValue + "0" : processValue, 
                    "" !== processValue && isFinite(processValue)) {
                        var floatValue = parseFloat(processValue), signedFloatValue = isNegative ? floatValue * -1 : floatValue;
                        if ("blur" === e.type && (null !== opts.min && isFinite(opts.min) && signedFloatValue < parseFloat(opts.min) ? (floatValue = Math.abs(opts.min), 
                        isNegative = opts.min < 0, maskedValue = void 0) : null !== opts.max && isFinite(opts.max) && signedFloatValue > parseFloat(opts.max) && (floatValue = Math.abs(opts.max), 
                        isNegative = opts.max < 0, maskedValue = void 0)), processValue = floatValue.toString().replace(".", opts.radixPoint).split(""), 
                        isFinite(opts.digits)) {
                            var radixPosition = $.inArray(opts.radixPoint, processValue), rpb = $.inArray(opts.radixPoint, maskedValue);
                            radixPosition === -1 && (processValue.push(opts.radixPoint), radixPosition = processValue.length - 1);
                            for (var i = 1; i <= opts.digits; i++) opts.digitsOptional || void 0 !== processValue[radixPosition + i] && processValue[radixPosition + i] !== opts.placeholder.charAt(0) ? rpb !== -1 && void 0 !== maskedValue[rpb + i] && (processValue[radixPosition + i] = processValue[radixPosition + i] || maskedValue[rpb + i]) : processValue[radixPosition + i] = "0";
                            processValue[processValue.length - 1] === opts.radixPoint && delete processValue[processValue.length - 1];
                        }
                        if (floatValue.toString() !== processValue && floatValue.toString() + "." !== processValue || isNegative) return processValue = (opts.prefix + processValue.join("")).split(""), 
                        !isNegative || 0 === floatValue && "blur" === e.type || (processValue.unshift(opts.negationSymbol.front), 
                        processValue.push(opts.negationSymbol.back)), opts.numericInput && (processValue = processValue.reverse()), 
                        rslt = opts.postFormat(processValue, opts.numericInput ? caretPos : caretPos - 1, opts), 
                        rslt.buffer && (rslt.refreshFromBuffer = rslt.buffer.join("") !== buffer.join("")), 
                        rslt;
                    }
                }
                if (opts.autoGroup) return rslt = opts.postFormat(buffer, opts.numericInput ? caretPos : caretPos - 1, opts), 
                rslt.caret = caretPos < (rslt.isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length || caretPos > rslt.buffer.length - (rslt.isNegative ? opts.negationSymbol.back.length : 0) ? rslt.pos : rslt.pos + 1, 
                rslt;
            },
            regex: {
                integerPart: function(opts) {
                    return new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?\\d+");
                },
                integerNPart: function(opts) {
                    return new RegExp("[\\d" + Inputmask.escapeRegex(opts.groupSeparator) + Inputmask.escapeRegex(opts.placeholder.charAt(0)) + "]+");
                }
            },
            signHandler: function(chrs, maskset, pos, strict, opts) {
                if (!strict && opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) {
                    var matchRslt = maskset.buffer.join("").match(opts.regex.integerPart(opts));
                    if (matchRslt && matchRslt[0].length > 0) return maskset.buffer[matchRslt.index] === ("-" === chrs ? "+" : opts.negationSymbol.front) ? "-" === chrs ? "" !== opts.negationSymbol.back ? {
                        pos: 0,
                        c: opts.negationSymbol.front,
                        remove: 0,
                        caret: pos,
                        insert: {
                            pos: maskset.buffer.length - 1,
                            c: opts.negationSymbol.back
                        }
                    } : {
                        pos: 0,
                        c: opts.negationSymbol.front,
                        remove: 0,
                        caret: pos
                    } : "" !== opts.negationSymbol.back ? {
                        pos: 0,
                        c: "+",
                        remove: [ 0, maskset.buffer.length - 1 ],
                        caret: pos
                    } : {
                        pos: 0,
                        c: "+",
                        remove: 0,
                        caret: pos
                    } : maskset.buffer[0] === ("-" === chrs ? opts.negationSymbol.front : "+") ? "-" === chrs && "" !== opts.negationSymbol.back ? {
                        remove: [ 0, maskset.buffer.length - 1 ],
                        caret: pos - 1
                    } : {
                        remove: 0,
                        caret: pos - 1
                    } : "-" === chrs ? "" !== opts.negationSymbol.back ? {
                        pos: 0,
                        c: opts.negationSymbol.front,
                        caret: pos + 1,
                        insert: {
                            pos: maskset.buffer.length,
                            c: opts.negationSymbol.back
                        }
                    } : {
                        pos: 0,
                        c: opts.negationSymbol.front,
                        caret: pos + 1
                    } : {
                        pos: 0,
                        c: chrs,
                        caret: pos + 1
                    };
                }
                return !1;
            },
            radixHandler: function(chrs, maskset, pos, strict, opts) {
                if (!strict && opts.numericInput !== !0 && chrs === opts.radixPoint && void 0 !== opts.digits && (isNaN(opts.digits) || parseInt(opts.digits) > 0)) {
                    var radixPos = $.inArray(opts.radixPoint, maskset.buffer), integerValue = maskset.buffer.join("").match(opts.regex.integerPart(opts));
                    if (radixPos !== -1 && maskset.validPositions[radixPos]) return maskset.validPositions[radixPos - 1] ? {
                        caret: radixPos + 1
                    } : {
                        pos: integerValue.index,
                        c: integerValue[0],
                        caret: radixPos + 1
                    };
                    if (!integerValue || "0" === integerValue[0] && integerValue.index + 1 !== pos) return maskset.buffer[integerValue ? integerValue.index : pos] = "0", 
                    {
                        pos: (integerValue ? integerValue.index : pos) + 1,
                        c: opts.radixPoint
                    };
                }
                return !1;
            },
            leadingZeroHandler: function(chrs, maskset, pos, strict, opts, isSelection) {
                if (!strict) {
                    var initialPos = pos, buffer = opts.numericInput === !0 ? maskset.buffer.slice("").reverse() : maskset.buffer.slice("");
                    opts.numericInput && (pos = buffer.join("").length - pos - 1), buffer.splice(0, opts.prefix.length), 
                    buffer.splice(buffer.length - opts.suffix.length, opts.suffix.length), pos -= opts.prefix.length;
                    var radixPosition = $.inArray(opts.radixPoint, buffer), matchRslt = buffer.slice(0, radixPosition !== -1 ? radixPosition : void 0).join("").match(opts.regex.integerNPart(opts));
                    if (matchRslt && (radixPosition === -1 || pos <= radixPosition || opts.numericInput)) {
                        var decimalPart = radixPosition === -1 ? 0 : parseInt(buffer.slice(radixPosition + 1).join("")), leadingZero = 0 === matchRslt[0].indexOf("" !== opts.placeholder ? opts.placeholder.charAt(0) : "0");
                        if (opts.numericInput) {
                            if (leadingZero && 0 !== decimalPart && isSelection !== !0) return maskset.buffer.splice(buffer.length - matchRslt.index - 1 + opts.suffix.length, 1), 
                            {
                                pos: initialPos,
                                remove: buffer.length - matchRslt.index - 1 + opts.suffix.length
                            };
                        } else {
                            if (leadingZero && (matchRslt.index + 1 === pos || isSelection !== !0 && 0 === decimalPart)) return maskset.buffer.splice(matchRslt.index + opts.prefix.length, 1), 
                            {
                                pos: matchRslt.index + opts.prefix.length,
                                remove: matchRslt.index + opts.prefix.length
                            };
                            if ("0" === chrs && pos <= matchRslt.index && matchRslt[0] !== opts.groupSeparator) return !1;
                        }
                    }
                }
                return !0;
            },
            definitions: {
                "~": {
                    validator: function(chrs, maskset, pos, strict, opts, isSelection) {
                        var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                        if (!isValid && (isValid = opts.radixHandler(chrs, maskset, pos, strict, opts), 
                        !isValid && (isValid = strict ? new RegExp("[0-9" + Inputmask.escapeRegex(opts.groupSeparator) + "]").test(chrs) : new RegExp("[0-9]").test(chrs), 
                        isValid === !0 && (isValid = opts.leadingZeroHandler(chrs, maskset, pos, strict, opts, isSelection), 
                        isValid === !0 && opts.numericInput !== !0)))) {
                            var radixPosition = $.inArray(opts.radixPoint, maskset.buffer);
                            isValid = radixPosition !== -1 && (opts.digitsOptional === !1 || maskset.validPositions[pos]) && opts.numericInput !== !0 && pos > radixPosition && !strict ? {
                                pos: pos,
                                remove: pos
                            } : {
                                pos: pos
                            };
                        }
                        return isValid;
                    },
                    cardinality: 1
                },
                "+": {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                        return !isValid && (strict && opts.allowMinus && chrs === opts.negationSymbol.front || opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) && (isValid = !(!strict && "-" === chrs) || ("" !== opts.negationSymbol.back ? {
                            pos: pos,
                            c: "-" === chrs ? opts.negationSymbol.front : "+",
                            caret: pos + 1,
                            insert: {
                                pos: maskset.buffer.length,
                                c: opts.negationSymbol.back
                            }
                        } : {
                            pos: pos,
                            c: "-" === chrs ? opts.negationSymbol.front : "+",
                            caret: pos + 1
                        })), isValid;
                    },
                    cardinality: 1,
                    placeholder: ""
                },
                "-": {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                        return !isValid && strict && opts.allowMinus && chrs === opts.negationSymbol.back && (isValid = !0), 
                        isValid;
                    },
                    cardinality: 1,
                    placeholder: ""
                },
                ":": {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                        if (!isValid) {
                            var radix = "[" + Inputmask.escapeRegex(opts.radixPoint) + "]";
                            isValid = new RegExp(radix).test(chrs), isValid && maskset.validPositions[pos] && maskset.validPositions[pos].match.placeholder === opts.radixPoint && (isValid = {
                                caret: pos + 1
                            });
                        }
                        return isValid;
                    },
                    cardinality: 1,
                    placeholder: function(opts) {
                        return opts.radixPoint;
                    }
                }
            },
            onUnMask: function(maskedValue, unmaskedValue, opts) {
                if ("" === unmaskedValue && opts.nullable === !0) return unmaskedValue;
                var processValue = maskedValue.replace(opts.prefix, "");
                return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                opts.unmaskAsNumber ? ("" !== opts.radixPoint && processValue.indexOf(opts.radixPoint) !== -1 && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")), 
                Number(processValue)) : processValue;
            },
            isComplete: function(buffer, opts) {
                var maskedValue = buffer.join(""), bufClone = buffer.slice();
                if (opts.postFormat(bufClone, 0, opts), bufClone.join("") !== maskedValue) return !1;
                var processValue = maskedValue.replace(opts.prefix, "");
                return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                "," === opts.radixPoint && (processValue = processValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")), 
                isFinite(processValue);
            },
            onBeforeMask: function(initialValue, opts) {
                if (initialValue = initialValue.toString(), opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")), 
                "" !== opts.radixPoint && isFinite(initialValue)) {
                    var vs = initialValue.split("."), groupSize = "" !== opts.groupSeparator ? parseInt(opts.groupSize) : 0;
                    2 === vs.length && (vs[0].length > groupSize || vs[1].length > groupSize) && (initialValue = initialValue.replace(".", opts.radixPoint));
                }
                var kommaMatches = initialValue.match(/,/g), dotMatches = initialValue.match(/\./g);
                if (dotMatches && kommaMatches ? dotMatches.length > kommaMatches.length ? (initialValue = initialValue.replace(/\./g, ""), 
                initialValue = initialValue.replace(",", opts.radixPoint)) : kommaMatches.length > dotMatches.length ? (initialValue = initialValue.replace(/,/g, ""), 
                initialValue = initialValue.replace(".", opts.radixPoint)) : initialValue = initialValue.indexOf(".") < initialValue.indexOf(",") ? initialValue.replace(/\./g, "") : initialValue = initialValue.replace(/,/g, "") : initialValue = initialValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 
                0 === opts.digits && (initialValue.indexOf(".") !== -1 ? initialValue = initialValue.substring(0, initialValue.indexOf(".")) : initialValue.indexOf(",") !== -1 && (initialValue = initialValue.substring(0, initialValue.indexOf(",")))), 
                "" !== opts.radixPoint && isFinite(opts.digits) && initialValue.indexOf(opts.radixPoint) !== -1) {
                    var valueParts = initialValue.split(opts.radixPoint), decPart = valueParts[1].match(new RegExp("\\d*"))[0];
                    if (parseInt(opts.digits) < decPart.toString().length) {
                        var digitsFactor = Math.pow(10, parseInt(opts.digits));
                        initialValue = initialValue.replace(Inputmask.escapeRegex(opts.radixPoint), "."), 
                        initialValue = Math.round(parseFloat(initialValue) * digitsFactor) / digitsFactor, 
                        initialValue = initialValue.toString().replace(".", opts.radixPoint);
                    }
                }
                return opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")), 
                initialValue;
            },
            canClearPosition: function(maskset, position, lvp, strict, opts) {
                var positionInput = maskset.validPositions[position].input, canClear = positionInput !== opts.radixPoint || null !== maskset.validPositions[position].match.fn && opts.decimalProtect === !1 || isFinite(positionInput) || position === lvp || positionInput === opts.groupSeparator || positionInput === opts.negationSymbol.front || positionInput === opts.negationSymbol.back;
                return canClear;
            },
            onKeyDown: function(e, buffer, caretPos, opts) {
                var $input = $(this);
                if (e.ctrlKey) switch (e.keyCode) {
                  case Inputmask.keyCode.UP:
                    $input.val(parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)), $input.trigger("setvalue");
                    break;

                  case Inputmask.keyCode.DOWN:
                    $input.val(parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)), $input.trigger("setvalue");
                }
            }
        },
        currency: {
            prefix: "$ ",
            groupSeparator: ",",
            alias: "numeric",
            placeholder: "0",
            autoGroup: !0,
            digits: 2,
            digitsOptional: !1,
            clearMaskOnLostFocus: !1
        },
        decimal: {
            alias: "numeric"
        },
        integer: {
            alias: "numeric",
            digits: 0,
            radixPoint: ""
        },
        percentage: {
            alias: "numeric",
            digits: 2,
            radixPoint: ".",
            placeholder: "0",
            autoGroup: !1,
            min: 0,
            max: 100,
            suffix: " %",
            allowPlus: !1,
            allowMinus: !1
        }
    }), Inputmask;
}(jQuery, Inputmask), function($, Inputmask) {
    function maskSort(a, b) {
        var maska = (a.mask || a).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""), maskb = (b.mask || b).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""), maskas = (a.mask || a).split("#")[0], maskbs = (b.mask || b).split("#")[0];
        return 0 === maskbs.indexOf(maskas) ? -1 : 0 === maskas.indexOf(maskbs) ? 1 : maska.localeCompare(maskb);
    }
    var analyseMaskBase = Inputmask.prototype.analyseMask;
    return Inputmask.prototype.analyseMask = function(mask, opts) {
        function reduceVariations(masks, previousVariation, previousmaskGroup) {
            previousVariation = previousVariation || "", previousmaskGroup = previousmaskGroup || maskGroups, 
            "" !== previousVariation && (previousmaskGroup[previousVariation] = {});
            for (var variation = "", maskGroup = previousmaskGroup[previousVariation] || previousmaskGroup, i = masks.length - 1; i >= 0; i--) mask = masks[i].mask || masks[i], 
            variation = mask.substr(0, 1), maskGroup[variation] = maskGroup[variation] || [], 
            maskGroup[variation].unshift(mask.substr(1)), masks.splice(i, 1);
            for (var ndx in maskGroup) maskGroup[ndx].length > 500 && reduceVariations(maskGroup[ndx].slice(), ndx, maskGroup);
        }
        function rebuild(maskGroup) {
            var mask = "", submasks = [];
            for (var ndx in maskGroup) $.isArray(maskGroup[ndx]) ? 1 === maskGroup[ndx].length ? submasks.push(ndx + maskGroup[ndx]) : submasks.push(ndx + opts.groupmarker.start + maskGroup[ndx].join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end) : submasks.push(ndx + rebuild(maskGroup[ndx]));
            return mask += 1 === submasks.length ? submasks[0] : opts.groupmarker.start + submasks.join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end;
        }
        var maskGroups = {};
        opts.phoneCodes && (opts.phoneCodes && opts.phoneCodes.length > 1e3 && (mask = mask.substr(1, mask.length - 2), 
        reduceVariations(mask.split(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start)), 
        mask = rebuild(maskGroups)), mask = mask.replace(/9/g, "\\9"));
        var mt = analyseMaskBase.call(this, mask, opts);
        return mt;
    }, Inputmask.extendAliases({
        abstractphone: {
            groupmarker: {
                start: "<",
                end: ">"
            },
            countrycode: "",
            phoneCodes: [],
            mask: function(opts) {
                return opts.definitions = {
                    "#": Inputmask.prototype.definitions[9]
                }, opts.phoneCodes.sort(maskSort);
            },
            keepStatic: !0,
            onBeforeMask: function(value, opts) {
                var processedValue = value.replace(/^0{1,2}/, "").replace(/[\s]/g, "");
                return (processedValue.indexOf(opts.countrycode) > 1 || processedValue.indexOf(opts.countrycode) === -1) && (processedValue = "+" + opts.countrycode + processedValue), 
                processedValue;
            },
            onUnMask: function(maskedValue, unmaskedValue, opts) {
                return unmaskedValue;
            },
            inputmode: "tel"
        }
    }), Inputmask;
}(jQuery, Inputmask), function($, Inputmask) {
    return Inputmask.extendAliases({
        Regex: {
            mask: "r",
            greedy: !1,
            repeat: "*",
            regex: null,
            regexTokens: null,
            tokenizer: /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,
            quantifierFilter: /[0-9]+[^,]/,
            isComplete: function(buffer, opts) {
                return new RegExp(opts.regex, opts.casing ? "i" : "").test(buffer.join(""));
            },
            definitions: {
                r: {
                    validator: function(chrs, maskset, pos, strict, opts) {
                        function RegexToken(isGroup, isQuantifier) {
                            this.matches = [], this.isGroup = isGroup || !1, this.isQuantifier = isQuantifier || !1, 
                            this.quantifier = {
                                min: 1,
                                max: 1
                            }, this.repeaterPart = void 0;
                        }
                        function analyseRegex() {
                            var match, m, currentToken = new RegexToken(), opengroups = [];
                            for (opts.regexTokens = []; match = opts.tokenizer.exec(opts.regex); ) switch (m = match[0], 
                            m.charAt(0)) {
                              case "(":
                                opengroups.push(new RegexToken((!0)));
                                break;

                              case ")":
                                groupToken = opengroups.pop(), opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(groupToken) : currentToken.matches.push(groupToken);
                                break;

                              case "{":
                              case "+":
                              case "*":
                                var quantifierToken = new RegexToken((!1), (!0));
                                m = m.replace(/[{}]/g, "");
                                var mq = m.split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                                if (quantifierToken.quantifier = {
                                    min: mq0,
                                    max: mq1
                                }, opengroups.length > 0) {
                                    var matches = opengroups[opengroups.length - 1].matches;
                                    match = matches.pop(), match.isGroup || (groupToken = new RegexToken((!0)), groupToken.matches.push(match), 
                                    match = groupToken), matches.push(match), matches.push(quantifierToken);
                                } else match = currentToken.matches.pop(), match.isGroup || (groupToken = new RegexToken((!0)), 
                                groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match), 
                                currentToken.matches.push(quantifierToken);
                                break;

                              default:
                                opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(m) : currentToken.matches.push(m);
                            }
                            currentToken.matches.length > 0 && opts.regexTokens.push(currentToken);
                        }
                        function validateRegexToken(token, fromGroup) {
                            var isvalid = !1;
                            fromGroup && (regexPart += "(", openGroupCount++);
                            for (var mndx = 0; mndx < token.matches.length; mndx++) {
                                var matchToken = token.matches[mndx];
                                if (matchToken.isGroup === !0) isvalid = validateRegexToken(matchToken, !0); else if (matchToken.isQuantifier === !0) {
                                    var crrntndx = $.inArray(matchToken, token.matches), matchGroup = token.matches[crrntndx - 1], regexPartBak = regexPart;
                                    if (isNaN(matchToken.quantifier.max)) {
                                        for (;matchToken.repeaterPart && matchToken.repeaterPart !== regexPart && matchToken.repeaterPart.length > regexPart.length && !(isvalid = validateRegexToken(matchGroup, !0)); ) ;
                                        isvalid = isvalid || validateRegexToken(matchGroup, !0), isvalid && (matchToken.repeaterPart = regexPart), 
                                        regexPart = regexPartBak + matchToken.quantifier.max;
                                    } else {
                                        for (var i = 0, qm = matchToken.quantifier.max - 1; i < qm && !(isvalid = validateRegexToken(matchGroup, !0)); i++) ;
                                        regexPart = regexPartBak + "{" + matchToken.quantifier.min + "," + matchToken.quantifier.max + "}";
                                    }
                                } else if (void 0 !== matchToken.matches) for (var k = 0; k < matchToken.length && !(isvalid = validateRegexToken(matchToken[k], fromGroup)); k++) ; else {
                                    var testExp;
                                    if ("[" == matchToken.charAt(0)) {
                                        testExp = regexPart, testExp += matchToken;
                                        for (var j = 0; j < openGroupCount; j++) testExp += ")";
                                        var exp = new RegExp("^(" + testExp + ")$", opts.casing ? "i" : "");
                                        isvalid = exp.test(bufferStr);
                                    } else for (var l = 0, tl = matchToken.length; l < tl; l++) if ("\\" !== matchToken.charAt(l)) {
                                        testExp = regexPart, testExp += matchToken.substr(0, l + 1), testExp = testExp.replace(/\|$/, "");
                                        for (var j = 0; j < openGroupCount; j++) testExp += ")";
                                        var exp = new RegExp("^(" + testExp + ")$", opts.casing ? "i" : "");
                                        if (isvalid = exp.test(bufferStr)) break;
                                    }
                                    regexPart += matchToken;
                                }
                                if (isvalid) break;
                            }
                            return fromGroup && (regexPart += ")", openGroupCount--), isvalid;
                        }
                        var bufferStr, groupToken, cbuffer = maskset.buffer.slice(), regexPart = "", isValid = !1, openGroupCount = 0;
                        null === opts.regexTokens && analyseRegex(), cbuffer.splice(pos, 0, chrs), bufferStr = cbuffer.join("");
                        for (var i = 0; i < opts.regexTokens.length; i++) {
                            var regexToken = opts.regexTokens[i];
                            if (isValid = validateRegexToken(regexToken, regexToken.isGroup)) break;
                        }
                        return isValid;
                    },
                    cardinality: 1
                }
            }
        }
    }), Inputmask;
}(jQuery, Inputmask);
/**
* jquery-match-height 0.7.2 by @liabru
* http://brm.io/jquery-match-height/
* License: MIT
*/

;(function(factory) { // eslint-disable-line no-extra-semi
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Global
        factory(jQuery);
    }
})(function($) {
    /*
    *  internal
    */

    var _previousResizeWidth = -1,
        _updateTimeout = -1;

    /*
    *  _parse
    *  value parse utility function
    */

    var _parse = function(value) {
        // parse value and convert NaN to 0
        return parseFloat(value) || 0;
    };

    /*
    *  _rows
    *  utility function returns array of jQuery selections representing each row
    *  (as displayed after float wrapping applied by browser)
    */

    var _rows = function(elements) {
        var tolerance = 1,
            $elements = $(elements),
            lastTop = null,
            rows = [];

        // group elements by their top position
        $elements.each(function(){
            var $that = $(this),
                top = $that.offset().top - _parse($that.css('margin-top')),
                lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

            if (lastRow === null) {
                // first item on the row, so just push it
                rows.push($that);
            } else {
                // if the row top is the same, add to the row group
                if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
                    rows[rows.length - 1] = lastRow.add($that);
                } else {
                    // otherwise start a new row group
                    rows.push($that);
                }
            }

            // keep track of the last row top
            lastTop = top;
        });

        return rows;
    };

    /*
    *  _parseOptions
    *  handle plugin options
    */

    var _parseOptions = function(options) {
        var opts = {
            byRow: true,
            property: 'height',
            target: null,
            remove: false
        };

        if (typeof options === 'object') {
            return $.extend(opts, options);
        }

        if (typeof options === 'boolean') {
            opts.byRow = options;
        } else if (options === 'remove') {
            opts.remove = true;
        }

        return opts;
    };

    /*
    *  matchHeight
    *  plugin definition
    */

    var matchHeight = $.fn.matchHeight = function(options) {
        var opts = _parseOptions(options);

        // handle remove
        if (opts.remove) {
            var that = this;

            // remove fixed height from all selected elements
            this.css(opts.property, '');

            // remove selected elements from all groups
            $.each(matchHeight._groups, function(key, group) {
                group.elements = group.elements.not(that);
            });

            // TODO: cleanup empty groups

            return this;
        }

        if (this.length <= 1 && !opts.target) {
            return this;
        }

        // keep track of this group so we can re-apply later on load and resize events
        matchHeight._groups.push({
            elements: this,
            options: opts
        });

        // match each element's height to the tallest element in the selection
        matchHeight._apply(this, opts);

        return this;
    };

    /*
    *  plugin global options
    */

    matchHeight.version = '0.7.2';
    matchHeight._groups = [];
    matchHeight._throttle = 80;
    matchHeight._maintainScroll = false;
    matchHeight._beforeUpdate = null;
    matchHeight._afterUpdate = null;
    matchHeight._rows = _rows;
    matchHeight._parse = _parse;
    matchHeight._parseOptions = _parseOptions;

    /*
    *  matchHeight._apply
    *  apply matchHeight to given elements
    */

    matchHeight._apply = function(elements, options) {
        var opts = _parseOptions(options),
            $elements = $(elements),
            rows = [$elements];

        // take note of scroll position
        var scrollTop = $(window).scrollTop(),
            htmlHeight = $('html').outerHeight(true);

        // get hidden parents
        var $hiddenParents = $elements.parents().filter(':hidden');

        // cache the original inline style
        $hiddenParents.each(function() {
            var $that = $(this);
            $that.data('style-cache', $that.attr('style'));
        });

        // temporarily must force hidden parents visible
        $hiddenParents.css('display', 'block');

        // get rows if using byRow, otherwise assume one row
        if (opts.byRow && !opts.target) {

            // must first force an arbitrary equal height so floating elements break evenly
            $elements.each(function() {
                var $that = $(this),
                    display = $that.css('display');

                // temporarily force a usable display value
                if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
                    display = 'block';
                }

                // cache the original inline style
                $that.data('style-cache', $that.attr('style'));

                $that.css({
                    'display': display,
                    'padding-top': '0',
                    'padding-bottom': '0',
                    'margin-top': '0',
                    'margin-bottom': '0',
                    'border-top-width': '0',
                    'border-bottom-width': '0',
                    'height': '100px',
                    'overflow': 'hidden'
                });
            });

            // get the array of rows (based on element top position)
            rows = _rows($elements);

            // revert original inline styles
            $elements.each(function() {
                var $that = $(this);
                $that.attr('style', $that.data('style-cache') || '');
            });
        }

        $.each(rows, function(key, row) {
            var $row = $(row),
                targetHeight = 0;

            if (!opts.target) {
                // skip apply to rows with only one item
                if (opts.byRow && $row.length <= 1) {
                    $row.css(opts.property, '');
                    return;
                }

                // iterate the row and find the max height
                $row.each(function(){
                    var $that = $(this),
                        style = $that.attr('style'),
                        display = $that.css('display');

                    // temporarily force a usable display value
                    if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
                        display = 'block';
                    }

                    // ensure we get the correct actual height (and not a previously set height value)
                    var css = { 'display': display };
                    css[opts.property] = '';
                    $that.css(css);

                    // find the max height (including padding, but not margin)
                    if ($that.outerHeight(false) > targetHeight) {
                        targetHeight = $that.outerHeight(false);
                    }

                    // revert styles
                    if (style) {
                        $that.attr('style', style);
                    } else {
                        $that.css('display', '');
                    }
                });
            } else {
                // if target set, use the height of the target element
                targetHeight = opts.target.outerHeight(false);
            }

            // iterate the row and apply the height to all elements
            $row.each(function(){
                var $that = $(this),
                    verticalPadding = 0;

                // don't apply to a target
                if (opts.target && $that.is(opts.target)) {
                    return;
                }

                // handle padding and border correctly (required when not using border-box)
                if ($that.css('box-sizing') !== 'border-box') {
                    verticalPadding += _parse($that.css('border-top-width')) + _parse($that.css('border-bottom-width'));
                    verticalPadding += _parse($that.css('padding-top')) + _parse($that.css('padding-bottom'));
                }

                // set the height (accounting for padding and border)
                $that.css(opts.property, (targetHeight - verticalPadding) + 'px');
            });
        });

        // revert hidden parents
        $hiddenParents.each(function() {
            var $that = $(this);
            $that.attr('style', $that.data('style-cache') || null);
        });

        // restore scroll position if enabled
        if (matchHeight._maintainScroll) {
            $(window).scrollTop((scrollTop / htmlHeight) * $('html').outerHeight(true));
        }

        return this;
    };

    /*
    *  matchHeight._applyDataApi
    *  applies matchHeight to all elements with a data-match-height attribute
    */

    matchHeight._applyDataApi = function() {
        var groups = {};

        // generate groups by their groupId set by elements using data-match-height
        $('[data-match-height], [data-mh]').each(function() {
            var $this = $(this),
                groupId = $this.attr('data-mh') || $this.attr('data-match-height');

            if (groupId in groups) {
                groups[groupId] = groups[groupId].add($this);
            } else {
                groups[groupId] = $this;
            }
        });

        // apply matchHeight to each group
        $.each(groups, function() {
            this.matchHeight(true);
        });
    };

    /*
    *  matchHeight._update
    *  updates matchHeight on all current groups with their correct options
    */

    var _update = function(event) {
        if (matchHeight._beforeUpdate) {
            matchHeight._beforeUpdate(event, matchHeight._groups);
        }

        $.each(matchHeight._groups, function() {
            matchHeight._apply(this.elements, this.options);
        });

        if (matchHeight._afterUpdate) {
            matchHeight._afterUpdate(event, matchHeight._groups);
        }
    };

    matchHeight._update = function(throttle, event) {
        // prevent update if fired from a resize event
        // where the viewport width hasn't actually changed
        // fixes an event looping bug in IE8
        if (event && event.type === 'resize') {
            var windowWidth = $(window).width();
            if (windowWidth === _previousResizeWidth) {
                return;
            }
            _previousResizeWidth = windowWidth;
        }

        // throttle updates
        if (!throttle) {
            _update(event);
        } else if (_updateTimeout === -1) {
            _updateTimeout = setTimeout(function() {
                _update(event);
                _updateTimeout = -1;
            }, matchHeight._throttle);
        }
    };

    /*
    *  bind events
    */

    // apply on DOM ready event
    $(matchHeight._applyDataApi);

    // use on or bind where supported
    var on = $.fn.on ? 'on' : 'bind';

    // update heights on load and resize events
    $(window)[on]('load', function(event) {
        matchHeight._update(false, event);
    });

    // throttled update heights on resize events
    $(window)[on]('resize orientationchange', function(event) {
        matchHeight._update(true, event);
    });

});

/** @preserve
 * jsPDF - PDF Document creation from JavaScript
 * Version 1.0.272-git Built on 2014-09-29T15:09
 *                           CommitID d4770725ca
 *
 * Copyright (c) 2010-2014 James Hall, https://github.com/MrRio/jsPDF
 *               2010 Aaron Spike, https://github.com/acspike
 *               2012 Willow Systems Corporation, willow-systems.com
 *               2012 Pablo Hess, https://github.com/pablohess
 *               2012 Florian Jenett, https://github.com/fjenett
 *               2013 Warren Weckesser, https://github.com/warrenweckesser
 *               2013 Youssef Beddad, https://github.com/lifof
 *               2013 Lee Driscoll, https://github.com/lsdriscoll
 *               2013 Stefan Slonevskiy, https://github.com/stefslon
 *               2013 Jeremy Morel, https://github.com/jmorel
 *               2013 Christoph Hartmann, https://github.com/chris-rock
 *               2014 Juan Pablo Gaviria, https://github.com/juanpgaviria
 *               2014 James Makes, https://github.com/dollaruw
 *               2014 Diego Casorran, https://github.com/diegocr
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Contributor(s):
 *    siefkenj, ahwolf, rickygu, Midnith, saintclair, eaparango,
 *    kim3er, mfo, alnorth,
 */

/**
 * Creates new jsPDF document object instance.
 *
 * @class
 * @param orientation One of "portrait" or "landscape" (or shortcuts "p" (Default), "l")
 * @param unit        Measurement unit to be used when coordinates are specified.
 *                    One of "pt" (points), "mm" (Default), "cm", "in"
 * @param format      One of 'pageFormats' as shown below, default: a4
 * @returns {jsPDF}
 * @name jsPDF
 */
var jsPDF = (function(global) {
  'use strict';
  var pdfVersion = '1.3',
    pageFormats = {
      // Size in pt of various paper formats
      a0: [2383.94, 3370.39],
      a1: [1683.78, 2383.94],
      a2: [1190.55, 1683.78],
      a3: [841.89, 1190.55],
      a4: [595.28, 841.89],
      a5: [419.53, 595.28],
      a6: [297.64, 419.53],
      a7: [209.76, 297.64],
      a8: [147.4, 209.76],
      a9: [104.88, 147.4],
      a10: [73.7, 104.88],
      b0: [2834.65, 4008.19],
      b1: [2004.09, 2834.65],
      b2: [1417.32, 2004.09],
      b3: [1000.63, 1417.32],
      b4: [708.66, 1000.63],
      b5: [498.9, 708.66],
      b6: [354.33, 498.9],
      b7: [249.45, 354.33],
      b8: [175.75, 249.45],
      b9: [124.72, 175.75],
      b10: [87.87, 124.72],
      c0: [2599.37, 3676.54],
      c1: [1836.85, 2599.37],
      c2: [1298.27, 1836.85],
      c3: [918.43, 1298.27],
      c4: [649.13, 918.43],
      c5: [459.21, 649.13],
      c6: [323.15, 459.21],
      c7: [229.61, 323.15],
      c8: [161.57, 229.61],
      c9: [113.39, 161.57],
      c10: [79.37, 113.39],
      dl: [311.81, 623.62],
      letter: [612, 792],
      'government-letter': [576, 756],
      legal: [612, 1008],
      'junior-legal': [576, 360],
      ledger: [1224, 792],
      tabloid: [792, 1224],
      'credit-card': [153, 243]
    };

  /**
	 * jsPDF's Internal PubSub Implementation.
	 * See mrrio.github.io/jsPDF/doc/symbols/PubSub.html
	 * Backward compatible rewritten on 2014 by
	 * Diego Casorran, https://github.com/diegocr
	 *
	 * @class
	 * @name PubSub
	 */
  function PubSub(context) {
    var topics = {};

    this.subscribe = function(topic, callback, once) {
      if (typeof callback !== 'function') {
        return false;
      }

      if (!topics.hasOwnProperty(topic)) {
        topics[topic] = {};
      }

      var id = Math.random().toString(35);
      topics[topic][id] = [callback, !!once];

      return id;
    };

    this.unsubscribe = function(token) {
      for (var topic in topics) {
        if (topics[topic][token]) {
          delete topics[topic][token];
          return true;
        }
      }
      return false;
    };

    this.publish = function(topic) {
      if (topics.hasOwnProperty(topic)) {
        var args = Array.prototype.slice.call(arguments, 1),
          idr = [];

        for (var id in topics[topic]) {
          var sub = topics[topic][id];
          try {
            sub[0].apply(context, args);
          } catch (ex) {
            if (global.console) {
              console.error('jsPDF PubSub Error', ex.message, ex);
            }
          }
          if (sub[1]) idr.push(id);
        }
        if (idr.length) idr.forEach(this.unsubscribe);
      }
    };
  }

  /**
	 * @constructor
	 * @private
	 */
  function jsPDF(orientation, unit, format, compressPdf) {
    var options = {};

    if (typeof orientation === 'object') {
      options = orientation;

      orientation = options.orientation;
      unit = options.unit || unit;
      format = options.format || format;
      compressPdf = options.compress || options.compressPdf || compressPdf;
    }

    // Default options
    unit = unit || 'mm';
    format = format || 'a4';
    orientation = ('' + (orientation || 'P')).toLowerCase();

    var format_as_string = ('' + format).toLowerCase(),
      compress = !!compressPdf && typeof Uint8Array === 'function',
      textColor = options.textColor || '0 g',
      drawColor = options.drawColor || '0 G',
      activeFontSize = options.fontSize || 16,
      lineHeightProportion = options.lineHeight || 1.15,
      lineWidth = options.lineWidth || 0.200025, // 2mm
      objectNumber = 2, // 'n' Current object number
      outToPages = !1, // switches where out() prints. outToPages true = push to pages obj. outToPages false = doc builder content
      offsets = [], // List of offsets. Activated and reset by buildDocument(). Pupulated by various calls buildDocument makes.
      fonts = {}, // collection of font objects, where key is fontKey - a dynamically created label for a given font.
      fontmap = {}, // mapping structure fontName > fontStyle > font key - performance layer. See addFont()
      activeFontKey, // will be string representing the KEY of the font as combination of fontName + fontStyle
      k, // Scale factor
      tmp,
      page = 0,
      currentPage,
      pages = [],
      pagedim = {},
      content = [],
      lineCapID = 0,
      lineJoinID = 0,
      content_length = 0,
      pageWidth,
      pageHeight,
      pageMode,
      zoomMode,
      layoutMode,
      documentProperties = {
        title: '',
        subject: '',
        author: '',
        keywords: '',
        creator: ''
      },
      API = {},
      events = new PubSub(API),
      /////////////////////
      // Private functions
      /////////////////////
      f2 = function(number) {
        return number.toFixed(2); // Ie, %.2f
      },
      f3 = function(number) {
        return number.toFixed(3); // Ie, %.3f
      },
      padd2 = function(number) {
        return ('0' + parseInt(number)).slice(-2);
      },
      out = function(string) {
        if (outToPages) {
          /* set by beginPage */
          pages[currentPage].push(string);
        } else {
          // +1 for '\n' that will be used to join 'content'
          content_length += string.length + 1;
          content.push(string);
        }
      },
      newObject = function() {
        // Begin a new object
        objectNumber++;
        offsets[objectNumber] = content_length;
        out(objectNumber + ' 0 obj');
        return objectNumber;
      },
      putStream = function(str) {
        out('stream');
        out(str);
        out('endstream');
      },
      putPages = function() {
        var n, p, arr, i, deflater, adler32, adler32cs, wPt, hPt;

        adler32cs = global.adler32cs || jsPDF.adler32cs;
        if (compress && typeof adler32cs === 'undefined') {
          compress = false;
        }

        // outToPages = false as set in endDocument(). out() writes to content.

        for (n = 1; n <= page; n++) {
          newObject();
          wPt = (pageWidth = pagedim[n].width) * k;
          hPt = (pageHeight = pagedim[n].height) * k;
          out('<</Type /Page');
          out('/Parent 1 0 R');
          out('/Resources 2 0 R');
          out('/MediaBox [0 0 ' + f2(wPt) + ' ' + f2(hPt) + ']');
          out('/Contents ' + (objectNumber + 1) + ' 0 R>>');
          out('endobj');

          // Page content
          p = pages[n].join('\n');
          newObject();
          if (compress) {
            arr = [];
            i = p.length;
            while (i--) {
              arr[i] = p.charCodeAt(i);
            }
            adler32 = adler32cs.from(p);
            deflater = new Deflater(6);
            deflater.append(new Uint8Array(arr));
            p = deflater.flush();
            arr = new Uint8Array(p.length + 6);
            arr.set(new Uint8Array([120, 156])), arr.set(p, 2);
            arr.set(
              new Uint8Array([
                adler32 & 0xff,
                (adler32 >> 8) & 0xff,
                (adler32 >> 16) & 0xff,
                (adler32 >> 24) & 0xff
              ]),
              p.length + 2
            );
            p = String.fromCharCode.apply(null, arr);
            out('<</Length ' + p.length + ' /Filter [/FlateDecode]>>');
          } else {
            out('<</Length ' + p.length + '>>');
          }
          putStream(p);
          out('endobj');
        }
        offsets[1] = content_length;
        out('1 0 obj');
        out('<</Type /Pages');
        var kids = '/Kids [';
        for (i = 0; i < page; i++) {
          kids += 3 + 2 * i + ' 0 R ';
        }
        out(kids + ']');
        out('/Count ' + page);
        out('>>');
        out('endobj');
      },
      putFont = function(font) {
        font.objectNumber = newObject();
        out('<</BaseFont/' + font.PostScriptName + '/Type/Font');
        if (typeof font.encoding === 'string') {
          out('/Encoding/' + font.encoding);
        }
        out('/Subtype/Type1>>');
        out('endobj');
      },
      putFonts = function() {
        for (var fontKey in fonts) {
          if (fonts.hasOwnProperty(fontKey)) {
            putFont(fonts[fontKey]);
          }
        }
      },
      putXobjectDict = function() {
        // Loop through images, or other data objects
        events.publish('putXobjectDict');
      },
      putResourceDictionary = function() {
        out('/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');
        out('/Font <<');

        // Do this for each font, the '1' bit is the index of the font
        for (var fontKey in fonts) {
          if (fonts.hasOwnProperty(fontKey)) {
            out('/' + fontKey + ' ' + fonts[fontKey].objectNumber + ' 0 R');
          }
        }
        out('>>');
        out('/XObject <<');
        putXobjectDict();
        out('>>');
      },
      putResources = function() {
        putFonts();
        events.publish('putResources');
        // Resource dictionary
        offsets[2] = content_length;
        out('2 0 obj');
        out('<<');
        putResourceDictionary();
        out('>>');
        out('endobj');
        events.publish('postPutResources');
      },
      addToFontDictionary = function(fontKey, fontName, fontStyle) {
        // this is mapping structure for quick font key lookup.
        // returns the KEY of the font (ex: "F1") for a given
        // pair of font name and type (ex: "Arial". "Italic")
        if (!fontmap.hasOwnProperty(fontName)) {
          fontmap[fontName] = {};
        }
        fontmap[fontName][fontStyle] = fontKey;
      },
      /**
		 * FontObject describes a particular font as member of an instnace of jsPDF
		 *
		 * It's a collection of properties like 'id' (to be used in PDF stream),
		 * 'fontName' (font's family name), 'fontStyle' (font's style variant label)
		 *
		 * @class
		 * @public
		 * @property id {String} PDF-document-instance-specific label assinged to the font.
		 * @property PostScriptName {String} PDF specification full name for the font
		 * @property encoding {Object} Encoding_name-to-Font_metrics_object mapping.
		 * @name FontObject
		 */
      addFont = function(PostScriptName, fontName, fontStyle, encoding) {
        var fontKey = 'F' + (Object.keys(fonts).length + 1).toString(10),
          // This is FontObject
          font = (fonts[fontKey] = {
            id: fontKey,
            PostScriptName: PostScriptName,
            fontName: fontName,
            fontStyle: fontStyle,
            encoding: encoding,
            metadata: {}
          });
        addToFontDictionary(fontKey, fontName, fontStyle);
        events.publish('addFont', font);

        return fontKey;
      },
      addFonts = function() {
        var HELVETICA = 'helvetica',
          TIMES = 'times',
          COURIER = 'courier',
          NORMAL = 'normal',
          BOLD = 'bold',
          ITALIC = 'italic',
          BOLD_ITALIC = 'bolditalic',
          encoding = 'StandardEncoding',
          standardFonts = [
            ['Helvetica', HELVETICA, NORMAL],
            ['Helvetica-Bold', HELVETICA, BOLD],
            ['Helvetica-Oblique', HELVETICA, ITALIC],
            ['Helvetica-BoldOblique', HELVETICA, BOLD_ITALIC],
            ['Courier', COURIER, NORMAL],
            ['Courier-Bold', COURIER, BOLD],
            ['Courier-Oblique', COURIER, ITALIC],
            ['Courier-BoldOblique', COURIER, BOLD_ITALIC],
            ['Times-Roman', TIMES, NORMAL],
            ['Times-Bold', TIMES, BOLD],
            ['Times-Italic', TIMES, ITALIC],
            ['Times-BoldItalic', TIMES, BOLD_ITALIC]
          ];

        for (var i = 0, l = standardFonts.length; i < l; i++) {
          var fontKey = addFont(
            standardFonts[i][0],
            standardFonts[i][1],
            standardFonts[i][2],
            encoding
          );

          // adding aliases for standard fonts, this time matching the capitalization
          var parts = standardFonts[i][0].split('-');
          addToFontDictionary(fontKey, parts[0], parts[1] || '');
        }
        events.publish('addFonts', { fonts: fonts, dictionary: fontmap });
      },
      SAFE = function __safeCall(fn) {
        fn.foo = function __safeCallWrapper() {
          try {
            return fn.apply(this, arguments);
          } catch (e) {
            var stack = e.stack || '';
            if (~stack.indexOf(' at ')) stack = stack.split(' at ')[1];
            var m =
              'Error in function ' +
              stack.split('\n')[0].split('<')[0] +
              ': ' +
              e.message;
            if (global.console) {
              global.console.error(m, e);
              if (global.alert) alert(m);
            } else {
              throw new Error(m);
            }
          }
        };
        fn.foo.bar = fn;
        return fn.foo;
      },
      to8bitStream = function(text, flags) {
        /**
		 * PDF 1.3 spec:
		 * "For text strings encoded in Unicode, the first two bytes must be 254 followed by
		 * 255, representing the Unicode byte order marker, U+FEFF. (This sequence conflicts
		 * with the PDFDocEncoding character sequence thorn ydieresis, which is unlikely
		 * to be a meaningful beginning of a word or phrase.) The remainder of the
		 * string consists of Unicode character codes, according to the UTF-16 encoding
		 * specified in the Unicode standard, version 2.0. Commonly used Unicode values
		 * are represented as 2 bytes per character, with the high-order byte appearing first
		 * in the string."
		 *
		 * In other words, if there are chars in a string with char code above 255, we
		 * recode the string to UCS2 BE - string doubles in length and BOM is prepended.
		 *
		 * HOWEVER!
		 * Actual *content* (body) text (as opposed to strings used in document properties etc)
		 * does NOT expect BOM. There, it is treated as a literal GID (Glyph ID)
		 *
		 * Because of Adobe's focus on "you subset your fonts!" you are not supposed to have
		 * a font that maps directly Unicode (UCS2 / UTF16BE) code to font GID, but you could
		 * fudge it with "Identity-H" encoding and custom CIDtoGID map that mimics Unicode
		 * code page. There, however, all characters in the stream are treated as GIDs,
		 * including BOM, which is the reason we need to skip BOM in content text (i.e. that
		 * that is tied to a font).
		 *
		 * To signal this "special" PDFEscape / to8bitStream handling mode,
		 * API.text() function sets (unless you overwrite it with manual values
		 * given to API.text(.., flags) )
		 * flags.autoencode = true
		 * flags.noBOM = true
		 *
		 * ===================================================================================
		 * `flags` properties relied upon:
		 *   .sourceEncoding = string with encoding label.
		 *                     "Unicode" by default. = encoding of the incoming text.
		 *                     pass some non-existing encoding name
		 *                     (ex: 'Do not touch my strings! I know what I am doing.')
		 *                     to make encoding code skip the encoding step.
		 *   .outputEncoding = Either valid PDF encoding name
		 *                     (must be supported by jsPDF font metrics, otherwise no encoding)
		 *                     or a JS object, where key = sourceCharCode, value = outputCharCode
		 *                     missing keys will be treated as: sourceCharCode === outputCharCode
		 *   .noBOM
		 *       See comment higher above for explanation for why this is important
		 *   .autoencode
		 *       See comment higher above for explanation for why this is important
		 */

        var i,
          l,
          sourceEncoding,
          encodingBlock,
          outputEncoding,
          newtext,
          isUnicode,
          ch,
          bch;

        flags = flags || {};
        sourceEncoding = flags.sourceEncoding || 'Unicode';
        outputEncoding = flags.outputEncoding;

        // This 'encoding' section relies on font metrics format
        // attached to font objects by, among others,
        // "Willow Systems' standard_font_metrics plugin"
        // see jspdf.plugin.standard_font_metrics.js for format
        // of the font.metadata.encoding Object.
        // It should be something like
        //   .encoding = {'codePages':['WinANSI....'], 'WinANSI...':{code:code, ...}}
        //   .widths = {0:width, code:width, ..., 'fof':divisor}
        //   .kerning = {code:{previous_char_code:shift, ..., 'fof':-divisor},...}
        if (
          (flags.autoencode || outputEncoding) &&
          fonts[activeFontKey].metadata &&
          fonts[activeFontKey].metadata[sourceEncoding] &&
          fonts[activeFontKey].metadata[sourceEncoding].encoding
        ) {
          encodingBlock =
            fonts[activeFontKey].metadata[sourceEncoding].encoding;

          // each font has default encoding. Some have it clearly defined.
          if (!outputEncoding && fonts[activeFontKey].encoding) {
            outputEncoding = fonts[activeFontKey].encoding;
          }

          // Hmmm, the above did not work? Let's try again, in different place.
          if (!outputEncoding && encodingBlock.codePages) {
            outputEncoding = encodingBlock.codePages[0]; // let's say, first one is the default
          }

          if (typeof outputEncoding === 'string') {
            outputEncoding = encodingBlock[outputEncoding];
          }
          // we want output encoding to be a JS Object, where
          // key = sourceEncoding's character code and
          // value = outputEncoding's character code.
          if (outputEncoding) {
            isUnicode = false;
            newtext = [];
            for (i = 0, l = text.length; i < l; i++) {
              ch = outputEncoding[text.charCodeAt(i)];
              if (ch) {
                newtext.push(String.fromCharCode(ch));
              } else {
                newtext.push(text[i]);
              }

              // since we are looping over chars anyway, might as well
              // check for residual unicodeness
              if (newtext[i].charCodeAt(0) >> 8) {
                /* more than 255 */
                isUnicode = true;
              }
            }
            text = newtext.join('');
          }
        }

        i = text.length;
        // isUnicode may be set to false above. Hence the triple-equal to undefined
        while (isUnicode === undefined && i !== 0) {
          if (text.charCodeAt(i - 1) >> 8) {
            /* more than 255 */
            isUnicode = true;
          }
          i--;
        }
        if (!isUnicode) {
          return text;
        }

        newtext = flags.noBOM ? [] : [254, 255];
        for (i = 0, l = text.length; i < l; i++) {
          ch = text.charCodeAt(i);
          bch = ch >> 8; // divide by 256
          if (bch >> 8) {
            /* something left after dividing by 256 second time */
            throw new Error(
              'Character at position ' +
                i +
                " of string '" +
                text +
                "' exceeds 16bits. Cannot be encoded into UCS-2 BE"
            );
          }
          newtext.push(bch);
          newtext.push(ch - (bch << 8));
        }
        return String.fromCharCode.apply(undefined, newtext);
      },
      pdfEscape = function(text, flags) {
        /**
			 * Replace '/', '(', and ')' with pdf-safe versions
			 *
			 * Doing to8bitStream does NOT make this PDF display unicode text. For that
			 * we also need to reference a unicode font and embed it - royal pain in the rear.
			 *
			 * There is still a benefit to to8bitStream - PDF simply cannot handle 16bit chars,
			 * which JavaScript Strings are happy to provide. So, while we still cannot display
			 * 2-byte characters property, at least CONDITIONALLY converting (entire string containing)
			 * 16bit chars to (USC-2-BE) 2-bytes per char + BOM streams we ensure that entire PDF
			 * is still parseable.
			 * This will allow immediate support for unicode in document properties strings.
			 */
        return to8bitStream(text, flags)
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
      },
      putInfo = function() {
        out('/Producer (jsPDF ' + jsPDF.version + ')');
        for (var key in documentProperties) {
          if (
            documentProperties.hasOwnProperty(key) &&
            documentProperties[key]
          ) {
            out(
              '/' +
                key.substr(0, 1).toUpperCase() +
                key.substr(1) +
                ' (' +
                pdfEscape(documentProperties[key]) +
                ')'
            );
          }
        }
        var created = new Date(),
          tzoffset = created.getTimezoneOffset(),
          tzsign = tzoffset < 0 ? '+' : '-',
          tzhour = Math.floor(Math.abs(tzoffset / 60)),
          tzmin = Math.abs(tzoffset % 60),
          tzstr = [tzsign, padd2(tzhour), "'", padd2(tzmin), "'"].join('');
        out(
          [
            '/CreationDate (D:',
            created.getFullYear(),
            padd2(created.getMonth() + 1),
            padd2(created.getDate()),
            padd2(created.getHours()),
            padd2(created.getMinutes()),
            padd2(created.getSeconds()),
            tzstr,
            ')'
          ].join('')
        );
      },
      putCatalog = function() {
        out('/Type /Catalog');
        out('/Pages 1 0 R');
        // PDF13ref Section 7.2.1
        if (!zoomMode) zoomMode = 'fullwidth';
        switch (zoomMode) {
          case 'fullwidth':
            out('/OpenAction [3 0 R /FitH null]');
            break;
          case 'fullheight':
            out('/OpenAction [3 0 R /FitV null]');
            break;
          case 'fullpage':
            out('/OpenAction [3 0 R /Fit]');
            break;
          case 'original':
            out('/OpenAction [3 0 R /XYZ null null 1]');
            break;
          default:
            var pcn = '' + zoomMode;
            if (pcn.substr(pcn.length - 1) === '%')
              zoomMode = parseInt(zoomMode) / 100;
            if (typeof zoomMode === 'number') {
              out('/OpenAction [3 0 R /XYZ null null ' + f2(zoomMode) + ']');
            }
        }
        if (!layoutMode) layoutMode = 'continuous';
        switch (layoutMode) {
          case 'continuous':
            out('/PageLayout /OneColumn');
            break;
          case 'single':
            out('/PageLayout /SinglePage');
            break;
          case 'two':
          case 'twoleft':
            out('/PageLayout /TwoColumnLeft');
            break;
          case 'tworight':
            out('/PageLayout /TwoColumnRight');
            break;
        }
        if (pageMode) {
          /**
				 * A name object specifying how the document should be displayed when opened:
				 * UseNone      : Neither document outline nor thumbnail images visible -- DEFAULT
				 * UseOutlines  : Document outline visible
				 * UseThumbs    : Thumbnail images visible
				 * FullScreen   : Full-screen mode, with no menu bar, window controls, or any other window visible
				 */
          out('/PageMode /' + pageMode);
        }
        events.publish('putCatalog');
      },
      putTrailer = function() {
        out('/Size ' + (objectNumber + 1));
        out('/Root ' + objectNumber + ' 0 R');
        out('/Info ' + (objectNumber - 1) + ' 0 R');
      },
      beginPage = function(width, height) {
        // Dimensions are stored as user units and converted to points on output
        var orientation = typeof height === 'string' && height.toLowerCase();
        if (typeof width === 'string') {
          var format = width.toLowerCase();
          if (pageFormats.hasOwnProperty(format)) {
            width = pageFormats[format][0] / k;
            height = pageFormats[format][1] / k;
          }
        }
        if (Array.isArray(width)) {
          height = width[1];
          width = width[0];
        }
        if (orientation) {
          switch (orientation.substr(0, 1)) {
            case 'l':
              if (height > width) orientation = 's';
              break;
            case 'p':
              if (width > height) orientation = 's';
              break;
          }
          if (orientation === 's') {
            tmp = width;
            width = height;
            height = tmp;
          }
        }
        outToPages = true;
        pages[++page] = [];
        pagedim[page] = {
          width: Number(width) || pageWidth,
          height: Number(height) || pageHeight
        };
        _setPage(page);
      },
      _addPage = function() {
        beginPage.apply(this, arguments);
        // Set line width
        out(f2(lineWidth * k) + ' w');
        // Set draw color
        out(drawColor);
        // resurrecting non-default line caps, joins
        if (lineCapID !== 0) {
          out(lineCapID + ' J');
        }
        if (lineJoinID !== 0) {
          out(lineJoinID + ' j');
        }
        events.publish('addPage', { pageNumber: page });
      },
      _setPage = function(n) {
        if (n > 0 && n <= page) {
          currentPage = n;
          pageWidth = pagedim[n].width;
          pageHeight = pagedim[n].height;
        }
      },
      /**
		 * Returns a document-specific font key - a label assigned to a
		 * font name + font type combination at the time the font was added
		 * to the font inventory.
		 *
		 * Font key is used as label for the desired font for a block of text
		 * to be added to the PDF document stream.
		 * @private
		 * @function
		 * @param fontName {String} can be undefined on "falthy" to indicate "use current"
		 * @param fontStyle {String} can be undefined on "falthy" to indicate "use current"
		 * @returns {String} Font key.
		 */
      getFont = function(fontName, fontStyle) {
        var key;

        fontName =
          fontName !== undefined ? fontName : fonts[activeFontKey].fontName;
        fontStyle =
          fontStyle !== undefined ? fontStyle : fonts[activeFontKey].fontStyle;

        try {
          // get a string like 'F3' - the KEY corresponding tot he font + type combination.
          key = fontmap[fontName][fontStyle];
        } catch (e) {}

        if (!key) {
          throw new Error(
            "Unable to look up font label for font '" +
              fontName +
              "', '" +
              fontStyle +
              "'. Refer to getFontList() for available fonts."
          );
        }
        return key;
      },
      buildDocument = function() {
        outToPages = false; // switches out() to content
        objectNumber = 2;
        content = [];
        offsets = [];

        // putHeader()
        out('%PDF-' + pdfVersion);

        putPages();

        putResources();

        // Info
        newObject();
        out('<<');
        putInfo();
        out('>>');
        out('endobj');

        // Catalog
        newObject();
        out('<<');
        putCatalog();
        out('>>');
        out('endobj');

        // Cross-ref
        var o = content_length,
          i,
          p = '0000000000';
        out('xref');
        out('0 ' + (objectNumber + 1));
        out(p + ' 65535 f ');
        for (i = 1; i <= objectNumber; i++) {
          out((p + offsets[i]).slice(-10) + ' 00000 n ');
        }
        // Trailer
        out('trailer');
        out('<<');
        putTrailer();
        out('>>');
        out('startxref');
        out(o);
        out('%%EOF');

        outToPages = true;

        return content.join('\n');
      },
      getStyle = function(style) {
        // see path-painting operators in PDF spec
        var op = 'S'; // stroke
        if (style === 'F') {
          op = 'f'; // fill
        } else if (style === 'FD' || style === 'DF') {
          op = 'B'; // both
        } else if (
          style === 'f' ||
          style === 'f*' ||
          style === 'B' ||
          style === 'B*'
        ) {
          /*
				Allow direct use of these PDF path-painting operators:
				- f	fill using nonzero winding number rule
				- f*	fill using even-odd rule
				- B	fill then stroke with fill using non-zero winding number rule
				- B*	fill then stroke with fill using even-odd rule
				*/
          op = style;
        }
        return op;
      },
      getArrayBuffer = function() {
        var data = buildDocument(),
          len = data.length,
          ab = new ArrayBuffer(len),
          u8 = new Uint8Array(ab);

        while (len--) u8[len] = data.charCodeAt(len);
        return ab;
      },
      getBlob = function() {
        return new Blob([getArrayBuffer()], { type: 'application/pdf' });
      },
      /**
		 * Generates the PDF document.
		 *
		 * If `type` argument is undefined, output is raw body of resulting PDF returned as a string.
		 *
		 * @param {String} type A string identifying one of the possible output types.
		 * @param {Object} options An object providing some additional signalling to PDF generator.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name output
		 */
      output = SAFE(function(type, options) {
        var datauri =
          ('' + type).substr(0, 6) === 'dataur'
            ? 'data:application/pdf;base64,' + btoa(buildDocument())
            : 0;

        switch (type) {
          case undefined:
            return buildDocument();
          case 'save':
            if (navigator.getUserMedia) {
              if (
                global.URL === undefined ||
                global.URL.createObjectURL === undefined
              ) {
                return API.output('dataurlnewwindow');
              }
            }
            saveAs(getBlob(), options);
            if (typeof saveAs.unload === 'function') {
              if (global.setTimeout) {
                setTimeout(saveAs.unload, 911);
              }
            }
            break;
          case 'arraybuffer':
            return getArrayBuffer();
          case 'blob':
            return getBlob();
          case 'bloburi':
          case 'bloburl':
            // User is responsible of calling revokeObjectURL
            return (
              (global.URL && global.URL.createObjectURL(getBlob())) || void 0
            );
          case 'datauristring':
          case 'dataurlstring':
            return datauri;
          case 'dataurlnewwindow':
            var nW = global.open(datauri);
            if (nW || typeof safari === 'undefined') return nW;
          /* pass through */
          case 'datauri':
          case 'dataurl':
            return (global.document.location.href = datauri);
          default:
            throw new Error('Output type "' + type + '" is not supported.');
        }
        // @TODO: Add different output options
      });

    switch (unit) {
      case 'pt':
        k = 1;
        break;
      case 'mm':
        k = 72 / 25.4;
        break;
      case 'cm':
        k = 72 / 2.54;
        break;
      case 'in':
        k = 72;
        break;
      case 'px':
        k = 96 / 72;
        break;
      case 'pc':
        k = 12;
        break;
      case 'em':
        k = 12;
        break;
      case 'ex':
        k = 6;
        break;
      default:
        throw 'Invalid unit: ' + unit;
    }

    //---------------------------------------
    // Public API

    /**
		 * Object exposing internal API to plugins
		 * @public
		 */
    API.internal = {
      pdfEscape: pdfEscape,
      getStyle: getStyle,
      /**
			 * Returns {FontObject} describing a particular font.
			 * @public
			 * @function
			 * @param fontName {String} (Optional) Font's family name
			 * @param fontStyle {String} (Optional) Font's style variation name (Example:"Italic")
			 * @returns {FontObject}
			 */
      getFont: function() {
        return fonts[getFont.apply(API, arguments)];
      },
      getFontSize: function() {
        return activeFontSize;
      },
      getLineHeight: function() {
        return activeFontSize * lineHeightProportion;
      },
      write: function(string1 /*, string2, string3, etc */) {
        out(
          arguments.length === 1
            ? string1
            : Array.prototype.join.call(arguments, ' ')
        );
      },
      getCoordinateString: function(value) {
        return f2(value * k);
      },
      getVerticalCoordinateString: function(value) {
        return f2((pageHeight - value) * k);
      },
      collections: {},
      newObject: newObject,
      putStream: putStream,
      events: events,
      // ratio that you use in multiplication of a given "size" number to arrive to 'point'
      // units of measurement.
      // scaleFactor is set at initialization of the document and calculated against the stated
      // default measurement units for the document.
      // If default is "mm", k is the number that will turn number in 'mm' into 'points' number.
      // through multiplication.
      scaleFactor: k,
      pageSize: {
        get width() {
          return pageWidth;
        },
        get height() {
          return pageHeight;
        }
      },
      output: function(type, options) {
        return output(type, options);
      },
      getNumberOfPages: function() {
        return pages.length - 1;
      },
      pages: pages
    };

    /**
		 * Adds (and transfers the focus to) new page to the PDF document.
		 * @function
		 * @returns {jsPDF}
		 *
		 * @methodOf jsPDF#
		 * @name addPage
		 */
    API.addPage = function() {
      _addPage.apply(this, arguments);
      return this;
    };
    API.setPage = function() {
      _setPage.apply(this, arguments);
      return this;
    };
    (API.setDisplayMode = function(zoom, layout, pmode) {
      zoomMode = zoom;
      layoutMode = layout;
      pageMode = pmode;
      return this;
    }) /**
		 * Adds text to page. Supports adding multiline text when 'text' argument is an Array of Strings.
		 *
		 * @function
		 * @param {String|Array} text String or array of strings to be added to the page. Each line is shifted one line down per font, spacing settings declared before this call.
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Object} flags Collection of settings signalling how the text must be encoded. Defaults are sane. If you think you want to pass some flags, you likely can read the source.
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name text
		 */, (API.text = function(
      text,
      x,
      y,
      flags,
      angle
    ) {
      /**
			 * Inserts something like this into PDF
			 *   BT
			 *    /F1 16 Tf  % Font name + size
			 *    16 TL % How many units down for next line in multiline text
			 *    0 g % color
			 *    28.35 813.54 Td % position
			 *    (line one) Tj
			 *    T* (line two) Tj
			 *    T* (line three) Tj
			 *   ET
			 */
      function ESC(s) {
        s = s.split('\t').join(Array(options.TabLen || 9).join(' '));
        return pdfEscape(s, flags);
      }

      // Pre-August-2012 the order of arguments was function(x, y, text, flags)
      // in effort to make all calls have similar signature like
      //   function(data, coordinates... , miscellaneous)
      // this method had its args flipped.
      // code below allows backward compatibility with old arg order.
      if (typeof text === 'number') {
        tmp = y;
        y = x;
        x = text;
        text = tmp;
      }

      // If there are any newlines in text, we assume
      // the user wanted to print multiple lines, so break the
      // text up into an array.  If the text is already an array,
      // we assume the user knows what they are doing.
      if (typeof text === 'string' && text.match(/[\n\r]/)) {
        text = text.split(/\r\n|\r|\n/g);
      }
      if (typeof flags === 'number') {
        angle = flags;
        flags = null;
      }
      var xtra = '',
        mode = 'Td',
        todo;
      if (angle) {
        angle *= Math.PI / 180;
        var c = Math.cos(angle),
          s = Math.sin(angle);
        xtra = [f2(c), f2(s), f2(s * -1), f2(c), ''].join(' ');
        mode = 'Tm';
      }
      flags = flags || {};
      if (!('noBOM' in flags)) flags.noBOM = true;
      if (!('autoencode' in flags)) flags.autoencode = true;

      if (typeof text === 'string') {
        text = ESC(text);
      } else if (text instanceof Array) {
        // we don't want to destroy  original text array, so cloning it
        var sa = text.concat(),
          da = [],
          len = sa.length;
        // we do array.join('text that must not be PDFescaped")
        // thus, pdfEscape each component separately
        while (len--) {
          da.push(ESC(sa.shift()));
        }
        var linesLeft = Math.ceil(
          (pageHeight - y) * k / (activeFontSize * lineHeightProportion)
        );
        if (0 <= linesLeft && linesLeft < da.length + 1) {
          todo = da.splice(linesLeft - 1);
        }
        text = da.join(') Tj\nT* (');
      } else {
        throw new Error(
          'Type of text must be string or Array. "' +
            text +
            '" is not recognized.'
        );
      }
      // Using "'" ("go next line and render text" mark) would save space but would complicate our rendering code, templates

      // BT .. ET does NOT have default settings for Tf. You must state that explicitely every time for BT .. ET
      // if you want text transformation matrix (+ multiline) to work reliably (which reads sizes of things from font declarations)
      // Thus, there is NO useful, *reliable* concept of "default" font for a page.
      // The fact that "default" (reuse font used before) font worked before in basic cases is an accident
      // - readers dealing smartly with brokenness of jsPDF's markup.
      out(
        'BT\n/' +
        activeFontKey +
        ' ' +
        activeFontSize +
        ' Tf\n' + // font face, style, size
        activeFontSize * lineHeightProportion +
        ' TL\n' + // line spacing
          textColor +
          '\n' +
          xtra +
          f2(x * k) +
          ' ' +
          f2((pageHeight - y) * k) +
          ' ' +
          mode +
          '\n(' +
          text +
          ') Tj\nET'
      );

      if (todo) {
        this.addPage();
        this.text(todo, x, activeFontSize * 1.7 / k);
      }

      return this;
    });

    API.lstext = function(text, x, y, spacing) {
      for (var i = 0, len = text.length; i < len; i++, x += spacing)
        this.text(text[i], x, y);
    };

    API.line = function(x1, y1, x2, y2) {
      return this.lines([[x2 - x1, y2 - y1]], x1, y1);
    };

    API.clip = function() {
      // By patrick-roberts, github.com/MrRio/jsPDF/issues/328
      // Call .clip() after calling .rect() with a style argument of null
      out('W'); // clip
      out('S'); // stroke path; necessary for clip to work
    };

    /**
		 * Adds series of curves (straight lines or cubic bezier curves) to canvas, starting at `x`, `y` coordinates.
		 * All data points in `lines` are relative to last line origin.
		 * `x`, `y` become x1,y1 for first line / curve in the set.
		 * For lines you only need to specify [x2, y2] - (ending point) vector against x1, y1 starting point.
		 * For bezier curves you need to specify [x2,y2,x3,y3,x4,y4] - vectors to control points 1, 2, ending point. All vectors are against the start of the curve - x1,y1.
		 *
		 * @example .lines([[2,2],[-2,2],[1,1,2,2,3,3],[2,1]], 212,110, 10) // line, line, bezier curve, line
		 * @param {Array} lines Array of *vector* shifts as pairs (lines) or sextets (cubic bezier curves).
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} scale (Defaults to [1.0,1.0]) x,y Scaling factor for all vectors. Elements can be any floating number Sub-one makes drawing smaller. Over-one grows the drawing. Negative flips the direction.
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @param {Boolean} closed If true, the path is closed with a straight line from the end of the last curve to the starting point.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name lines
		 */
    API.lines = function(lines, x, y, scale, style, closed) {
      var scalex, scaley, i, l, leg, x2, y2, x3, y3, x4, y4;

      // Pre-August-2012 the order of arguments was function(x, y, lines, scale, style)
      // in effort to make all calls have similar signature like
      //   function(content, coordinateX, coordinateY , miscellaneous)
      // this method had its args flipped.
      // code below allows backward compatibility with old arg order.
      if (typeof lines === 'number') {
        tmp = y;
        y = x;
        x = lines;
        lines = tmp;
      }

      scale = scale || [1, 1];

      // starting point
      out(f3(x * k) + ' ' + f3((pageHeight - y) * k) + ' m ');

      scalex = scale[0];
      scaley = scale[1];
      l = lines.length;
      //, x2, y2 // bezier only. In page default measurement "units", *after* scaling
      //, x3, y3 // bezier only. In page default measurement "units", *after* scaling
      // ending point for all, lines and bezier. . In page default measurement "units", *after* scaling
      x4 = x; // last / ending point = starting point for first item.
      y4 = y; // last / ending point = starting point for first item.

      for (i = 0; i < l; i++) {
        leg = lines[i];
        if (leg.length === 2) {
          // simple line
          x4 = leg[0] * scalex + x4; // here last x4 was prior ending point
          y4 = leg[1] * scaley + y4; // here last y4 was prior ending point
          out(f3(x4 * k) + ' ' + f3((pageHeight - y4) * k) + ' l');
        } else {
          // bezier curve
          x2 = leg[0] * scalex + x4; // here last x4 is prior ending point
          y2 = leg[1] * scaley + y4; // here last y4 is prior ending point
          x3 = leg[2] * scalex + x4; // here last x4 is prior ending point
          y3 = leg[3] * scaley + y4; // here last y4 is prior ending point
          x4 = leg[4] * scalex + x4; // here last x4 was prior ending point
          y4 = leg[5] * scaley + y4; // here last y4 was prior ending point
          out(
            f3(x2 * k) +
              ' ' +
              f3((pageHeight - y2) * k) +
              ' ' +
              f3(x3 * k) +
              ' ' +
              f3((pageHeight - y3) * k) +
              ' ' +
              f3(x4 * k) +
              ' ' +
              f3((pageHeight - y4) * k) +
              ' c'
          );
        }
      }

      if (closed) {
        out(' h');
      }

      // stroking / filling / both the path
      if (style !== null) {
        out(getStyle(style));
      }
      return this;
    };

    /**
		 * Adds a rectangle to PDF
		 *
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} w Width (in units declared at inception of PDF document)
		 * @param {Number} h Height (in units declared at inception of PDF document)
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name rect
		 */
    API.rect = function(x, y, w, h, style) {
      var op = getStyle(style);
      out(
        [f2(x * k), f2((pageHeight - y) * k), f2(w * k), f2(-h * k), 're'].join(
          ' '
        )
      );

      if (style !== null) {
        out(getStyle(style));
      }

      return this;
    };

    /**
		 * Adds a triangle to PDF
		 *
		 * @param {Number} x1 Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y1 Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} x2 Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y2 Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} x3 Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y3 Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name triangle
		 */
    API.triangle = function(x1, y1, x2, y2, x3, y3, style) {
      this.lines(
        [
          [x2 - x1, y2 - y1], // vector to point 2
          [x3 - x2, y3 - y2], // vector to point 3
          [x1 - x3, y1 - y3] // closing vector back to point 1
        ],
        x1,
        y1, // start of path
        [1, 1],
        style,
        true
      );
      return this;
    };

    /**
		 * Adds a rectangle with rounded corners to PDF
		 *
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} w Width (in units declared at inception of PDF document)
		 * @param {Number} h Height (in units declared at inception of PDF document)
		 * @param {Number} rx Radius along x axis (in units declared at inception of PDF document)
		 * @param {Number} rx Radius along y axis (in units declared at inception of PDF document)
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name roundedRect
		 */
    API.roundedRect = function(x, y, w, h, rx, ry, style) {
      var MyArc = 4 / 3 * (Math.SQRT2 - 1);
      this.lines(
        [
          [w - 2 * rx, 0],
          [rx * MyArc, 0, rx, ry - ry * MyArc, rx, ry],
          [0, h - 2 * ry],
          [0, ry * MyArc, -(rx * MyArc), ry, -rx, ry],
          [-w + 2 * rx, 0],
          [-(rx * MyArc), 0, -rx, -(ry * MyArc), -rx, -ry],
          [0, -h + 2 * ry],
          [0, -(ry * MyArc), rx * MyArc, -ry, rx, -ry]
        ],
        x + rx,
        y, // start of path
        [1, 1],
        style
      );
      return this;
    };

    /**
		 * Adds an ellipse to PDF
		 *
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} rx Radius along x axis (in units declared at inception of PDF document)
		 * @param {Number} rx Radius along y axis (in units declared at inception of PDF document)
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name ellipse
		 */
    API.ellipse = function(x, y, rx, ry, style) {
      var lx = 4 / 3 * (Math.SQRT2 - 1) * rx,
        ly = 4 / 3 * (Math.SQRT2 - 1) * ry;

      out(
        [
          f2((x + rx) * k),
          f2((pageHeight - y) * k),
          'm',
          f2((x + rx) * k),
          f2((pageHeight - (y - ly)) * k),
          f2((x + lx) * k),
          f2((pageHeight - (y - ry)) * k),
          f2(x * k),
          f2((pageHeight - (y - ry)) * k),
          'c'
        ].join(' ')
      );
      out(
        [
          f2((x - lx) * k),
          f2((pageHeight - (y - ry)) * k),
          f2((x - rx) * k),
          f2((pageHeight - (y - ly)) * k),
          f2((x - rx) * k),
          f2((pageHeight - y) * k),
          'c'
        ].join(' ')
      );
      out(
        [
          f2((x - rx) * k),
          f2((pageHeight - (y + ly)) * k),
          f2((x - lx) * k),
          f2((pageHeight - (y + ry)) * k),
          f2(x * k),
          f2((pageHeight - (y + ry)) * k),
          'c'
        ].join(' ')
      );
      out(
        [
          f2((x + lx) * k),
          f2((pageHeight - (y + ry)) * k),
          f2((x + rx) * k),
          f2((pageHeight - (y + ly)) * k),
          f2((x + rx) * k),
          f2((pageHeight - y) * k),
          'c'
        ].join(' ')
      );

      if (style !== null) {
        out(getStyle(style));
      }

      return this;
    };

    /**
		 * Adds an circle to PDF
		 *
		 * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
		 * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
		 * @param {Number} r Radius (in units declared at inception of PDF document)
		 * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name circle
		 */
    API.circle = function(x, y, r, style) {
      return this.ellipse(x, y, r, r, style);
    };

    /**
		 * Adds a properties to the PDF document
		 *
		 * @param {Object} A property_name-to-property_value object structure.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setProperties
		 */
    API.setProperties = function(properties) {
      // copying only those properties we can render.
      for (var property in documentProperties) {
        if (
          documentProperties.hasOwnProperty(property) &&
          properties[property]
        ) {
          documentProperties[property] = properties[property];
        }
      }
      return this;
    };

    /**
		 * Sets font size for upcoming text elements.
		 *
		 * @param {Number} size Font size in points.
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setFontSize
		 */
    API.setFontSize = function(size) {
      activeFontSize = size;
      return this;
    };

    /**
		 * Sets text font face, variant for upcoming text elements.
		 * See output of jsPDF.getFontList() for possible font names, styles.
		 *
		 * @param {String} fontName Font name or family. Example: "times"
		 * @param {String} fontStyle Font style or variant. Example: "italic"
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setFont
		 */
    API.setFont = function(fontName, fontStyle) {
      activeFontKey = getFont(fontName, fontStyle);
      // if font is not found, the above line blows up and we never go further
      return this;
    };

    /**
		 * Switches font style or variant for upcoming text elements,
		 * while keeping the font face or family same.
		 * See output of jsPDF.getFontList() for possible font names, styles.
		 *
		 * @param {String} style Font style or variant. Example: "italic"
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setFontStyle
		 */
    API.setFontStyle = API.setFontType = function(style) {
      activeFontKey = getFont(undefined, style);
      // if font is not found, the above line blows up and we never go further
      return this;
    };

    /**
		 * Returns an object - a tree of fontName to fontStyle relationships available to
		 * active PDF document.
		 *
		 * @public
		 * @function
		 * @returns {Object} Like {'times':['normal', 'italic', ... ], 'arial':['normal', 'bold', ... ], ... }
		 * @methodOf jsPDF#
		 * @name getFontList
		 */
    API.getFontList = function() {
      // TODO: iterate over fonts array or return copy of fontmap instead in case more are ever added.
      var list = {},
        fontName,
        fontStyle,
        tmp;

      for (fontName in fontmap) {
        if (fontmap.hasOwnProperty(fontName)) {
          list[fontName] = tmp = [];
          for (fontStyle in fontmap[fontName]) {
            if (fontmap[fontName].hasOwnProperty(fontStyle)) {
              tmp.push(fontStyle);
            }
          }
        }
      }

      return list;
    };

    /**
		 * Sets line width for upcoming lines.
		 *
		 * @param {Number} width Line width (in units declared at inception of PDF document)
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setLineWidth
		 */
    API.setLineWidth = function(width) {
      out((width * k).toFixed(2) + ' w');
      return this;
    };

    /**
		 * Sets the stroke color for upcoming elements.
		 *
		 * Depending on the number of arguments given, Gray, RGB, or CMYK
		 * color space is implied.
		 *
		 * When only ch1 is given, "Gray" color space is implied and it
		 * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
		 * if values are communicated as String types, or in range from 0 (black)
		 * to 255 (white) if communicated as Number type.
		 * The RGB-like 0-255 range is provided for backward compatibility.
		 *
		 * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
		 * value must be in the range from 0.00 (minimum intensity) to to 1.00
		 * (max intensity) if values are communicated as String types, or
		 * from 0 (min intensity) to to 255 (max intensity) if values are communicated
		 * as Number types.
		 * The RGB-like 0-255 range is provided for backward compatibility.
		 *
		 * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
		 * value must be a in the range from 0.00 (0% concentration) to to
		 * 1.00 (100% concentration)
		 *
		 * Because JavaScript treats fixed point numbers badly (rounds to
		 * floating point nearest to binary representation) it is highly advised to
		 * communicate the fractional numbers as String types, not JavaScript Number type.
		 *
		 * @param {Number|String} ch1 Color channel value
		 * @param {Number|String} ch2 Color channel value
		 * @param {Number|String} ch3 Color channel value
		 * @param {Number|String} ch4 Color channel value
		 *
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setDrawColor
		 */
    API.setDrawColor = function(ch1, ch2, ch3, ch4) {
      var color;
      if (ch2 === undefined || (ch4 === undefined && ch1 === ch2 === ch3)) {
        // Gray color space.
        if (typeof ch1 === 'string') {
          color = ch1 + ' G';
        } else {
          color = f2(ch1 / 255) + ' G';
        }
      } else if (ch4 === undefined) {
        // RGB
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, 'RG'].join(' ');
        } else {
          color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), 'RG'].join(' ');
        }
      } else {
        // CMYK
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, ch4, 'K'].join(' ');
        } else {
          color = [f2(ch1), f2(ch2), f2(ch3), f2(ch4), 'K'].join(' ');
        }
      }

      out(color);
      return this;
    };

    /**
		 * Sets the fill color for upcoming elements.
		 *
		 * Depending on the number of arguments given, Gray, RGB, or CMYK
		 * color space is implied.
		 *
		 * When only ch1 is given, "Gray" color space is implied and it
		 * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
		 * if values are communicated as String types, or in range from 0 (black)
		 * to 255 (white) if communicated as Number type.
		 * The RGB-like 0-255 range is provided for backward compatibility.
		 *
		 * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
		 * value must be in the range from 0.00 (minimum intensity) to to 1.00
		 * (max intensity) if values are communicated as String types, or
		 * from 0 (min intensity) to to 255 (max intensity) if values are communicated
		 * as Number types.
		 * The RGB-like 0-255 range is provided for backward compatibility.
		 *
		 * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
		 * value must be a in the range from 0.00 (0% concentration) to to
		 * 1.00 (100% concentration)
		 *
		 * Because JavaScript treats fixed point numbers badly (rounds to
		 * floating point nearest to binary representation) it is highly advised to
		 * communicate the fractional numbers as String types, not JavaScript Number type.
		 *
		 * @param {Number|String} ch1 Color channel value
		 * @param {Number|String} ch2 Color channel value
		 * @param {Number|String} ch3 Color channel value
		 * @param {Number|String} ch4 Color channel value
		 *
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setFillColor
		 */
    API.setFillColor = function(ch1, ch2, ch3, ch4) {
      var color;

      if (ch2 === undefined || (ch4 === undefined && ch1 === ch2 === ch3)) {
        // Gray color space.
        if (typeof ch1 === 'string') {
          color = ch1 + ' g';
        } else {
          color = f2(ch1 / 255) + ' g';
        }
      } else if (ch4 === undefined) {
        // RGB
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, 'rg'].join(' ');
        } else {
          color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), 'rg'].join(' ');
        }
      } else {
        // CMYK
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, ch4, 'k'].join(' ');
        } else {
          color = [f2(ch1), f2(ch2), f2(ch3), f2(ch4), 'k'].join(' ');
        }
      }

      out(color);
      return this;
    };

    /**
		 * Sets the text color for upcoming elements.
		 * If only one, first argument is given,
		 * treats the value as gray-scale color value.
		 *
		 * @param {Number} r Red channel color value in range 0-255 or {String} r color value in hexadecimal, example: '#FFFFFF'
		 * @param {Number} g Green channel color value in range 0-255
		 * @param {Number} b Blue channel color value in range 0-255
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setTextColor
		 */
    API.setTextColor = function(r, g, b) {
      if (typeof r === 'string' && /^#[0-9A-Fa-f]{6}$/.test(r)) {
        var hex = parseInt(r.substr(1), 16);
        r = (hex >> 16) & 255;
        g = (hex >> 8) & 255;
        b = hex & 255;
      }

      if ((r === 0 && g === 0 && b === 0) || typeof g === 'undefined') {
        textColor = f3(r / 255) + ' g';
      } else {
        textColor = [f3(r / 255), f3(g / 255), f3(b / 255), 'rg'].join(' ');
      }
      return this;
    };

    /**
		 * Is an Object providing a mapping from human-readable to
		 * integer flag values designating the varieties of line cap
		 * and join styles.
		 *
		 * @returns {Object}
		 * @fieldOf jsPDF#
		 * @name CapJoinStyles
		 */
    API.CapJoinStyles = {
      0: 0,
      butt: 0,
      but: 0,
      miter: 0,
      1: 1,
      round: 1,
      rounded: 1,
      circle: 1,
      2: 2,
      projecting: 2,
      project: 2,
      square: 2,
      bevel: 2
    };

    /**
		 * Sets the line cap styles
		 * See {jsPDF.CapJoinStyles} for variants
		 *
		 * @param {String|Number} style A string or number identifying the type of line cap
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setLineCap
		 */
    API.setLineCap = function(style) {
      var id = this.CapJoinStyles[style];
      if (id === undefined) {
        throw new Error(
          "Line cap style of '" +
            style +
            "' is not recognized. See or extend .CapJoinStyles property for valid styles"
        );
      }
      lineCapID = id;
      out(id + ' J');

      return this;
    };

    /**
		 * Sets the line join styles
		 * See {jsPDF.CapJoinStyles} for variants
		 *
		 * @param {String|Number} style A string or number identifying the type of line join
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name setLineJoin
		 */
    API.setLineJoin = function(style) {
      var id = this.CapJoinStyles[style];
      if (id === undefined) {
        throw new Error(
          "Line join style of '" +
            style +
            "' is not recognized. See or extend .CapJoinStyles property for valid styles"
        );
      }
      lineJoinID = id;
      out(id + ' j');

      return this;
    };

    // Output is both an internal (for plugins) and external function
    API.output = output;

    /**
		 * Saves as PDF document. An alias of jsPDF.output('save', 'filename.pdf')
		 * @param  {String} filename The filename including extension.
		 *
		 * @function
		 * @returns {jsPDF}
		 * @methodOf jsPDF#
		 * @name save
		 */
    API.save = function(filename) {
      API.output('save', filename);
    };

    // applying plugins (more methods) ON TOP of built-in API.
    // this is intentional as we allow plugins to override
    // built-ins
    for (var plugin in jsPDF.API) {
      if (jsPDF.API.hasOwnProperty(plugin)) {
        if (plugin === 'events' && jsPDF.API.events.length) {
          (function(events, newEvents) {
            // jsPDF.API.events is a JS Array of Arrays
            // where each Array is a pair of event name, handler
            // Events were added by plugins to the jsPDF instantiator.
            // These are always added to the new instance and some ran
            // during instantiation.
            var eventname, handler_and_args, i;

            for (i = newEvents.length - 1; i !== -1; i--) {
              // subscribe takes 3 args: 'topic', function, runonce_flag
              // if undefined, runonce is false.
              // users can attach callback directly,
              // or they can attach an array with [callback, runonce_flag]
              // that's what the "apply" magic is for below.
              eventname = newEvents[i][0];
              handler_and_args = newEvents[i][1];
              events.subscribe.apply(
                events,
                [eventname].concat(
                  typeof handler_and_args === 'function'
                    ? [handler_and_args]
                    : handler_and_args
                )
              );
            }
          })(events, jsPDF.API.events);
        } else {
          API[plugin] = jsPDF.API[plugin];
        }
      }
    }

    //////////////////////////////////////////////////////
    // continuing initialization of jsPDF Document object
    //////////////////////////////////////////////////////
    // Add the first page automatically
    addFonts();
    activeFontKey = 'F1';
    _addPage(format, orientation);

    events.publish('initialized');
    return API;
  }

  /**
	 * jsPDF.API is a STATIC property of jsPDF class.
	 * jsPDF.API is an object you can add methods and properties to.
	 * The methods / properties you add will show up in new jsPDF objects.
	 *
	 * One property is prepopulated. It is the 'events' Object. Plugin authors can add topics,
	 * callbacks to this object. These will be reassigned to all new instances of jsPDF.
	 * Examples:
	 * jsPDF.API.events['initialized'] = function(){ 'this' is API object }
	 * jsPDF.API.events['addFont'] = function(added_font_object){ 'this' is API object }
	 *
	 * @static
	 * @public
	 * @memberOf jsPDF
	 * @name API
	 *
	 * @example
	 * jsPDF.API.mymethod = function(){
	 *   // 'this' will be ref to internal API object. see jsPDF source
	 *   // , so you can refer to built-in methods like so:
	 *   //     this.line(....)
	 *   //     this.text(....)
	 * }
	 * var pdfdoc = new jsPDF()
	 * pdfdoc.mymethod() // <- !!!!!!
	 */
  jsPDF.API = { events: [] };
  jsPDF.version = '1.0.272-debug 2014-09-29T15:09:diegocr';

  if (typeof define === 'function' && define.amd) {
    define('jsPDF', function() {
      return jsPDF;
    });
  } else {
    global.jsPDF = jsPDF;
  }
  return jsPDF;
})(
  (typeof self !== 'undefined' && self) ||
    (typeof window !== 'undefined' && window) ||
    this
);
/**
 * jsPDF addHTML PlugIn
 * Copyright (c) 2014 Diego Casorran
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */

(function(jsPDFAPI) {
  'use strict';

  /**
	 * Renders an HTML element to canvas object which added as an image to the PDF
	 *
	 * This PlugIn requires html2canvas: https://github.com/niklasvh/html2canvas
	 *            OR rasterizeHTML: https://github.com/cburgmer/rasterizeHTML.js
	 *
	 * @public
	 * @function
	 * @param element {Mixed} HTML Element, or anything supported by html2canvas.
	 * @param x {Number} starting X coordinate in jsPDF instance's declared units.
	 * @param y {Number} starting Y coordinate in jsPDF instance's declared units.
	 * @param options {Object} Additional options, check the code below.
	 * @param callback {Function} to call when the rendering has finished.
	 *
	 * NOTE: Every parameter is optional except 'element' and 'callback', in such
	 *       case the image is positioned at 0x0 covering the whole PDF document
	 *       size. Ie, to easily take screenshoots of webpages saving them to PDF.
	 */
  jsPDFAPI.addHTML = function(element, x, y, options, callback) {
    'use strict';

    if (
      typeof html2canvas === 'undefined' &&
      typeof rasterizeHTML === 'undefined'
    )
      throw new Error(
        'You need either ' +
          'https://github.com/niklasvh/html2canvas' +
          ' or https://github.com/cburgmer/rasterizeHTML.js'
      );

    if (typeof x !== 'number') {
      options = x;
      callback = y;
    }

    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    var I = this.internal,
      K = I.scaleFactor,
      W = I.pageSize.width,
      H = I.pageSize.height;

    options = options || {};
    options.onrendered = function(obj) {
      x = parseInt(x) || 0;
      y = parseInt(y) || 0;
      var dim = options.dim || {};
      var h = dim.h || 0;
      var w = dim.w || Math.min(W, obj.width / K) - x;

      var format = 'JPEG';
      if (options.format) format = options.format;

      if (obj.height > H && options.pagesplit) {
        var crop = function() {
          var cy = 0;
          while (1) {
            var canvas = document.createElement('canvas');
            canvas.width = Math.min(W * K, obj.width);
            canvas.height = Math.min(H * K, obj.height - cy);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(
              obj,
              0,
              cy,
              obj.width,
              canvas.height,
              0,
              0,
              canvas.width,
              canvas.height
            );
            var args = [
              canvas,
              x,
              cy ? 0 : y,
              canvas.width / K,
              canvas.height / K,
              format,
              null,
              'SLOW'
            ];
            this.addImage.apply(this, args);
            cy += canvas.height;
            if (cy >= obj.height) break;
            this.addPage();
          }
          callback(w, cy, null, args);
        }.bind(this);
        if (obj.nodeName === 'CANVAS') {
          var img = new Image();
          img.onload = crop;
          img.src = obj.toDataURL('image/png');
          obj = img;
        } else {
          crop();
        }
      } else {
        var alias = Math.random().toString(35);
        var args = [obj, x, y, w, h, format, alias, 'SLOW'];

        this.addImage.apply(this, args);

        callback(w, h, alias, args);
      }
    }.bind(this);

    if (typeof html2canvas !== 'undefined' && !options.rstz) {
      return html2canvas(element, options);
    }

    if (typeof rasterizeHTML !== 'undefined') {
      var meth = 'drawDocument';
      if (typeof element === 'string') {
        meth = /^http/.test(element) ? 'drawURL' : 'drawHTML';
      }
      options.width = options.width || W * K;
      return rasterizeHTML[meth](element, void 0, options).then(
        function(r) {
          options.onrendered(r.image);
        },
        function(e) {
          callback(null, e);
        }
      );
    }

    return null;
  };
})(jsPDF.API);
/** @preserve
 * jsPDF addImage plugin
 * Copyright (c) 2012 Jason Siefken, https://github.com/siefkenj/
 *               2013 Chris Dowling, https://github.com/gingerchris
 *               2013 Trinh Ho, https://github.com/ineedfat
 *               2013 Edwin Alejandro Perez, https://github.com/eaparango
 *               2013 Norah Smith, https://github.com/burnburnrocket
 *               2014 Diego Casorran, https://github.com/diegocr
 *               2014 James Robb, https://github.com/jamesbrobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function(jsPDFAPI) {
  'use strict';

  var namespace = 'addImage_',
    supported_image_types = ['jpeg', 'jpg', 'png'];

  // Image functionality ported from pdf.js
  var putImage = function(img) {
      var objectNumber = this.internal.newObject(),
        out = this.internal.write,
        putStream = this.internal.putStream;

      img['n'] = objectNumber;

      out('<</Type /XObject');
      out('/Subtype /Image');
      out('/Width ' + img['w']);
      out('/Height ' + img['h']);
      if (img['cs'] === this.color_spaces.INDEXED) {
        out(
          '/ColorSpace [/Indexed /DeviceRGB ' +
            // if an indexed png defines more than one colour with transparency, we've created a smask
            (img['pal'].length / 3 - 1) +
            ' ' +
            ('smask' in img ? objectNumber + 2 : objectNumber + 1) +
            ' 0 R]'
        );
      } else {
        out('/ColorSpace /' + img['cs']);
        if (img['cs'] === this.color_spaces.DEVICE_CMYK) {
          out('/Decode [1 0 1 0 1 0 1 0]');
        }
      }
      out('/BitsPerComponent ' + img['bpc']);
      if ('f' in img) {
        out('/Filter /' + img['f']);
      }
      if ('dp' in img) {
        out('/DecodeParms <<' + img['dp'] + '>>');
      }
      if ('trns' in img && img['trns'].constructor == Array) {
        var trns = '',
          i = 0,
          len = img['trns'].length;
        for (; i < len; i++)
          trns += img['trns'][i] + ' ' + img['trns'][i] + ' ';
        out('/Mask [' + trns + ']');
      }
      if ('smask' in img) {
        out('/SMask ' + (objectNumber + 1) + ' 0 R');
      }
      out('/Length ' + img['data'].length + '>>');

      putStream(img['data']);

      out('endobj');

      // Soft mask
      if ('smask' in img) {
        var dp =
          '/Predictor 15 /Colors 1 /BitsPerComponent ' +
          img['bpc'] +
          ' /Columns ' +
          img['w'];
        var smask = {
          w: img['w'],
          h: img['h'],
          cs: 'DeviceGray',
          bpc: img['bpc'],
          dp: dp,
          data: img['smask']
        };
        if ('f' in img) smask.f = img['f'];
        putImage.call(this, smask);
      }

      //Palette
      if (img['cs'] === this.color_spaces.INDEXED) {
        this.internal.newObject();
        //out('<< /Filter / ' + img['f'] +' /Length ' + img['pal'].length + '>>');
        //putStream(zlib.compress(img['pal']));
        out('<< /Length ' + img['pal'].length + '>>');
        putStream(this.arrayBufferToBinaryString(new Uint8Array(img['pal'])));
        out('endobj');
      }
    },
    putResourcesCallback = function() {
      var images = this.internal.collections[namespace + 'images'];
      for (var i in images) {
        putImage.call(this, images[i]);
      }
    },
    putXObjectsDictCallback = function() {
      var images = this.internal.collections[namespace + 'images'],
        out = this.internal.write,
        image;
      for (var i in images) {
        image = images[i];
        out('/I' + image['i'], image['n'], '0', 'R');
      }
    },
    checkCompressValue = function(value) {
      if (value && typeof value === 'string') value = value.toUpperCase();
      return value in jsPDFAPI.image_compression
        ? value
        : jsPDFAPI.image_compression.NONE;
    },
    getImages = function() {
      var images = this.internal.collections[namespace + 'images'];
      //first run, so initialise stuff
      if (!images) {
        this.internal.collections[namespace + 'images'] = images = {};
        this.internal.events.subscribe('putResources', putResourcesCallback);
        this.internal.events.subscribe(
          'putXobjectDict',
          putXObjectsDictCallback
        );
      }

      return images;
    },
    getImageIndex = function(images) {
      var imageIndex = 0;

      if (images) {
        // this is NOT the first time this method is ran on this instance of jsPDF object.
        imageIndex = Object.keys
          ? Object.keys(images).length
          : (function(o) {
              var i = 0;
              for (var e in o) {
                if (o.hasOwnProperty(e)) {
                  i++;
                }
              }
              return i;
            })(images);
      }

      return imageIndex;
    },
    notDefined = function(value) {
      return typeof value === 'undefined' || value === null;
    },
    generateAliasFromData = function(data) {
      return typeof data === 'string' && jsPDFAPI.sHashCode(data);
    },
    doesNotSupportImageType = function(type) {
      return supported_image_types.indexOf(type) === -1;
    },
    processMethodNotEnabled = function(type) {
      return typeof jsPDFAPI['process' + type.toUpperCase()] !== 'function';
    },
    isDOMElement = function(object) {
      return typeof object === 'object' && object.nodeType === 1;
    },
    createDataURIFromElement = function(element, format, angle) {
      //if element is an image which uses data url defintion, just return the dataurl
      if (element.nodeName === 'IMG' && element.hasAttribute('src')) {
        var src = '' + element.getAttribute('src');
        if (!angle && src.indexOf('data:image/') === 0) return src;

        // only if the user doesn't care about a format
        if (!format && /\.png(?:[?#].*)?$/i.test(src)) format = 'png';
      }

      if (element.nodeName === 'CANVAS') {
        var canvas = element;
      } else {
        var canvas = document.createElement('canvas');
        canvas.width = element.clientWidth || element.width;
        canvas.height = element.clientHeight || element.height;

        var ctx = canvas.getContext('2d');
        if (!ctx) {
          throw 'addImage requires canvas to be supported by browser.';
        }
        if (angle) {
          var x,
            y,
            b,
            c,
            s,
            w,
            h,
            to_radians = Math.PI / 180,
            angleInRadians;

          if (typeof angle === 'object') {
            x = angle.x;
            y = angle.y;
            b = angle.bg;
            angle = angle.angle;
          }
          angleInRadians = angle * to_radians;
          c = Math.abs(Math.cos(angleInRadians));
          s = Math.abs(Math.sin(angleInRadians));
          w = canvas.width;
          h = canvas.height;
          canvas.width = h * s + w * c;
          canvas.height = h * c + w * s;

          if (isNaN(x)) x = canvas.width / 2;
          if (isNaN(y)) y = canvas.height / 2;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = b || 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleInRadians);
          ctx.drawImage(element, -(w / 2), -(h / 2));
          ctx.rotate(-angleInRadians);
          ctx.translate(-x, -y);
          ctx.restore();
        } else {
          ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        }
      }
      return canvas.toDataURL(
        ('' + format).toLowerCase() == 'png' ? 'image/png' : 'image/jpeg'
      );
    },
    checkImagesForAlias = function(alias, images) {
      var cached_info;
      if (images) {
        for (var e in images) {
          if (alias === images[e].alias) {
            cached_info = images[e];
            break;
          }
        }
      }
      return cached_info;
    },
    determineWidthAndHeight = function(w, h, info) {
      if (!w && !h) {
        w = -96;
        h = -96;
      }
      if (w < 0) {
        w = -1 * info['w'] * 72 / w / this.internal.scaleFactor;
      }
      if (h < 0) {
        h = -1 * info['h'] * 72 / h / this.internal.scaleFactor;
      }
      if (w === 0) {
        w = h * info['w'] / info['h'];
      }
      if (h === 0) {
        h = w * info['h'] / info['w'];
      }

      return [w, h];
    },
    writeImageToPDF = function(x, y, w, h, info, index, images) {
      var dims = determineWidthAndHeight.call(this, w, h, info),
        coord = this.internal.getCoordinateString,
        vcoord = this.internal.getVerticalCoordinateString;

      w = dims[0];
      h = dims[1];

      images[index] = info;

      this.internal.write(
        'q',
        coord(w),
        '0 0',
        coord(h), // TODO: check if this should be shifted by vcoord
        coord(x),
        vcoord(y + h),
        'cm /I' + info['i'],
        'Do Q'
      );
    };

  /**
	 * COLOR SPACES
	 */
  jsPDFAPI.color_spaces = {
    DEVICE_RGB: 'DeviceRGB',
    DEVICE_GRAY: 'DeviceGray',
    DEVICE_CMYK: 'DeviceCMYK',
    CAL_GREY: 'CalGray',
    CAL_RGB: 'CalRGB',
    LAB: 'Lab',
    ICC_BASED: 'ICCBased',
    INDEXED: 'Indexed',
    PATTERN: 'Pattern',
    SEPERATION: 'Seperation',
    DEVICE_N: 'DeviceN'
  };

  /**
	 * DECODE METHODS
	 */
  jsPDFAPI.decode = {
    DCT_DECODE: 'DCTDecode',
    FLATE_DECODE: 'FlateDecode',
    LZW_DECODE: 'LZWDecode',
    JPX_DECODE: 'JPXDecode',
    JBIG2_DECODE: 'JBIG2Decode',
    ASCII85_DECODE: 'ASCII85Decode',
    ASCII_HEX_DECODE: 'ASCIIHexDecode',
    RUN_LENGTH_DECODE: 'RunLengthDecode',
    CCITT_FAX_DECODE: 'CCITTFaxDecode'
  };

  /**
	 * IMAGE COMPRESSION TYPES
	 */
  jsPDFAPI.image_compression = {
    NONE: 'NONE',
    FAST: 'FAST',
    MEDIUM: 'MEDIUM',
    SLOW: 'SLOW'
  };

  jsPDFAPI.sHashCode = function(str) {
    return (
      Array.prototype.reduce &&
      str.split('').reduce(function(a, b) {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
    );
  };

  jsPDFAPI.isString = function(object) {
    return typeof object === 'string';
  };

  /**
	 * Strips out and returns info from a valid base64 data URI
	 * @param {String[dataURI]} a valid data URI of format 'data:[<MIME-type>][;base64],<data>'
	 * @returns an Array containing the following
	 * [0] the complete data URI
	 * [1] <MIME-type>
	 * [2] format - the second part of the mime-type i.e 'png' in 'image/png'
	 * [4] <data>
	 */
  jsPDFAPI.extractInfoFromBase64DataURI = function(dataURI) {
    return /^data:([\w]+?\/([\w]+?));base64,(.+?)$/g.exec(dataURI);
  };

  /**
	 * Check to see if ArrayBuffer is supported
	 */
  jsPDFAPI.supportsArrayBuffer = function() {
    return (
      typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined'
    );
  };

  /**
	 * Tests supplied object to determine if ArrayBuffer
	 * @param {Object[object]}
	 */
  jsPDFAPI.isArrayBuffer = function(object) {
    if (!this.supportsArrayBuffer()) return false;
    return object instanceof ArrayBuffer;
  };

  /**
	 * Tests supplied object to determine if it implements the ArrayBufferView (TypedArray) interface
	 * @param {Object[object]}
	 */
  jsPDFAPI.isArrayBufferView = function(object) {
    if (!this.supportsArrayBuffer()) return false;
    if (typeof Uint32Array === 'undefined') return false;
    return (
      object instanceof Int8Array ||
      object instanceof Uint8Array ||
      (typeof Uint8ClampedArray !== 'undefined' &&
        object instanceof Uint8ClampedArray) ||
      object instanceof Int16Array ||
      object instanceof Uint16Array ||
      object instanceof Int32Array ||
      object instanceof Uint32Array ||
      object instanceof Float32Array ||
      object instanceof Float64Array
    );
  };

  /**
	 * Exactly what it says on the tin
	 */
  jsPDFAPI.binaryStringToUint8Array = function(binary_string) {
    /*
		 * not sure how efficient this will be will bigger files. Is there a native method?
		 */
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  /**
	 * @see this discussion
	 * http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
	 *
	 * As stated, i imagine the method below is highly inefficent for large files.
	 *
	 * Also of note from Mozilla,
	 *
	 * "However, this is slow and error-prone, due to the need for multiple conversions (especially if the binary data is not actually byte-format data, but, for example, 32-bit integers or floats)."
	 *
	 * https://developer.mozilla.org/en-US/Add-ons/Code_snippets/StringView
	 *
	 * Although i'm strugglig to see how StringView solves this issue? Doesn't appear to be a direct method for conversion?
	 *
	 * Async method using Blob and FileReader could be best, but i'm not sure how to fit it into the flow?
	 */
  jsPDFAPI.arrayBufferToBinaryString = function(buffer) {
    if (this.isArrayBuffer(buffer)) buffer = new Uint8Array(buffer);

    var binary_string = '';
    var len = buffer.byteLength;
    for (var i = 0; i < len; i++) {
      binary_string += String.fromCharCode(buffer[i]);
    }
    return binary_string;
    /*
	     * Another solution is the method below - convert array buffer straight to base64 and then use atob
	     */
    //return atob(this.arrayBufferToBase64(buffer));
  };

  /**
	 * Converts an ArrayBuffer directly to base64
	 *
	 * Taken from here
	 *
	 * http://jsperf.com/encoding-xhr-image-data/31
	 *
	 * Need to test if this is a better solution for larger files
	 *
	 */
  jsPDFAPI.arrayBufferToBase64 = function(arrayBuffer) {
    var base64 = '';
    var encodings =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63; // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength];

      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3) << 4; // 3   = 2^2 - 1

      base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15) << 2; // 15    = 2^4 - 1

      base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
  };

  jsPDFAPI.createImageInfo = function(
    data,
    wd,
    ht,
    cs,
    bpc,
    f,
    imageIndex,
    alias,
    dp,
    trns,
    pal,
    smask
  ) {
    var info = {
      alias: alias,
      w: wd,
      h: ht,
      cs: cs,
      bpc: bpc,
      i: imageIndex,
      data: data
      // n: objectNumber will be added by putImage code
    };

    if (f) info.f = f;
    if (dp) info.dp = dp;
    if (trns) info.trns = trns;
    if (pal) info.pal = pal;
    if (smask) info.smask = smask;

    return info;
  };

  jsPDFAPI.addImage = function(
    imageData,
    format,
    x,
    y,
    w,
    h,
    alias,
    compression,
    rotation
  ) {
    'use strict';

    if (typeof format !== 'string') {
      var tmp = h;
      h = w;
      w = y;
      y = x;
      x = format;
      format = tmp;
    }

    if (
      typeof imageData === 'object' &&
      !isDOMElement(imageData) &&
      'imageData' in imageData
    ) {
      var options = imageData;

      imageData = options.imageData;
      format = options.format || format;
      x = options.x || x || 0;
      y = options.y || y || 0;
      w = options.w || w;
      h = options.h || h;
      alias = options.alias || alias;
      compression = options.compression || compression;
      rotation = options.rotation || options.angle || rotation;
    }

    if (isNaN(x) || isNaN(y)) {
      console.error('jsPDF.addImage: Invalid coordinates', arguments);
      throw new Error('Invalid coordinates passed to jsPDF.addImage');
    }

    var images = getImages.call(this),
      info;

    if (!(info = checkImagesForAlias(imageData, images))) {
      var dataAsBinaryString;

      if (isDOMElement(imageData))
        imageData = createDataURIFromElement(imageData, format, rotation);

      if (notDefined(alias)) alias = generateAliasFromData(imageData);

      if (!(info = checkImagesForAlias(alias, images))) {
        if (this.isString(imageData)) {
          var base64Info = this.extractInfoFromBase64DataURI(imageData);

          if (base64Info) {
            format = base64Info[2];
            imageData = atob(base64Info[3]); //convert to binary string
          } else {
            if (
              imageData.charCodeAt(0) === 0x89 &&
              imageData.charCodeAt(1) === 0x50 &&
              imageData.charCodeAt(2) === 0x4e &&
              imageData.charCodeAt(3) === 0x47
            )
              format = 'png';
          }
        }
        format = (format || 'JPEG').toLowerCase();

        if (doesNotSupportImageType(format))
          throw new Error(
            'addImage currently only supports formats ' +
              supported_image_types +
              ", not '" +
              format +
              "'"
          );

        if (processMethodNotEnabled(format))
          throw new Error(
            "please ensure that the plugin for '" +
              format +
              "' support is added"
          );

        /**
				 * need to test if it's more efficent to convert all binary strings
				 * to TypedArray - or should we just leave and process as string?
				 */
        if (this.supportsArrayBuffer()) {
          dataAsBinaryString = imageData;
          imageData = this.binaryStringToUint8Array(imageData);
        }

        info = this['process' + format.toUpperCase()](
          imageData,
          getImageIndex(images),
          alias,
          checkCompressValue(compression),
          dataAsBinaryString
        );

        if (!info)
          throw new Error(
            'An unkwown error occurred whilst processing the image'
          );
      }
    }

    writeImageToPDF.call(this, x, y, w, h, info, info.i, images);

    return this;
  };

  /**
	 * JPEG SUPPORT
	 **/

  //takes a string imgData containing the raw bytes of
  //a jpeg image and returns [width, height]
  //Algorithm from: http://www.64lines.com/jpeg-width-height
  var getJpegSize = function(imgData) {
      'use strict';
      var width, height, numcomponents;
      // Verify we have a valid jpeg header 0xff,0xd8,0xff,0xe0,?,?,'J','F','I','F',0x00
      if (
        !imgData.charCodeAt(0) === 0xff ||
        !imgData.charCodeAt(1) === 0xd8 ||
        !imgData.charCodeAt(2) === 0xff ||
        !imgData.charCodeAt(3) === 0xe0 ||
        !imgData.charCodeAt(6) === 'J'.charCodeAt(0) ||
        !imgData.charCodeAt(7) === 'F'.charCodeAt(0) ||
        !imgData.charCodeAt(8) === 'I'.charCodeAt(0) ||
        !imgData.charCodeAt(9) === 'F'.charCodeAt(0) ||
        !imgData.charCodeAt(10) === 0x00
      ) {
        throw new Error('getJpegSize requires a binary string jpeg file');
      }
      var blockLength = imgData.charCodeAt(4) * 256 + imgData.charCodeAt(5);
      var i = 4,
        len = imgData.length;
      while (i < len) {
        i += blockLength;
        if (imgData.charCodeAt(i) !== 0xff) {
          throw new Error('getJpegSize could not find the size of the image');
        }
        if (
          imgData.charCodeAt(i + 1) === 0xc0 || //(SOF) Huffman  - Baseline DCT
          imgData.charCodeAt(i + 1) === 0xc1 || //(SOF) Huffman  - Extended sequential DCT
          imgData.charCodeAt(i + 1) === 0xc2 || // Progressive DCT (SOF2)
          imgData.charCodeAt(i + 1) === 0xc3 || // Spatial (sequential) lossless (SOF3)
          imgData.charCodeAt(i + 1) === 0xc4 || // Differential sequential DCT (SOF5)
          imgData.charCodeAt(i + 1) === 0xc5 || // Differential progressive DCT (SOF6)
          imgData.charCodeAt(i + 1) === 0xc6 || // Differential spatial (SOF7)
          imgData.charCodeAt(i + 1) === 0xc7
        ) {
          height = imgData.charCodeAt(i + 5) * 256 + imgData.charCodeAt(i + 6);
          width = imgData.charCodeAt(i + 7) * 256 + imgData.charCodeAt(i + 8);
          numcomponents = imgData.charCodeAt(i + 9);
          return [width, height, numcomponents];
        } else {
          i += 2;
          blockLength = imgData.charCodeAt(i) * 256 + imgData.charCodeAt(i + 1);
        }
      }
    },
    getJpegSizeFromBytes = function(data) {
      var hdr = (data[0] << 8) | data[1];

      if (hdr !== 0xffd8) throw new Error('Supplied data is not a JPEG');

      var len = data.length,
        block = (data[4] << 8) + data[5],
        pos = 4,
        bytes,
        width,
        height,
        numcomponents;

      while (pos < len) {
        pos += block;
        bytes = readBytes(data, pos);
        block = (bytes[2] << 8) + bytes[3];
        if (
          (bytes[1] === 0xc0 || bytes[1] === 0xc2) &&
          bytes[0] === 0xff &&
          block > 7
        ) {
          bytes = readBytes(data, pos + 5);
          width = (bytes[2] << 8) + bytes[3];
          height = (bytes[0] << 8) + bytes[1];
          numcomponents = bytes[4];
          return { width: width, height: height, numcomponents: numcomponents };
        }

        pos += 2;
      }

      throw new Error(
        'getJpegSizeFromBytes could not find the size of the image'
      );
    },
    readBytes = function(data, offset) {
      return data.subarray(offset, offset + 5);
    };

  jsPDFAPI.processJPEG = function(
    data,
    index,
    alias,
    compression,
    dataAsBinaryString
  ) {
    'use strict';
    var colorSpace = this.color_spaces.DEVICE_RGB,
      filter = this.decode.DCT_DECODE,
      bpc = 8,
      dims;

    if (this.isString(data)) {
      dims = getJpegSize(data);
      return this.createImageInfo(
        data,
        dims[0],
        dims[1],
        dims[3] == 1 ? this.color_spaces.DEVICE_GRAY : colorSpace,
        bpc,
        filter,
        index,
        alias
      );
    }

    if (this.isArrayBuffer(data)) data = new Uint8Array(data);

    if (this.isArrayBufferView(data)) {
      dims = getJpegSizeFromBytes(data);

      // if we already have a stored binary string rep use that
      data = dataAsBinaryString || this.arrayBufferToBinaryString(data);

      return this.createImageInfo(
        data,
        dims.width,
        dims.height,
        dims.numcomponents == 1 ? this.color_spaces.DEVICE_GRAY : colorSpace,
        bpc,
        filter,
        index,
        alias
      );
    }

    return null;
  };

  jsPDFAPI.processJPG = function(/*data, index, alias, compression, dataAsBinaryString*/) {
    return this.processJPEG.apply(this, arguments);
  };
})(jsPDF.API);
(function(jsPDFAPI) {
  'use strict';

  jsPDFAPI.autoPrint = function() {
    'use strict';
    var refAutoPrintTag;

    this.internal.events.subscribe('postPutResources', function() {
      refAutoPrintTag = this.internal.newObject();
      this.internal.write('<< /S/Named /Type/Action /N/Print >>', 'endobj');
    });

    this.internal.events.subscribe('putCatalog', function() {
      this.internal.write('/OpenAction ' + refAutoPrintTag + ' 0' + ' R');
    });
    return this;
  };
})(jsPDF.API);
/** ====================================================================
 * jsPDF Cell plugin
 * Copyright (c) 2013 Youssef Beddad, youssef.beddad@gmail.com
 *               2013 Eduardo Menezes de Morais, eduardo.morais@usp.br
 *               2013 Lee Driscoll, https://github.com/lsdriscoll
 *               2014 Juan Pablo Gaviria, https://github.com/juanpgaviria
 *               2014 James Hall, james@parall.ax
 *               2014 Diego Casorran, https://github.com/diegocr
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(jsPDFAPI) {
  'use strict';
  /*jslint browser:true */
  /*global document: false, jsPDF */

  var fontName,
    fontSize,
    fontStyle,
    padding = 3,
    margin = 13,
    headerFunction,
    lastCellPos = {
      x: undefined,
      y: undefined,
      w: undefined,
      h: undefined,
      ln: undefined
    },
    pages = 1,
    setLastCellPosition = function(x, y, w, h, ln) {
      lastCellPos = { x: x, y: y, w: w, h: h, ln: ln };
    },
    getLastCellPosition = function() {
      return lastCellPos;
    },
    NO_MARGINS = { left: 0, top: 0, bottom: 0 };

  jsPDFAPI.setHeaderFunction = function(func) {
    headerFunction = func;
  };

  jsPDFAPI.getTextDimensions = function(txt) {
    fontName = this.internal.getFont().fontName;
    fontSize = this.table_font_size || this.internal.getFontSize();
    fontStyle = this.internal.getFont().fontStyle;
    // 1 pixel = 0.264583 mm and 1 mm = 72/25.4 point
    var px2pt = 0.264583 * 72 / 25.4,
      dimensions,
      text;

    text = document.createElement('font');
    text.id = 'jsPDFCell';
    text.style.fontStyle = fontStyle;
    text.style.fontName = fontName;
    text.style.fontSize = fontSize + 'pt';
    text.textContent = txt;

    document.body.appendChild(text);

    dimensions = {
      w: (text.offsetWidth + 1) * px2pt,
      h: (text.offsetHeight + 1) * px2pt
    };

    document.body.removeChild(text);

    return dimensions;
  };

  jsPDFAPI.cellAddPage = function() {
    var margins = this.margins || NO_MARGINS;

    this.addPage();

    setLastCellPosition(margins.left, margins.top, undefined, undefined);
    //setLastCellPosition(undefined, undefined, undefined, undefined, undefined);
    pages += 1;
  };

  jsPDFAPI.cellInitialize = function() {
    lastCellPos = {
      x: undefined,
      y: undefined,
      w: undefined,
      h: undefined,
      ln: undefined
    };
    pages = 1;
  };

  jsPDFAPI.cell = function(x, y, w, h, txt, ln, align) {
    var curCell = getLastCellPosition();

    // If this is not the first cell, we must change its position
    if (curCell.ln !== undefined) {
      if (curCell.ln === ln) {
        //Same line
        x = curCell.x + curCell.w;
        y = curCell.y;
      } else {
        //New line
        var margins = this.margins || NO_MARGINS;
        if (
          curCell.y + curCell.h + h + margin >=
          this.internal.pageSize.height - margins.bottom
        ) {
          this.cellAddPage();
          if (this.printHeaders && this.tableHeaderRow) {
            this.printHeaderRow(ln, true);
          }
        }
        //We ignore the passed y: the lines may have diferent heights
        y = getLastCellPosition().y + getLastCellPosition().h;
      }
    }

    if (txt[0] !== undefined) {
      if (this.printingHeaderRow) {
        this.rect(x, y, w, h, 'FD');
      } else {
        this.rect(x, y, w, h);
      }
      if (align === 'right') {
        if (txt instanceof Array) {
          for (var i = 0; i < txt.length; i++) {
            var currentLine = txt[i];
            var textSize =
              this.getStringUnitWidth(currentLine) *
              this.internal.getFontSize();
            this.text(
              currentLine,
              x + w - textSize - padding,
              y + this.internal.getLineHeight() * (i + 1)
            );
          }
        }
      } else {
        this.text(txt, x + padding, y + this.internal.getLineHeight());
      }
    }
    setLastCellPosition(x, y, w, h, ln);
    return this;
  };

  /**
     * Return the maximum value from an array
     * @param array
     * @param comparisonFn
     * @returns {*}
     */
  jsPDFAPI.arrayMax = function(array, comparisonFn) {
    var max = array[0],
      i,
      ln,
      item;

    for (i = 0, ln = array.length; i < ln; i += 1) {
      item = array[i];

      if (comparisonFn) {
        if (comparisonFn(max, item) === -1) {
          max = item;
        }
      } else {
        if (item > max) {
          max = item;
        }
      }
    }

    return max;
  };

  /**
     * Create a table from a set of data.
     * @param {Integer} [x] : left-position for top-left corner of table
     * @param {Integer} [y] top-position for top-left corner of table
     * @param {Object[]} [data] As array of objects containing key-value pairs corresponding to a row of data.
     * @param {String[]} [headers] Omit or null to auto-generate headers at a performance cost

     * @param {Object} [config.printHeaders] True to print column headers at the top of every page
     * @param {Object} [config.autoSize] True to dynamically set the column widths to match the widest cell value
     * @param {Object} [config.margins] margin values for left, top, bottom, and width
     * @param {Object} [config.fontSize] Integer fontSize to use (optional)
     */

  jsPDFAPI.table = function(x, y, data, headers, config) {
    if (!data) {
      throw 'No data for PDF table';
    }

    var headerNames = [],
      headerPrompts = [],
      header,
      i,
      ln,
      cln,
      columnMatrix = {},
      columnWidths = {},
      columnData,
      column,
      columnMinWidths = [],
      j,
      tableHeaderConfigs = [],
      model,
      jln,
      func,
      //set up defaults. If a value is provided in config, defaults will be overwritten:
      autoSize = false,
      printHeaders = true,
      fontSize = 12,
      margins = NO_MARGINS;

    margins.width = this.internal.pageSize.width;

    if (config) {
      //override config defaults if the user has specified non-default behavior:
      if (config.autoSize === true) {
        autoSize = true;
      }
      if (config.printHeaders === false) {
        printHeaders = false;
      }
      if (config.fontSize) {
        fontSize = config.fontSize;
      }
      if (config.margins) {
        margins = config.margins;
      }
    }

    /**
         * @property {Number} lnMod
         * Keep track of the current line number modifier used when creating cells
         */
    this.lnMod = 0;
    (lastCellPos = {
      x: undefined,
      y: undefined,
      w: undefined,
      h: undefined,
      ln: undefined
    }), (pages = 1);

    this.printHeaders = printHeaders;
    this.margins = margins;
    this.setFontSize(fontSize);
    this.table_font_size = fontSize;

    // Set header values
    if (headers === undefined || headers === null) {
      // No headers defined so we derive from data
      headerNames = Object.keys(data[0]);
    } else if (headers[0] && typeof headers[0] !== 'string') {
      var px2pt = 0.264583 * 72 / 25.4;

      // Split header configs into names and prompts
      for (i = 0, ln = headers.length; i < ln; i += 1) {
        header = headers[i];
        headerNames.push(header.name);
        headerPrompts.push(header.prompt);
        columnWidths[header.name] = header.width * px2pt;
      }
    } else {
      headerNames = headers;
    }

    if (autoSize) {
      // Create a matrix of columns e.g., {column_title: [row1_Record, row2_Record]}
      func = function(rec) {
        return rec[header];
      };

      for (i = 0, ln = headerNames.length; i < ln; i += 1) {
        header = headerNames[i];

        columnMatrix[header] = data.map(func);

        // get header width
        columnMinWidths.push(
          this.getTextDimensions(headerPrompts[i] || header).w
        );
        column = columnMatrix[header];

        // get cell widths
        for (j = 0, cln = column.length; j < cln; j += 1) {
          columnData = column[j];
          columnMinWidths.push(this.getTextDimensions(columnData).w);
        }

        // get final column width
        columnWidths[header] = jsPDFAPI.arrayMax(columnMinWidths);
      }
    }

    // -- Construct the table

    if (printHeaders) {
      var lineHeight = this.calculateLineHeight(
        headerNames,
        columnWidths,
        headerPrompts.length ? headerPrompts : headerNames
      );

      // Construct the header row
      for (i = 0, ln = headerNames.length; i < ln; i += 1) {
        header = headerNames[i];
        tableHeaderConfigs.push([
          x,
          y,
          columnWidths[header],
          lineHeight,
          String(headerPrompts.length ? headerPrompts[i] : header)
        ]);
      }

      // Store the table header config
      this.setTableHeaderRow(tableHeaderConfigs);

      // Print the header for the start of the table
      this.printHeaderRow(1, false);
    }

    // Construct the data rows
    for (i = 0, ln = data.length; i < ln; i += 1) {
      var lineHeight;
      model = data[i];
      lineHeight = this.calculateLineHeight(headerNames, columnWidths, model);

      for (j = 0, jln = headerNames.length; j < jln; j += 1) {
        header = headerNames[j];
        this.cell(
          x,
          y,
          columnWidths[header],
          lineHeight,
          model[header],
          i + 2,
          header.align
        );
      }
    }
    this.lastCellPos = lastCellPos;
    this.table_x = x;
    this.table_y = y;
    return this;
  };
  /**
     * Calculate the height for containing the highest column
     * @param {String[]} headerNames is the header, used as keys to the data
     * @param {Integer[]} columnWidths is size of each column
     * @param {Object[]} model is the line of data we want to calculate the height of
     */
  jsPDFAPI.calculateLineHeight = function(headerNames, columnWidths, model) {
    var header,
      lineHeight = 0;
    for (var j = 0; j < headerNames.length; j++) {
      header = headerNames[j];
      model[header] = this.splitTextToSize(
        String(model[header]),
        columnWidths[header] - padding
      );
      var h = this.internal.getLineHeight() * model[header].length + padding;
      if (h > lineHeight) lineHeight = h;
    }
    return lineHeight;
  };

  /**
     * Store the config for outputting a table header
     * @param {Object[]} config
     * An array of cell configs that would define a header row: Each config matches the config used by jsPDFAPI.cell
     * except the ln parameter is excluded
     */
  jsPDFAPI.setTableHeaderRow = function(config) {
    this.tableHeaderRow = config;
  };

  /**
     * Output the store header row
     * @param lineNumber The line number to output the header at
     */
  jsPDFAPI.printHeaderRow = function(lineNumber, new_page) {
    if (!this.tableHeaderRow) {
      throw 'Property tableHeaderRow does not exist.';
    }

    var tableHeaderCell, tmpArray, i, ln;

    this.printingHeaderRow = true;
    if (headerFunction !== undefined) {
      var position = headerFunction(this, pages);
      setLastCellPosition(
        position[0],
        position[1],
        position[2],
        position[3],
        -1
      );
    }
    this.setFontStyle('bold');
    var tempHeaderConf = [];
    for (i = 0, ln = this.tableHeaderRow.length; i < ln; i += 1) {
      this.setFillColor(200, 200, 200);

      tableHeaderCell = this.tableHeaderRow[i];
      if (new_page) {
        tableHeaderCell[1] = (this.margins && this.margins.top) || 0;
        tempHeaderConf.push(tableHeaderCell);
      }
      tmpArray = [].concat(tableHeaderCell);
      this.cell.apply(this, tmpArray.concat(lineNumber));
    }
    if (tempHeaderConf.length > 0) {
      this.setTableHeaderRow(tempHeaderConf);
    }
    this.setFontStyle('normal');
    this.printingHeaderRow = false;
  };
})(jsPDF.API);
/** @preserve
 * jsPDF fromHTML plugin. BETA stage. API subject to change. Needs browser
 * Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
 *               2014 Juan Pablo Gaviria, https://github.com/juanpgaviria
 *               2014 Diego Casorran, https://github.com/diegocr
 *               2014 Daniel Husar, https://github.com/danielhusar
 *               2014 Wolfgang Gassler, https://github.com/woolfg
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(jsPDFAPI) {
  var clone,
    DrillForContent,
    FontNameDB,
    FontStyleMap,
    FontWeightMap,
    FloatMap,
    ClearMap,
    GetCSS,
    PurgeWhiteSpace,
    Renderer,
    ResolveFont,
    ResolveUnitedNumber,
    UnitedNumberMap,
    elementHandledElsewhere,
    images,
    loadImgs,
    checkForFooter,
    process,
    tableToJson;
  clone = (function() {
    return function(obj) {
      Clone.prototype = obj;
      return new Clone();
    };
    function Clone() {}
  })();
  PurgeWhiteSpace = function(array) {
    var fragment, i, l, lTrimmed, r, rTrimmed, trailingSpace;
    i = 0;
    l = array.length;
    fragment = void 0;
    lTrimmed = false;
    rTrimmed = false;
    while (!lTrimmed && i !== l) {
      fragment = array[i] = array[i].trimLeft();
      if (fragment) {
        lTrimmed = true;
      }
      i++;
    }
    i = l - 1;
    while (l && !rTrimmed && i !== -1) {
      fragment = array[i] = array[i].trimRight();
      if (fragment) {
        rTrimmed = true;
      }
      i--;
    }
    r = /\s+$/g;
    trailingSpace = true;
    i = 0;
    while (i !== l) {
      fragment = array[i].replace(/\s+/g, ' ');
      if (trailingSpace) {
        fragment = fragment.trimLeft();
      }
      if (fragment) {
        trailingSpace = r.test(fragment);
      }
      array[i] = fragment;
      i++;
    }
    return array;
  };
  Renderer = function(pdf, x, y, settings) {
    this.pdf = pdf;
    this.x = x;
    this.y = y;
    this.settings = settings;
    //list of functions which are called after each element-rendering process
    this.watchFunctions = [];
    this.init();
    return this;
  };
  ResolveFont = function(css_font_family_string) {
    var name, part, parts;
    name = void 0;
    parts = css_font_family_string.split(',');
    part = parts.shift();
    while (!name && part) {
      name = FontNameDB[part.trim().toLowerCase()];
      part = parts.shift();
    }
    return name;
  };
  ResolveUnitedNumber = function(css_line_height_string) {
    //IE8 issues
    css_line_height_string =
      css_line_height_string === 'auto' ? '0px' : css_line_height_string;
    if (
      css_line_height_string.indexOf('em') > -1 &&
      !isNaN(Number(css_line_height_string.replace('em', '')))
    ) {
      css_line_height_string =
        Number(css_line_height_string.replace('em', '')) * 18.719 + 'px';
    }
    if (
      css_line_height_string.indexOf('pt') > -1 &&
      !isNaN(Number(css_line_height_string.replace('pt', '')))
    ) {
      css_line_height_string =
        Number(css_line_height_string.replace('pt', '')) * 1.333 + 'px';
    }

    var normal, undef, value;
    undef = void 0;
    normal = 16.0;
    value = UnitedNumberMap[css_line_height_string];
    if (value) {
      return value;
    }
    value = {
      'xx-small': 9,
      'x-small': 11,
      small: 13,
      medium: 16,
      large: 19,
      'x-large': 23,
      'xx-large': 28,
      auto: 0
    }[{ css_line_height_string: css_line_height_string }];

    if (value !== undef) {
      return (UnitedNumberMap[css_line_height_string] = value / normal);
    }
    if ((value = parseFloat(css_line_height_string))) {
      return (UnitedNumberMap[css_line_height_string] = value / normal);
    }
    value = css_line_height_string.match(/([\d\.]+)(px)/);
    if (value.length === 3) {
      return (UnitedNumberMap[css_line_height_string] =
        parseFloat(value[1]) / normal);
    }
    return (UnitedNumberMap[css_line_height_string] = 1);
  };
  GetCSS = function(element) {
    var css, tmp, computedCSSElement;
    computedCSSElement = (function(el) {
      var compCSS;
      compCSS = (function(el) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
          return document.defaultView.getComputedStyle(el, null);
        } else if (el.currentStyle) {
          return el.currentStyle;
        } else {
          return el.style;
        }
      })(el);
      return function(prop) {
        prop = prop.replace(/-\D/g, function(match) {
          return match.charAt(1).toUpperCase();
        });
        return compCSS[prop];
      };
    })(element);
    css = {};
    tmp = void 0;
    css['font-family'] =
      ResolveFont(computedCSSElement('font-family')) || 'times';
    css['font-style'] =
      FontStyleMap[computedCSSElement('font-style')] || 'normal';
    css['text-align'] =
      TextAlignMap[computedCSSElement('text-align')] || 'left';
    tmp = FontWeightMap[computedCSSElement('font-weight')] || 'normal';
    if (tmp === 'bold') {
      if (css['font-style'] === 'normal') {
        css['font-style'] = tmp;
      } else {
        css['font-style'] = tmp + css['font-style'];
      }
    }
    css['font-size'] =
      ResolveUnitedNumber(computedCSSElement('font-size')) || 1;
    css['line-height'] =
      ResolveUnitedNumber(computedCSSElement('line-height')) || 1;
    css['display'] =
      computedCSSElement('display') === 'inline' ? 'inline' : 'block';

    tmp = css['display'] === 'block';
    css['margin-top'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('margin-top'))) || 0;
    css['margin-bottom'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('margin-bottom'))) || 0;
    css['padding-top'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('padding-top'))) || 0;
    css['padding-bottom'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('padding-bottom'))) || 0;
    css['margin-left'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('margin-left'))) || 0;
    css['margin-right'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('margin-right'))) || 0;
    css['padding-left'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('padding-left'))) || 0;
    css['padding-right'] =
      (tmp && ResolveUnitedNumber(computedCSSElement('padding-right'))) || 0;

    //float and clearing of floats
    css['float'] = FloatMap[computedCSSElement('cssFloat')] || 'none';
    css['clear'] = ClearMap[computedCSSElement('clear')] || 'none';
    return css;
  };
  elementHandledElsewhere = function(element, renderer, elementHandlers) {
    var handlers, i, isHandledElsewhere, l, t;
    isHandledElsewhere = false;
    i = void 0;
    l = void 0;
    t = void 0;
    handlers = elementHandlers['#' + element.id];
    if (handlers) {
      if (typeof handlers === 'function') {
        isHandledElsewhere = handlers(element, renderer);
      } else {
        i = 0;
        l = handlers.length;
        while (!isHandledElsewhere && i !== l) {
          isHandledElsewhere = handlers[i](element, renderer);
          i++;
        }
      }
    }
    handlers = elementHandlers[element.nodeName];
    if (!isHandledElsewhere && handlers) {
      if (typeof handlers === 'function') {
        isHandledElsewhere = handlers(element, renderer);
      } else {
        i = 0;
        l = handlers.length;
        while (!isHandledElsewhere && i !== l) {
          isHandledElsewhere = handlers[i](element, renderer);
          i++;
        }
      }
    }
    return isHandledElsewhere;
  };
  tableToJson = function(table, renderer) {
    var data, headers, i, j, rowData, tableRow, table_obj, table_with, cell, l;
    data = [];
    headers = [];
    i = 0;
    l = table.rows[0].cells.length;
    table_with = table.clientWidth;
    while (i < l) {
      cell = table.rows[0].cells[i];
      headers[i] = {
        name: cell.textContent.toLowerCase().replace(/\s+/g, ''),
        prompt: cell.textContent.replace(/\r?\n/g, ''),
        width:
          cell.clientWidth / table_with * renderer.pdf.internal.pageSize.width
      };
      i++;
    }
    i = 1;
    while (i < table.rows.length) {
      tableRow = table.rows[i];
      rowData = {};
      j = 0;
      while (j < tableRow.cells.length) {
        rowData[headers[j].name] = tableRow.cells[j].textContent.replace(
          /\r?\n/g,
          ''
        );
        j++;
      }
      data.push(rowData);
      i++;
    }
    return (table_obj = {
      rows: data,
      headers: headers
    });
  };
  var SkipNode = {
    SCRIPT: 1,
    STYLE: 1,
    NOSCRIPT: 1,
    OBJECT: 1,
    EMBED: 1,
    SELECT: 1
  };
  var listCount = 1;
  DrillForContent = function(element, renderer, elementHandlers) {
    var cn, cns, fragmentCSS, i, isBlock, l, px2pt, table2json, cb;
    cns = element.childNodes;
    cn = void 0;
    fragmentCSS = GetCSS(element);
    isBlock = fragmentCSS.display === 'block';
    if (isBlock) {
      renderer.setBlockBoundary();
      renderer.setBlockStyle(fragmentCSS);
    }
    px2pt = 0.264583 * 72 / 25.4;
    i = 0;
    l = cns.length;
    while (i < l) {
      cn = cns[i];
      if (typeof cn === 'object') {
        //execute all watcher functions to e.g. reset floating
        renderer.executeWatchFunctions(cn);

        /*** HEADER rendering **/
        if (cn.nodeType === 1 && cn.nodeName === 'HEADER') {
          var header = cn;
          //store old top margin
          var oldMarginTop = renderer.pdf.margins_doc.top;
          //subscribe for new page event and render header first on every page
          renderer.pdf.internal.events.subscribe(
            'addPage',
            function(pageInfo) {
              //set current y position to old margin
              renderer.y = oldMarginTop;
              //render all child nodes of the header element
              DrillForContent(header, renderer, elementHandlers);
              //set margin to old margin + rendered header + 10 space to prevent overlapping
              //important for other plugins (e.g. table) to start rendering at correct position after header
              renderer.pdf.margins_doc.top = renderer.y + 10;
              renderer.y += 10;
            },
            false
          );
        }

        if (cn.nodeType === 8 && cn.nodeName === '#comment') {
          if (~cn.textContent.indexOf('ADD_PAGE')) {
            renderer.pdf.addPage();
            renderer.y = renderer.pdf.margins_doc.top;
          }
        } else if (cn.nodeType === 1 && !SkipNode[cn.nodeName]) {
          /*** IMAGE RENDERING ***/
          var cached_image;
          if (cn.nodeName === 'IMG') {
            var url = cn.getAttribute('src');
            cached_image = images[renderer.pdf.sHashCode(url) || url];
          }
          if (cached_image) {
            if (
              renderer.pdf.internal.pageSize.height -
                renderer.pdf.margins_doc.bottom <
                renderer.y + cn.height &&
              renderer.y > renderer.pdf.margins_doc.top
            ) {
              renderer.pdf.addPage();
              renderer.y = renderer.pdf.margins_doc.top;
              //check if we have to set back some values due to e.g. header rendering for new page
              renderer.executeWatchFunctions(cn);
            }

            var imagesCSS = GetCSS(cn);
            var imageX = renderer.x;
            var fontToUnitRatio = 12 / renderer.pdf.internal.scaleFactor;

            //define additional paddings, margins which have to be taken into account for margin calculations
            var additionalSpaceLeft =
              (imagesCSS['margin-left'] + imagesCSS['padding-left']) *
              fontToUnitRatio;
            var additionalSpaceRight =
              (imagesCSS['margin-right'] + imagesCSS['padding-right']) *
              fontToUnitRatio;
            var additionalSpaceTop =
              (imagesCSS['margin-top'] + imagesCSS['padding-top']) *
              fontToUnitRatio;
            var additionalSpaceBottom =
              (imagesCSS['margin-bottom'] + imagesCSS['padding-bottom']) *
              fontToUnitRatio;

            //if float is set to right, move the image to the right border
            //add space if margin is set
            if (
              imagesCSS['float'] !== undefined &&
              imagesCSS['float'] === 'right'
            ) {
              imageX +=
                renderer.settings.width - cn.width - additionalSpaceRight;
            } else {
              imageX += additionalSpaceLeft;
            }

            renderer.pdf.addImage(
              cached_image,
              imageX,
              renderer.y + additionalSpaceTop,
              cn.width,
              cn.height
            );
            cached_image = undefined;
            //if the float prop is specified we have to float the text around the image
            if (
              imagesCSS['float'] === 'right' ||
              imagesCSS['float'] === 'left'
            ) {
              //add functiont to set back coordinates after image rendering
              renderer.watchFunctions.push(
                function(diffX, thresholdY, diffWidth, el) {
                  //undo drawing box adaptions which were set by floating
                  if (renderer.y >= thresholdY) {
                    renderer.x += diffX;
                    renderer.settings.width += diffWidth;
                    return true;
                  } else if (
                    el &&
                    el.nodeType === 1 &&
                    !SkipNode[el.nodeName] &&
                    renderer.x + el.width >
                      renderer.pdf.margins_doc.left +
                        renderer.pdf.margins_doc.width
                  ) {
                    renderer.x += diffX;
                    renderer.y = thresholdY;
                    renderer.settings.width += diffWidth;
                    return true;
                  } else {
                    return false;
                  }
                }.bind(
                  this,
                  imagesCSS['float'] === 'left'
                    ? -cn.width - additionalSpaceLeft - additionalSpaceRight
                    : 0,
                  renderer.y +
                    cn.height +
                    additionalSpaceTop +
                    additionalSpaceBottom,
                  cn.width
                )
              );
              //reset floating by clear:both divs
              //just set cursorY after the floating element
              renderer.watchFunctions.push(
                function(yPositionAfterFloating, pages, el) {
                  if (
                    renderer.y < yPositionAfterFloating &&
                    pages === renderer.pdf.internal.getNumberOfPages()
                  ) {
                    if (el.nodeType === 1 && GetCSS(el).clear === 'both') {
                      renderer.y = yPositionAfterFloating;
                      return true;
                    } else {
                      return false;
                    }
                  } else {
                    return true;
                  }
                }.bind(
                  this,
                  renderer.y + cn.height,
                  renderer.pdf.internal.getNumberOfPages()
                )
              );

              //if floating is set we decrease the available width by the image width
              renderer.settings.width -=
                cn.width + additionalSpaceLeft + additionalSpaceRight;
              //if left just add the image width to the X coordinate
              if (imagesCSS['float'] === 'left') {
                renderer.x +=
                  cn.width + additionalSpaceLeft + additionalSpaceRight;
              }
            } else {
              //if no floating is set, move the rendering cursor after the image height
              renderer.y += cn.height + additionalSpaceBottom;
            }

            /*** TABLE RENDERING ***/
          } else if (cn.nodeName === 'TABLE') {
            table2json = tableToJson(cn, renderer);
            renderer.y += 10;
            renderer.pdf.table(
              renderer.x,
              renderer.y,
              table2json.rows,
              table2json.headers,
              {
                autoSize: false,
                printHeaders: true,
                margins: renderer.pdf.margins_doc
              }
            );
            renderer.y =
              renderer.pdf.lastCellPos.y + renderer.pdf.lastCellPos.h + 20;
          } else if (cn.nodeName === 'OL' || cn.nodeName === 'UL') {
            listCount = 1;
            if (!elementHandledElsewhere(cn, renderer, elementHandlers)) {
              DrillForContent(cn, renderer, elementHandlers);
            }
            renderer.y += 10;
          } else if (cn.nodeName === 'LI') {
            var temp = renderer.x;
            renderer.x += cn.parentNode.nodeName === 'UL' ? 22 : 10;
            renderer.y += 3;
            if (!elementHandledElsewhere(cn, renderer, elementHandlers)) {
              DrillForContent(cn, renderer, elementHandlers);
            }
            renderer.x = temp;
          } else if (cn.nodeName === 'BR') {
            renderer.y +=
              fragmentCSS['font-size'] * renderer.pdf.internal.scaleFactor;
          } else {
            if (!elementHandledElsewhere(cn, renderer, elementHandlers)) {
              DrillForContent(cn, renderer, elementHandlers);
            }
          }
        } else if (cn.nodeType === 3) {
          var value = cn.nodeValue;
          if (cn.nodeValue && cn.parentNode.nodeName === 'LI') {
            if (cn.parentNode.parentNode.nodeName === 'OL') {
              value = listCount++ + '. ' + value;
            } else {
              var fontPx = fragmentCSS['font-size'] * 16;
              var radius = 2;
              if (fontPx > 20) {
                radius = 3;
              }
              cb = function(x, y) {
                this.pdf.circle(x, y, radius, 'FD');
              };
            }
          }
          renderer.addText(value, fragmentCSS);
        } else if (typeof cn === 'string') {
          renderer.addText(cn, fragmentCSS);
        }
      }
      i++;
    }

    if (isBlock) {
      return renderer.setBlockBoundary(cb);
    }
  };
  images = {};
  loadImgs = function(element, renderer, elementHandlers, cb) {
    var imgs = element.getElementsByTagName('img'),
      l = imgs.length,
      found_images,
      x = 0;
    function done() {
      renderer.pdf.internal.events.publish('imagesLoaded');
      cb(found_images);
    }
    function loadImage(url, width, height) {
      if (!url) return;
      var img = new Image();
      found_images = ++x;
      img.crossOrigin = '';
      img.onerror = img.onload = function() {
        if (img.complete) {
          //to support data urls in images, set width and height
          //as those values are not recognized automatically
          if (img.src.indexOf('data:image/') === 0) {
            img.width = width || img.width || 0;
            img.height = height || img.height || 0;
          }
          //if valid image add to known images array
          if (img.width + img.height) {
            var hash = renderer.pdf.sHashCode(url) || url;
            images[hash] = images[hash] || img;
          }
        }
        if (!--x) {
          done();
        }
      };
      img.src = url;
    }
    while (l--)
      loadImage(imgs[l].getAttribute('src'), imgs[l].width, imgs[l].height);
    return x || done();
  };
  checkForFooter = function(elem, renderer, elementHandlers) {
    //check if we can found a <footer> element
    var footer = elem.getElementsByTagName('footer');
    if (footer.length > 0) {
      footer = footer[0];

      //bad hack to get height of footer
      //creat dummy out and check new y after fake rendering
      var oldOut = renderer.pdf.internal.write;
      var oldY = renderer.y;
      renderer.pdf.internal.write = function() {};
      DrillForContent(footer, renderer, elementHandlers);
      var footerHeight = Math.ceil(renderer.y - oldY) + 5;
      renderer.y = oldY;
      renderer.pdf.internal.write = oldOut;

      //add 20% to prevent overlapping
      renderer.pdf.margins_doc.bottom += footerHeight;

      //Create function render header on every page
      var renderFooter = function(pageInfo) {
        var pageNumber = pageInfo !== undefined ? pageInfo.pageNumber : 1;
        //set current y position to old margin
        var oldPosition = renderer.y;
        //render all child nodes of the header element
        renderer.y =
          renderer.pdf.internal.pageSize.height -
          renderer.pdf.margins_doc.bottom;
        renderer.pdf.margins_doc.bottom -= footerHeight;

        //check if we have to add page numbers
        var spans = footer.getElementsByTagName('span');
        for (var i = 0; i < spans.length; ++i) {
          //if we find some span element with class pageCounter, set the page
          if (
            (' ' + spans[i].className + ' ')
              .replace(/[\n\t]/g, ' ')
              .indexOf(' pageCounter ') > -1
          ) {
            spans[i].innerHTML = pageNumber;
          }
          //if we find some span element with class totalPages, set a variable which is replaced after rendering of all pages
          if (
            (' ' + spans[i].className + ' ')
              .replace(/[\n\t]/g, ' ')
              .indexOf(' totalPages ') > -1
          ) {
            spans[i].innerHTML = '###jsPDFVarTotalPages###';
          }
        }

        //render footer content
        DrillForContent(footer, renderer, elementHandlers);
        //set bottom margin to previous height including the footer height
        renderer.pdf.margins_doc.bottom += footerHeight;
        //important for other plugins (e.g. table) to start rendering at correct position after header
        renderer.y = oldPosition;
      };

      //check if footer contains totalPages which shoudl be replace at the disoposal of the document
      var spans = footer.getElementsByTagName('span');
      for (var i = 0; i < spans.length; ++i) {
        if (
          (' ' + spans[i].className + ' ')
            .replace(/[\n\t]/g, ' ')
            .indexOf(' totalPages ') > -1
        ) {
          renderer.pdf.internal.events.subscribe(
            'htmlRenderingFinished',
            renderer.pdf.putTotalPages.bind(
              renderer.pdf,
              '###jsPDFVarTotalPages###'
            ),
            true
          );
        }
      }

      //register event to render footer on every new page
      renderer.pdf.internal.events.subscribe('addPage', renderFooter, false);
      //render footer on first page
      renderFooter();

      //prevent footer rendering
      SkipNode['FOOTER'] = 1;
    }
  };
  process = function(pdf, element, x, y, settings, callback) {
    if (!element) return false;
    if (typeof element !== 'string' && !element.parentNode)
      element = '' + element.innerHTML;
    if (typeof element === 'string') {
      element = (function(element) {
        var $frame, $hiddendiv, framename, visuallyhidden;
        framename =
          'jsPDFhtmlText' +
          Date.now().toString() +
          (Math.random() * 1000).toFixed(0);
        visuallyhidden =
          'position: absolute !important;' +
          'clip: rect(1px 1px 1px 1px); /* IE6, IE7 */' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'padding:0 !important;' +
          'border:0 !important;' +
          'height: 1px !important;' +
          'width: 1px !important; ' +
          'top:auto;' +
          'left:-100px;' +
          'overflow: hidden;';
        $hiddendiv = document.createElement('div');
        $hiddendiv.style.cssText = visuallyhidden;
        $hiddendiv.innerHTML =
          '<iframe style="height:1px;width:1px" name="' + framename + '" />';
        document.body.appendChild($hiddendiv);
        $frame = window.frames[framename];
        $frame.document.body.innerHTML = element;
        return $frame.document.body;
      })(element.replace(/<\/?script[^>]*?>/gi, ''));
    }
    var r = new Renderer(pdf, x, y, settings),
      out;

    // 1. load images
    // 2. prepare optional footer elements
    // 3. render content
    loadImgs.call(this, element, r, settings.elementHandlers, function(
      found_images
    ) {
      checkForFooter(element, r, settings.elementHandlers);
      DrillForContent(element, r, settings.elementHandlers);
      //send event dispose for final taks (e.g. footer totalpage replacement)
      r.pdf.internal.events.publish('htmlRenderingFinished');
      out = r.dispose();
      if (typeof callback === 'function') callback(out);
      else if (found_images)
        console.error(
          'jsPDF Warning: rendering issues? provide a callback to fromHTML!'
        );
    });
    return out || { x: r.x, y: r.y };
  };
  Renderer.prototype.init = function() {
    this.paragraph = {
      text: [],
      style: []
    };
    return this.pdf.internal.write('q');
  };
  Renderer.prototype.dispose = function() {
    this.pdf.internal.write('Q');
    return {
      x: this.x,
      y: this.y,
      ready: true
    };
  };

  //Checks if we have to execute some watcher functions
  //e.g. to end text floating around an image
  Renderer.prototype.executeWatchFunctions = function(el) {
    var ret = false;
    var narray = [];
    if (this.watchFunctions.length > 0) {
      for (var i = 0; i < this.watchFunctions.length; ++i) {
        if (this.watchFunctions[i](el) === true) {
          ret = true;
        } else {
          narray.push(this.watchFunctions[i]);
        }
      }
      this.watchFunctions = narray;
    }
    return ret;
  };

  Renderer.prototype.splitFragmentsIntoLines = function(fragments, styles) {
    var currentLineLength,
      defaultFontSize,
      ff,
      fontMetrics,
      fontMetricsCache,
      fragment,
      fragmentChopped,
      fragmentLength,
      fragmentSpecificMetrics,
      fs,
      k,
      line,
      lines,
      maxLineLength,
      style;
    defaultFontSize = 12;
    k = this.pdf.internal.scaleFactor;
    fontMetricsCache = {};
    ff = void 0;
    fs = void 0;
    fontMetrics = void 0;
    fragment = void 0;
    style = void 0;
    fragmentSpecificMetrics = void 0;
    fragmentLength = void 0;
    fragmentChopped = void 0;
    line = [];
    lines = [line];
    currentLineLength = 0;
    maxLineLength = this.settings.width;
    while (fragments.length) {
      fragment = fragments.shift();
      style = styles.shift();
      if (fragment) {
        ff = style['font-family'];
        fs = style['font-style'];
        fontMetrics = fontMetricsCache[ff + fs];
        if (!fontMetrics) {
          fontMetrics = this.pdf.internal.getFont(ff, fs).metadata.Unicode;
          fontMetricsCache[ff + fs] = fontMetrics;
        }
        fragmentSpecificMetrics = {
          widths: fontMetrics.widths,
          kerning: fontMetrics.kerning,
          fontSize: style['font-size'] * defaultFontSize,
          textIndent: currentLineLength
        };
        fragmentLength =
          this.pdf.getStringUnitWidth(fragment, fragmentSpecificMetrics) *
          fragmentSpecificMetrics.fontSize /
          k;
        if (currentLineLength + fragmentLength > maxLineLength) {
          fragmentChopped = this.pdf.splitTextToSize(
            fragment,
            maxLineLength,
            fragmentSpecificMetrics
          );
          line.push([fragmentChopped.shift(), style]);
          while (fragmentChopped.length) {
            line = [[fragmentChopped.shift(), style]];
            lines.push(line);
          }
          currentLineLength =
            this.pdf.getStringUnitWidth(line[0][0], fragmentSpecificMetrics) *
            fragmentSpecificMetrics.fontSize /
            k;
        } else {
          line.push([fragment, style]);
          currentLineLength += fragmentLength;
        }
      }
    }

    //if text alignment was set, set margin/indent of each line
    if (
      style['text-align'] !== undefined &&
      (style['text-align'] === 'center' ||
        style['text-align'] === 'right' ||
        style['text-align'] === 'justify')
    ) {
      for (var i = 0; i < lines.length; ++i) {
        var length =
          this.pdf.getStringUnitWidth(lines[i][0][0], fragmentSpecificMetrics) *
          fragmentSpecificMetrics.fontSize /
          k;
        //if there is more than on line we have to clone the style object as all lines hold a reference on this object
        if (i > 0) {
          lines[i][0][1] = clone(lines[i][0][1]);
        }
        var space = maxLineLength - length;

        if (style['text-align'] === 'right') {
          lines[i][0][1]['margin-left'] = space;
          //if alignment is not right, it has to be center so split the space to the left and the right
        } else if (style['text-align'] === 'center') {
          lines[i][0][1]['margin-left'] = space / 2;
          //if justify was set, calculate the word spacing and define in by using the css property
        } else if (style['text-align'] === 'justify') {
          var countSpaces = lines[i][0][0].split(' ').length - 1;
          lines[i][0][1]['word-spacing'] = space / countSpaces;
          //ignore the last line in justify mode
          if (i === lines.length - 1) {
            lines[i][0][1]['word-spacing'] = 0;
          }
        }
      }
    }

    return lines;
  };
  Renderer.prototype.RenderTextFragment = function(text, style) {
    var defaultFontSize, font, maxLineHeight;

    maxLineHeight = 0;
    defaultFontSize = 12;

    if (
      this.pdf.internal.pageSize.height - this.pdf.margins_doc.bottom <
      this.y + this.pdf.internal.getFontSize()
    ) {
      this.pdf.internal.write('ET', 'Q');
      this.pdf.addPage();
      this.y = this.pdf.margins_doc.top;
      this.pdf.internal.write(
        'q',
        'BT 0 g',
        this.pdf.internal.getCoordinateString(this.x),
        this.pdf.internal.getVerticalCoordinateString(this.y),
        'Td'
      );
      //move cursor by one line on new page
      maxLineHeight = Math.max(
        maxLineHeight,
        style['line-height'],
        style['font-size']
      );
      this.pdf.internal.write(
        0,
        (-1 * defaultFontSize * maxLineHeight).toFixed(2),
        'Td'
      );
    }

    font = this.pdf.internal.getFont(style['font-family'], style['font-style']);

    //set the word spacing for e.g. justify style
    if (style['word-spacing'] !== undefined && style['word-spacing'] > 0) {
      this.pdf.internal.write(style['word-spacing'].toFixed(2), 'Tw');
    }

    this.pdf.internal.write(
      '/' + font.id,
      (defaultFontSize * style['font-size']).toFixed(2),
      'Tf',
      '(' + this.pdf.internal.pdfEscape(text) + ') Tj'
    );

    //set the word spacing back to neutral => 0
    if (style['word-spacing'] !== undefined) {
      this.pdf.internal.write(0, 'Tw');
    }
  };
  Renderer.prototype.renderParagraph = function(cb) {
    var blockstyle,
      defaultFontSize,
      fontToUnitRatio,
      fragments,
      i,
      l,
      line,
      lines,
      maxLineHeight,
      out,
      paragraphspacing_after,
      paragraphspacing_before,
      priorblockstype,
      styles,
      fontSize;
    fragments = PurgeWhiteSpace(this.paragraph.text);
    styles = this.paragraph.style;
    blockstyle = this.paragraph.blockstyle;
    priorblockstype = this.paragraph.blockstyle || {};
    this.paragraph = {
      text: [],
      style: [],
      blockstyle: {},
      priorblockstyle: blockstyle
    };
    if (!fragments.join('').trim()) {
      return;
    }
    lines = this.splitFragmentsIntoLines(fragments, styles);
    line = void 0;
    maxLineHeight = void 0;
    defaultFontSize = 12;
    fontToUnitRatio = defaultFontSize / this.pdf.internal.scaleFactor;
    paragraphspacing_before =
      (Math.max(
        (blockstyle['margin-top'] || 0) -
          (priorblockstype['margin-bottom'] || 0),
        0
      ) +
        (blockstyle['padding-top'] || 0)) *
      fontToUnitRatio;
    paragraphspacing_after =
      ((blockstyle['margin-bottom'] || 0) +
        (blockstyle['padding-bottom'] || 0)) *
      fontToUnitRatio;
    out = this.pdf.internal.write;
    i = void 0;
    l = void 0;
    this.y += paragraphspacing_before;
    out(
      'q',
      'BT 0 g',
      this.pdf.internal.getCoordinateString(this.x),
      this.pdf.internal.getVerticalCoordinateString(this.y),
      'Td'
    );

    //stores the current indent of cursor position
    var currentIndent = 0;

    while (lines.length) {
      line = lines.shift();
      maxLineHeight = 0;
      i = 0;
      l = line.length;
      while (i !== l) {
        if (line[i][0].trim()) {
          maxLineHeight = Math.max(
            maxLineHeight,
            line[i][1]['line-height'],
            line[i][1]['font-size']
          );
          fontSize = line[i][1]['font-size'] * 7;
        }
        i++;
      }
      //if we have to move the cursor to adapt the indent
      var indentMove = 0;
      //if a margin was added (by e.g. a text-alignment), move the cursor
      if (
        line[0][1]['margin-left'] !== undefined &&
        line[0][1]['margin-left'] > 0
      ) {
        wantedIndent = this.pdf.internal.getCoordinateString(
          line[0][1]['margin-left']
        );
        indentMove = wantedIndent - currentIndent;
        currentIndent = wantedIndent;
      }
      //move the cursor
      out(indentMove, (-1 * defaultFontSize * maxLineHeight).toFixed(2), 'Td');
      i = 0;
      l = line.length;
      while (i !== l) {
        if (line[i][0]) {
          this.RenderTextFragment(line[i][0], line[i][1]);
        }
        i++;
      }
      this.y += maxLineHeight * fontToUnitRatio;

      //if some watcher function was executed sucessful, so e.g. margin and widths were changed,
      //reset line drawing and calculate position and lines again
      //e.g. to stop text floating around an image
      if (this.executeWatchFunctions(line[0][1]) && lines.length > 0) {
        var localFragments = [];
        var localStyles = [];
        //create fragement array of
        lines.forEach(function(localLine) {
          var i = 0;
          var l = localLine.length;
          while (i !== l) {
            if (localLine[i][0]) {
              localFragments.push(localLine[i][0] + ' ');
              localStyles.push(localLine[i][1]);
            }
            ++i;
          }
        });
        //split lines again due to possible coordinate changes
        lines = this.splitFragmentsIntoLines(
          PurgeWhiteSpace(localFragments),
          localStyles
        );
        //reposition the current cursor
        out('ET', 'Q');
        out(
          'q',
          'BT 0 g',
          this.pdf.internal.getCoordinateString(this.x),
          this.pdf.internal.getVerticalCoordinateString(this.y),
          'Td'
        );
      }
    }
    if (cb && typeof cb === 'function') {
      cb.call(this, this.x - 9, this.y - fontSize / 2);
    }
    out('ET', 'Q');
    return (this.y += paragraphspacing_after);
  };
  Renderer.prototype.setBlockBoundary = function(cb) {
    return this.renderParagraph(cb);
  };
  Renderer.prototype.setBlockStyle = function(css) {
    return (this.paragraph.blockstyle = css);
  };
  Renderer.prototype.addText = function(text, css) {
    this.paragraph.text.push(text);
    return this.paragraph.style.push(css);
  };
  FontNameDB = {
    helvetica: 'helvetica',
    'sans-serif': 'helvetica',
    'times new roman': 'times',
    serif: 'times',
    times: 'times',
    monospace: 'courier',
    courier: 'courier'
  };
  FontWeightMap = {
    100: 'normal',
    200: 'normal',
    300: 'normal',
    400: 'normal',
    500: 'bold',
    600: 'bold',
    700: 'bold',
    800: 'bold',
    900: 'bold',
    normal: 'normal',
    bold: 'bold',
    bolder: 'bold',
    lighter: 'normal'
  };
  FontStyleMap = {
    normal: 'normal',
    italic: 'italic',
    oblique: 'italic'
  };
  TextAlignMap = {
    left: 'left',
    right: 'right',
    center: 'center',
    justify: 'justify'
  };
  FloatMap = {
    none: 'none',
    right: 'right',
    left: 'left'
  };
  ClearMap = {
    none: 'none',
    both: 'both'
  };
  UnitedNumberMap = {
    normal: 1
  };
  /**
	 * Converts HTML-formatted text into formatted PDF text.
	 *
	 * Notes:
	 * 2012-07-18
	 * Plugin relies on having browser, DOM around. The HTML is pushed into dom and traversed.
	 * Plugin relies on jQuery for CSS extraction.
	 * Targeting HTML output from Markdown templating, which is a very simple
	 * markup - div, span, em, strong, p. No br-based paragraph separation supported explicitly (but still may work.)
	 * Images, tables are NOT supported.
	 *
	 * @public
	 * @function
	 * @param HTML {String or DOM Element} HTML-formatted text, or pointer to DOM element that is to be rendered into PDF.
	 * @param x {Number} starting X coordinate in jsPDF instance's declared units.
	 * @param y {Number} starting Y coordinate in jsPDF instance's declared units.
	 * @param settings {Object} Additional / optional variables controlling parsing, rendering.
	 * @returns {Object} jsPDF instance
	 */
  jsPDFAPI.fromHTML = function(HTML, x, y, settings, callback, margins) {
    'use strict';

    this.margins_doc = margins || {
      top: 0,
      bottom: 0
    };
    if (!settings) settings = {};
    if (!settings.elementHandlers) settings.elementHandlers = {};

    return process(
      this,
      HTML,
      isNaN(x) ? 4 : x,
      isNaN(y) ? 4 : y,
      settings,
      callback
    );
  };
})(jsPDF.API);
/** ====================================================================
 * jsPDF JavaScript plugin
 * Copyright (c) 2013 Youssef Beddad, youssef.beddad@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

/*global jsPDF */

(function(jsPDFAPI) {
  'use strict';
  var jsNamesObj, jsJsObj, text;
  jsPDFAPI.addJS = function(txt) {
    text = txt;
    this.internal.events.subscribe('postPutResources', function(txt) {
      jsNamesObj = this.internal.newObject();
      this.internal.write(
        '<< /Names [(EmbeddedJS) ' + (jsNamesObj + 1) + ' 0 R] >>',
        'endobj'
      );
      jsJsObj = this.internal.newObject();
      this.internal.write('<< /S /JavaScript /JS (', text, ') >>', 'endobj');
    });
    this.internal.events.subscribe('putCatalog', function() {
      if (jsNamesObj !== undefined && jsJsObj !== undefined) {
        this.internal.write('/Names <</JavaScript ' + jsNamesObj + ' 0 R>>');
      }
    });
    return this;
  };
})(jsPDF.API);
/**@preserve
 *  ====================================================================
 * jsPDF PNG PlugIn
 * Copyright (c) 2014 James Robb, https://github.com/jamesbrobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(jsPDFAPI) {
  'use strict';

  /*
	 * @see http://www.w3.org/TR/PNG-Chunks.html
	 *
	 Color    Allowed      Interpretation
	 Type     Bit Depths

	   0       1,2,4,8,16  Each pixel is a grayscale sample.

	   2       8,16        Each pixel is an R,G,B triple.

	   3       1,2,4,8     Each pixel is a palette index;
	                       a PLTE chunk must appear.

	   4       8,16        Each pixel is a grayscale sample,
	                       followed by an alpha sample.

	   6       8,16        Each pixel is an R,G,B triple,
	                       followed by an alpha sample.
	*/

  /*
	 * PNG filter method types
	 *
	 * @see http://www.w3.org/TR/PNG-Filters.html
	 * @see http://www.libpng.org/pub/png/book/chapter09.html
	 *
	 * This is what the value 'Predictor' in decode params relates to
	 *
	 * 15 is "optimal prediction", which means the prediction algorithm can change from line to line.
	 * In that case, you actually have to read the first byte off each line for the prediction algorthim (which should be 0-4, corresponding to PDF 10-14) and select the appropriate unprediction algorithm based on that byte.
	 *
	   0       None
	   1       Sub
	   2       Up
	   3       Average
	   4       Paeth
	 */

  var doesNotHavePngJS = function() {
      return typeof PNG !== 'function' || typeof FlateStream !== 'function';
    },
    canCompress = function(value) {
      return value !== jsPDFAPI.image_compression.NONE && hasCompressionJS();
    },
    hasCompressionJS = function() {
      var inst = typeof Deflater === 'function';
      if (!inst) throw new Error('requires deflate.js for compression');
      return inst;
    },
    compressBytes = function(bytes, lineLength, colorsPerPixel, compression) {
      var level = 5,
        filter_method = filterUp;

      switch (compression) {
        case jsPDFAPI.image_compression.FAST:
          level = 3;
          filter_method = filterSub;
          break;

        case jsPDFAPI.image_compression.MEDIUM:
          level = 6;
          filter_method = filterAverage;
          break;

        case jsPDFAPI.image_compression.SLOW:
          level = 9;
          filter_method = filterPaeth; //uses to sum to choose best filter for each line
          break;
      }

      bytes = applyPngFilterMethod(
        bytes,
        lineLength,
        colorsPerPixel,
        filter_method
      );

      var header = new Uint8Array(createZlibHeader(level));
      var checksum = adler32(bytes);

      var deflate = new Deflater(level);
      var a = deflate.append(bytes);
      var cBytes = deflate.flush();

      var len = header.length + a.length + cBytes.length;

      var cmpd = new Uint8Array(len + 4);
      cmpd.set(header);
      cmpd.set(a, header.length);
      cmpd.set(cBytes, header.length + a.length);

      cmpd[len++] = (checksum >>> 24) & 0xff;
      cmpd[len++] = (checksum >>> 16) & 0xff;
      cmpd[len++] = (checksum >>> 8) & 0xff;
      cmpd[len++] = checksum & 0xff;

      return jsPDFAPI.arrayBufferToBinaryString(cmpd);
    },
    createZlibHeader = function(bytes, level) {
      /*
		 * @see http://www.ietf.org/rfc/rfc1950.txt for zlib header
		 */
      var cm = 8;
      var cinfo = Math.LOG2E * Math.log(0x8000) - 8;
      var cmf = (cinfo << 4) | cm;

      var hdr = cmf << 8;
      var flevel = Math.min(3, ((level - 1) & 0xff) >> 1);

      hdr |= flevel << 6;
      hdr |= 0; //FDICT
      hdr += 31 - hdr % 31;

      return [cmf, hdr & 0xff & 0xff];
    },
    adler32 = function(array, param) {
      var adler = 1;
      var s1 = adler & 0xffff,
        s2 = (adler >>> 16) & 0xffff;
      var len = array.length;
      var tlen;
      var i = 0;

      while (len > 0) {
        tlen = len > param ? param : len;
        len -= tlen;
        do {
          s1 += array[i++];
          s2 += s1;
        } while (--tlen);

        s1 %= 65521;
        s2 %= 65521;
      }

      return ((s2 << 16) | s1) >>> 0;
    },
    applyPngFilterMethod = function(
      bytes,
      lineLength,
      colorsPerPixel,
      filter_method
    ) {
      var lines = bytes.length / lineLength,
        result = new Uint8Array(bytes.length + lines),
        filter_methods = getFilterMethods(),
        i = 0,
        line,
        prevLine,
        offset;

      for (; i < lines; i++) {
        offset = i * lineLength;
        line = bytes.subarray(offset, offset + lineLength);

        if (filter_method) {
          result.set(filter_method(line, colorsPerPixel, prevLine), offset + i);
        } else {
          var j = 0,
            len = filter_methods.length,
            results = [];

          for (; j < len; j++)
            results[j] = filter_methods[j](line, colorsPerPixel, prevLine);

          var ind = getIndexOfSmallestSum(results.concat());

          result.set(results[ind], offset + i);
        }

        prevLine = line;
      }

      return result;
    },
    filterNone = function(line, colorsPerPixel, prevLine) {
      /*var result = new Uint8Array(line.length + 1);
		result[0] = 0;
		result.set(line, 1);*/

      var result = Array.apply([], line);
      result.unshift(0);

      return result;
    },
    filterSub = function(line, colorsPerPixel, prevLine) {
      var result = [],
        i = 0,
        len = line.length,
        left;

      result[0] = 1;

      for (; i < len; i++) {
        left = line[i - colorsPerPixel] || 0;
        result[i + 1] = (line[i] - left + 0x0100) & 0xff;
      }

      return result;
    },
    filterUp = function(line, colorsPerPixel, prevLine) {
      var result = [],
        i = 0,
        len = line.length,
        up;

      result[0] = 2;

      for (; i < len; i++) {
        up = (prevLine && prevLine[i]) || 0;
        result[i + 1] = (line[i] - up + 0x0100) & 0xff;
      }

      return result;
    },
    filterAverage = function(line, colorsPerPixel, prevLine) {
      var result = [],
        i = 0,
        len = line.length,
        left,
        up;

      result[0] = 3;

      for (; i < len; i++) {
        left = line[i - colorsPerPixel] || 0;
        up = (prevLine && prevLine[i]) || 0;
        result[i + 1] = (line[i] + 0x0100 - ((left + up) >>> 1)) & 0xff;
      }

      return result;
    },
    filterPaeth = function(line, colorsPerPixel, prevLine) {
      var result = [],
        i = 0,
        len = line.length,
        left,
        up,
        upLeft,
        paeth;

      result[0] = 4;

      for (; i < len; i++) {
        left = line[i - colorsPerPixel] || 0;
        up = (prevLine && prevLine[i]) || 0;
        upLeft = (prevLine && prevLine[i - colorsPerPixel]) || 0;
        paeth = paethPredictor(left, up, upLeft);
        result[i + 1] = (line[i] - paeth + 0x0100) & 0xff;
      }

      return result;
    },
    paethPredictor = function(left, up, upLeft) {
      var p = left + up - upLeft,
        pLeft = Math.abs(p - left),
        pUp = Math.abs(p - up),
        pUpLeft = Math.abs(p - upLeft);

      return pLeft <= pUp && pLeft <= pUpLeft
        ? left
        : pUp <= pUpLeft ? up : upLeft;
    },
    getFilterMethods = function() {
      return [filterNone, filterSub, filterUp, filterAverage, filterPaeth];
    },
    getIndexOfSmallestSum = function(arrays) {
      var i = 0,
        len = arrays.length,
        sum,
        min,
        ind;

      while (i < len) {
        sum = absSum(arrays[i].slice(1));

        if (sum < min || !min) {
          min = sum;
          ind = i;
        }

        i++;
      }

      return ind;
    },
    absSum = function(array) {
      var i = 0,
        len = array.length,
        sum = 0;

      while (i < len) sum += Math.abs(array[i++]);

      return sum;
    },
    logImg = function(img) {
      console.log('width: ' + img.width);
      console.log('height: ' + img.height);
      console.log('bits: ' + img.bits);
      console.log('colorType: ' + img.colorType);
      console.log('transparency:');
      console.log(img.transparency);
      console.log('text:');
      console.log(img.text);
      console.log('compressionMethod: ' + img.compressionMethod);
      console.log('filterMethod: ' + img.filterMethod);
      console.log('interlaceMethod: ' + img.interlaceMethod);
      console.log('imgData:');
      console.log(img.imgData);
      console.log('palette:');
      console.log(img.palette);
      console.log('colors: ' + img.colors);
      console.log('colorSpace: ' + img.colorSpace);
      console.log('pixelBitlength: ' + img.pixelBitlength);
      console.log('hasAlphaChannel: ' + img.hasAlphaChannel);
    };

  jsPDFAPI.processPNG = function(
    imageData,
    imageIndex,
    alias,
    compression,
    dataAsBinaryString
  ) {
    'use strict';

    var colorSpace = this.color_spaces.DEVICE_RGB,
      decode = this.decode.FLATE_DECODE,
      bpc = 8,
      img,
      dp,
      trns,
      colors,
      pal,
      smask;

    /*	if(this.isString(imageData)) {

		}*/

    if (this.isArrayBuffer(imageData)) imageData = new Uint8Array(imageData);

    if (this.isArrayBufferView(imageData)) {
      if (doesNotHavePngJS())
        throw new Error('PNG support requires png.js and zlib.js');

      img = new PNG(imageData);
      imageData = img.imgData;
      bpc = img.bits;
      colorSpace = img.colorSpace;
      colors = img.colors;

      //logImg(img);

      /*
			 * colorType 6 - Each pixel is an R,G,B triple, followed by an alpha sample.
			 *
			 * colorType 4 - Each pixel is a grayscale sample, followed by an alpha sample.
			 *
			 * Extract alpha to create two separate images, using the alpha as a sMask
			 */
      if ([4, 6].indexOf(img.colorType) !== -1) {
        /*
				 * processes 8 bit RGBA and grayscale + alpha images
				 */
        if (img.bits === 8) {
          var pixelsArrayType = window['Uint' + img.pixelBitlength + 'Array'],
            pixels = new pixelsArrayType(img.decodePixels().buffer),
            len = pixels.length,
            imgData = new Uint8Array(len * img.colors),
            alphaData = new Uint8Array(len),
            pDiff = img.pixelBitlength - img.bits,
            i = 0,
            n = 0,
            pixel,
            pbl;

          for (; i < len; i++) {
            pixel = pixels[i];
            pbl = 0;

            while (pbl < pDiff) {
              imgData[n++] = (pixel >>> pbl) & 0xff;
              pbl = pbl + img.bits;
            }

            alphaData[i] = (pixel >>> pbl) & 0xff;
          }
        }

        /*
				 * processes 16 bit RGBA and grayscale + alpha images
				 */
        if (img.bits === 16) {
          var pixels = new Uint32Array(img.decodePixels().buffer),
            len = pixels.length,
            imgData = new Uint8Array(
              len * (32 / img.pixelBitlength) * img.colors
            ),
            alphaData = new Uint8Array(len * (32 / img.pixelBitlength)),
            hasColors = img.colors > 1,
            i = 0,
            n = 0,
            a = 0,
            pixel;

          while (i < len) {
            pixel = pixels[i++];

            imgData[n++] = (pixel >>> 0) & 0xff;

            if (hasColors) {
              imgData[n++] = (pixel >>> 16) & 0xff;

              pixel = pixels[i++];
              imgData[n++] = (pixel >>> 0) & 0xff;
            }

            alphaData[a++] = (pixel >>> 16) & 0xff;
          }

          bpc = 8;
        }

        if (canCompress(compression)) {
          imageData = compressBytes(
            imgData,
            img.width * img.colors,
            img.colors,
            compression
          );
          smask = compressBytes(alphaData, img.width, 1, compression);
        } else {
          imageData = imgData;
          smask = alphaData;
          decode = null;
        }
      }

      /*
			 * Indexed png. Each pixel is a palette index.
			 */
      if (img.colorType === 3) {
        colorSpace = this.color_spaces.INDEXED;
        pal = img.palette;

        if (img.transparency.indexed) {
          var trans = img.transparency.indexed;

          var total = 0,
            i = 0,
            len = trans.length;

          for (; i < len; ++i) total += trans[i];

          total = total / 255;

          /*
					 * a single color is specified as 100% transparent (0),
					 * so we set trns to use a /Mask with that index
					 */
          if (total === len - 1 && trans.indexOf(0) !== -1) {
            trns = [trans.indexOf(0)];

            /*
					 * there's more than one colour within the palette that specifies
					 * a transparency value less than 255, so we unroll the pixels to create an image sMask
					 */
          } else if (total !== len) {
            var pixels = img.decodePixels(),
              alphaData = new Uint8Array(pixels.length),
              i = 0,
              len = pixels.length;

            for (; i < len; i++) alphaData[i] = trans[pixels[i]];

            smask = compressBytes(alphaData, img.width, 1);
          }
        }
      }

      if (decode === this.decode.FLATE_DECODE)
        dp =
          '/Predictor 15 /Colors ' +
          colors +
          ' /BitsPerComponent ' +
          bpc +
          ' /Columns ' +
          img.width;
      else
        //remove 'Predictor' as it applies to the type of png filter applied to its IDAT - we only apply with compression
        dp =
          '/Colors ' +
          colors +
          ' /BitsPerComponent ' +
          bpc +
          ' /Columns ' +
          img.width;

      if (this.isArrayBuffer(imageData) || this.isArrayBufferView(imageData))
        imageData = this.arrayBufferToBinaryString(imageData);

      if ((smask && this.isArrayBuffer(smask)) || this.isArrayBufferView(smask))
        smask = this.arrayBufferToBinaryString(smask);

      return this.createImageInfo(
        imageData,
        img.width,
        img.height,
        colorSpace,
        bpc,
        decode,
        imageIndex,
        alias,
        dp,
        trns,
        pal,
        smask
      );
    }

    throw new Error('Unsupported PNG image data, try using JPEG instead.');
  };
})(jsPDF.API);
/** @preserve
jsPDF Silly SVG plugin
Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
*/
/**
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */
(function(jsPDFAPI) {
  'use strict';

  /**
Parses SVG XML and converts only some of the SVG elements into
PDF elements.

Supports:
 paths

@public
@function
@param
@returns {Type}
*/
  jsPDFAPI.addSVG = function(svgtext, x, y, w, h) {
    // 'this' is _jsPDF object returned when jsPDF is inited (new jsPDF())

    var undef;

    if (x === undef || y === undef) {
      throw new Error("addSVG needs values for 'x' and 'y'");
    }

    function InjectCSS(cssbody, document) {
      var styletag = document.createElement('style');
      styletag.type = 'text/css';
      if (styletag.styleSheet) {
        // ie
        styletag.styleSheet.cssText = cssbody;
      } else {
        // others
        styletag.appendChild(document.createTextNode(cssbody));
      }
      document.getElementsByTagName('head')[0].appendChild(styletag);
    }

    function createWorkerNode(document) {
      var frameID = 'childframe', // Date.now().toString() + '_' + (Math.random() * 100).toString()
        frame = document.createElement('iframe');

      InjectCSS(
        '.jsPDF_sillysvg_iframe {display:none;position:absolute;}',
        document
      );

      frame.name = frameID;
      frame.setAttribute('width', 0);
      frame.setAttribute('height', 0);
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('seamless', 'seamless');
      frame.setAttribute('class', 'jsPDF_sillysvg_iframe');

      document.body.appendChild(frame);

      return frame;
    }

    function attachSVGToWorkerNode(svgtext, frame) {
      var framedoc = (frame.contentWindow || frame.contentDocument).document;
      framedoc.write(svgtext);
      framedoc.close();
      return framedoc.getElementsByTagName('svg')[0];
    }

    function convertPathToPDFLinesArgs(path) {
      'use strict';
      // we will use 'lines' method call. it needs:
      // - starting coordinate pair
      // - array of arrays of vector shifts (2-len for line, 6 len for bezier)
      // - scale array [horizontal, vertical] ratios
      // - style (stroke, fill, both)

      var x = parseFloat(path[1]),
        y = parseFloat(path[2]),
        vectors = [],
        position = 3,
        len = path.length;

      while (position < len) {
        if (path[position] === 'c') {
          vectors.push([
            parseFloat(path[position + 1]),
            parseFloat(path[position + 2]),
            parseFloat(path[position + 3]),
            parseFloat(path[position + 4]),
            parseFloat(path[position + 5]),
            parseFloat(path[position + 6])
          ]);
          position += 7;
        } else if (path[position] === 'l') {
          vectors.push([
            parseFloat(path[position + 1]),
            parseFloat(path[position + 2])
          ]);
          position += 3;
        } else {
          position += 1;
        }
      }
      return [x, y, vectors];
    }

    var workernode = createWorkerNode(document),
      svgnode = attachSVGToWorkerNode(svgtext, workernode),
      scale = [1, 1],
      svgw = parseFloat(svgnode.getAttribute('width')),
      svgh = parseFloat(svgnode.getAttribute('height'));

    if (svgw && svgh) {
      // setting both w and h makes image stretch to size.
      // this may distort the image, but fits your demanded size
      if (w && h) {
        scale = [w / svgw, h / svgh];
      } else if (w) {
        // if only one is set, that value is set as max and SVG
        // is scaled proportionately.
        scale = [w / svgw, w / svgw];
      } else if (h) {
        scale = [h / svgh, h / svgh];
      }
    }

    var i,
      l,
      tmp,
      linesargs,
      items = svgnode.childNodes;
    for (i = 0, l = items.length; i < l; i++) {
      tmp = items[i];
      if (tmp.tagName && tmp.tagName.toUpperCase() === 'PATH') {
        linesargs = convertPathToPDFLinesArgs(tmp.getAttribute('d').split(' '));
        // path start x coordinate
        linesargs[0] = linesargs[0] * scale[0] + x; // where x is upper left X of image
        // path start y coordinate
        linesargs[1] = linesargs[1] * scale[1] + y; // where y is upper left Y of image
        // the rest of lines are vectors. these will adjust with scale value auto.
        this.lines.call(
          this,
          linesargs[2], // lines
          linesargs[0], // starting x
          linesargs[1], // starting y
          scale
        );
      }
    }

    // clean up
    // workernode.parentNode.removeChild(workernode)

    return this;
  };
})(jsPDF.API);
/** @preserve
 * jsPDF split_text_to_size plugin - MIT license.
 * Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
 *               2014 Diego Casorran, https://github.com/diegocr
 */
/**
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(API) {
  'use strict';

  /**
Returns an array of length matching length of the 'word' string, with each
cell ocupied by the width of the char in that position.

@function
@param word {String}
@param widths {Object}
@param kerning {Object}
@returns {Array}
*/
  var getCharWidthsArray = (API.getCharWidthsArray = function(text, options) {
    if (!options) {
      options = {};
    }

    var widths = options.widths
        ? options.widths
        : this.internal.getFont().metadata.Unicode.widths,
      widthsFractionOf = widths.fof ? widths.fof : 1,
      kerning = options.kerning
        ? options.kerning
        : this.internal.getFont().metadata.Unicode.kerning,
      kerningFractionOf = kerning.fof ? kerning.fof : 1;

    // console.log("widths, kergnings", widths, kerning)

    var i,
      l,
      char_code,
      prior_char_code = 0, // for kerning
      default_char_width = widths[0] || widthsFractionOf,
      output = [];

    for (i = 0, l = text.length; i < l; i++) {
      char_code = text.charCodeAt(i);
      output.push(
        (widths[char_code] || default_char_width) / widthsFractionOf +
          ((kerning[char_code] && kerning[char_code][prior_char_code]) || 0) /
            kerningFractionOf
      );
      prior_char_code = char_code;
    }

    return output;
  });
  var getArraySum = function(array) {
    var i = array.length,
      output = 0;
    while (i) {
      i--;
      output += array[i];
    }
    return output;
  };
  /**
Returns a widths of string in a given font, if the font size is set as 1 point.

In other words, this is "proportional" value. For 1 unit of font size, the length
of the string will be that much.

Multiply by font size to get actual width in *points*
Then divide by 72 to get inches or divide by (72/25.6) to get 'mm' etc.

@public
@function
@param
@returns {Type}
*/
  var getStringUnitWidth = (API.getStringUnitWidth = function(text, options) {
    return getArraySum(getCharWidthsArray.call(this, text, options));
  });

  /**
returns array of lines
*/
  var splitLongWord = function(word, widths_array, firstLineMaxLen, maxLen) {
    var answer = [];

    // 1st, chop off the piece that can fit on the hanging line.
    var i = 0,
      l = word.length,
      workingLen = 0;
    while (i !== l && workingLen + widths_array[i] < firstLineMaxLen) {
      workingLen += widths_array[i];
      i++;
    }
    // this is first line.
    answer.push(word.slice(0, i));

    // 2nd. Split the rest into maxLen pieces.
    var startOfLine = i;
    workingLen = 0;
    while (i !== l) {
      if (workingLen + widths_array[i] > maxLen) {
        answer.push(word.slice(startOfLine, i));
        workingLen = 0;
        startOfLine = i;
      }
      workingLen += widths_array[i];
      i++;
    }
    if (startOfLine !== i) {
      answer.push(word.slice(startOfLine, i));
    }

    return answer;
  };

  // Note, all sizing inputs for this function must be in "font measurement units"
  // By default, for PDF, it's "point".
  var splitParagraphIntoLines = function(text, maxlen, options) {
    // at this time works only on Western scripts, ones with space char
    // separating the words. Feel free to expand.

    if (!options) {
      options = {};
    }

    var line = [],
      lines = [line],
      line_length = options.textIndent || 0,
      separator_length = 0,
      current_word_length = 0,
      word,
      widths_array,
      words = text.split(' '),
      spaceCharWidth = getCharWidthsArray(' ', options)[0],
      i,
      l,
      tmp,
      lineIndent;

    if (options.lineIndent === -1) {
      lineIndent = words[0].length + 2;
    } else {
      lineIndent = options.lineIndent || 0;
    }
    if (lineIndent) {
      var pad = Array(lineIndent).join(' '),
        wrds = [];
      words.map(function(wrd) {
        wrd = wrd.split(/\s*\n/);
        if (wrd.length > 1) {
          wrds = wrds.concat(
            wrd.map(function(wrd, idx) {
              return (idx && wrd.length ? '\n' : '') + wrd;
            })
          );
        } else {
          wrds.push(wrd[0]);
        }
      });
      words = wrds;
      lineIndent = getStringUnitWidth(pad, options);
    }

    for (i = 0, l = words.length; i < l; i++) {
      var force = 0;

      word = words[i];
      if (lineIndent && word[0] == '\n') {
        word = word.substr(1);
        force = 1;
      }
      widths_array = getCharWidthsArray(word, options);
      current_word_length = getArraySum(widths_array);

      if (
        line_length + separator_length + current_word_length > maxlen ||
        force
      ) {
        if (current_word_length > maxlen) {
          // this happens when you have space-less long URLs for example.
          // we just chop these to size. We do NOT insert hiphens
          tmp = splitLongWord(
            word,
            widths_array,
            maxlen - (line_length + separator_length),
            maxlen
          );
          // first line we add to existing line object
          line.push(tmp.shift()); // it's ok to have extra space indicator there
          // last line we make into new line object
          line = [tmp.pop()];
          // lines in the middle we apped to lines object as whole lines
          while (tmp.length) {
            lines.push([tmp.shift()]); // single fragment occupies whole line
          }
          current_word_length = getArraySum(
            widths_array.slice(word.length - line[0].length)
          );
        } else {
          // just put it on a new line
          line = [word];
        }

        // now we attach new line to lines
        lines.push(line);
        line_length = current_word_length + lineIndent;
        separator_length = spaceCharWidth;
      } else {
        line.push(word);

        line_length += separator_length + current_word_length;
        separator_length = spaceCharWidth;
      }
    }

    if (lineIndent) {
      var postProcess = function(ln, idx) {
        return (idx ? pad : '') + ln.join(' ');
      };
    } else {
      var postProcess = function(ln) {
        return ln.join(' ');
      };
    }

    return lines.map(postProcess);
  };

  /**
Splits a given string into an array of strings. Uses 'size' value
(in measurement units declared as default for the jsPDF instance)
and the font's "widths" and "Kerning" tables, where availabe, to
determine display length of a given string for a given font.

We use character's 100% of unit size (height) as width when Width
table or other default width is not available.

@public
@function
@param text {String} Unencoded, regular JavaScript (Unicode, UTF-16 / UCS-2) string.
@param size {Number} Nominal number, measured in units default to this instance of jsPDF.
@param options {Object} Optional flags needed for chopper to do the right thing.
@returns {Array} with strings chopped to size.
*/
  API.splitTextToSize = function(text, maxlen, options) {
    'use strict';

    if (!options) {
      options = {};
    }

    var fsize = options.fontSize || this.internal.getFontSize(),
      newOptions = function(options) {
        var widths = { 0: 1 },
          kerning = {};

        if (!options.widths || !options.kerning) {
          var f = this.internal.getFont(options.fontName, options.fontStyle),
            encoding = 'Unicode';
          // NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE
          // Actual JavaScript-native String's 16bit char codes used.
          // no multi-byte logic here

          if (f.metadata[encoding]) {
            return {
              widths: f.metadata[encoding].widths || widths,
              kerning: f.metadata[encoding].kerning || kerning
            };
          }
        } else {
          return {
            widths: options.widths,
            kerning: options.kerning
          };
        }

        // then use default values
        return {
          widths: widths,
          kerning: kerning
        };
      }.call(this, options);

    // first we split on end-of-line chars
    var paragraphs;
    if (Array.isArray(text)) {
      paragraphs = text;
    } else {
      paragraphs = text.split(/\r?\n/);
    }

    // now we convert size (max length of line) into "font size units"
    // at present time, the "font size unit" is always 'point'
    // 'proportional' means, "in proportion to font size"
    var fontUnit_maxLen = 1.0 * this.internal.scaleFactor * maxlen / fsize;
    // at this time, fsize is always in "points" regardless of the default measurement unit of the doc.
    // this may change in the future?
    // until then, proportional_maxlen is likely to be in 'points'

    // If first line is to be indented (shorter or longer) than maxLen
    // we indicate that by using CSS-style "text-indent" option.
    // here it's in font units too (which is likely 'points')
    // it can be negative (which makes the first line longer than maxLen)
    newOptions.textIndent = options.textIndent
      ? options.textIndent * 1.0 * this.internal.scaleFactor / fsize
      : 0;
    newOptions.lineIndent = options.lineIndent;

    var i,
      l,
      output = [];
    for (i = 0, l = paragraphs.length; i < l; i++) {
      output = output.concat(
        splitParagraphIntoLines(paragraphs[i], fontUnit_maxLen, newOptions)
      );
    }

    return output;
  };
})(jsPDF.API);
/** @preserve
jsPDF standard_fonts_metrics plugin
Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
MIT license.
*/
/**
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(API) {
  'use strict';

  /*
# reference (Python) versions of 'compress' and 'uncompress'
# only 'uncompress' function is featured lower as JavaScript
# if you want to unit test "roundtrip", just transcribe the reference
# 'compress' function from Python into JavaScript

def compress(data):

	keys =   '0123456789abcdef'
	values = 'klmnopqrstuvwxyz'
	mapping = dict(zip(keys, values))
	vals = []
	for key in data.keys():
		value = data[key]
		try:
			keystring = hex(key)[2:]
			keystring = keystring[:-1] + mapping[keystring[-1:]]
		except:
			keystring = key.join(["'","'"])
			#print('Keystring is %s' % keystring)

		try:
			if value < 0:
				valuestring = hex(value)[3:]
				numberprefix = '-'
			else:
				valuestring = hex(value)[2:]
				numberprefix = ''
			valuestring = numberprefix + valuestring[:-1] + mapping[valuestring[-1:]]
		except:
			if type(value) == dict:
				valuestring = compress(value)
			else:
				raise Exception("Don't know what to do with value type %s" % type(value))

		vals.append(keystring+valuestring)

	return '{' + ''.join(vals) + '}'

def uncompress(data):

	decoded = '0123456789abcdef'
	encoded = 'klmnopqrstuvwxyz'
	mapping = dict(zip(encoded, decoded))

	sign = +1
	stringmode = False
	stringparts = []

	output = {}

	activeobject = output
	parentchain = []

	keyparts = ''
	valueparts = ''

	key = None

	ending = set(encoded)

	i = 1
	l = len(data) - 1 # stripping starting, ending {}
	while i != l: # stripping {}
		# -, {, }, ' are special.

		ch = data[i]
		i += 1

		if ch == "'":
			if stringmode:
				# end of string mode
				stringmode = False
				key = ''.join(stringparts)
			else:
				# start of string mode
				stringmode = True
				stringparts = []
		elif stringmode == True:
			#print("Adding %s to stringpart" % ch)
			stringparts.append(ch)

		elif ch == '{':
			# start of object
			parentchain.append( [activeobject, key] )
			activeobject = {}
			key = None
			#DEBUG = True
		elif ch == '}':
			# end of object
			parent, key = parentchain.pop()
			parent[key] = activeobject
			key = None
			activeobject = parent
			#DEBUG = False

		elif ch == '-':
			sign = -1
		else:
			# must be number
			if key == None:
				#debug("In Key. It is '%s', ch is '%s'" % (keyparts, ch))
				if ch in ending:
					#debug("End of key")
					keyparts += mapping[ch]
					key = int(keyparts, 16) * sign
					sign = +1
					keyparts = ''
				else:
					keyparts += ch
			else:
				#debug("In value. It is '%s', ch is '%s'" % (valueparts, ch))
				if ch in ending:
					#debug("End of value")
					valueparts += mapping[ch]
					activeobject[key] = int(valueparts, 16) * sign
					sign = +1
					key = None
					valueparts = ''
				else:
					valueparts += ch

			#debug(activeobject)

	return output

*/

  /**
Uncompresses data compressed into custom, base16-like format.
@public
@function
@param
@returns {Type}
*/
  var uncompress = function(data) {
    var decoded = '0123456789abcdef',
      encoded = 'klmnopqrstuvwxyz',
      mapping = {};

    for (var i = 0; i < encoded.length; i++) {
      mapping[encoded[i]] = decoded[i];
    }

    var undef,
      output = {},
      sign = 1,
      stringparts, // undef. will be [] in string mode
      activeobject = output,
      parentchain = [],
      parent_key_pair,
      keyparts = '',
      valueparts = '',
      key, // undef. will be Truthy when Key is resolved.
      datalen = data.length - 1, // stripping ending }
      ch;

    i = 1; // stripping starting {

    while (i != datalen) {
      // - { } ' are special.

      ch = data[i];
      i += 1;

      if (ch == "'") {
        if (stringparts) {
          // end of string mode
          key = stringparts.join('');
          stringparts = undef;
        } else {
          // start of string mode
          stringparts = [];
        }
      } else if (stringparts) {
        stringparts.push(ch);
      } else if (ch == '{') {
        // start of object
        parentchain.push([activeobject, key]);
        activeobject = {};
        key = undef;
      } else if (ch == '}') {
        // end of object
        parent_key_pair = parentchain.pop();
        parent_key_pair[0][parent_key_pair[1]] = activeobject;
        key = undef;
        activeobject = parent_key_pair[0];
      } else if (ch == '-') {
        sign = -1;
      } else {
        // must be number
        if (key === undef) {
          if (mapping.hasOwnProperty(ch)) {
            keyparts += mapping[ch];
            key = parseInt(keyparts, 16) * sign;
            sign = +1;
            keyparts = '';
          } else {
            keyparts += ch;
          }
        } else {
          if (mapping.hasOwnProperty(ch)) {
            valueparts += mapping[ch];
            activeobject[key] = parseInt(valueparts, 16) * sign;
            sign = +1;
            key = undef;
            valueparts = '';
          } else {
            valueparts += ch;
          }
        }
      }
    } // end while

    return output;
  };

  // encoding = 'Unicode'
  // NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE. NO clever BOM behavior
  // Actual 16bit char codes used.
  // no multi-byte logic here

  // Unicode characters to WinAnsiEncoding:
  // {402: 131, 8211: 150, 8212: 151, 8216: 145, 8217: 146, 8218: 130, 8220: 147, 8221: 148, 8222: 132, 8224: 134, 8225: 135, 8226: 149, 8230: 133, 8364: 128, 8240:137, 8249: 139, 8250: 155, 710: 136, 8482: 153, 338: 140, 339: 156, 732: 152, 352: 138, 353: 154, 376: 159, 381: 142, 382: 158}
  // as you can see, all Unicode chars are outside of 0-255 range. No char code conflicts.
  // this means that you can give Win cp1252 encoded strings to jsPDF for rendering directly
  // as well as give strings with some (supported by these fonts) Unicode characters and
  // these will be mapped to win cp1252
  // for example, you can send char code (cp1252) 0x80 or (unicode) 0x20AC, getting "Euro" glyph displayed in both cases.

  var encodingBlock = {
      codePages: ['WinAnsiEncoding'],
      WinAnsiEncoding: uncompress(
        '{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}'
      )
    },
    encodings = {
      Unicode: {
        Courier: encodingBlock,
        'Courier-Bold': encodingBlock,
        'Courier-BoldOblique': encodingBlock,
        'Courier-Oblique': encodingBlock,
        Helvetica: encodingBlock,
        'Helvetica-Bold': encodingBlock,
        'Helvetica-BoldOblique': encodingBlock,
        'Helvetica-Oblique': encodingBlock,
        'Times-Roman': encodingBlock,
        'Times-Bold': encodingBlock,
        'Times-BoldItalic': encodingBlock,
        'Times-Italic': encodingBlock
        //	, 'Symbol'
        //	, 'ZapfDingbats'
      }
    },
    /**
Resources:
Font metrics data is reprocessed derivative of contents of
"Font Metrics for PDF Core 14 Fonts" package, which exhibits the following copyright and license:

Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated. All Rights Reserved.

This file and the 14 PostScript(R) AFM files it accompanies may be used,
copied, and distributed for any purpose and without charge, with or without
modification, provided that all copyright notices are retained; that the AFM
files are not distributed without this file; that all modifications to this
file or any of the AFM files are prominently noted in the modified file(s);
and that this paragraph is not modified. Adobe Systems has no responsibility
or obligation to support the use of the AFM files.

*/
    fontMetrics = {
      Unicode: {
        // all sizing numbers are n/fontMetricsFractionOf = one font size unit
        // this means that if fontMetricsFractionOf = 1000, and letter A's width is 476, it's
        // width is 476/1000 or 47.6% of its height (regardless of font size)
        // At this time this value applies to "widths" and "kerning" numbers.

        // char code 0 represents "default" (average) width - use it for chars missing in this table.
        // key 'fof' represents the "fontMetricsFractionOf" value

        'Courier-Oblique': uncompress(
          "{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"
        ),
        'Times-BoldItalic': uncompress(
          "{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}"
        ),
        'Helvetica-Bold': uncompress(
          "{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"
        ),
        Courier: uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Courier-BoldOblique': uncompress(
          "{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"
        ),
        'Times-Bold': uncompress(
          "{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}"
        ),
        //, 'Symbol': uncompress("{'widths'{k3uaw4r19m3m2k1t2l2l202m2y2n3m2p5n202q6o3k3m2s2l2t2l2v3r2w1t3m3m2y1t2z1wbk2sbl3r'fof'6o3n3m3o3m3p3m3q3m3r3m3s3m3t3m3u1w3v1w3w3r3x3r3y3r3z2wbp3t3l3m5v2l5x2l5z3m2q4yfr3r7v3k7w1o7x3k}'kerning'{'fof'-6o}}")
        Helvetica: uncompress(
          "{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"
        ),
        'Helvetica-BoldOblique': uncompress(
          "{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"
        ),
        //, 'ZapfDingbats': uncompress("{'widths'{k4u2k1w'fof'6o}'kerning'{'fof'-6o}}")
        'Courier-Bold': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Times-Italic': uncompress(
          "{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}"
        ),
        'Times-Roman': uncompress(
          "{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}"
        ),
        'Helvetica-Oblique': uncompress(
          "{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"
        )
      }
    };

  /*
This event handler is fired when a new jsPDF object is initialized
This event handler appends metrics data to standard fonts within
that jsPDF instance. The metrics are mapped over Unicode character
codes, NOT CIDs or other codes matching the StandardEncoding table of the
standard PDF fonts.
Future:
Also included is the encoding maping table, converting Unicode (UCS-2, UTF-16)
char codes to StandardEncoding character codes. The encoding table is to be used
somewhere around "pdfEscape" call.
*/

  API.events.push([
    'addFonts',
    function(fontManagementObjects) {
      // fontManagementObjects is {
      //	'fonts':font_ID-keyed hash of font objects
      //	, 'dictionary': lookup object, linking ["FontFamily"]['Style'] to font ID
      //}
      var font,
        fontID,
        metrics,
        unicode_section,
        encoding = 'Unicode',
        encodingBlock;

      for (fontID in fontManagementObjects.fonts) {
        if (fontManagementObjects.fonts.hasOwnProperty(fontID)) {
          font = fontManagementObjects.fonts[fontID];

          // // we only ship 'Unicode' mappings and metrics. No need for loop.
          // // still, leaving this for the future.

          // for (encoding in fontMetrics){
          // 	if (fontMetrics.hasOwnProperty(encoding)) {

          metrics = fontMetrics[encoding][font.PostScriptName];
          if (metrics) {
            if (font.metadata[encoding]) {
              unicode_section = font.metadata[encoding];
            } else {
              unicode_section = font.metadata[encoding] = {};
            }

            unicode_section.widths = metrics.widths;
            unicode_section.kerning = metrics.kerning;
          }
          // 	}
          // }
          // for (encoding in encodings){
          // 	if (encodings.hasOwnProperty(encoding)) {
          encodingBlock = encodings[encoding][font.PostScriptName];
          if (encodingBlock) {
            if (font.metadata[encoding]) {
              unicode_section = font.metadata[encoding];
            } else {
              unicode_section = font.metadata[encoding] = {};
            }

            unicode_section.encoding = encodingBlock;
            if (encodingBlock.codePages && encodingBlock.codePages.length) {
              font.encoding = encodingBlock.codePages[0];
            }
          }
          // 	}
          // }
        }
      }
    }
  ]); // end of adding event handler
})(jsPDF.API);
/** ====================================================================
 * jsPDF total_pages plugin
 * Copyright (c) 2013 Eduardo Menezes de Morais, eduardo.morais@usp.br
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function(jsPDFAPI) {
  'use strict';

  jsPDFAPI.putTotalPages = function(pageExpression) {
    'use strict';
    var replaceExpression = new RegExp(pageExpression, 'g');
    for (var n = 1; n <= this.internal.getNumberOfPages(); n++) {
      for (var i = 0; i < this.internal.pages[n].length; i++)
        this.internal.pages[n][i] = this.internal.pages[n][i].replace(
          replaceExpression,
          this.internal.getNumberOfPages()
        );
    }
    return this;
  };
})(jsPDF.API);
/* Blob.js
 * A Blob implementation.
 * 2014-07-24
 *
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/dsamarin
 * License: X11/MIT
 *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

(function(view) {
  'use strict';

  view.URL = view.URL || view.webkitURL;

  if (view.Blob && view.URL) {
    try {
      new Blob();
      return;
    } catch (e) {}
  }

  // Internally we use a BlobBuilder implementation to base Blob off of
  // in order to support older browsers that only have BlobBuilder
  var BlobBuilder =
    view.BlobBuilder ||
    view.WebKitBlobBuilder ||
    view.MozBlobBuilder ||
    (function(view) {
      var get_class = function(object) {
          return Object.prototype.toString
            .call(object)
            .match(/^\[object\s(.*)\]$/)[1];
        },
        FakeBlobBuilder = function BlobBuilder() {
          this.data = [];
        },
        FakeBlob = function Blob(data, type, encoding) {
          this.data = data;
          this.size = data.length;
          this.type = type;
          this.encoding = encoding;
        },
        FBB_proto = FakeBlobBuilder.prototype,
        FB_proto = FakeBlob.prototype,
        FileReaderSync = view.FileReaderSync,
        FileException = function(type) {
          this.code = this[(this.name = type)];
        },
        file_ex_codes = ('NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR ' +
          'NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR').split(
          ' '
        ),
        file_ex_code = file_ex_codes.length,
        real_URL = view.URL || view.webkitURL || view,
        real_create_object_URL = real_URL.createObjectURL,
        real_revoke_object_URL = real_URL.revokeObjectURL,
        URL = real_URL,
        btoa = view.btoa,
        atob = view.atob,
        ArrayBuffer = view.ArrayBuffer,
        Uint8Array = view.Uint8Array,
        origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/;
      FakeBlob.fake = FB_proto.fake = true;
      while (file_ex_code--) {
        FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
      }
      // Polyfill URL
      if (!real_URL.createObjectURL) {
        URL = view.URL = function(uri) {
          var uri_info = document.createElementNS(
              'http://www.w3.org/1999/xhtml',
              'a'
            ),
            uri_origin;
          uri_info.href = uri;
          if (!('origin' in uri_info)) {
            if (uri_info.protocol.toLowerCase() === 'data:') {
              uri_info.origin = null;
            } else {
              uri_origin = uri.match(origin);
              uri_info.origin = uri_origin && uri_origin[1];
            }
          }
          return uri_info;
        };
      }
      URL.createObjectURL = function(blob) {
        var type = blob.type,
          data_URI_header;
        if (type === null) {
          type = 'application/octet-stream';
        }
        if (blob instanceof FakeBlob) {
          data_URI_header = 'data:' + type;
          if (blob.encoding === 'base64') {
            return data_URI_header + ';base64,' + blob.data;
          } else if (blob.encoding === 'URI') {
            return data_URI_header + ',' + decodeURIComponent(blob.data);
          }
          if (btoa) {
            return data_URI_header + ';base64,' + btoa(blob.data);
          } else {
            return data_URI_header + ',' + encodeURIComponent(blob.data);
          }
        } else if (real_create_object_URL) {
          return real_create_object_URL.call(real_URL, blob);
        }
      };
      URL.revokeObjectURL = function(object_URL) {
        if (object_URL.substring(0, 5) !== 'data:' && real_revoke_object_URL) {
          real_revoke_object_URL.call(real_URL, object_URL);
        }
      };
      FBB_proto.append = function(data /*, endings*/) {
        var bb = this.data;
        // decode data to a binary string
        if (
          Uint8Array &&
          (data instanceof ArrayBuffer || data instanceof Uint8Array)
        ) {
          var str = '',
            buf = new Uint8Array(data),
            i = 0,
            buf_len = buf.length;
          for (; i < buf_len; i++) {
            str += String.fromCharCode(buf[i]);
          }
          bb.push(str);
        } else if (get_class(data) === 'Blob' || get_class(data) === 'File') {
          if (FileReaderSync) {
            var fr = new FileReaderSync();
            bb.push(fr.readAsBinaryString(data));
          } else {
            // async FileReader won't work as BlobBuilder is sync
            throw new FileException('NOT_READABLE_ERR');
          }
        } else if (data instanceof FakeBlob) {
          if (data.encoding === 'base64' && atob) {
            bb.push(atob(data.data));
          } else if (data.encoding === 'URI') {
            bb.push(decodeURIComponent(data.data));
          } else if (data.encoding === 'raw') {
            bb.push(data.data);
          }
        } else {
          if (typeof data !== 'string') {
            data += ''; // convert unsupported types to strings
          }
          // decode UTF-16 to binary string
          bb.push(unescape(encodeURIComponent(data)));
        }
      };
      FBB_proto.getBlob = function(type) {
        if (!arguments.length) {
          type = null;
        }
        return new FakeBlob(this.data.join(''), type, 'raw');
      };
      FBB_proto.toString = function() {
        return '[object BlobBuilder]';
      };
      FB_proto.slice = function(start, end, type) {
        var args = arguments.length;
        if (args < 3) {
          type = null;
        }
        return new FakeBlob(
          this.data.slice(start, args > 1 ? end : this.data.length),
          type,
          this.encoding
        );
      };
      FB_proto.toString = function() {
        return '[object Blob]';
      };
      FB_proto.close = function() {
        this.size = 0;
        delete this.data;
      };
      return FakeBlobBuilder;
    })(view);

  view.Blob = function(blobParts, options) {
    var type = options ? options.type || '' : '';
    var builder = new BlobBuilder();
    if (blobParts) {
      for (var i = 0, len = blobParts.length; i < len; i++) {
        builder.append(blobParts[i]);
      }
    }
    return builder.getBlob(type);
  };
})(
  (typeof self !== 'undefined' && self) ||
    (typeof window !== 'undefined' && window) ||
    this.content ||
    this
);
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2014-08-29
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs =
  saveAs ||
  // IE 10+ (native saveAs)
  (typeof navigator !== 'undefined' &&
    navigator.msSaveOrOpenBlob &&
    navigator.msSaveOrOpenBlob.bind(navigator)) ||
  // Everyone else
  (function(view) {
    'use strict';
    // IE <10 is explicitly unsupported
    if (
      typeof navigator !== 'undefined' &&
      /MSIE [1-9]\./.test(navigator.userAgent)
    ) {
      return;
    }
    var doc = view.document,
      // only get URL when necessary in case Blob.js hasn't overridden it yet
      get_URL = function() {
        return view.URL || view.webkitURL || view;
      },
      save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a'),
      can_use_save_link = 'download' in save_link,
      click = function(node) {
        var event = doc.createEvent('MouseEvents');
        event.initMouseEvent(
          'click',
          true,
          false,
          view,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null
        );
        node.dispatchEvent(event);
      },
      webkit_req_fs = view.webkitRequestFileSystem,
      req_fs =
        view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
      throw_outside = function(ex) {
        (view.setImmediate || view.setTimeout)(function() {
          throw ex;
        }, 0);
      },
      force_saveable_type = 'application/octet-stream',
      fs_min_size = 0,
      // See https://code.google.com/p/chromium/issues/detail?id=375297#c7 for
      // the reasoning behind the timeout and revocation flow
      arbitrary_revoke_timeout = 10,
      revoke = function(file) {
        var revoker = function() {
          if (typeof file === 'string') {
            // file is an object URL
            get_URL().revokeObjectURL(file);
          } else {
            // file is a File
            file.remove();
          }
        };
        if (view.chrome) {
          revoker();
        } else {
          setTimeout(revoker, arbitrary_revoke_timeout);
        }
      },
      dispatch = function(filesaver, event_types, event) {
        event_types = [].concat(event_types);
        var i = event_types.length;
        while (i--) {
          var listener = filesaver['on' + event_types[i]];
          if (typeof listener === 'function') {
            try {
              listener.call(filesaver, event || filesaver);
            } catch (ex) {
              throw_outside(ex);
            }
          }
        }
      },
      FileSaver = function(blob, name) {
        // First try a.download, then web filesystem, then object URLs
        var filesaver = this,
          type = blob.type,
          blob_changed = false,
          object_url,
          target_view,
          dispatch_all = function() {
            dispatch(
              filesaver,
              'writestart progress write writeend'.split(' ')
            );
          },
          // on any filesys errors revert to saving with object URLs
          fs_error = function() {
            // don't create more object URLs than needed
            if (blob_changed || !object_url) {
              object_url = get_URL().createObjectURL(blob);
            }
            if (target_view) {
              target_view.location.href = object_url;
            } else {
              var new_tab = view.open(object_url, '_blank');
              if (new_tab == undefined && typeof safari !== 'undefined') {
                //Apple do not allow window.open, see http://bit.ly/1kZffRI
                view.location.href = object_url;
              }
            }
            filesaver.readyState = filesaver.DONE;
            dispatch_all();
            revoke(object_url);
          },
          abortable = function(func) {
            return function() {
              if (filesaver.readyState !== filesaver.DONE) {
                return func.apply(this, arguments);
              }
            };
          },
          create_if_not_found = { create: true, exclusive: false },
          slice;
        filesaver.readyState = filesaver.INIT;
        if (!name) {
          name = 'download';
        }
        if (can_use_save_link) {
          object_url = get_URL().createObjectURL(blob);
          save_link.href = object_url;
          save_link.download = name;
          click(save_link);
          filesaver.readyState = filesaver.DONE;
          dispatch_all();
          revoke(object_url);
          return;
        }
        // Object and web filesystem URLs have a problem saving in Google Chrome when
        // viewed in a tab, so I force save with application/octet-stream
        // http://code.google.com/p/chromium/issues/detail?id=91158
        // Update: Google errantly closed 91158, I submitted it again:
        // https://code.google.com/p/chromium/issues/detail?id=389642
        if (view.chrome && type && type !== force_saveable_type) {
          slice = blob.slice || blob.webkitSlice;
          blob = slice.call(blob, 0, blob.size, force_saveable_type);
          blob_changed = true;
        }
        // Since I can't be sure that the guessed media type will trigger a download
        // in WebKit, I append .download to the filename.
        // https://bugs.webkit.org/show_bug.cgi?id=65440
        if (webkit_req_fs && name !== 'download') {
          name += '.download';
        }
        if (type === force_saveable_type || webkit_req_fs) {
          target_view = view;
        }
        if (!req_fs) {
          fs_error();
          return;
        }
        fs_min_size += blob.size;
        req_fs(
          view.TEMPORARY,
          fs_min_size,
          abortable(function(fs) {
            fs.root.getDirectory(
              'saved',
              create_if_not_found,
              abortable(function(dir) {
                var save = function() {
                  dir.getFile(
                    name,
                    create_if_not_found,
                    abortable(function(file) {
                      file.createWriter(
                        abortable(function(writer) {
                          writer.onwriteend = function(event) {
                            target_view.location.href = file.toURL();
                            filesaver.readyState = filesaver.DONE;
                            dispatch(filesaver, 'writeend', event);
                            revoke(file);
                          };
                          writer.onerror = function() {
                            var error = writer.error;
                            if (error.code !== error.ABORT_ERR) {
                              fs_error();
                            }
                          };
                          'writestart progress write abort'
                            .split(' ')
                            .forEach(function(event) {
                              writer['on' + event] = filesaver['on' + event];
                            });
                          writer.write(blob);
                          filesaver.abort = function() {
                            writer.abort();
                            filesaver.readyState = filesaver.DONE;
                          };
                          filesaver.readyState = filesaver.WRITING;
                        }),
                        fs_error
                      );
                    }),
                    fs_error
                  );
                };
                dir.getFile(
                  name,
                  { create: false },
                  abortable(function(file) {
                    // delete file if it already exists
                    file.remove();
                    save();
                  }),
                  abortable(function(ex) {
                    if (ex.code === ex.NOT_FOUND_ERR) {
                      save();
                    } else {
                      fs_error();
                    }
                  })
                );
              }),
              fs_error
            );
          }),
          fs_error
        );
      },
      FS_proto = FileSaver.prototype,
      saveAs = function(blob, name) {
        return new FileSaver(blob, name);
      };
    FS_proto.abort = function() {
      var filesaver = this;
      filesaver.readyState = filesaver.DONE;
      dispatch(filesaver, 'abort');
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;

    FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;

    return saveAs;
  })(
    (typeof self !== 'undefined' && self) ||
      (typeof window !== 'undefined' && window) ||
      this.content
  );
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== 'undefined' && module !== null) {
  module.exports = saveAs;
} else if (typeof define !== 'undefined' && 0) {
  define([], function() {
    return saveAs;
  });
}
/*
 * Copyright (c) 2012 chick307 <chick307@gmail.com>
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */

void (function(global, callback) {
  if (typeof module === 'object') {
    module.exports = callback();
  } else if (0 === 'function') {
    define(callback);
  } else {
    global.adler32cs = callback();
  }
})(jsPDF, function() {
  var _hasArrayBuffer =
    typeof ArrayBuffer === 'function' && typeof Uint8Array === 'function';

  var _Buffer = null,
    _isBuffer = (function() {
      if (!_hasArrayBuffer)
        return function _isBuffer() {
          return false;
        };

      try {
        var buffer = require('buffer');
        if (typeof buffer.Buffer === 'function') _Buffer = buffer.Buffer;
      } catch (error) {}

      return function _isBuffer(value) {
        return (
          value instanceof ArrayBuffer ||
          (_Buffer !== null && value instanceof _Buffer)
        );
      };
    })();

  var _utf8ToBinary = (function() {
    if (_Buffer !== null) {
      return function _utf8ToBinary(utf8String) {
        return new _Buffer(utf8String, 'utf8').toString('binary');
      };
    } else {
      return function _utf8ToBinary(utf8String) {
        return unescape(encodeURIComponent(utf8String));
      };
    }
  })();

  var MOD = 65521;

  var _update = function _update(checksum, binaryString) {
    var a = checksum & 0xffff,
      b = checksum >>> 16;
    for (var i = 0, length = binaryString.length; i < length; i++) {
      a = (a + (binaryString.charCodeAt(i) & 0xff)) % MOD;
      b = (b + a) % MOD;
    }
    return ((b << 16) | a) >>> 0;
  };

  var _updateUint8Array = function _updateUint8Array(checksum, uint8Array) {
    var a = checksum & 0xffff,
      b = checksum >>> 16;
    for (var i = 0, length = uint8Array.length, x; i < length; i++) {
      a = (a + uint8Array[i]) % MOD;
      b = (b + a) % MOD;
    }
    return ((b << 16) | a) >>> 0;
  };

  var exports = {};

  var Adler32 = (exports.Adler32 = (function() {
    var ctor = function Adler32(checksum) {
      if (!(this instanceof ctor)) {
        throw new TypeError('Constructor cannot called be as a function.');
      }
      if (!isFinite((checksum = checksum == null ? 1 : +checksum))) {
        throw new Error('First arguments needs to be a finite number.');
      }
      this.checksum = checksum >>> 0;
    };

    var proto = (ctor.prototype = {});
    proto.constructor = ctor;

    ctor.from = (function(from) {
      from.prototype = proto;
      return from;
    })(function from(binaryString) {
      if (!(this instanceof ctor)) {
        throw new TypeError('Constructor cannot called be as a function.');
      }
      if (binaryString == null)
        throw new Error('First argument needs to be a string.');
      this.checksum = _update(1, binaryString.toString());
    });

    ctor.fromUtf8 = (function(fromUtf8) {
      fromUtf8.prototype = proto;
      return fromUtf8;
    })(function fromUtf8(utf8String) {
      if (!(this instanceof ctor)) {
        throw new TypeError('Constructor cannot called be as a function.');
      }
      if (utf8String == null)
        throw new Error('First argument needs to be a string.');
      var binaryString = _utf8ToBinary(utf8String.toString());
      this.checksum = _update(1, binaryString);
    });

    if (_hasArrayBuffer) {
      ctor.fromBuffer = (function(fromBuffer) {
        fromBuffer.prototype = proto;
        return fromBuffer;
      })(function fromBuffer(buffer) {
        if (!(this instanceof ctor)) {
          throw new TypeError('Constructor cannot called be as a function.');
        }
        if (!_isBuffer(buffer))
          throw new Error('First argument needs to be ArrayBuffer.');
        var array = new Uint8Array(buffer);
        return (this.checksum = _updateUint8Array(1, array));
      });
    }

    proto.update = function update(binaryString) {
      if (binaryString == null)
        throw new Error('First argument needs to be a string.');
      binaryString = binaryString.toString();
      return (this.checksum = _update(this.checksum, binaryString));
    };

    proto.updateUtf8 = function updateUtf8(utf8String) {
      if (utf8String == null)
        throw new Error('First argument needs to be a string.');
      var binaryString = _utf8ToBinary(utf8String.toString());
      return (this.checksum = _update(this.checksum, binaryString));
    };

    if (_hasArrayBuffer) {
      proto.updateBuffer = function updateBuffer(buffer) {
        if (!_isBuffer(buffer))
          throw new Error('First argument needs to be ArrayBuffer.');
        var array = new Uint8Array(buffer);
        return (this.checksum = _updateUint8Array(this.checksum, array));
      };
    }

    proto.clone = function clone() {
      return new Adler32(this.checksum);
    };

    return ctor;
  })());

  exports.from = function from(binaryString) {
    if (binaryString == null)
      throw new Error('First argument needs to be a string.');
    return _update(1, binaryString.toString());
  };

  exports.fromUtf8 = function fromUtf8(utf8String) {
    if (utf8String == null)
      throw new Error('First argument needs to be a string.');
    var binaryString = _utf8ToBinary(utf8String.toString());
    return _update(1, binaryString);
  };

  if (_hasArrayBuffer) {
    exports.fromBuffer = function fromBuffer(buffer) {
      if (!_isBuffer(buffer))
        throw new Error('First argument need to be ArrayBuffer.');
      var array = new Uint8Array(buffer);
      return _updateUint8Array(1, array);
    };
  }

  return exports;
});
/*
 Deflate.js - https://github.com/gildas-lormeau/zip.js
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * This program is based on JZlib 1.0.2 ymnk, JCraft,Inc.
 * JZlib is based on zlib-1.1.3, so all credit should go authors
 * Jean-loup Gailly(jloup@gzip.org) and Mark Adler(madler@alumni.caltech.edu)
 * and contributors of zlib.
 */

var Deflater = (function(obj) {
  // Global

  var MAX_BITS = 15;
  var D_CODES = 30;
  var BL_CODES = 19;

  var LENGTH_CODES = 29;
  var LITERALS = 256;
  var L_CODES = LITERALS + 1 + LENGTH_CODES;
  var HEAP_SIZE = 2 * L_CODES + 1;

  var END_BLOCK = 256;

  // Bit length codes must not exceed MAX_BL_BITS bits
  var MAX_BL_BITS = 7;

  // repeat previous bit length 3-6 times (2 bits of repeat count)
  var REP_3_6 = 16;

  // repeat a zero length 3-10 times (3 bits of repeat count)
  var REPZ_3_10 = 17;

  // repeat a zero length 11-138 times (7 bits of repeat count)
  var REPZ_11_138 = 18;

  // The lengths of the bit length codes are sent in order of decreasing
  // probability, to avoid transmitting the lengths for unused bit
  // length codes.

  var Buf_size = 8 * 2;

  // JZlib version : "1.0.2"
  var Z_DEFAULT_COMPRESSION = -1;

  // compression strategy
  var Z_FILTERED = 1;
  var Z_HUFFMAN_ONLY = 2;
  var Z_DEFAULT_STRATEGY = 0;

  var Z_NO_FLUSH = 0;
  var Z_PARTIAL_FLUSH = 1;
  var Z_FULL_FLUSH = 3;
  var Z_FINISH = 4;

  var Z_OK = 0;
  var Z_STREAM_END = 1;
  var Z_NEED_DICT = 2;
  var Z_STREAM_ERROR = -2;
  var Z_DATA_ERROR = -3;
  var Z_BUF_ERROR = -5;

  // Tree

  // see definition of array dist_code below
  var _dist_code = [
    0,
    1,
    2,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    6,
    6,
    7,
    7,
    7,
    7,
    8,
    8,
    8,
    8,
    8,
    8,
    8,
    8,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    11,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    12,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    13,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    15,
    0,
    0,
    16,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29
  ];

  function Tree() {
    var that = this;

    // dyn_tree; // the dynamic tree
    // max_code; // largest code with non zero frequency
    // stat_desc; // the corresponding static tree

    // Compute the optimal bit lengths for a tree and update the total bit
    // length
    // for the current block.
    // IN assertion: the fields freq and dad are set, heap[heap_max] and
    // above are the tree nodes sorted by increasing frequency.
    // OUT assertions: the field len is set to the optimal bit length, the
    // array bl_count contains the frequencies for each bit length.
    // The length opt_len is updated; static_len is also updated if stree is
    // not null.
    function gen_bitlen(s) {
      var tree = that.dyn_tree;
      var stree = that.stat_desc.static_tree;
      var extra = that.stat_desc.extra_bits;
      var base = that.stat_desc.extra_base;
      var max_length = that.stat_desc.max_length;
      var h; // heap index
      var n, m; // iterate over the tree elements
      var bits; // bit length
      var xbits; // extra bits
      var f; // frequency
      var overflow = 0; // number of elements with bit length too large

      for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;

      // In a first pass, compute the optimal bit lengths (which may
      // overflow in the case of the bit length tree).
      tree[s.heap[s.heap_max] * 2 + 1] = 0; // root of the heap

      for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1] = bits;
        // We overwrite tree[n*2+1] which is no longer needed

        if (n > that.max_code) continue; // not a leaf node

        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) xbits = extra[n - base];
        f = tree[n * 2];
        s.opt_len += f * (bits + xbits);
        if (stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
      }
      if (overflow === 0) return;

      // This happens for example on obj2 and pic of the Calgary corpus
      // Find the first bit length which could increase:
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) bits--;
        s.bl_count[bits]--; // move one leaf down the tree
        s.bl_count[bits + 1] += 2; // move one overflow item as its brother
        s.bl_count[max_length]--;
        // The brother of the overflow item also moves one step up,
        // but this does not affect bl_count[max_length]
        overflow -= 2;
      } while (overflow > 0);

      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > that.max_code) continue;
          if (tree[m * 2 + 1] != bits) {
            s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n--;
        }
      }
    }

    // Reverse the first len bits of a code, using straightforward code (a
    // faster
    // method would use a table)
    // IN assertion: 1 <= len <= 15
    function bi_reverse(
      code, // the value to invert
      len // its bit length
    ) {
      var res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    }

    // Generate the codes for a given tree and bit counts (which need not be
    // optimal).
    // IN assertion: the array bl_count contains the bit length statistics for
    // the given tree and the field len is set for all tree elements.
    // OUT assertion: the field code is set for all tree elements of non
    // zero code length.
    function gen_codes(
      tree, // the tree to decorate
      max_code, // largest code with non zero frequency
      bl_count // number of codes at each bit length
    ) {
      var next_code = []; // next code value for each
      // bit length
      var code = 0; // running code value
      var bits; // bit index
      var n; // code index
      var len;

      // The distribution counts are first used to generate the code values
      // without bit reversal.
      for (bits = 1; bits <= MAX_BITS; bits++) {
        next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
      }

      // Check that the bit counts in bl_count are consistent. The last code
      // must be all ones.
      // Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
      // "inconsistent bit counts");
      // Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

      for (n = 0; n <= max_code; n++) {
        len = tree[n * 2 + 1];
        if (len === 0) continue;
        // Now reverse the bits
        tree[n * 2] = bi_reverse(next_code[len]++, len);
      }
    }

    // Construct one Huffman tree and assigns the code bit strings and lengths.
    // Update the total bit length for the current block.
    // IN assertion: the field freq is set for all tree elements.
    // OUT assertions: the fields len and code are set to the optimal bit length
    // and corresponding code. The length opt_len is updated; static_len is
    // also updated if stree is not null. The field max_code is set.
    that.build_tree = function(s) {
      var tree = that.dyn_tree;
      var stree = that.stat_desc.static_tree;
      var elems = that.stat_desc.elems;
      var n, m; // iterate over heap elements
      var max_code = -1; // largest code with non zero frequency
      var node; // new node being created

      // Construct the initial heap, with least frequent element in
      // heap[1]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
      // heap[0] is not used.
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE;

      for (n = 0; n < elems; n++) {
        if (tree[n * 2] !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;
        } else {
          tree[n * 2 + 1] = 0;
        }
      }

      // The pkzip format requires that at least one distance code exists,
      // and that at least one bit should be sent even if there is only one
      // possible code. So to avoid special checks later on we force at least
      // two codes of non zero frequency.
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (stree) s.static_len -= stree[node * 2 + 1];
        // node is 0 or 1 so it does not have extra bits
      }
      that.max_code = max_code;

      // The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
      // establish sub-heaps of increasing lengths:

      for (n = Math.floor(s.heap_len / 2); n >= 1; n--) s.pqdownheap(tree, n);

      // Construct the Huffman tree by repeatedly combining the least two
      // frequent nodes.

      node = elems; // next internal node of the tree
      do {
        // n = node of least frequency
        n = s.heap[1];
        s.heap[1] = s.heap[s.heap_len--];
        s.pqdownheap(tree, 1);
        m = s.heap[1]; // m = node of next least frequency

        s.heap[--s.heap_max] = n; // keep the nodes sorted by frequency
        s.heap[--s.heap_max] = m;

        // Create a new node father of n and m
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s.depth[node] = Math.max(s.depth[n], s.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;

        // and insert the new node in the heap
        s.heap[1] = node++;
        s.pqdownheap(tree, 1);
      } while (s.heap_len >= 2);

      s.heap[--s.heap_max] = s.heap[1];

      // At this point, the fields freq and dad are set. We can now
      // generate the bit lengths.

      gen_bitlen(s);

      // The field len is now set, we can generate the bit codes
      gen_codes(tree, that.max_code, s.bl_count);
    };
  }

  Tree._length_code = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    12,
    12,
    13,
    13,
    13,
    13,
    14,
    14,
    14,
    14,
    15,
    15,
    15,
    15,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    25,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    26,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    27,
    28
  ];

  Tree.base_length = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    28,
    32,
    40,
    48,
    56,
    64,
    80,
    96,
    112,
    128,
    160,
    192,
    224,
    0
  ];

  Tree.base_dist = [
    0,
    1,
    2,
    3,
    4,
    6,
    8,
    12,
    16,
    24,
    32,
    48,
    64,
    96,
    128,
    192,
    256,
    384,
    512,
    768,
    1024,
    1536,
    2048,
    3072,
    4096,
    6144,
    8192,
    12288,
    16384,
    24576
  ];

  // Mapping from a distance to a distance code. dist is the distance - 1 and
  // must not have side effects. _dist_code[256] and _dist_code[257] are never
  // used.
  Tree.d_code = function(dist) {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
  };

  // extra bits for each length code
  Tree.extra_lbits = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0
  ];

  // extra bits for each distance code
  Tree.extra_dbits = [
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13
  ];

  // extra bits for each bit length code
  Tree.extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];

  Tree.bl_order = [
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15
  ];

  // StaticTree

  function StaticTree(static_tree, extra_bits, extra_base, elems, max_length) {
    var that = this;
    that.static_tree = static_tree;
    that.extra_bits = extra_bits;
    that.extra_base = extra_base;
    that.elems = elems;
    that.max_length = max_length;
  }

  StaticTree.static_ltree = [
    12,
    8,
    140,
    8,
    76,
    8,
    204,
    8,
    44,
    8,
    172,
    8,
    108,
    8,
    236,
    8,
    28,
    8,
    156,
    8,
    92,
    8,
    220,
    8,
    60,
    8,
    188,
    8,
    124,
    8,
    252,
    8,
    2,
    8,
    130,
    8,
    66,
    8,
    194,
    8,
    34,
    8,
    162,
    8,
    98,
    8,
    226,
    8,
    18,
    8,
    146,
    8,
    82,
    8,
    210,
    8,
    50,
    8,
    178,
    8,
    114,
    8,
    242,
    8,
    10,
    8,
    138,
    8,
    74,
    8,
    202,
    8,
    42,
    8,
    170,
    8,
    106,
    8,
    234,
    8,
    26,
    8,
    154,
    8,
    90,
    8,
    218,
    8,
    58,
    8,
    186,
    8,
    122,
    8,
    250,
    8,
    6,
    8,
    134,
    8,
    70,
    8,
    198,
    8,
    38,
    8,
    166,
    8,
    102,
    8,
    230,
    8,
    22,
    8,
    150,
    8,
    86,
    8,
    214,
    8,
    54,
    8,
    182,
    8,
    118,
    8,
    246,
    8,
    14,
    8,
    142,
    8,
    78,
    8,
    206,
    8,
    46,
    8,
    174,
    8,
    110,
    8,
    238,
    8,
    30,
    8,
    158,
    8,
    94,
    8,
    222,
    8,
    62,
    8,
    190,
    8,
    126,
    8,
    254,
    8,
    1,
    8,
    129,
    8,
    65,
    8,
    193,
    8,
    33,
    8,
    161,
    8,
    97,
    8,
    225,
    8,
    17,
    8,
    145,
    8,
    81,
    8,
    209,
    8,
    49,
    8,
    177,
    8,
    113,
    8,
    241,
    8,
    9,
    8,
    137,
    8,
    73,
    8,
    201,
    8,
    41,
    8,
    169,
    8,
    105,
    8,
    233,
    8,
    25,
    8,
    153,
    8,
    89,
    8,
    217,
    8,
    57,
    8,
    185,
    8,
    121,
    8,
    249,
    8,
    5,
    8,
    133,
    8,
    69,
    8,
    197,
    8,
    37,
    8,
    165,
    8,
    101,
    8,
    229,
    8,
    21,
    8,
    149,
    8,
    85,
    8,
    213,
    8,
    53,
    8,
    181,
    8,
    117,
    8,
    245,
    8,
    13,
    8,
    141,
    8,
    77,
    8,
    205,
    8,
    45,
    8,
    173,
    8,
    109,
    8,
    237,
    8,
    29,
    8,
    157,
    8,
    93,
    8,
    221,
    8,
    61,
    8,
    189,
    8,
    125,
    8,
    253,
    8,
    19,
    9,
    275,
    9,
    147,
    9,
    403,
    9,
    83,
    9,
    339,
    9,
    211,
    9,
    467,
    9,
    51,
    9,
    307,
    9,
    179,
    9,
    435,
    9,
    115,
    9,
    371,
    9,
    243,
    9,
    499,
    9,
    11,
    9,
    267,
    9,
    139,
    9,
    395,
    9,
    75,
    9,
    331,
    9,
    203,
    9,
    459,
    9,
    43,
    9,
    299,
    9,
    171,
    9,
    427,
    9,
    107,
    9,
    363,
    9,
    235,
    9,
    491,
    9,
    27,
    9,
    283,
    9,
    155,
    9,
    411,
    9,
    91,
    9,
    347,
    9,
    219,
    9,
    475,
    9,
    59,
    9,
    315,
    9,
    187,
    9,
    443,
    9,
    123,
    9,
    379,
    9,
    251,
    9,
    507,
    9,
    7,
    9,
    263,
    9,
    135,
    9,
    391,
    9,
    71,
    9,
    327,
    9,
    199,
    9,
    455,
    9,
    39,
    9,
    295,
    9,
    167,
    9,
    423,
    9,
    103,
    9,
    359,
    9,
    231,
    9,
    487,
    9,
    23,
    9,
    279,
    9,
    151,
    9,
    407,
    9,
    87,
    9,
    343,
    9,
    215,
    9,
    471,
    9,
    55,
    9,
    311,
    9,
    183,
    9,
    439,
    9,
    119,
    9,
    375,
    9,
    247,
    9,
    503,
    9,
    15,
    9,
    271,
    9,
    143,
    9,
    399,
    9,
    79,
    9,
    335,
    9,
    207,
    9,
    463,
    9,
    47,
    9,
    303,
    9,
    175,
    9,
    431,
    9,
    111,
    9,
    367,
    9,
    239,
    9,
    495,
    9,
    31,
    9,
    287,
    9,
    159,
    9,
    415,
    9,
    95,
    9,
    351,
    9,
    223,
    9,
    479,
    9,
    63,
    9,
    319,
    9,
    191,
    9,
    447,
    9,
    127,
    9,
    383,
    9,
    255,
    9,
    511,
    9,
    0,
    7,
    64,
    7,
    32,
    7,
    96,
    7,
    16,
    7,
    80,
    7,
    48,
    7,
    112,
    7,
    8,
    7,
    72,
    7,
    40,
    7,
    104,
    7,
    24,
    7,
    88,
    7,
    56,
    7,
    120,
    7,
    4,
    7,
    68,
    7,
    36,
    7,
    100,
    7,
    20,
    7,
    84,
    7,
    52,
    7,
    116,
    7,
    3,
    8,
    131,
    8,
    67,
    8,
    195,
    8,
    35,
    8,
    163,
    8,
    99,
    8,
    227,
    8
  ];

  StaticTree.static_dtree = [
    0,
    5,
    16,
    5,
    8,
    5,
    24,
    5,
    4,
    5,
    20,
    5,
    12,
    5,
    28,
    5,
    2,
    5,
    18,
    5,
    10,
    5,
    26,
    5,
    6,
    5,
    22,
    5,
    14,
    5,
    30,
    5,
    1,
    5,
    17,
    5,
    9,
    5,
    25,
    5,
    5,
    5,
    21,
    5,
    13,
    5,
    29,
    5,
    3,
    5,
    19,
    5,
    11,
    5,
    27,
    5,
    7,
    5,
    23,
    5
  ];

  StaticTree.static_l_desc = new StaticTree(
    StaticTree.static_ltree,
    Tree.extra_lbits,
    LITERALS + 1,
    L_CODES,
    MAX_BITS
  );

  StaticTree.static_d_desc = new StaticTree(
    StaticTree.static_dtree,
    Tree.extra_dbits,
    0,
    D_CODES,
    MAX_BITS
  );

  StaticTree.static_bl_desc = new StaticTree(
    null,
    Tree.extra_blbits,
    0,
    BL_CODES,
    MAX_BL_BITS
  );

  // Deflate

  var MAX_MEM_LEVEL = 9;
  var DEF_MEM_LEVEL = 8;

  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    var that = this;
    that.good_length = good_length;
    that.max_lazy = max_lazy;
    that.nice_length = nice_length;
    that.max_chain = max_chain;
    that.func = func;
  }

  var STORED = 0;
  var FAST = 1;
  var SLOW = 2;
  var config_table = [
    new Config(0, 0, 0, 0, STORED),
    new Config(4, 4, 8, 4, FAST),
    new Config(4, 5, 16, 8, FAST),
    new Config(4, 6, 32, 32, FAST),
    new Config(4, 4, 16, 16, SLOW),
    new Config(8, 16, 32, 32, SLOW),
    new Config(8, 16, 128, 128, SLOW),
    new Config(8, 32, 128, 256, SLOW),
    new Config(32, 128, 258, 1024, SLOW),
    new Config(32, 258, 258, 4096, SLOW)
  ];

  var z_errmsg = [
    'need dictionary', // Z_NEED_DICT
    // 2
    'stream end', // Z_STREAM_END 1
    '', // Z_OK 0
    '', // Z_ERRNO (-1)
    'stream error', // Z_STREAM_ERROR (-2)
    'data error', // Z_DATA_ERROR (-3)
    '', // Z_MEM_ERROR (-4)
    'buffer error', // Z_BUF_ERROR (-5)
    '', // Z_VERSION_ERROR (-6)
    ''
  ];

  // block not completed, need more input or more output
  var NeedMore = 0;

  // block flush performed
  var BlockDone = 1;

  // finish started, need only more output at next deflate
  var FinishStarted = 2;

  // finish done, accept no more input or output
  var FinishDone = 3;

  // preset dictionary flag in zlib header
  var PRESET_DICT = 0x20;

  var INIT_STATE = 42;
  var BUSY_STATE = 113;
  var FINISH_STATE = 666;

  // The deflate compression method
  var Z_DEFLATED = 8;

  var STORED_BLOCK = 0;
  var STATIC_TREES = 1;
  var DYN_TREES = 2;

  var MIN_MATCH = 3;
  var MAX_MATCH = 258;
  var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;

  function smaller(tree, n, m, depth) {
    var tn2 = tree[n * 2];
    var tm2 = tree[m * 2];
    return tn2 < tm2 || (tn2 == tm2 && depth[n] <= depth[m]);
  }

  function Deflate() {
    var that = this;
    var strm; // pointer back to this zlib stream
    var status; // as the name implies
    // pending_buf; // output still pending
    var pending_buf_size; // size of pending_buf
    // pending_out; // next pending byte to output to the stream
    // pending; // nb of bytes in the pending buffer
    var method; // STORED (for zip only) or DEFLATED
    var last_flush; // value of flush param for previous deflate call

    var w_size; // LZ77 window size (32K by default)
    var w_bits; // log2(w_size) (8..16)
    var w_mask; // w_size - 1

    var window;
    // Sliding window. Input bytes are read into the second half of the window,
    // and move to the first half later to keep a dictionary of at least wSize
    // bytes. With this organization, matches are limited to a distance of
    // wSize-MAX_MATCH bytes, but this ensures that IO is always
    // performed with a length multiple of the block size. Also, it limits
    // the window size to 64K, which is quite useful on MSDOS.
    // To do: use the user input buffer as sliding window.

    var window_size;
    // Actual size of window: 2*wSize, except when the user input buffer
    // is directly used as sliding window.

    var prev;
    // Link to older string with same hash index. To limit the size of this
    // array to 64K, this link is maintained only for the last 32K strings.
    // An index in this array is thus a window index modulo 32K.

    var head; // Heads of the hash chains or NIL.

    var ins_h; // hash index of string to be inserted
    var hash_size; // number of elements in hash table
    var hash_bits; // log2(hash_size)
    var hash_mask; // hash_size-1

    // Number of bits by which ins_h must be shifted at each input
    // step. It must be such that after MIN_MATCH steps, the oldest
    // byte no longer takes part in the hash key, that is:
    // hash_shift * MIN_MATCH >= hash_bits
    var hash_shift;

    // Window position at the beginning of the current output block. Gets
    // negative when the window is moved backwards.

    var block_start;

    var match_length; // length of best match
    var prev_match; // previous match
    var match_available; // set if previous match exists
    var strstart; // start of string to insert
    var match_start; // start of matching string
    var lookahead; // number of valid bytes ahead in window

    // Length of the best match at previous step. Matches not greater than this
    // are discarded. This is used in the lazy match evaluation.
    var prev_length;

    // To speed up deflation, hash chains are never searched beyond this
    // length. A higher limit improves compression ratio but degrades the speed.
    var max_chain_length;

    // Attempt to find a better match only when the current match is strictly
    // smaller than this value. This mechanism is used only for compression
    // levels >= 4.
    var max_lazy_match;

    // Insert new strings in the hash table only if the match length is not
    // greater than this length. This saves time but degrades compression.
    // max_insert_length is used only for compression levels <= 3.

    var level; // compression level (1..9)
    var strategy; // favor or force Huffman coding

    // Use a faster search when the previous match is longer than this
    var good_match;

    // Stop searching when current match exceeds this
    var nice_match;

    var dyn_ltree; // literal and length tree
    var dyn_dtree; // distance tree
    var bl_tree; // Huffman tree for bit lengths

    var l_desc = new Tree(); // desc for literal tree
    var d_desc = new Tree(); // desc for distance tree
    var bl_desc = new Tree(); // desc for bit length tree

    // that.heap_len; // number of elements in the heap
    // that.heap_max; // element of largest frequency
    // The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
    // The same heap array is used to build all trees.

    // Depth of each subtree used as tie breaker for trees of equal frequency
    that.depth = [];

    var l_buf; // index for literals or lengths */

    // Size of match buffer for literals/lengths. There are 4 reasons for
    // limiting lit_bufsize to 64K:
    // - frequencies can be kept in 16 bit counters
    // - if compression is not successful for the first block, all input
    // data is still in the window so we can still emit a stored block even
    // when input comes from standard input. (This can also be done for
    // all blocks if lit_bufsize is not greater than 32K.)
    // - if compression is not successful for a file smaller than 64K, we can
    // even emit a stored file instead of a stored block (saving 5 bytes).
    // This is applicable only for zip (not gzip or zlib).
    // - creating new Huffman trees less frequently may not provide fast
    // adaptation to changes in the input data statistics. (Take for
    // example a binary file with poorly compressible code followed by
    // a highly compressible string table.) Smaller buffer sizes give
    // fast adaptation but have of course the overhead of transmitting
    // trees more frequently.
    // - I can't count above 4
    var lit_bufsize;

    var last_lit; // running index in l_buf

    // Buffer for distances. To simplify the code, d_buf and l_buf have
    // the same number of elements. To use different lengths, an extra flag
    // array would be necessary.

    var d_buf; // index of pendig_buf

    // that.opt_len; // bit length of current block with optimal trees
    // that.static_len; // bit length of current block with static trees
    var matches; // number of string matches in current block
    var last_eob_len; // bit length of EOB code for last block

    // Output buffer. bits are inserted starting at the bottom (least
    // significant bits).
    var bi_buf;

    // Number of valid bits in bi_buf. All bits above the last valid bit
    // are always zero.
    var bi_valid;

    // number of codes at each bit length for an optimal tree
    that.bl_count = [];

    // heap used to build the Huffman trees
    that.heap = [];

    dyn_ltree = [];
    dyn_dtree = [];
    bl_tree = [];

    function lm_init() {
      var i;
      window_size = 2 * w_size;

      head[hash_size - 1] = 0;
      for (i = 0; i < hash_size - 1; i++) {
        head[i] = 0;
      }

      // Set the default configuration parameters:
      max_lazy_match = config_table[level].max_lazy;
      good_match = config_table[level].good_length;
      nice_match = config_table[level].nice_length;
      max_chain_length = config_table[level].max_chain;

      strstart = 0;
      block_start = 0;
      lookahead = 0;
      match_length = prev_length = MIN_MATCH - 1;
      match_available = 0;
      ins_h = 0;
    }

    function init_block() {
      var i;
      // Initialize the trees.
      for (i = 0; i < L_CODES; i++) dyn_ltree[i * 2] = 0;
      for (i = 0; i < D_CODES; i++) dyn_dtree[i * 2] = 0;
      for (i = 0; i < BL_CODES; i++) bl_tree[i * 2] = 0;

      dyn_ltree[END_BLOCK * 2] = 1;
      that.opt_len = that.static_len = 0;
      last_lit = matches = 0;
    }

    // Initialize the tree data structures for a new zlib stream.
    function tr_init() {
      l_desc.dyn_tree = dyn_ltree;
      l_desc.stat_desc = StaticTree.static_l_desc;

      d_desc.dyn_tree = dyn_dtree;
      d_desc.stat_desc = StaticTree.static_d_desc;

      bl_desc.dyn_tree = bl_tree;
      bl_desc.stat_desc = StaticTree.static_bl_desc;

      bi_buf = 0;
      bi_valid = 0;
      last_eob_len = 8; // enough lookahead for inflate

      // Initialize the first block of the first file:
      init_block();
    }

    // Restore the heap property by moving down the tree starting at node k,
    // exchanging a node with the smallest of its two sons if necessary,
    // stopping
    // when the heap property is re-established (each father smaller than its
    // two sons).
    that.pqdownheap = function(
      tree, // the tree to restore
      k // node to move down
    ) {
      var heap = that.heap;
      var v = heap[k];
      var j = k << 1; // left son of k
      while (j <= that.heap_len) {
        // Set j to the smallest of the two sons:
        if (
          j < that.heap_len &&
          smaller(tree, heap[j + 1], heap[j], that.depth)
        ) {
          j++;
        }
        // Exit if v is smaller than both sons
        if (smaller(tree, v, heap[j], that.depth)) break;

        // Exchange v with the smallest son
        heap[k] = heap[j];
        k = j;
        // And continue down the tree, setting j to the left son of k
        j <<= 1;
      }
      heap[k] = v;
    };

    // Scan a literal or distance tree to determine the frequencies of the codes
    // in the bit length tree.
    function scan_tree(
      tree, // the tree to be scanned
      max_code // and its largest code of non zero frequency
    ) {
      var n; // iterates over all tree elements
      var prevlen = -1; // last emitted length
      var curlen; // length of current code
      var nextlen = tree[0 * 2 + 1]; // length of next code
      var count = 0; // repeat count of the current code
      var max_count = 7; // max repeat count
      var min_count = 4; // min repeat count

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 0xffff; // guard

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen == nextlen) {
          continue;
        } else if (count < min_count) {
          bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen != prevlen) bl_tree[curlen * 2]++;
          bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          bl_tree[REPZ_3_10 * 2]++;
        } else {
          bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen == nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }

    // Construct the Huffman tree for the bit lengths and return the index in
    // bl_order of the last bit length code to send.
    function build_bl_tree() {
      var max_blindex; // index of last bit length code of non zero freq

      // Determine the bit length frequencies for literal and distance trees
      scan_tree(dyn_ltree, l_desc.max_code);
      scan_tree(dyn_dtree, d_desc.max_code);

      // Build the bit length tree:
      bl_desc.build_tree(that);
      // opt_len now includes the length of the tree representations, except
      // the lengths of the bit lengths codes and the 5+5+4 bits for the
      // counts.

      // Determine the number of bit length codes to send. The pkzip format
      // requires that at least 4 bit length codes be sent. (appnote.txt says
      // 3 but the actual value used is 4.)
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (bl_tree[Tree.bl_order[max_blindex] * 2 + 1] !== 0) break;
      }
      // Update opt_len to include the bit length tree and counts
      that.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;

      return max_blindex;
    }

    // Output a byte on the stream.
    // IN assertion: there is enough room in pending_buf.
    function put_byte(p) {
      that.pending_buf[that.pending++] = p;
    }

    function put_short(w) {
      put_byte(w & 0xff);
      put_byte((w >>> 8) & 0xff);
    }

    function putShortMSB(b) {
      put_byte((b >> 8) & 0xff);
      put_byte(b & 0xff & 0xff);
    }

    function send_bits(value, length) {
      var val,
        len = length;
      if (bi_valid > Buf_size - len) {
        val = value;
        // bi_buf |= (val << bi_valid);
        bi_buf |= (val << bi_valid) & 0xffff;
        put_short(bi_buf);
        bi_buf = val >>> (Buf_size - bi_valid);
        bi_valid += len - Buf_size;
      } else {
        // bi_buf |= (value) << bi_valid;
        bi_buf |= (value << bi_valid) & 0xffff;
        bi_valid += len;
      }
    }

    function send_code(c, tree) {
      var c2 = c * 2;
      send_bits(tree[c2] & 0xffff, tree[c2 + 1] & 0xffff);
    }

    // Send a literal or distance tree in compressed form, using the codes in
    // bl_tree.
    function send_tree(
      tree, // the tree to be sent
      max_code // and its largest code of non zero frequency
    ) {
      var n; // iterates over all tree elements
      var prevlen = -1; // last emitted length
      var curlen; // length of current code
      var nextlen = tree[0 * 2 + 1]; // length of next code
      var count = 0; // repeat count of the current code
      var max_count = 7; // max repeat count
      var min_count = 4; // min repeat count

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen == nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(curlen, bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen != prevlen) {
            send_code(curlen, bl_tree);
            count--;
          }
          send_code(REP_3_6, bl_tree);
          send_bits(count - 3, 2);
        } else if (count <= 10) {
          send_code(REPZ_3_10, bl_tree);
          send_bits(count - 3, 3);
        } else {
          send_code(REPZ_11_138, bl_tree);
          send_bits(count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen == nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }

    // Send the header for a block using dynamic Huffman trees: the counts, the
    // lengths of the bit length codes, the literal tree and the distance tree.
    // IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
    function send_all_trees(lcodes, dcodes, blcodes) {
      var rank; // index in bl_order

      send_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt
      send_bits(dcodes - 1, 5);
      send_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt
      for (rank = 0; rank < blcodes; rank++) {
        send_bits(bl_tree[Tree.bl_order[rank] * 2 + 1], 3);
      }
      send_tree(dyn_ltree, lcodes - 1); // literal tree
      send_tree(dyn_dtree, dcodes - 1); // distance tree
    }

    // Flush the bit buffer, keeping at most 7 bits in it.
    function bi_flush() {
      if (bi_valid == 16) {
        put_short(bi_buf);
        bi_buf = 0;
        bi_valid = 0;
      } else if (bi_valid >= 8) {
        put_byte(bi_buf & 0xff);
        bi_buf >>>= 8;
        bi_valid -= 8;
      }
    }

    // Send one empty static block to give enough lookahead for inflate.
    // This takes 10 bits, of which 7 may remain in the bit buffer.
    // The current inflate code requires 9 bits of lookahead. If the
    // last two codes for the previous block (real code plus EOB) were coded
    // on 5 bits or less, inflate may have only 5+3 bits of lookahead to decode
    // the last real code. In this case we send two empty static blocks instead
    // of one. (There are no problems if the previous block is stored or fixed.)
    // To simplify the code, we assume the worst case of last real code encoded
    // on one bit only.
    function _tr_align() {
      send_bits(STATIC_TREES << 1, 3);
      send_code(END_BLOCK, StaticTree.static_ltree);

      bi_flush();

      // Of the 10 bits for the empty block, we have already sent
      // (10 - bi_valid) bits. The lookahead for the last real code (before
      // the EOB of the previous block) was thus at least one plus the length
      // of the EOB plus what we have just sent of the empty static block.
      if (1 + last_eob_len + 10 - bi_valid < 9) {
        send_bits(STATIC_TREES << 1, 3);
        send_code(END_BLOCK, StaticTree.static_ltree);
        bi_flush();
      }
      last_eob_len = 7;
    }

    // Save the match info and tally the frequency counts. Return true if
    // the current block must be flushed.
    function _tr_tally(
      dist, // distance of matched string
      lc // match length-MIN_MATCH or unmatched char (if dist==0)
    ) {
      var out_length, in_length, dcode;
      that.pending_buf[d_buf + last_lit * 2] = (dist >>> 8) & 0xff;
      that.pending_buf[d_buf + last_lit * 2 + 1] = dist & 0xff;

      that.pending_buf[l_buf + last_lit] = lc & 0xff;
      last_lit++;

      if (dist === 0) {
        // lc is the unmatched char
        dyn_ltree[lc * 2]++;
      } else {
        matches++;
        // Here, lc is the match length - MIN_MATCH
        dist--; // dist = match distance - 1
        dyn_ltree[(Tree._length_code[lc] + LITERALS + 1) * 2]++;
        dyn_dtree[Tree.d_code(dist) * 2]++;
      }

      if ((last_lit & 0x1fff) === 0 && level > 2) {
        // Compute an upper bound for the compressed length
        out_length = last_lit * 8;
        in_length = strstart - block_start;
        for (dcode = 0; dcode < D_CODES; dcode++) {
          out_length += dyn_dtree[dcode * 2] * (5 + Tree.extra_dbits[dcode]);
        }
        out_length >>>= 3;
        if (
          matches < Math.floor(last_lit / 2) &&
          out_length < Math.floor(in_length / 2)
        )
          return true;
      }

      return last_lit == lit_bufsize - 1;
      // We avoid equality with lit_bufsize because of wraparound at 64K
      // on 16 bit machines and because stored blocks are restricted to
      // 64K-1 bytes.
    }

    // Send the block data compressed using the given Huffman trees
    function compress_block(ltree, dtree) {
      var dist; // distance of matched string
      var lc; // match length or unmatched char (if dist === 0)
      var lx = 0; // running index in l_buf
      var code; // the code to send
      var extra; // number of extra bits to send

      if (last_lit !== 0) {
        do {
          dist =
            ((that.pending_buf[d_buf + lx * 2] << 8) & 0xff00) |
            (that.pending_buf[d_buf + lx * 2 + 1] & 0xff);
          lc = that.pending_buf[l_buf + lx] & 0xff;
          lx++;

          if (dist === 0) {
            send_code(lc, ltree); // send a literal byte
          } else {
            // Here, lc is the match length - MIN_MATCH
            code = Tree._length_code[lc];

            send_code(code + LITERALS + 1, ltree); // send the length
            // code
            extra = Tree.extra_lbits[code];
            if (extra !== 0) {
              lc -= Tree.base_length[code];
              send_bits(lc, extra); // send the extra length bits
            }
            dist--; // dist is now the match distance - 1
            code = Tree.d_code(dist);

            send_code(code, dtree); // send the distance code
            extra = Tree.extra_dbits[code];
            if (extra !== 0) {
              dist -= Tree.base_dist[code];
              send_bits(dist, extra); // send the extra distance bits
            }
          } // literal or match pair ?

          // Check that the overlay between pending_buf and d_buf+l_buf is
          // ok:
        } while (lx < last_lit);
      }

      send_code(END_BLOCK, ltree);
      last_eob_len = ltree[END_BLOCK * 2 + 1];
    }

    // Flush the bit buffer and align the output on a byte boundary
    function bi_windup() {
      if (bi_valid > 8) {
        put_short(bi_buf);
      } else if (bi_valid > 0) {
        put_byte(bi_buf & 0xff);
      }
      bi_buf = 0;
      bi_valid = 0;
    }

    // Copy a stored block, storing first the length and its
    // one's complement if requested.
    function copy_block(
      buf, // the input data
      len, // its length
      header // true if block header must be written
    ) {
      bi_windup(); // align on byte boundary
      last_eob_len = 8; // enough lookahead for inflate

      if (header) {
        put_short(len);
        put_short(~len);
      }

      that.pending_buf.set(window.subarray(buf, buf + len), that.pending);
      that.pending += len;
    }

    // Send a stored block
    function _tr_stored_block(
      buf, // input block
      stored_len, // length of input block
      eof // true if this is the last block for a file
    ) {
      send_bits((STORED_BLOCK << 1) + (eof ? 1 : 0), 3); // send block type
      copy_block(buf, stored_len, true); // with header
    }

    // Determine the best encoding for the current block: dynamic trees, static
    // trees or store, and output the encoded block to the zip file.
    function _tr_flush_block(
      buf, // input block, or NULL if too old
      stored_len, // length of input block
      eof // true if this is the last block for a file
    ) {
      var opt_lenb, static_lenb; // opt_len and static_len in bytes
      var max_blindex = 0; // index of last bit length code of non zero freq

      // Build the Huffman trees unless a stored block is forced
      if (level > 0) {
        // Construct the literal and distance trees
        l_desc.build_tree(that);

        d_desc.build_tree(that);

        // At this point, opt_len and static_len are the total bit lengths
        // of
        // the compressed block data, excluding the tree representations.

        // Build the bit length tree for the above two trees, and get the
        // index
        // in bl_order of the last bit length code to send.
        max_blindex = build_bl_tree();

        // Determine the best encoding. Compute first the block length in
        // bytes
        opt_lenb = (that.opt_len + 3 + 7) >>> 3;
        static_lenb = (that.static_len + 3 + 7) >>> 3;

        if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
      } else {
        opt_lenb = static_lenb = stored_len + 5; // force a stored block
      }

      if (stored_len + 4 <= opt_lenb && buf != -1) {
        // 4: two words for the lengths
        // The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
        // Otherwise we can't have processed more than WSIZE input bytes
        // since
        // the last block flush, because compression would have been
        // successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
        // transform a block into a stored block.
        _tr_stored_block(buf, stored_len, eof);
      } else if (static_lenb == opt_lenb) {
        send_bits((STATIC_TREES << 1) + (eof ? 1 : 0), 3);
        compress_block(StaticTree.static_ltree, StaticTree.static_dtree);
      } else {
        send_bits((DYN_TREES << 1) + (eof ? 1 : 0), 3);
        send_all_trees(
          l_desc.max_code + 1,
          d_desc.max_code + 1,
          max_blindex + 1
        );
        compress_block(dyn_ltree, dyn_dtree);
      }

      // The above check is made mod 2^32, for files larger than 512 MB
      // and uLong implemented on 32 bits.

      init_block();

      if (eof) {
        bi_windup();
      }
    }

    function flush_block_only(eof) {
      _tr_flush_block(
        block_start >= 0 ? block_start : -1,
        strstart - block_start,
        eof
      );
      block_start = strstart;
      strm.flush_pending();
    }

    // Fill the window when the lookahead becomes insufficient.
    // Updates strstart and lookahead.
    //
    // IN assertion: lookahead < MIN_LOOKAHEAD
    // OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
    // At least one byte has been read, or avail_in === 0; reads are
    // performed for at least two bytes (required for the zip translate_eol
    // option -- not supported here).
    function fill_window() {
      var n, m;
      var p;
      var more; // Amount of free space at the end of the window.

      do {
        more = window_size - lookahead - strstart;

        // Deal with !@#$% 64K limit:
        if (more === 0 && strstart === 0 && lookahead === 0) {
          more = w_size;
        } else if (more == -1) {
          // Very unlikely, but possible on 16 bit machine if strstart ==
          // 0
          // and lookahead == 1 (input done one byte at time)
          more--;

          // If the window is almost full and there is insufficient
          // lookahead,
          // move the upper half to the lower one to make room in the
          // upper half.
        } else if (strstart >= w_size + w_size - MIN_LOOKAHEAD) {
          window.set(window.subarray(w_size, w_size + w_size), 0);

          match_start -= w_size;
          strstart -= w_size; // we now have strstart >= MAX_DIST
          block_start -= w_size;

          // Slide the hash table (could be avoided with 32 bit values
          // at the expense of memory usage). We slide even when level ==
          // 0
          // to keep the hash table consistent if we switch back to level
          // > 0
          // later. (Using level 0 permanently is not an optimal usage of
          // zlib, so we don't care about this pathological case.)

          n = hash_size;
          p = n;
          do {
            m = head[--p] & 0xffff;
            head[p] = m >= w_size ? m - w_size : 0;
          } while (--n !== 0);

          n = w_size;
          p = n;
          do {
            m = prev[--p] & 0xffff;
            prev[p] = m >= w_size ? m - w_size : 0;
            // If n is not on any hash chain, prev[n] is garbage but
            // its value will never be used.
          } while (--n !== 0);
          more += w_size;
        }

        if (strm.avail_in === 0) return;

        // If there was no sliding:
        // strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
        // more == window_size - lookahead - strstart
        // => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
        // => more >= window_size - 2*WSIZE + 2
        // In the BIG_MEM or MMAP case (not yet supported),
        // window_size == input_size + MIN_LOOKAHEAD &&
        // strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
        // Otherwise, window_size == 2*WSIZE so more >= 2.
        // If there was sliding, more >= WSIZE. So in all cases, more >= 2.

        n = strm.read_buf(window, strstart + lookahead, more);
        lookahead += n;

        // Initialize the hash value now that we have some input:
        if (lookahead >= MIN_MATCH) {
          ins_h = window[strstart] & 0xff;
          ins_h =
            ((ins_h << hash_shift) ^ (window[strstart + 1] & 0xff)) & hash_mask;
        }
        // If the whole input has less than MIN_MATCH bytes, ins_h is
        // garbage,
        // but this is not important since only literal bytes will be
        // emitted.
      } while (lookahead < MIN_LOOKAHEAD && strm.avail_in !== 0);
    }

    // Copy without compression as much as possible from the input stream,
    // return
    // the current block state.
    // This function does not insert new strings in the dictionary since
    // uncompressible data is probably not useful. This function is used
    // only for the level=0 compression option.
    // NOTE: this function should be optimized to avoid extra copying from
    // window to pending_buf.
    function deflate_stored(flush) {
      // Stored blocks are limited to 0xffff bytes, pending_buf is limited
      // to pending_buf_size, and each stored block has a 5 byte header:

      var max_block_size = 0xffff;
      var max_start;

      if (max_block_size > pending_buf_size - 5) {
        max_block_size = pending_buf_size - 5;
      }

      // Copy as much as possible from input to output:
      while (true) {
        // Fill the window as much as possible:
        if (lookahead <= 1) {
          fill_window();
          if (lookahead === 0 && flush == Z_NO_FLUSH) return NeedMore;
          if (lookahead === 0) break; // flush the current block
        }

        strstart += lookahead;
        lookahead = 0;

        // Emit a stored block if pending_buf will be full:
        max_start = block_start + max_block_size;
        if (strstart === 0 || strstart >= max_start) {
          // strstart === 0 is possible when wraparound on 16-bit machine
          lookahead = strstart - max_start;
          strstart = max_start;

          flush_block_only(false);
          if (strm.avail_out === 0) return NeedMore;
        }

        // Flush if we may have to slide, otherwise block_start may become
        // negative and the data will be gone:
        if (strstart - block_start >= w_size - MIN_LOOKAHEAD) {
          flush_block_only(false);
          if (strm.avail_out === 0) return NeedMore;
        }
      }

      flush_block_only(flush == Z_FINISH);
      if (strm.avail_out === 0)
        return flush == Z_FINISH ? FinishStarted : NeedMore;

      return flush == Z_FINISH ? FinishDone : BlockDone;
    }

    function longest_match(cur_match) {
      var chain_length = max_chain_length; // max hash chain length
      var scan = strstart; // current string
      var match; // matched string
      var len; // length of current match
      var best_len = prev_length; // best match length so far
      var limit =
        strstart > w_size - MIN_LOOKAHEAD
          ? strstart - (w_size - MIN_LOOKAHEAD)
          : 0;
      var _nice_match = nice_match;

      // Stop when cur_match becomes <= limit. To simplify the code,
      // we prevent matches with the string of window index 0.

      var wmask = w_mask;

      var strend = strstart + MAX_MATCH;
      var scan_end1 = window[scan + best_len - 1];
      var scan_end = window[scan + best_len];

      // The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of
      // 16.
      // It is easy to get rid of this optimization if necessary.

      // Do not waste too much time if we already have a good match:
      if (prev_length >= good_match) {
        chain_length >>= 2;
      }

      // Do not look for matches beyond the end of the input. This is
      // necessary
      // to make deflate deterministic.
      if (_nice_match > lookahead) _nice_match = lookahead;

      do {
        match = cur_match;

        // Skip to next match if the match length cannot increase
        // or if the match length is less than 2:
        if (
          window[match + best_len] != scan_end ||
          window[match + best_len - 1] != scan_end1 ||
          window[match] != window[scan] ||
          window[++match] != window[scan + 1]
        )
          continue;

        // The check at best_len-1 can be removed because it will be made
        // again later. (This heuristic is not always a win.)
        // It is not necessary to compare scan[2] and match[2] since they
        // are always equal when the other bytes match, given that
        // the hash keys are equal and that HASH_BITS >= 8.
        scan += 2;
        match++;

        // We check for insufficient lookahead only every 8th comparison;
        // the 256th check will be made at strstart+258.
        do {} while (
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          window[++scan] == window[++match] &&
          scan < strend
        );

        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;

        if (len > best_len) {
          match_start = cur_match;
          best_len = len;
          if (len >= _nice_match) break;
          scan_end1 = window[scan + best_len - 1];
          scan_end = window[scan + best_len];
        }
      } while (
        (cur_match = prev[cur_match & wmask] & 0xffff) > limit &&
        --chain_length !== 0
      );

      if (best_len <= lookahead) return best_len;
      return lookahead;
    }

    // Compress as much as possible from the input stream, return the current
    // block state.
    // This function does not perform lazy evaluation of matches and inserts
    // new strings in the dictionary only for unmatched strings or for short
    // matches. It is used only for the fast compression options.
    function deflate_fast(flush) {
      // short hash_head = 0; // head of the hash chain
      var hash_head = 0; // head of the hash chain
      var bflush; // set if current block must be flushed

      while (true) {
        // Make sure that we always have enough lookahead, except
        // at the end of the input file. We need MAX_MATCH bytes
        // for the next match, plus MIN_MATCH bytes to insert the
        // string following the next match.
        if (lookahead < MIN_LOOKAHEAD) {
          fill_window();
          if (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {
            return NeedMore;
          }
          if (lookahead === 0) break; // flush the current block
        }

        // Insert the string window[strstart .. strstart+2] in the
        // dictionary, and set hash_head to the head of the hash chain:
        if (lookahead >= MIN_MATCH) {
          ins_h =
            ((ins_h << hash_shift) ^
              (window[strstart + (MIN_MATCH - 1)] & 0xff)) &
            hash_mask;

          // prev[strstart&w_mask]=hash_head=head[ins_h];
          hash_head = head[ins_h] & 0xffff;
          prev[strstart & w_mask] = head[ins_h];
          head[ins_h] = strstart;
        }

        // Find the longest match, discarding those <= prev_length.
        // At this point we have always match_length < MIN_MATCH

        if (
          hash_head !== 0 &&
          ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD
        ) {
          // To simplify the code, we prevent matches with the string
          // of window index 0 (in particular we have to avoid a match
          // of the string with itself at the start of the input file).
          if (strategy != Z_HUFFMAN_ONLY) {
            match_length = longest_match(hash_head);
          }
          // longest_match() sets match_start
        }
        if (match_length >= MIN_MATCH) {
          // check_match(strstart, match_start, match_length);

          bflush = _tr_tally(strstart - match_start, match_length - MIN_MATCH);

          lookahead -= match_length;

          // Insert new strings in the hash table only if the match length
          // is not too large. This saves time but degrades compression.
          if (match_length <= max_lazy_match && lookahead >= MIN_MATCH) {
            match_length--; // string at strstart already in hash table
            do {
              strstart++;

              ins_h =
                ((ins_h << hash_shift) ^
                  (window[strstart + (MIN_MATCH - 1)] & 0xff)) &
                hash_mask;
              // prev[strstart&w_mask]=hash_head=head[ins_h];
              hash_head = head[ins_h] & 0xffff;
              prev[strstart & w_mask] = head[ins_h];
              head[ins_h] = strstart;

              // strstart never exceeds WSIZE-MAX_MATCH, so there are
              // always MIN_MATCH bytes ahead.
            } while (--match_length !== 0);
            strstart++;
          } else {
            strstart += match_length;
            match_length = 0;
            ins_h = window[strstart] & 0xff;

            ins_h =
              ((ins_h << hash_shift) ^ (window[strstart + 1] & 0xff)) &
              hash_mask;
            // If lookahead < MIN_MATCH, ins_h is garbage, but it does
            // not
            // matter since it will be recomputed at next deflate call.
          }
        } else {
          // No match, output a literal byte

          bflush = _tr_tally(0, window[strstart] & 0xff);
          lookahead--;
          strstart++;
        }
        if (bflush) {
          flush_block_only(false);
          if (strm.avail_out === 0) return NeedMore;
        }
      }

      flush_block_only(flush == Z_FINISH);
      if (strm.avail_out === 0) {
        if (flush == Z_FINISH) return FinishStarted;
        else return NeedMore;
      }
      return flush == Z_FINISH ? FinishDone : BlockDone;
    }

    // Same as above, but achieves better compression. We use a lazy
    // evaluation for matches: a match is finally adopted only if there is
    // no better match at the next window position.
    function deflate_slow(flush) {
      // short hash_head = 0; // head of hash chain
      var hash_head = 0; // head of hash chain
      var bflush; // set if current block must be flushed
      var max_insert;

      // Process the input block.
      while (true) {
        // Make sure that we always have enough lookahead, except
        // at the end of the input file. We need MAX_MATCH bytes
        // for the next match, plus MIN_MATCH bytes to insert the
        // string following the next match.

        if (lookahead < MIN_LOOKAHEAD) {
          fill_window();
          if (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {
            return NeedMore;
          }
          if (lookahead === 0) break; // flush the current block
        }

        // Insert the string window[strstart .. strstart+2] in the
        // dictionary, and set hash_head to the head of the hash chain:

        if (lookahead >= MIN_MATCH) {
          ins_h =
            ((ins_h << hash_shift) ^
              (window[strstart + (MIN_MATCH - 1)] & 0xff)) &
            hash_mask;
          // prev[strstart&w_mask]=hash_head=head[ins_h];
          hash_head = head[ins_h] & 0xffff;
          prev[strstart & w_mask] = head[ins_h];
          head[ins_h] = strstart;
        }

        // Find the longest match, discarding those <= prev_length.
        prev_length = match_length;
        prev_match = match_start;
        match_length = MIN_MATCH - 1;

        if (
          hash_head !== 0 &&
          prev_length < max_lazy_match &&
          ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD
        ) {
          // To simplify the code, we prevent matches with the string
          // of window index 0 (in particular we have to avoid a match
          // of the string with itself at the start of the input file).

          if (strategy != Z_HUFFMAN_ONLY) {
            match_length = longest_match(hash_head);
          }
          // longest_match() sets match_start

          if (
            match_length <= 5 &&
            (strategy == Z_FILTERED ||
              (match_length == MIN_MATCH && strstart - match_start > 4096))
          ) {
            // If prev_match is also MIN_MATCH, match_start is garbage
            // but we will ignore the current match anyway.
            match_length = MIN_MATCH - 1;
          }
        }

        // If there was a match at the previous step and the current
        // match is not better, output the previous match:
        if (prev_length >= MIN_MATCH && match_length <= prev_length) {
          max_insert = strstart + lookahead - MIN_MATCH;
          // Do not insert strings in hash table beyond this.

          // check_match(strstart-1, prev_match, prev_length);

          bflush = _tr_tally(
            strstart - 1 - prev_match,
            prev_length - MIN_MATCH
          );

          // Insert in hash table all strings up to the end of the match.
          // strstart-1 and strstart are already inserted. If there is not
          // enough lookahead, the last two strings are not inserted in
          // the hash table.
          lookahead -= prev_length - 1;
          prev_length -= 2;
          do {
            if (++strstart <= max_insert) {
              ins_h =
                ((ins_h << hash_shift) ^
                  (window[strstart + (MIN_MATCH - 1)] & 0xff)) &
                hash_mask;
              // prev[strstart&w_mask]=hash_head=head[ins_h];
              hash_head = head[ins_h] & 0xffff;
              prev[strstart & w_mask] = head[ins_h];
              head[ins_h] = strstart;
            }
          } while (--prev_length !== 0);
          match_available = 0;
          match_length = MIN_MATCH - 1;
          strstart++;

          if (bflush) {
            flush_block_only(false);
            if (strm.avail_out === 0) return NeedMore;
          }
        } else if (match_available !== 0) {
          // If there was no match at the previous position, output a
          // single literal. If there was a match but the current match
          // is longer, truncate the previous match to a single literal.

          bflush = _tr_tally(0, window[strstart - 1] & 0xff);

          if (bflush) {
            flush_block_only(false);
          }
          strstart++;
          lookahead--;
          if (strm.avail_out === 0) return NeedMore;
        } else {
          // There is no previous match to compare with, wait for
          // the next step to decide.

          match_available = 1;
          strstart++;
          lookahead--;
        }
      }

      if (match_available !== 0) {
        bflush = _tr_tally(0, window[strstart - 1] & 0xff);
        match_available = 0;
      }
      flush_block_only(flush == Z_FINISH);

      if (strm.avail_out === 0) {
        if (flush == Z_FINISH) return FinishStarted;
        else return NeedMore;
      }

      return flush == Z_FINISH ? FinishDone : BlockDone;
    }

    function deflateReset(strm) {
      strm.total_in = strm.total_out = 0;
      strm.msg = null; //

      that.pending = 0;
      that.pending_out = 0;

      status = BUSY_STATE;

      last_flush = Z_NO_FLUSH;

      tr_init();
      lm_init();
      return Z_OK;
    }

    that.deflateInit = function(
      strm,
      _level,
      bits,
      _method,
      memLevel,
      _strategy
    ) {
      if (!_method) _method = Z_DEFLATED;
      if (!memLevel) memLevel = DEF_MEM_LEVEL;
      if (!_strategy) _strategy = Z_DEFAULT_STRATEGY;

      // byte[] my_version=ZLIB_VERSION;

      //
      // if (!version || version[0] != my_version[0]
      // || stream_size != sizeof(z_stream)) {
      // return Z_VERSION_ERROR;
      // }

      strm.msg = null;

      if (_level == Z_DEFAULT_COMPRESSION) _level = 6;

      if (
        memLevel < 1 ||
        memLevel > MAX_MEM_LEVEL ||
        _method != Z_DEFLATED ||
        bits < 9 ||
        bits > 15 ||
        _level < 0 ||
        _level > 9 ||
        _strategy < 0 ||
        _strategy > Z_HUFFMAN_ONLY
      ) {
        return Z_STREAM_ERROR;
      }

      strm.dstate = that;

      w_bits = bits;
      w_size = 1 << w_bits;
      w_mask = w_size - 1;

      hash_bits = memLevel + 7;
      hash_size = 1 << hash_bits;
      hash_mask = hash_size - 1;
      hash_shift = Math.floor((hash_bits + MIN_MATCH - 1) / MIN_MATCH);

      window = new Uint8Array(w_size * 2);
      prev = [];
      head = [];

      lit_bufsize = 1 << (memLevel + 6); // 16K elements by default

      // We overlay pending_buf and d_buf+l_buf. This works since the average
      // output size for (length,distance) codes is <= 24 bits.
      that.pending_buf = new Uint8Array(lit_bufsize * 4);
      pending_buf_size = lit_bufsize * 4;

      d_buf = Math.floor(lit_bufsize / 2);
      l_buf = (1 + 2) * lit_bufsize;

      level = _level;

      strategy = _strategy;
      method = _method & 0xff;

      return deflateReset(strm);
    };

    that.deflateEnd = function() {
      if (
        status != INIT_STATE &&
        status != BUSY_STATE &&
        status != FINISH_STATE
      ) {
        return Z_STREAM_ERROR;
      }
      // Deallocate in reverse order of allocations:
      that.pending_buf = null;
      head = null;
      prev = null;
      window = null;
      // free
      that.dstate = null;
      return status == BUSY_STATE ? Z_DATA_ERROR : Z_OK;
    };

    that.deflateParams = function(strm, _level, _strategy) {
      var err = Z_OK;

      if (_level == Z_DEFAULT_COMPRESSION) {
        _level = 6;
      }
      if (
        _level < 0 ||
        _level > 9 ||
        _strategy < 0 ||
        _strategy > Z_HUFFMAN_ONLY
      ) {
        return Z_STREAM_ERROR;
      }

      if (
        config_table[level].func != config_table[_level].func &&
        strm.total_in !== 0
      ) {
        // Flush the last buffer:
        err = strm.deflate(Z_PARTIAL_FLUSH);
      }

      if (level != _level) {
        level = _level;
        max_lazy_match = config_table[level].max_lazy;
        good_match = config_table[level].good_length;
        nice_match = config_table[level].nice_length;
        max_chain_length = config_table[level].max_chain;
      }
      strategy = _strategy;
      return err;
    };

    that.deflateSetDictionary = function(strm, dictionary, dictLength) {
      var length = dictLength;
      var n,
        index = 0;

      if (!dictionary || status != INIT_STATE) return Z_STREAM_ERROR;

      if (length < MIN_MATCH) return Z_OK;
      if (length > w_size - MIN_LOOKAHEAD) {
        length = w_size - MIN_LOOKAHEAD;
        index = dictLength - length; // use the tail of the dictionary
      }
      window.set(dictionary.subarray(index, index + length), 0);

      strstart = length;
      block_start = length;

      // Insert all strings in the hash table (except for the last two bytes).
      // s->lookahead stays null, so s->ins_h will be recomputed at the next
      // call of fill_window.

      ins_h = window[0] & 0xff;
      ins_h = ((ins_h << hash_shift) ^ (window[1] & 0xff)) & hash_mask;

      for (n = 0; n <= length - MIN_MATCH; n++) {
        ins_h =
          ((ins_h << hash_shift) ^ (window[n + (MIN_MATCH - 1)] & 0xff)) &
          hash_mask;
        prev[n & w_mask] = head[ins_h];
        head[ins_h] = n;
      }
      return Z_OK;
    };

    that.deflate = function(_strm, flush) {
      var i, header, level_flags, old_flush, bstate;

      if (flush > Z_FINISH || flush < 0) {
        return Z_STREAM_ERROR;
      }

      if (
        !_strm.next_out ||
        (!_strm.next_in && _strm.avail_in !== 0) ||
        (status == FINISH_STATE && flush != Z_FINISH)
      ) {
        _strm.msg = z_errmsg[Z_NEED_DICT - Z_STREAM_ERROR];
        return Z_STREAM_ERROR;
      }
      if (_strm.avail_out === 0) {
        _strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
        return Z_BUF_ERROR;
      }

      strm = _strm; // just in case
      old_flush = last_flush;
      last_flush = flush;

      // Write the zlib header
      if (status == INIT_STATE) {
        header = (Z_DEFLATED + ((w_bits - 8) << 4)) << 8;
        level_flags = ((level - 1) & 0xff) >> 1;

        if (level_flags > 3) level_flags = 3;
        header |= level_flags << 6;
        if (strstart !== 0) header |= PRESET_DICT;
        header += 31 - header % 31;

        status = BUSY_STATE;
        putShortMSB(header);
      }

      // Flush as much pending output as possible
      if (that.pending !== 0) {
        strm.flush_pending();
        if (strm.avail_out === 0) {
          // console.log(" avail_out==0");
          // Since avail_out is 0, deflate will be called again with
          // more output space, but possibly with both pending and
          // avail_in equal to zero. There won't be anything to do,
          // but this is not an error situation so make sure we
          // return OK instead of BUF_ERROR at next call of deflate:
          last_flush = -1;
          return Z_OK;
        }

        // Make sure there is something to do and avoid duplicate
        // consecutive
        // flushes. For repeated and useless calls with Z_FINISH, we keep
        // returning Z_STREAM_END instead of Z_BUFF_ERROR.
      } else if (
        strm.avail_in === 0 &&
        flush <= old_flush &&
        flush != Z_FINISH
      ) {
        strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
        return Z_BUF_ERROR;
      }

      // User must not provide more input after the first FINISH:
      if (status == FINISH_STATE && strm.avail_in !== 0) {
        _strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
        return Z_BUF_ERROR;
      }

      // Start a new block or continue the current one.
      if (
        strm.avail_in !== 0 ||
        lookahead !== 0 ||
        (flush != Z_NO_FLUSH && status != FINISH_STATE)
      ) {
        bstate = -1;
        switch (config_table[level].func) {
          case STORED:
            bstate = deflate_stored(flush);
            break;
          case FAST:
            bstate = deflate_fast(flush);
            break;
          case SLOW:
            bstate = deflate_slow(flush);
            break;
          default:
        }

        if (bstate == FinishStarted || bstate == FinishDone) {
          status = FINISH_STATE;
        }
        if (bstate == NeedMore || bstate == FinishStarted) {
          if (strm.avail_out === 0) {
            last_flush = -1; // avoid BUF_ERROR next call, see above
          }
          return Z_OK;
          // If flush != Z_NO_FLUSH && avail_out === 0, the next call
          // of deflate should use the same flush parameter to make sure
          // that the flush is complete. So we don't have to output an
          // empty block here, this will be done at next call. This also
          // ensures that for a very small output buffer, we emit at most
          // one empty block.
        }

        if (bstate == BlockDone) {
          if (flush == Z_PARTIAL_FLUSH) {
            _tr_align();
          } else {
            // FULL_FLUSH or SYNC_FLUSH
            _tr_stored_block(0, 0, false);
            // For a full flush, this empty block will be recognized
            // as a special marker by inflate_sync().
            if (flush == Z_FULL_FLUSH) {
              // state.head[s.hash_size-1]=0;
              for (i = 0; i < hash_size /*-1*/; i++)
                // forget history
                head[i] = 0;
            }
          }
          strm.flush_pending();
          if (strm.avail_out === 0) {
            last_flush = -1; // avoid BUF_ERROR at next call, see above
            return Z_OK;
          }
        }
      }

      if (flush != Z_FINISH) return Z_OK;
      return Z_STREAM_END;
    };
  }

  // ZStream

  function ZStream() {
    var that = this;
    that.next_in_index = 0;
    that.next_out_index = 0;
    // that.next_in; // next input byte
    that.avail_in = 0; // number of bytes available at next_in
    that.total_in = 0; // total nb of input bytes read so far
    // that.next_out; // next output byte should be put there
    that.avail_out = 0; // remaining free space at next_out
    that.total_out = 0; // total nb of bytes output so far
    // that.msg;
    // that.dstate;
  }

  ZStream.prototype = {
    deflateInit: function(level, bits) {
      var that = this;
      that.dstate = new Deflate();
      if (!bits) bits = MAX_BITS;
      return that.dstate.deflateInit(that, level, bits);
    },

    deflate: function(flush) {
      var that = this;
      if (!that.dstate) {
        return Z_STREAM_ERROR;
      }
      return that.dstate.deflate(that, flush);
    },

    deflateEnd: function() {
      var that = this;
      if (!that.dstate) return Z_STREAM_ERROR;
      var ret = that.dstate.deflateEnd();
      that.dstate = null;
      return ret;
    },

    deflateParams: function(level, strategy) {
      var that = this;
      if (!that.dstate) return Z_STREAM_ERROR;
      return that.dstate.deflateParams(that, level, strategy);
    },

    deflateSetDictionary: function(dictionary, dictLength) {
      var that = this;
      if (!that.dstate) return Z_STREAM_ERROR;
      return that.dstate.deflateSetDictionary(that, dictionary, dictLength);
    },

    // Read a new buffer from the current input stream, update the
    // total number of bytes read. All deflate() input goes through
    // this function so some applications may wish to modify it to avoid
    // allocating a large strm->next_in buffer and copying from it.
    // (See also flush_pending()).
    read_buf: function(buf, start, size) {
      var that = this;
      var len = that.avail_in;
      if (len > size) len = size;
      if (len === 0) return 0;
      that.avail_in -= len;
      buf.set(
        that.next_in.subarray(that.next_in_index, that.next_in_index + len),
        start
      );
      that.next_in_index += len;
      that.total_in += len;
      return len;
    },

    // Flush as much pending output as possible. All deflate() output goes
    // through this function so some applications may wish to modify it
    // to avoid allocating a large strm->next_out buffer and copying into it.
    // (See also read_buf()).
    flush_pending: function() {
      var that = this;
      var len = that.dstate.pending;

      if (len > that.avail_out) len = that.avail_out;
      if (len === 0) return;

      // if (that.dstate.pending_buf.length <= that.dstate.pending_out || that.next_out.length <= that.next_out_index
      // || that.dstate.pending_buf.length < (that.dstate.pending_out + len) || that.next_out.length < (that.next_out_index +
      // len)) {
      // console.log(that.dstate.pending_buf.length + ", " + that.dstate.pending_out + ", " + that.next_out.length + ", " +
      // that.next_out_index + ", " + len);
      // console.log("avail_out=" + that.avail_out);
      // }

      that.next_out.set(
        that.dstate.pending_buf.subarray(
          that.dstate.pending_out,
          that.dstate.pending_out + len
        ),
        that.next_out_index
      );

      that.next_out_index += len;
      that.dstate.pending_out += len;
      that.total_out += len;
      that.avail_out -= len;
      that.dstate.pending -= len;
      if (that.dstate.pending === 0) {
        that.dstate.pending_out = 0;
      }
    }
  };

  // Deflater

  return function Deflater(level) {
    var that = this;
    var z = new ZStream();
    var bufsize = 512;
    var flush = Z_NO_FLUSH;
    var buf = new Uint8Array(bufsize);

    if (typeof level == 'undefined') level = Z_DEFAULT_COMPRESSION;
    z.deflateInit(level);
    z.next_out = buf;

    that.append = function(data, onprogress) {
      var err,
        buffers = [],
        lastIndex = 0,
        bufferIndex = 0,
        bufferSize = 0,
        array;
      if (!data.length) return;
      z.next_in_index = 0;
      z.next_in = data;
      z.avail_in = data.length;
      do {
        z.next_out_index = 0;
        z.avail_out = bufsize;
        err = z.deflate(flush);
        if (err != Z_OK) throw 'deflating: ' + z.msg;
        if (z.next_out_index)
          if (z.next_out_index == bufsize) buffers.push(new Uint8Array(buf));
          else buffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));
        bufferSize += z.next_out_index;
        if (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {
          onprogress(z.next_in_index);
          lastIndex = z.next_in_index;
        }
      } while (z.avail_in > 0 || z.avail_out === 0);
      array = new Uint8Array(bufferSize);
      buffers.forEach(function(chunk) {
        array.set(chunk, bufferIndex);
        bufferIndex += chunk.length;
      });
      return array;
    };
    that.flush = function() {
      var err,
        buffers = [],
        bufferIndex = 0,
        bufferSize = 0,
        array;
      do {
        z.next_out_index = 0;
        z.avail_out = bufsize;
        err = z.deflate(Z_FINISH);
        if (err != Z_STREAM_END && err != Z_OK) throw 'deflating: ' + z.msg;
        if (bufsize - z.avail_out > 0)
          buffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));
        bufferSize += z.next_out_index;
      } while (z.avail_in > 0 || z.avail_out === 0);
      z.deflateEnd();
      array = new Uint8Array(bufferSize);
      buffers.forEach(function(chunk) {
        array.set(chunk, bufferIndex);
        bufferIndex += chunk.length;
      });
      return array;
    };
  };
})(this);
// Generated by CoffeeScript 1.4.0

/*
# PNG.js
# Copyright (c) 2011 Devon Govett
# MIT LICENSE
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
# to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or
# substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function(global) {
  var PNG;

  PNG = (function() {
    var APNG_BLEND_OP_OVER,
      APNG_BLEND_OP_SOURCE,
      APNG_DISPOSE_OP_BACKGROUND,
      APNG_DISPOSE_OP_NONE,
      APNG_DISPOSE_OP_PREVIOUS,
      makeImage,
      scratchCanvas,
      scratchCtx;

    PNG.load = function(url, canvas, callback) {
      var xhr,
        _this = this;
      if (typeof canvas === 'function') {
        callback = canvas;
      }
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        var data, png;
        data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
        png = new PNG(data);
        if (
          typeof (canvas != null ? canvas.getContext : void 0) === 'function'
        ) {
          png.render(canvas);
        }
        return typeof callback === 'function' ? callback(png) : void 0;
      };
      return xhr.send(null);
    };

    APNG_DISPOSE_OP_NONE = 0;

    APNG_DISPOSE_OP_BACKGROUND = 1;

    APNG_DISPOSE_OP_PREVIOUS = 2;

    APNG_BLEND_OP_SOURCE = 0;

    APNG_BLEND_OP_OVER = 1;

    function PNG(data) {
      var chunkSize,
        colors,
        palLen,
        delayDen,
        delayNum,
        frame,
        i,
        index,
        key,
        section,
        palShort,
        text,
        _i,
        _j,
        _ref;
      this.data = data;
      this.pos = 8;
      this.palette = [];
      this.imgData = [];
      this.transparency = {};
      this.animation = null;
      this.text = {};
      frame = null;
      while (true) {
        chunkSize = this.readUInt32();
        section = function() {
          var _i, _results;
          _results = [];
          for (i = _i = 0; _i < 4; i = ++_i) {
            _results.push(String.fromCharCode(this.data[this.pos++]));
          }
          return _results;
        }
          .call(this)
          .join('');
        switch (section) {
          case 'IHDR':
            this.width = this.readUInt32();
            this.height = this.readUInt32();
            this.bits = this.data[this.pos++];
            this.colorType = this.data[this.pos++];
            this.compressionMethod = this.data[this.pos++];
            this.filterMethod = this.data[this.pos++];
            this.interlaceMethod = this.data[this.pos++];
            break;
          case 'acTL':
            this.animation = {
              numFrames: this.readUInt32(),
              numPlays: this.readUInt32() || Infinity,
              frames: []
            };
            break;
          case 'PLTE':
            this.palette = this.read(chunkSize);
            break;
          case 'fcTL':
            if (frame) {
              this.animation.frames.push(frame);
            }
            this.pos += 4;
            frame = {
              width: this.readUInt32(),
              height: this.readUInt32(),
              xOffset: this.readUInt32(),
              yOffset: this.readUInt32()
            };
            delayNum = this.readUInt16();
            delayDen = this.readUInt16() || 100;
            frame.delay = 1000 * delayNum / delayDen;
            frame.disposeOp = this.data[this.pos++];
            frame.blendOp = this.data[this.pos++];
            frame.data = [];
            break;
          case 'IDAT':
          case 'fdAT':
            if (section === 'fdAT') {
              this.pos += 4;
              chunkSize -= 4;
            }
            data = (frame != null ? frame.data : void 0) || this.imgData;
            for (
              i = _i = 0;
              0 <= chunkSize ? _i < chunkSize : _i > chunkSize;
              i = 0 <= chunkSize ? ++_i : --_i
            ) {
              data.push(this.data[this.pos++]);
            }
            break;
          case 'tRNS':
            this.transparency = {};
            switch (this.colorType) {
              case 3:
                palLen = this.palette.length / 3;
                this.transparency.indexed = this.read(chunkSize);
                if (this.transparency.indexed.length > palLen)
                  throw new Error('More transparent colors than palette size');
                /*
                 * According to the PNG spec trns should be increased to the same size as palette if shorter
                 */
                //palShort = 255 - this.transparency.indexed.length;
                palShort = palLen - this.transparency.indexed.length;
                if (palShort > 0) {
                  for (
                    i = _j = 0;
                    0 <= palShort ? _j < palShort : _j > palShort;
                    i = 0 <= palShort ? ++_j : --_j
                  ) {
                    this.transparency.indexed.push(255);
                  }
                }
                break;
              case 0:
                this.transparency.grayscale = this.read(chunkSize)[0];
                break;
              case 2:
                this.transparency.rgb = this.read(chunkSize);
            }
            break;
          case 'tEXt':
            text = this.read(chunkSize);
            index = text.indexOf(0);
            key = String.fromCharCode.apply(String, text.slice(0, index));
            this.text[key] = String.fromCharCode.apply(
              String,
              text.slice(index + 1)
            );
            break;
          case 'IEND':
            if (frame) {
              this.animation.frames.push(frame);
            }
            this.colors = function() {
              switch (this.colorType) {
                case 0:
                case 3:
                case 4:
                  return 1;
                case 2:
                case 6:
                  return 3;
              }
            }.call(this);
            this.hasAlphaChannel = (_ref = this.colorType) === 4 || _ref === 6;
            colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
            this.pixelBitlength = this.bits * colors;
            this.colorSpace = function() {
              switch (this.colors) {
                case 1:
                  return 'DeviceGray';
                case 3:
                  return 'DeviceRGB';
              }
            }.call(this);
            this.imgData = new Uint8Array(this.imgData);
            return;
          default:
            this.pos += chunkSize;
        }
        this.pos += 4;
        if (this.pos > this.data.length) {
          throw new Error('Incomplete or corrupt PNG file');
        }
      }
      return;
    }

    PNG.prototype.read = function(bytes) {
      var i, _i, _results;
      _results = [];
      for (
        i = _i = 0;
        0 <= bytes ? _i < bytes : _i > bytes;
        i = 0 <= bytes ? ++_i : --_i
      ) {
        _results.push(this.data[this.pos++]);
      }
      return _results;
    };

    PNG.prototype.readUInt32 = function() {
      var b1, b2, b3, b4;
      b1 = this.data[this.pos++] << 24;
      b2 = this.data[this.pos++] << 16;
      b3 = this.data[this.pos++] << 8;
      b4 = this.data[this.pos++];
      return b1 | b2 | b3 | b4;
    };

    PNG.prototype.readUInt16 = function() {
      var b1, b2;
      b1 = this.data[this.pos++] << 8;
      b2 = this.data[this.pos++];
      return b1 | b2;
    };

    PNG.prototype.decodePixels = function(data) {
      var abyte,
        c,
        col,
        i,
        left,
        length,
        p,
        pa,
        paeth,
        pb,
        pc,
        pixelBytes,
        pixels,
        pos,
        row,
        scanlineLength,
        upper,
        upperLeft,
        _i,
        _j,
        _k,
        _l,
        _m;
      if (data == null) {
        data = this.imgData;
      }
      if (data.length === 0) {
        return new Uint8Array(0);
      }
      data = new FlateStream(data);
      data = data.getBytes();
      pixelBytes = this.pixelBitlength / 8;
      scanlineLength = pixelBytes * this.width;
      pixels = new Uint8Array(scanlineLength * this.height);
      length = data.length;
      row = 0;
      pos = 0;
      c = 0;
      while (pos < length) {
        switch (data[pos++]) {
          case 0:
            for (i = _i = 0; _i < scanlineLength; i = _i += 1) {
              pixels[c++] = data[pos++];
            }
            break;
          case 1:
            for (i = _j = 0; _j < scanlineLength; i = _j += 1) {
              abyte = data[pos++];
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              pixels[c++] = (abyte + left) % 256;
            }
            break;
          case 2:
            for (i = _k = 0; _k < scanlineLength; i = _k += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              upper =
                row &&
                pixels[
                  (row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes
                ];
              pixels[c++] = (upper + abyte) % 256;
            }
            break;
          case 3:
            for (i = _l = 0; _l < scanlineLength; i = _l += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              upper =
                row &&
                pixels[
                  (row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes
                ];
              pixels[c++] = (abyte + Math.floor((left + upper) / 2)) % 256;
            }
            break;
          case 4:
            for (i = _m = 0; _m < scanlineLength; i = _m += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              if (row === 0) {
                upper = upperLeft = 0;
              } else {
                upper =
                  pixels[
                    (row - 1) * scanlineLength +
                      col * pixelBytes +
                      i % pixelBytes
                  ];
                upperLeft =
                  col &&
                  pixels[
                    (row - 1) * scanlineLength +
                      (col - 1) * pixelBytes +
                      i % pixelBytes
                  ];
              }
              p = left + upper - upperLeft;
              pa = Math.abs(p - left);
              pb = Math.abs(p - upper);
              pc = Math.abs(p - upperLeft);
              if (pa <= pb && pa <= pc) {
                paeth = left;
              } else if (pb <= pc) {
                paeth = upper;
              } else {
                paeth = upperLeft;
              }
              pixels[c++] = (abyte + paeth) % 256;
            }
            break;
          default:
            throw new Error('Invalid filter algorithm: ' + data[pos - 1]);
        }
        row++;
      }
      return pixels;
    };

    PNG.prototype.decodePalette = function() {
      var c, i, length, palette, pos, ret, transparency, _i, _ref, _ref1;
      palette = this.palette;
      transparency = this.transparency.indexed || [];
      ret = new Uint8Array((transparency.length || 0) + palette.length);
      pos = 0;
      length = palette.length;
      c = 0;
      for (i = _i = 0, _ref = palette.length; _i < _ref; i = _i += 3) {
        ret[pos++] = palette[i];
        ret[pos++] = palette[i + 1];
        ret[pos++] = palette[i + 2];
        ret[pos++] = (_ref1 = transparency[c++]) != null ? _ref1 : 255;
      }
      return ret;
    };

    PNG.prototype.copyToImageData = function(imageData, pixels) {
      var alpha, colors, data, i, input, j, k, length, palette, v, _ref;
      colors = this.colors;
      palette = null;
      alpha = this.hasAlphaChannel;
      if (this.palette.length) {
        palette =
          (_ref = this._decodedPalette) != null
            ? _ref
            : (this._decodedPalette = this.decodePalette());
        colors = 4;
        alpha = true;
      }
      data = imageData.data || imageData;
      length = data.length;
      input = palette || pixels;
      i = j = 0;
      if (colors === 1) {
        while (i < length) {
          k = palette ? pixels[i / 4] * 4 : j;
          v = input[k++];
          data[i++] = v;
          data[i++] = v;
          data[i++] = v;
          data[i++] = alpha ? input[k++] : 255;
          j = k;
        }
      } else {
        while (i < length) {
          k = palette ? pixels[i / 4] * 4 : j;
          data[i++] = input[k++];
          data[i++] = input[k++];
          data[i++] = input[k++];
          data[i++] = alpha ? input[k++] : 255;
          j = k;
        }
      }
    };

    PNG.prototype.decode = function() {
      var ret;
      ret = new Uint8Array(this.width * this.height * 4);
      this.copyToImageData(ret, this.decodePixels());
      return ret;
    };

    try {
      scratchCanvas = global.document.createElement('canvas');
      scratchCtx = scratchCanvas.getContext('2d');
    } catch (e) {
      return -1;
    }

    makeImage = function(imageData) {
      var img;
      scratchCtx.width = imageData.width;
      scratchCtx.height = imageData.height;
      scratchCtx.clearRect(0, 0, imageData.width, imageData.height);
      scratchCtx.putImageData(imageData, 0, 0);
      img = new Image();
      img.src = scratchCanvas.toDataURL();
      return img;
    };

    PNG.prototype.decodeFrames = function(ctx) {
      var frame, i, imageData, pixels, _i, _len, _ref, _results;
      if (!this.animation) {
        return;
      }
      _ref = this.animation.frames;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        frame = _ref[i];
        imageData = ctx.createImageData(frame.width, frame.height);
        pixels = this.decodePixels(new Uint8Array(frame.data));
        this.copyToImageData(imageData, pixels);
        frame.imageData = imageData;
        _results.push((frame.image = makeImage(imageData)));
      }
      return _results;
    };

    PNG.prototype.renderFrame = function(ctx, number) {
      var frame, frames, prev;
      frames = this.animation.frames;
      frame = frames[number];
      prev = frames[number - 1];
      if (number === 0) {
        ctx.clearRect(0, 0, this.width, this.height);
      }
      if (
        (prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_BACKGROUND
      ) {
        ctx.clearRect(prev.xOffset, prev.yOffset, prev.width, prev.height);
      } else if (
        (prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_PREVIOUS
      ) {
        ctx.putImageData(prev.imageData, prev.xOffset, prev.yOffset);
      }
      if (frame.blendOp === APNG_BLEND_OP_SOURCE) {
        ctx.clearRect(frame.xOffset, frame.yOffset, frame.width, frame.height);
      }
      return ctx.drawImage(frame.image, frame.xOffset, frame.yOffset);
    };

    PNG.prototype.animate = function(ctx) {
      var doFrame,
        frameNumber,
        frames,
        numFrames,
        numPlays,
        _ref,
        _this = this;
      frameNumber = 0;
      (_ref = this.animation), (numFrames = _ref.numFrames), (frames =
        _ref.frames), (numPlays = _ref.numPlays);
      return (doFrame = function() {
        var f, frame;
        f = frameNumber++ % numFrames;
        frame = frames[f];
        _this.renderFrame(ctx, f);
        if (numFrames > 1 && frameNumber / numFrames < numPlays) {
          return (_this.animation._timeout = setTimeout(doFrame, frame.delay));
        }
      })();
    };

    PNG.prototype.stopAnimation = function() {
      var _ref;
      return clearTimeout(
        (_ref = this.animation) != null ? _ref._timeout : void 0
      );
    };

    PNG.prototype.render = function(canvas) {
      var ctx, data;
      if (canvas._png) {
        canvas._png.stopAnimation();
      }
      canvas._png = this;
      canvas.width = this.width;
      canvas.height = this.height;
      ctx = canvas.getContext('2d');
      if (this.animation) {
        this.decodeFrames(ctx);
        return this.animate(ctx);
      } else {
        data = ctx.createImageData(this.width, this.height);
        this.copyToImageData(data, this.decodePixels());
        return ctx.putImageData(data, 0, 0);
      }
    };

    return PNG;
  })();

  global.PNG = PNG;
})((typeof window !== 'undefined' && window) || this);
/*
 * Extracted from pdf.js
 * https://github.com/andreasgal/pdf.js
 *
 * Copyright (c) 2011 Mozilla Foundation
 *
 * Contributors: Andreas Gal <gal@mozilla.com>
 *               Chris G Jones <cjones@mozilla.com>
 *               Shaon Barman <shaon.barman@gmail.com>
 *               Vivien Nicolas <21@vingtetun.org>
 *               Justin D'Arcangelo <justindarc@gmail.com>
 *               Yury Delendik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var DecodeStream = (function() {
  function constructor() {
    this.pos = 0;
    this.bufferLength = 0;
    this.eof = false;
    this.buffer = null;
  }

  constructor.prototype = {
    ensureBuffer: function decodestream_ensureBuffer(requested) {
      var buffer = this.buffer;
      var current = buffer ? buffer.byteLength : 0;
      if (requested < current) return buffer;
      var size = 512;
      while (size < requested) size <<= 1;
      var buffer2 = new Uint8Array(size);
      for (var i = 0; i < current; ++i) buffer2[i] = buffer[i];
      return (this.buffer = buffer2);
    },
    getByte: function decodestream_getByte() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }
      return this.buffer[this.pos++];
    },
    getBytes: function decodestream_getBytes(length) {
      var pos = this.pos;

      if (length) {
        this.ensureBuffer(pos + length);
        var end = pos + length;

        while (!this.eof && this.bufferLength < end) this.readBlock();

        var bufEnd = this.bufferLength;
        if (end > bufEnd) end = bufEnd;
      } else {
        while (!this.eof) this.readBlock();

        var end = this.bufferLength;
      }

      this.pos = end;
      return this.buffer.subarray(pos, end);
    },
    lookChar: function decodestream_lookChar() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }
      return String.fromCharCode(this.buffer[this.pos]);
    },
    getChar: function decodestream_getChar() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }
      return String.fromCharCode(this.buffer[this.pos++]);
    },
    makeSubStream: function decodestream_makeSubstream(start, length, dict) {
      var end = start + length;
      while (this.bufferLength <= end && !this.eof) this.readBlock();
      return new Stream(this.buffer, start, length, dict);
    },
    skip: function decodestream_skip(n) {
      if (!n) n = 1;
      this.pos += n;
    },
    reset: function decodestream_reset() {
      this.pos = 0;
    }
  };

  return constructor;
})();

var FlateStream = (function() {
  if (typeof Uint32Array === 'undefined') {
    return undefined;
  }
  var codeLenCodeMap = new Uint32Array([
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15
  ]);

  var lengthDecode = new Uint32Array([
    0x00003,
    0x00004,
    0x00005,
    0x00006,
    0x00007,
    0x00008,
    0x00009,
    0x0000a,
    0x1000b,
    0x1000d,
    0x1000f,
    0x10011,
    0x20013,
    0x20017,
    0x2001b,
    0x2001f,
    0x30023,
    0x3002b,
    0x30033,
    0x3003b,
    0x40043,
    0x40053,
    0x40063,
    0x40073,
    0x50083,
    0x500a3,
    0x500c3,
    0x500e3,
    0x00102,
    0x00102,
    0x00102
  ]);

  var distDecode = new Uint32Array([
    0x00001,
    0x00002,
    0x00003,
    0x00004,
    0x10005,
    0x10007,
    0x20009,
    0x2000d,
    0x30011,
    0x30019,
    0x40021,
    0x40031,
    0x50041,
    0x50061,
    0x60081,
    0x600c1,
    0x70101,
    0x70181,
    0x80201,
    0x80301,
    0x90401,
    0x90601,
    0xa0801,
    0xa0c01,
    0xb1001,
    0xb1801,
    0xc2001,
    0xc3001,
    0xd4001,
    0xd6001
  ]);

  var fixedLitCodeTab = [
    new Uint32Array([
      0x70100,
      0x80050,
      0x80010,
      0x80118,
      0x70110,
      0x80070,
      0x80030,
      0x900c0,
      0x70108,
      0x80060,
      0x80020,
      0x900a0,
      0x80000,
      0x80080,
      0x80040,
      0x900e0,
      0x70104,
      0x80058,
      0x80018,
      0x90090,
      0x70114,
      0x80078,
      0x80038,
      0x900d0,
      0x7010c,
      0x80068,
      0x80028,
      0x900b0,
      0x80008,
      0x80088,
      0x80048,
      0x900f0,
      0x70102,
      0x80054,
      0x80014,
      0x8011c,
      0x70112,
      0x80074,
      0x80034,
      0x900c8,
      0x7010a,
      0x80064,
      0x80024,
      0x900a8,
      0x80004,
      0x80084,
      0x80044,
      0x900e8,
      0x70106,
      0x8005c,
      0x8001c,
      0x90098,
      0x70116,
      0x8007c,
      0x8003c,
      0x900d8,
      0x7010e,
      0x8006c,
      0x8002c,
      0x900b8,
      0x8000c,
      0x8008c,
      0x8004c,
      0x900f8,
      0x70101,
      0x80052,
      0x80012,
      0x8011a,
      0x70111,
      0x80072,
      0x80032,
      0x900c4,
      0x70109,
      0x80062,
      0x80022,
      0x900a4,
      0x80002,
      0x80082,
      0x80042,
      0x900e4,
      0x70105,
      0x8005a,
      0x8001a,
      0x90094,
      0x70115,
      0x8007a,
      0x8003a,
      0x900d4,
      0x7010d,
      0x8006a,
      0x8002a,
      0x900b4,
      0x8000a,
      0x8008a,
      0x8004a,
      0x900f4,
      0x70103,
      0x80056,
      0x80016,
      0x8011e,
      0x70113,
      0x80076,
      0x80036,
      0x900cc,
      0x7010b,
      0x80066,
      0x80026,
      0x900ac,
      0x80006,
      0x80086,
      0x80046,
      0x900ec,
      0x70107,
      0x8005e,
      0x8001e,
      0x9009c,
      0x70117,
      0x8007e,
      0x8003e,
      0x900dc,
      0x7010f,
      0x8006e,
      0x8002e,
      0x900bc,
      0x8000e,
      0x8008e,
      0x8004e,
      0x900fc,
      0x70100,
      0x80051,
      0x80011,
      0x80119,
      0x70110,
      0x80071,
      0x80031,
      0x900c2,
      0x70108,
      0x80061,
      0x80021,
      0x900a2,
      0x80001,
      0x80081,
      0x80041,
      0x900e2,
      0x70104,
      0x80059,
      0x80019,
      0x90092,
      0x70114,
      0x80079,
      0x80039,
      0x900d2,
      0x7010c,
      0x80069,
      0x80029,
      0x900b2,
      0x80009,
      0x80089,
      0x80049,
      0x900f2,
      0x70102,
      0x80055,
      0x80015,
      0x8011d,
      0x70112,
      0x80075,
      0x80035,
      0x900ca,
      0x7010a,
      0x80065,
      0x80025,
      0x900aa,
      0x80005,
      0x80085,
      0x80045,
      0x900ea,
      0x70106,
      0x8005d,
      0x8001d,
      0x9009a,
      0x70116,
      0x8007d,
      0x8003d,
      0x900da,
      0x7010e,
      0x8006d,
      0x8002d,
      0x900ba,
      0x8000d,
      0x8008d,
      0x8004d,
      0x900fa,
      0x70101,
      0x80053,
      0x80013,
      0x8011b,
      0x70111,
      0x80073,
      0x80033,
      0x900c6,
      0x70109,
      0x80063,
      0x80023,
      0x900a6,
      0x80003,
      0x80083,
      0x80043,
      0x900e6,
      0x70105,
      0x8005b,
      0x8001b,
      0x90096,
      0x70115,
      0x8007b,
      0x8003b,
      0x900d6,
      0x7010d,
      0x8006b,
      0x8002b,
      0x900b6,
      0x8000b,
      0x8008b,
      0x8004b,
      0x900f6,
      0x70103,
      0x80057,
      0x80017,
      0x8011f,
      0x70113,
      0x80077,
      0x80037,
      0x900ce,
      0x7010b,
      0x80067,
      0x80027,
      0x900ae,
      0x80007,
      0x80087,
      0x80047,
      0x900ee,
      0x70107,
      0x8005f,
      0x8001f,
      0x9009e,
      0x70117,
      0x8007f,
      0x8003f,
      0x900de,
      0x7010f,
      0x8006f,
      0x8002f,
      0x900be,
      0x8000f,
      0x8008f,
      0x8004f,
      0x900fe,
      0x70100,
      0x80050,
      0x80010,
      0x80118,
      0x70110,
      0x80070,
      0x80030,
      0x900c1,
      0x70108,
      0x80060,
      0x80020,
      0x900a1,
      0x80000,
      0x80080,
      0x80040,
      0x900e1,
      0x70104,
      0x80058,
      0x80018,
      0x90091,
      0x70114,
      0x80078,
      0x80038,
      0x900d1,
      0x7010c,
      0x80068,
      0x80028,
      0x900b1,
      0x80008,
      0x80088,
      0x80048,
      0x900f1,
      0x70102,
      0x80054,
      0x80014,
      0x8011c,
      0x70112,
      0x80074,
      0x80034,
      0x900c9,
      0x7010a,
      0x80064,
      0x80024,
      0x900a9,
      0x80004,
      0x80084,
      0x80044,
      0x900e9,
      0x70106,
      0x8005c,
      0x8001c,
      0x90099,
      0x70116,
      0x8007c,
      0x8003c,
      0x900d9,
      0x7010e,
      0x8006c,
      0x8002c,
      0x900b9,
      0x8000c,
      0x8008c,
      0x8004c,
      0x900f9,
      0x70101,
      0x80052,
      0x80012,
      0x8011a,
      0x70111,
      0x80072,
      0x80032,
      0x900c5,
      0x70109,
      0x80062,
      0x80022,
      0x900a5,
      0x80002,
      0x80082,
      0x80042,
      0x900e5,
      0x70105,
      0x8005a,
      0x8001a,
      0x90095,
      0x70115,
      0x8007a,
      0x8003a,
      0x900d5,
      0x7010d,
      0x8006a,
      0x8002a,
      0x900b5,
      0x8000a,
      0x8008a,
      0x8004a,
      0x900f5,
      0x70103,
      0x80056,
      0x80016,
      0x8011e,
      0x70113,
      0x80076,
      0x80036,
      0x900cd,
      0x7010b,
      0x80066,
      0x80026,
      0x900ad,
      0x80006,
      0x80086,
      0x80046,
      0x900ed,
      0x70107,
      0x8005e,
      0x8001e,
      0x9009d,
      0x70117,
      0x8007e,
      0x8003e,
      0x900dd,
      0x7010f,
      0x8006e,
      0x8002e,
      0x900bd,
      0x8000e,
      0x8008e,
      0x8004e,
      0x900fd,
      0x70100,
      0x80051,
      0x80011,
      0x80119,
      0x70110,
      0x80071,
      0x80031,
      0x900c3,
      0x70108,
      0x80061,
      0x80021,
      0x900a3,
      0x80001,
      0x80081,
      0x80041,
      0x900e3,
      0x70104,
      0x80059,
      0x80019,
      0x90093,
      0x70114,
      0x80079,
      0x80039,
      0x900d3,
      0x7010c,
      0x80069,
      0x80029,
      0x900b3,
      0x80009,
      0x80089,
      0x80049,
      0x900f3,
      0x70102,
      0x80055,
      0x80015,
      0x8011d,
      0x70112,
      0x80075,
      0x80035,
      0x900cb,
      0x7010a,
      0x80065,
      0x80025,
      0x900ab,
      0x80005,
      0x80085,
      0x80045,
      0x900eb,
      0x70106,
      0x8005d,
      0x8001d,
      0x9009b,
      0x70116,
      0x8007d,
      0x8003d,
      0x900db,
      0x7010e,
      0x8006d,
      0x8002d,
      0x900bb,
      0x8000d,
      0x8008d,
      0x8004d,
      0x900fb,
      0x70101,
      0x80053,
      0x80013,
      0x8011b,
      0x70111,
      0x80073,
      0x80033,
      0x900c7,
      0x70109,
      0x80063,
      0x80023,
      0x900a7,
      0x80003,
      0x80083,
      0x80043,
      0x900e7,
      0x70105,
      0x8005b,
      0x8001b,
      0x90097,
      0x70115,
      0x8007b,
      0x8003b,
      0x900d7,
      0x7010d,
      0x8006b,
      0x8002b,
      0x900b7,
      0x8000b,
      0x8008b,
      0x8004b,
      0x900f7,
      0x70103,
      0x80057,
      0x80017,
      0x8011f,
      0x70113,
      0x80077,
      0x80037,
      0x900cf,
      0x7010b,
      0x80067,
      0x80027,
      0x900af,
      0x80007,
      0x80087,
      0x80047,
      0x900ef,
      0x70107,
      0x8005f,
      0x8001f,
      0x9009f,
      0x70117,
      0x8007f,
      0x8003f,
      0x900df,
      0x7010f,
      0x8006f,
      0x8002f,
      0x900bf,
      0x8000f,
      0x8008f,
      0x8004f,
      0x900ff
    ]),
    9
  ];

  var fixedDistCodeTab = [
    new Uint32Array([
      0x50000,
      0x50010,
      0x50008,
      0x50018,
      0x50004,
      0x50014,
      0x5000c,
      0x5001c,
      0x50002,
      0x50012,
      0x5000a,
      0x5001a,
      0x50006,
      0x50016,
      0x5000e,
      0x00000,
      0x50001,
      0x50011,
      0x50009,
      0x50019,
      0x50005,
      0x50015,
      0x5000d,
      0x5001d,
      0x50003,
      0x50013,
      0x5000b,
      0x5001b,
      0x50007,
      0x50017,
      0x5000f,
      0x00000
    ]),
    5
  ];

  function error(e) {
    throw new Error(e);
  }

  function constructor(bytes) {
    //var bytes = stream.getBytes();
    var bytesPos = 0;

    var cmf = bytes[bytesPos++];
    var flg = bytes[bytesPos++];
    if (cmf == -1 || flg == -1) error('Invalid header in flate stream');
    if ((cmf & 0x0f) != 0x08)
      error('Unknown compression method in flate stream');
    if (((cmf << 8) + flg) % 31 != 0) error('Bad FCHECK in flate stream');
    if (flg & 0x20) error('FDICT bit set in flate stream');

    this.bytes = bytes;
    this.bytesPos = bytesPos;

    this.codeSize = 0;
    this.codeBuf = 0;

    DecodeStream.call(this);
  }

  constructor.prototype = Object.create(DecodeStream.prototype);

  constructor.prototype.getBits = function(bits) {
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;

    var b;
    while (codeSize < bits) {
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad encoding in flate stream');
      codeBuf |= b << codeSize;
      codeSize += 8;
    }
    b = codeBuf & ((1 << bits) - 1);
    this.codeBuf = codeBuf >> bits;
    this.codeSize = codeSize -= bits;
    this.bytesPos = bytesPos;
    return b;
  };

  constructor.prototype.getCode = function(table) {
    var codes = table[0];
    var maxLen = table[1];
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;

    while (codeSize < maxLen) {
      var b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad encoding in flate stream');
      codeBuf |= b << codeSize;
      codeSize += 8;
    }
    var code = codes[codeBuf & ((1 << maxLen) - 1)];
    var codeLen = code >> 16;
    var codeVal = code & 0xffff;
    if (codeSize == 0 || codeSize < codeLen || codeLen == 0)
      error('Bad encoding in flate stream');
    this.codeBuf = codeBuf >> codeLen;
    this.codeSize = codeSize - codeLen;
    this.bytesPos = bytesPos;
    return codeVal;
  };

  constructor.prototype.generateHuffmanTable = function(lengths) {
    var n = lengths.length;

    // find max code length
    var maxLen = 0;
    for (var i = 0; i < n; ++i) {
      if (lengths[i] > maxLen) maxLen = lengths[i];
    }

    // build the table
    var size = 1 << maxLen;
    var codes = new Uint32Array(size);
    for (
      var len = 1, code = 0, skip = 2;
      len <= maxLen;
      ++len, code <<= 1, skip <<= 1
    ) {
      for (var val = 0; val < n; ++val) {
        if (lengths[val] == len) {
          // bit-reverse the code
          var code2 = 0;
          var t = code;
          for (var i = 0; i < len; ++i) {
            code2 = (code2 << 1) | (t & 1);
            t >>= 1;
          }

          // fill the table entries
          for (var i = code2; i < size; i += skip) codes[i] = (len << 16) | val;

          ++code;
        }
      }
    }

    return [codes, maxLen];
  };

  constructor.prototype.readBlock = function() {
    function repeat(stream, array, len, offset, what) {
      var repeat = stream.getBits(len) + offset;
      while (repeat-- > 0) array[i++] = what;
    }

    // read block header
    var hdr = this.getBits(3);
    if (hdr & 1) this.eof = true;
    hdr >>= 1;

    if (hdr == 0) {
      // uncompressed block
      var bytes = this.bytes;
      var bytesPos = this.bytesPos;
      var b;

      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      var blockLen = b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      blockLen |= b << 8;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      var check = b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      check |= b << 8;
      if (check != (~blockLen & 0xffff))
        error('Bad uncompressed block length in flate stream');

      this.codeBuf = 0;
      this.codeSize = 0;

      var bufferLength = this.bufferLength;
      var buffer = this.ensureBuffer(bufferLength + blockLen);
      var end = bufferLength + blockLen;
      this.bufferLength = end;
      for (var n = bufferLength; n < end; ++n) {
        if (typeof (b = bytes[bytesPos++]) == 'undefined') {
          this.eof = true;
          break;
        }
        buffer[n] = b;
      }
      this.bytesPos = bytesPos;
      return;
    }

    var litCodeTable;
    var distCodeTable;
    if (hdr == 1) {
      // compressed block, fixed codes
      litCodeTable = fixedLitCodeTab;
      distCodeTable = fixedDistCodeTab;
    } else if (hdr == 2) {
      // compressed block, dynamic codes
      var numLitCodes = this.getBits(5) + 257;
      var numDistCodes = this.getBits(5) + 1;
      var numCodeLenCodes = this.getBits(4) + 4;

      // build the code lengths code table
      var codeLenCodeLengths = Array(codeLenCodeMap.length);
      var i = 0;
      while (i < numCodeLenCodes)
        codeLenCodeLengths[codeLenCodeMap[i++]] = this.getBits(3);
      var codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);

      // build the literal and distance code tables
      var len = 0;
      var i = 0;
      var codes = numLitCodes + numDistCodes;
      var codeLengths = new Array(codes);
      while (i < codes) {
        var code = this.getCode(codeLenCodeTab);
        if (code == 16) {
          repeat(this, codeLengths, 2, 3, len);
        } else if (code == 17) {
          repeat(this, codeLengths, 3, 3, (len = 0));
        } else if (code == 18) {
          repeat(this, codeLengths, 7, 11, (len = 0));
        } else {
          codeLengths[i++] = len = code;
        }
      }

      litCodeTable = this.generateHuffmanTable(
        codeLengths.slice(0, numLitCodes)
      );
      distCodeTable = this.generateHuffmanTable(
        codeLengths.slice(numLitCodes, codes)
      );
    } else {
      error('Unknown block type in flate stream');
    }

    var buffer = this.buffer;
    var limit = buffer ? buffer.length : 0;
    var pos = this.bufferLength;
    while (true) {
      var code1 = this.getCode(litCodeTable);
      if (code1 < 256) {
        if (pos + 1 >= limit) {
          buffer = this.ensureBuffer(pos + 1);
          limit = buffer.length;
        }
        buffer[pos++] = code1;
        continue;
      }
      if (code1 == 256) {
        this.bufferLength = pos;
        return;
      }
      code1 -= 257;
      code1 = lengthDecode[code1];
      var code2 = code1 >> 16;
      if (code2 > 0) code2 = this.getBits(code2);
      var len = (code1 & 0xffff) + code2;
      code1 = this.getCode(distCodeTable);
      code1 = distDecode[code1];
      code2 = code1 >> 16;
      if (code2 > 0) code2 = this.getBits(code2);
      var dist = (code1 & 0xffff) + code2;
      if (pos + len >= limit) {
        buffer = this.ensureBuffer(pos + len);
        limit = buffer.length;
      }
      for (var k = 0; k < len; ++k, ++pos) buffer[pos] = buffer[pos - dist];
    }
  };

  return constructor;
})(); /**
 * JavaScript Polyfill functions for jsPDF
 * Collected from public resources by
 * https://github.com/diegocr
 */

(function(global) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  if (typeof global.btoa === 'undefined') {
    global.btoa = function(data) {
      //  discuss at: http://phpjs.org/functions/base64_encode/
      // original by: Tyler Akins (http://rumkin.com)
      // improved by: Bayron Guevara
      // improved by: Thunder.m
      // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Rafal Kukawski (http://kukawski.pl)
      // bugfixed by: Pellentesque Malesuada
      //   example 1: base64_encode('Kevin van Zonneveld');
      //   returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='

      var o1,
        o2,
        o3,
        h1,
        h2,
        h3,
        h4,
        bits,
        i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

      if (!data) {
        return data;
      }

      do {
        // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = (o1 << 16) | (o2 << 8) | o3;

        h1 = (bits >> 18) & 0x3f;
        h2 = (bits >> 12) & 0x3f;
        h3 = (bits >> 6) & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] =
          b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);

      enc = tmp_arr.join('');

      var r = data.length % 3;

      return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    };
  }

  if (typeof global.atob === 'undefined') {
    global.atob = function(data) {
      //  discuss at: http://phpjs.org/functions/base64_decode/
      // original by: Tyler Akins (http://rumkin.com)
      // improved by: Thunder.m
      // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      //    input by: Aman Gupta
      //    input by: Brett Zamir (http://brett-zamir.me)
      // bugfixed by: Onno Marsman
      // bugfixed by: Pellentesque Malesuada
      // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
      //   returns 1: 'Kevin van Zonneveld'

      var o1,
        o2,
        o3,
        h1,
        h2,
        h3,
        h4,
        bits,
        i = 0,
        ac = 0,
        dec = '',
        tmp_arr = [];

      if (!data) {
        return data;
      }

      data += '';

      do {
        // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = (h1 << 18) | (h2 << 12) | (h3 << 6) | h4;

        o1 = (bits >> 16) & 0xff;
        o2 = (bits >> 8) & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
          tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
          tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
          tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
      } while (i < data.length);

      dec = tmp_arr.join('');

      return dec;
    };
  }

  if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisArg */) {
      if (this === void 0 || this === null || typeof fun !== 'function')
        throw new TypeError();

      var t = Object(this),
        len = t.length >>> 0,
        res = new Array(len);
      var thisArg = arguments.length > 1 ? arguments[1] : void 0;
      for (var i = 0; i < len; i++) {
        // NOTE: Absolute correctness would demand Object.defineProperty
        //       be used.  But this method is fairly new, and failure is
        //       possible only if Object.prototype or Array.prototype
        //       has a property |i| (very unlikely), so use a less-correct
        //       but more portable alternative.
        if (i in t) res[i] = fun.call(thisArg, t[i], i, t);
      }

      return res;
    };
  }

  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun, thisArg) {
      'use strict';

      if (this === void 0 || this === null || typeof fun !== 'function')
        throw new TypeError();

      var t = Object(this),
        len = t.length >>> 0;
      for (var i = 0; i < len; i++) {
        if (i in t) fun.call(thisArg, t[i], i, t);
      }
    };
  }

  if (!Object.keys) {
    Object.keys = (function() {
      'use strict';

      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !{ toString: null }.propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

      return function(obj) {
        if (
          typeof obj !== 'object' &&
          (typeof obj !== 'function' || obj === null)
        ) {
          throw new TypeError();
        }
        var result = [],
          prop,
          i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    })();
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }
  if (!String.prototype.trimLeft) {
    String.prototype.trimLeft = function() {
      return this.replace(/^\s+/g, '');
    };
  }
  if (!String.prototype.trimRight) {
    String.prototype.trimRight = function() {
      return this.replace(/\s+$/g, '');
    };
  }
})(
  (typeof self !== 'undefined' && self) ||
    (typeof window !== 'undefined' && window) ||
    this
);

// *************************************
//
//   AYS Finalize
//   -> Scripts that fire on finalize form
//
// *************************************
$(function(){
  var $wrapper = $(".form-finalize");
  if (!$wrapper) return;
  // sync content for all inputs with the same name
  $('input').on('keyup',function(){
    var $this = $(this);
    var name = $(this).attr('name');
    var $sameName = $("[name='"+name+"']").not($this);
    $sameName.val($this.val());
  });
});

// *************************************
//
//   AYS Generate PDF
//   -> Generate a PDF version of the Contract, depends on the jsPDF library
//
// *************************************
(function(API) {
  API.addText = function(txt, x, options) {
    var options = options || {
      lineWidth: 1
    };
    var lines = this.splitTextToSize(txt, this.settings.contentWidth * options.lineWidth);
    // if there are more than 1 lines needed
    if (lines.length > 1) {
      for (var i = 0; i < lines.length; i++) {
        this.checkOrUpdatePaging();
        this.text(x, this.settings._y, lines[i]);
        var lineHeight = px2mm(this.internal.getLineHeight(txt));
        this.settings._y += lineHeight;
      }
    } else {
      this.checkOrUpdatePaging();
      this.text(x, this.settings._y, txt);
    }
  };

  API.checkOrUpdatePaging = function(elementHeight) {
    var elementHeight = elementHeight || 0;
    if (this.settings._y + elementHeight >= this.settings.contentBottomY) {
      this.addPage("p", "mm", "a4");
      this.settings._y = this.settings.marginY;
    }
  };
})(jsPDF.API);

function px2mm(pixel) {
  // px to inches
  var inches = pixel / 72;
  return inches * 25.4;
}

function toDataURL(src, callback) {
  var img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = function() {
    var canvas = document.createElement("CANVAS");
    var ctx = canvas.getContext("2d");
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL();
    callback(dataURL);
  };
  img.src = src;
}

var logoDataString =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOUAAABzCAYAAABn9sVIAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7J15eFXVubjfb+1zTk4mSEgI86Qgs5aGBMcKjrcOFYVQh+twbYtVCGq1w61tPR3ur72t1iGAiq3a1lqbAM5Yb7XgiAwRREBRRJCZJISQ8Zyz9/p+f5wkZDiBgAGE5n0eHmBPa52997f2Wt8odHLMkZdX6KzvSTfHpZsYpwdq+4kjvbF0VyFNlCwVEdA0FF+8ayiERaQy9m+1BrYg1AIlYHaibPFwS3yOu2tJ+sclhEL2iP7If2PkaHegk/YxLn9BF0+rv2rUnK+iuaj2AzIQyTyMze4Fdgp8YlWe1mj45eI5V5cexvY6oVMov/R85bZn0vye+y1Rc5WiySA7QVVhjyDRts+0PhVJE0uKiKQomgl0ARJaH6vbBB5VpDfwnfjXExf0QzXyu+6aWPhywUXhDvh5ncShUyi/pOTlFTqf9TATBUIK2wzmDz6X1zXRrQRY3HVteL9TylDIjN94diBq9vpt17C/LuoFE1wC6neSrJrbqBc+gU0evkuLZ0784Ku3PD3cEd8ShCpF8hAvqp6TLMYGjZozVfT7gAIvYqO3LZt91eYjcCv+7egUyi8hudOfH2Q1/FtBEsTo75Iqq5YteuK/6jri2jm3FPZEZBEiQwEPkf9YVjDpVYAzfvBcaqTGfRU0B+GyZQWTX2g4L3vqcr/j3/iwCjeCKGo/tqrfLp495W1igtpJB2GOdgc62cf40MJg7vSifIjMdBwze+Aue/nSgrw3O0ogAcE436kXSBAeXpbxwb8adr7928sqVfQtQATyQiFtfD+K54yNWp//tyibwX6ImJMcY17OmTY3f3woFFeZ1Mmh0SmUXwZCIZM9vXB0dWnp38Ek7pakK5Y8OGlhUdEUryObGTdj7mDQmwEQ2Wgd+Z9WU2DLayiqKuNfLn++e9Ndy9NXfIKRV1TlCUFfViUZ4YGq0lEFg/MfjLNW7eRQ6BTKo8xptxcm5pSNuslgHkR5cGnBFb9bfxiUKONDIZ9VbgV6AZ4ovyq+f9KOlsd5yBpEtoD2szaa22xnKGQF+2cRTo3i/44aFgEIclO67TVzTH5hd9DOJdEXpFMojxKn3V6YOC5/3qmu6zyKcq6rcsOyWXmvIXJY1meVpSOGo1wT+5+8nmS9vxNnLdi1+wdbBf0QQFUn5+UVOk33J3m6AsUvXrgXKj8FKkAFkW/51LydO33u98+48bnUw/Eb/l3oHNWOEmPz594rqjch5r5wQspvVt1zYfXhait76iN+J5D5B0WvA0B4aFnG6unjynJTwk7YpO3ZU9d03Zozfe6PgF8Du0TNiKW73D2nZdDTdZwTBR1r4XqReqcEYTBKoElzHkiRcXy3LXngsp2H6zcdz3Qu0I8w2VMf8UsgY7ook1Wdbw/a6RYVFV3YoWvHljiBjFMUndK4Qbkmp2TUWCs1Sb4opjo5pXxcfuF3lhRMWQuANSsxtg7IUtGHcns6ma7VQYjto4i/2Uje+rvugH7Tuu4m0P+Gw/PlP57p/FIeEVTG5c/vo0KOWm4A/TqwR2CFQjmwV2EXUGuQHUCtWtlt0bDjyG7Hc6tdqCp3UsoPfr2pkpM/9/eo3Lbfo5SFGH1VLGchMgrozRdb3qy1CQlnF997aacH0EHSKZSHiXH5T3axBM8WlTNBz1YYTMyjxn/AkxVFiAIeiisirqr1EIkCFtiuonWCbEOJiLJdDbUKJaB7jTWVVmw5ojUOVFk1zwMnHtYf3JqocRi75IHJq45wu8c8ndPXjkHGhxY6VWVlo4HzUM5T5XQgUVHnQCe3vhoC9es0icko0mz87CNNlJwqgDaMsGJVVAWxqKgX2300zBV+10o/oFMoD5JOoTxE8vIKnU/6+FMDUTvBil5cXVp2sUDPhv1HcSHVMOV04OhOhYzaAUex+WOWTqE8SLJ/WNjVqXHO3Kh6tT/qXqAimZ1rgPgIlBztPhyLdApl+5Ax05/r5dfolVrNDYqOAqTFlLKT5uxxrK442p04FukUygMwLv/JLqrBq5Xo7SoMoVM5Fh+RjSibQM+u37CJMLuPbqeOTTqFcj/kTpufYdU+AXyd+jVaJ3GxqtzqGP3QWpYCacCmvnupONodOxbpdLNrExWLvRG4hE6BPBDbNTLg5SrXbhdYF9tk3+xoh/p/FzqFsg3GzZg3WIz84Gj349hA3imeMzbaPat7nQq7gO2izvNHu1fHKp1CGRcVq/Igqocz/81xhP0AYFFogotSo2ipF3U7/V4Pkc41ZRxOvvMvSdQlX3gEmvLqc99Ug64D+RTVjQjbRZwq63mJGHOpoP/Bl3gKLcZsBxicvyABrclAqSieM6VzPXmIdAplcwTQxOqkE61z2OICw6KsU6P/EmveEEdXL9luN9DW+iukj+aUzX8E1W8fpv58cep73iMxGojUkGaMbD26HTq26RTKJoydXnS2I2a9p95A6fiZvQVdI6p3J3Xv/sKi0AS3PSedtqvoBNeYI/HVPmTUxAawmhpSfaoDUVl4tPt0LNMplPWcceNzqRGiv7aq68Fs6uDL1wF/8bvOT955+Ipd7T1pfGihr7qk7PdAvw7uT0fTF8Av7hgL3QTeOdodOpbpFMp6IknuRcBY4FSBdn3F2kmFKnd1N0l/ePnhgwu7qi7dPQnh4nYcWkMscXLPAx3YMWgUxEe9I4UoF47Lf/Jeq/pdQbYbn7PyyPTj+KRTKOsRdLDuux8ddV92IXrz8pmTnznYYN/Tbi/s5kb117RHQ668huhqkP8+1I4eGFHQLQpzDfKGwoPUf8EVzVFN+BdwikLRu2nvf374+nH80ymU9ahqeof6soqUgkxZVnDF6+09ZVz+gi64VUM8nznJjepkYGA7GlKMvoontYfRwPUu8LjPb19a3HXtdu6+W3NmPJOM2jsFBiuSAmQDn4rSOkNeJwdFp1A2IKamIwOuxNr/Xjorr5lAjgwVBgKlCZnGCfvE0lPEDMRygiDDVXW41ZqB4phEURJB2mkCUddY86En1t/B6uJahBdAHg0nVC9edc91+3IIhUIsQ58648bnn9eAlxjxy0AR7eaLuB8sfnjKto7txr8fnc7V9WRPnzvMoK8Rq6fREURovTaVJn8MMdvjF/2+1eLJKPxyEta+/IWuFMt4sA3kMet4fzhhG1s7XeWOPJ1C2YSc/LmXohQCwaPdl3ajVNZ0t5lJu33nHLpQah0q74lhpuOzzy6+b0ptx3ayk4Ohc/q6DwGpRTWKHENCKexaE5oSyZkx/2DPtEAZ8KyoPr50Vt7iju9cJ4dCp1DWMy7/yVSrOgvhGEskLLsA1LqBdjo8RIC1iDzpWuaumDWpo22ynXxBOoWynsSMPjU1ZWVLVI+tQGZBy2N/Oz33r6jSckQWirVPikl5bUnBRXuPUBc7OUg6hbKeRaEJbs4tz96FcQeAnHWs1MRQ2FP/r0RgC6qzBTNARS8hVjfkQ1SfsaKFhHd/VDznpv0Umu3ky0CnUDZh2eyJm8+8+cWJdU7454J+F+TAOVoPP25siqpxtcIa8+RBoLsiO8vNtt+vL5gRzs0vuk6RchtOWFw8pzMh8rFEp1C24K2HLikfH1r4vdpdu5+xonchnHt0eyTbQf8K/Gh/R6nSB7FV6wtmhAGWFuT9+Yh0r5MOpzPIOQ6LQhPcJbMnLUyurrxEjU4EXo3FPR4FRBeD1uzvkJF5hQERskSl073tOKDzS7kf6itRPQf6/NgZz4zE6pUSS6I1DDQIcrgHNVX0JYH9JjVO6RkJWg32BpYc5v50cgToFMp2Ibr8QVYDPwF+Mi5/Xl/PmjMF+zVEchEGoKSCdmx5ANUyv19f9CLmhrbUToImRNRJ8cFAkVhdyU6ObTqF8hBYUjBpC/B07I/KmOlP9/LjH60wBuQURMegZBJLtXiIaTw0KmJ+sfi+Sbtz8ot27kcZ3NfBdxIg4umGQ2urky8TnUL5hRFdMZNtwDbgFYhVabYugxQGqTXZiH4F5AQgHSUdIYXmtlAFKkH3oLIFdDGO82pSt/RXAcTqBm0zgkVGi+o1QHnER+ea8jjgmLDFHQ9kT30kicT0TLEmA9WuRkwyVjNV8BCzGc+tAK/MukN2FM8Z28yWeNp3C/u4PvM+kNHG5T2FF5bPnHz54f8lB0/21BeSnEB4hFpXAIwa60tN+Pjt315W2XBMzi2FPcE2ZliwxtQRKf+3tKt2fimPEMVzbqoBPq//c1CU+HeUpttebyDSltCJKP/3hTp4GDH+ul+oylSc2OtmVTVS6z4G3L7vIHkO8Q1v/K8SJZB+C/D3I93fo02nUB4DrC+YEc65ed6dOPo58DWgD0r3+jqWAB+hic8cxS7uH5GhQOo+L0BBVUe0OOhktHkggIjp3/T/uflFZ4HcoTAM1TUi3L+0IO/Nw9jzo0KnnfIYYdlDkzYsy1z9vXAw9Syf3w43vkgvz5oRAjlRn3PGstkX7zjafTycZE+fO0yVF1W5DGUoyBWq5ulTb5s//MBnH1t0fimPJUIhuwqqif0B+LfJQm7gWyBdmm/V3q5rpwA/PyqdOkx0CmUnxwpx02xKLD/QMUXutPkZKt43gBGoVFp4hejA9xoUfJ3T106OEWy8IGwL8skR78oXIOeWotNV7D/BnCVq1qlonaD3OIGND46++a/p0CmUnRwj2EjioygvAA0mkrDC323EO2a0s6dPmzcAI7MQ+QGqKxVNMpgyjMxASA46ge+PD4V8caev2VNfSPInuVmqXhe1JmZbioYrKsucbWuKpkQOpUPjQwuDlaVlAx0xCda4dVp7woaW9jiAvLxC5/OeTi9XnXRHrPHUtUSc0uLeH+z8sqUuHJf/ZBfPBHoZ6wsCCG5UrW/n0lmX7z7YPK9HhFDInL7j5MxIgCyjMU+jg32u4/Kf7CJeUh/rEADAUusE3M2HO69P8ZxLa06+85WrguGq8Yr2Vms3RhLr3lk1s0mWvQOQPXVeLydBsgCs4IWjtVs/eOia8oPtS/bUR5LESe9nfLHnrj6tTC7fu63eV7pNokZvVJVn95D4ZrrUvAA8omhfo0xRT25WQ1F4x4hZjc4D40MhX+WuEacaYyYDZwFZQOq+YF/ZW18V6u9Rv/O3lfdfvqdlo+Pyiy5Qy09VTL1rme61Kj82aodj5GZUhyIEQMIody+bNfmhhnNH3lKYkuT4LkPtNYgMRzUN1IBYkDJRuxr4Q1L3zH8cqA5H9tRH/BLodq9gxu7bqlZVZy6fNfnvbQlM7rT5l6jY7zfGUaoqoq8nZ2b+rLHNUMiMKxuda9HrUM4CeuzzeZUoUILyror+aXnm5DcISauBZNyMuUOspaCZ4kLtkvDe2p+s+kvrlyxnRtHpqPwClaR9W+3LA3fq/2tXtrlQyIwtHX2aCDeD5opKpmLrn5HsRflc4VlR39PLZk/c3PoCKuNunTfas1wvyrmI9EFtoP78OpRNiL7gEvjjipmXtUoxmTN97gvEiu/uuyL83/KZky9sckwttDSJ8IOlBZN/B7GcuFarHwfTq8lFNtho+LbiOVeXAozNn3uVqOQ3uUSJqHxf8foh5ttADtjuAILxFN2mwit+zz60ePaU9Qe6jdm3zetlotyA6BUC/RWt76+pErEbBHlcrKx00XtEpH6fjajq/yyfNeWfOfnzXkbsL2u66fKkUrNHRX4lVocg2q1ctk9J195/9cS9xwcw7tbnelSVRB9xDOcqtFg4N8ptF9C+CGf6PfvNU295+uZ3Z1/ZzAHaqrkS0TObpqUwoiepSG+BhKbJjkVotFONnTF/lFididozAB/acH7D8ZqmIicCF9aUlT31ldueuSPeoNBAqi89oRr5dn00/j6MpI68pejFNbOpannO+FDIV1OmP0TZ1/9YUv5eu3eU3w/syp76VKZTkvArK/aq5prAZo5RGQjDBMnLLZ0/T2597gdLHrismZbUWpkAemGz9B0i/ZKS/Q+wT7O6b5eVCQrnNk/3YfpuSA/cS6xkQZtkT13ud0o+C6nodJQuEMsk2ey5Cn1FOQ2JXj1m+nMXNxWs7KnL/SZh7g+tJ7cLdAOIPZ9m52eBjPUTvWrstPm3Lp91xT/316dDwUr1KFSuaH7POFUSAvcCpQCi8l+gpzU9T8X2QeUk0NSGk6DhHpAuykjXca7InV74raUzp/wrbuOhkBlbOupycfX/ITKExlG98f3soiq9FU4Fu0dEMvf1UzCYj4B/iuKpNb5YmTJRUdsHkYtV9Zr1M2eEc6bNDTiO3zMA1o1eIcJlrQUyLg6qZ3vG/8SY/MLuzXdpvLwvgwTajJ4Ym/9Mrlj7EujZHFgbHFTlRr/r/WH8DY+3nXEuq3sdSKsXQyyjg/CVeKdU7T55mNLSoA0gS1c9fHnJabcX9jGBwDxFp7ZWzcclWdFrrRd9+dTbnhnY7Ipo67W8qhCM/5M0zvFxrxEHE/jsVhV+BOy/z4IgJstPuPFZZU9d7ncCn/0BlRANArmfKygMF7F/ypk272vt6dvBIBrXsb/ZaKhonAwLkn3AZGiqAxXzt+xp874ab3dO2ajpIvI4cNIB0sT4EGlVaFhNbFaiytuIXtq/LEVAI9bR/wWeEjF3ZE8vHI1Ib0P4cwNgjKygscpge9Ecv8q05tvkoJIxZd82r5eo9xjQ/4AHN2diVXKX77a1c1FogivKE612COKI859xb6x630BbvXgRUfvk+FuKkt2IeQj4WhMvmvYgwBjPdeecfOefkw/ivA4h+9YX+gtyd7vjPlWLl87M29jwX5Ow6YeKXMPBRbr0QvT+3Gnz2/LTPWyIclAFlFqQZcT+nlCo2b0aO23++Si/RPWQsxyqxxYA6+cJlEvLtPobqtxBbWKpz29/IchLBqcA1eeXpH9cYgCWFEx6F6FhKuqBfg48iXI3qj+Nab20pVJGFPnm6d+dn3UQ/XOBMBBWYbeJ6k+BkS1/A7AalR+DuRHVvyqtppuOiN4Rc2KOT8RvFgIftdyuwpSRtxQ1E5DxNzweFJVL41xmU11i7cIqMde3Uf3KFVgC+msRfgcsJ97gpnJesDbpprb6erhw3Lqr4sx+oqAvI/JThYeBtfVZFTxUG9fbufnzT0G5g9YCWSHCY6A3gv4MdG2cpsdg7FUd/4u+EB6wBeSfCNuJ5b1tgZydvWvE6Q3/y502P0PE+y3xZhlCNcJriP4BdCmx1J1xERNrq/j+SdvFmG8qcpeIXiIJ4Wmea35kVW9GeTe5uvK3hEK2cbqoSkjguyr6F79Pixbfl9dMm5aTP+8nqP6yRXuDPb+eAByg5qIo8IYIv/Ms2yGKscbiOP/ct35sPHZucma36xaFJjRosh4fmz9vMqp/ApooOuitYi4CHovX4sr7L9+Tkz/vr637rOnJxvkG8FTDltouaSPxvJHNv4GiorYopSol2fXZadrCfKQQFuR7S3d6jzRUYR4ZKgwklTo/RPQnaL12EkAQhe+Ou/Wpvy554Ooj5oWjxoxueX8VFtbu1IlriiZFILaWrto1YiLG9KtFn2vosaq9hVg86D5EShF75dIH815r2HTmzS/ODDvhBaCnNmtH9dozbnzuT28/ti8S5Oih1YLcWb3TPramaErk5Dv/nJxQm3g/Yr7VctbkiPkG8BZAzMAv8ZY7K62VbxXPmvQeAKGQySkbORGVRznANH9pwRXvj7/h8VNrklPOA+0PZjc+3x+XPXDZuoZjGoVy+czJ84B5Tc6XM37wXEqkqibNGn8yscpLLfFZtcPb2NcEXeGKzVtRMKWkYUvutLnfU9WW8+/drnjTmghkrG8ZH8zPKR11I7FUHA0YMVxIG0IJYFXnGvR7IOkt+nMNTYTSU/dCEWkxPdFa6zh/i4g9S6CVf6UojyybNWl2021rQlMi40MLf11TUpatwmUtTjnBRgO5wAtt9bejEWyCtphtC/RPyjJDCIU+JBSyi0IhF5jb9Jhxtz6XZb3o+S0uZ0XtrKUF+wQSYonGsvOL7jYqr7RofWQkMdofWNNRv+fQkV8tzVw9h5kxk9qqe66rHjNt3q986AW0WDqpkAMwOP/BBFTy4lysBmv/q3j2lH01OEMhuwzmj80vGiYqv+QA9v9608mLbe1vpVg58+YX0+tM7ddE5KJIbXQMxt/XQHdU21DCtEPpIeb3KwomNwrk+NBCX1Vp2VktF2cClT7M3bnT5zYf3ktBkazWyYZlxPjQwmBLIW4kUvap+Lu9psLkppsVxp962zMD373/8o0n3/nnZBM2X9cW1xZhybIHL1+TM31+fpwkx1Hrs/fGa3JRaII7bsa8B9TqxTS/vw7CeRxBoVSVeGr+YcAruWWjnrL5c/+m4bLVLWMWrXVHA31anGdRRuZOn1vQup24irxkozKcoy+UJY7PebqljXvwLm/Lxh6yCqSlPqMnQHdfz0w3ql9tGXKs8NzypgLZdJ/RJ8WTHwNfSH/Q+NKMDy301ZSUXROW8AxBTgGc9lWG0x773S1U4mozF6k9e/ak+GFwqyvBAJRp8ZuNs9Vq0u4d5V2IlS9vRfGcm6I5+XP/jDKR5gKS6LruFOC3gXDSSai2mKKIYvVP40OLEmrKdEjLGbZAcXF63pa43QTcutK3TCBjLy2mMiIMDoXULCid18aZHYyV+Ri9jZYFi4Q+qnxflO8SyHht3K3z712SvuqdhhdX1A5XJNDiaj4VmcxBYI09GH3D4aIsWuNrZQIrKprijZ0+d0tbWrtIxOlh0KxWaj3Rf7TVUPEDUz7PmT73CwdlG4DB+QsSakrLClT0UdCvchDaNlHZvxnDUuJXaXZT/JFoEGilOj4EEpKCTQ3qrfH57NtAy4RSIsjV40MLfUa5qLUyxO4RU/dM5baShDhTbFT5nFDbQ1bsy6PrWm5XIW1+1V8S451zOFg264rlorT6sjUipApMtJ73Uk7JqJ+MzCsMAGgss/pxj9DasaMBY+gWT9NurB52X1sDkK61dylMPRwZwUUk7DqtNZLSAX63KtTaqO5XkbD4vim7QYvi7Dqptqz0HET+o/Uumbuk4D/rzTtxkuMIew6USUWQ1v1SEdj/xKJDEVEnYO9WuI99PqPxDuyC6E+SeshPWpoEvggq5rirbamYw16DxYzLf3YEqjOIIyQKH9Y/0GtV7QXAlymQ1gq8m9R9VcUBD0SfjZU7b0aiVflvVR3b8ngj0qbyKIZ2b601bnFE6zUZqlrnpVTEFw5jElp5IHUAi++bUquRsh+qYSIiy9o+UvyCmZ5TPjq7QxpWdtWbCo4rxNiBh7sNo+pejtC1xXYX5JcaSRi7fObk7y2bOfnJ5d3XvsZ+bDEHgy+BiApxHIH1lzWZNqGdfxIH7rQ31GsP90vxzCmrURsvbcR4WheIXVlG4gqAioSUOtDtrU+T7PE/X9TmFL/edntCq7OErWtCbTh+W01wPRvXpUeQL7Q2K55zU3T5g5MX2HDpGRg9Q+GP0tr2i6LpuHYSYsriXKZE1GS29/nYaFnf5QWTV3yRfh9NPE+2EsfmrDinxjkciCX/kg6IUfYpmt1qKibyUY3n/XbNnEsb/Sqzt/Vy8GtSvNncwRKpLq80/oyPEYa2aDgP9FdtvrgtOAi1niLyOMrFQEsFRvMeKH9ZP/OiMMD6govCY6cXfSTQ0jzQv6qk7AJgQbxrRP32SizB1jPcmMLLQonEHvg+wRZSjZWBQLMX+bTbCxPdKCcf6Ae2h3ot6zvAO7nT5z4MPE/L9aPhFIu9z8QcCva9YEJXNfbcNaEphR3Rly876rilqNkADGm+w16XPbXwnuI5U1rN0NSRy1C+8GzHiEhaq62qdSNKaOY8IP5uk+L59R0KxXNuiqqReM6/w5LKnF8Mzl/Qpq9s9tRH/NlTC1t+2Q9IsmcXAvtPVqxUGi/arCSyQV4izogpwv8bffOL6S23Z0+fOwzl+3GUBGWe9RYCOCJbNebd1Lx5o1eODBXuGzRCIeO5vjzQM/fb7zbIyyt0cqcXDjrt9sJWBu2lMycvF+StViepJBvP/VBga/PtBMRKaNyMufup36kyLv/JLg0Ko2OZFRlryxTeaL1H+puAeeArtz3TKDd5eYXO2PxnckXNzzjk5Nv78GG1rPXXT0/c2NNclD218A1fYkLQcyMThP1o8Q4B63kvOka+D9K8xJvq99OpGTwuv2iOi+9Tq3W1Pn8gaKymqMsYRS9D6JOb//TUpQVXvt/e9hbNnlJV7+HzC9p6qQwvR6N7m72MEZ+zxO96y4AW0xY5OeiEn8mZNu9nrvE+NI7jc6I2W+HXQN/WF5d/iluxHsD4vPdt1FQQC49r8tu5NKnM+UXu9LlzUePXEp2E2Jva7bvags96yAWCzHejsj5n+tw/oLwqmB1etE7w+YZZNDfOjdi8bPZVm3Py5y5Aubl593S4evwjZ9rcB8SY1wUtA3BVUxxsb5X5F1hNOC+pp3k1L6/wrnaFlX1ZCYWs3FL0GCJT4ji0X+d3vZNzpxc9D1KxUWSEqL0ctEP8fX2I8w5qJzUf2SUd1SdNwKy3NposIoPpgBGgKe9lrd2QWzryUYWf0lzJZIBJVuVyg1dq8FcStSkWSUNIaAy9UWcS0G6hBBArhSp6J7RaQwN4RvSpZS0M6Svvv3xPzvR594M+QbP1pwpwNsI/HDUbjat+FRkAxNNgb1XR3zYY6RffN6V27PS5Lwh8q8Vxiaj+UOFOxBq+YKS0YK4DDYKOAu5HqFDRzSYQEIEBcfxirRCbwVjlQYNe1mrQFE4AHlC1NarsEkEM0lUxaU1CujI+7+nMBNq05R4LWHf3MhPo9heQm2k+kAswRpExAAdS+h0sRkSLMPG0qtIF+GosnV/bAqn7CcvaL6GQRWsKQF9r4whD7EtyIkgPWrUjZx9sk0tnXfExxJ02A3xoHI2bQ7Qm03sGkYeJH0mTKDBcY84QrQRSoEqUu5YXTGruBWLc+4kTO1mPwwFsLqqaEO1S3uYx2VOfygQ9p8XmrqiOAkbGC9NTeIyCXAAAIABJREFUZbXPlRcAimdO/kjV/Ig2HDOAJISBCgNAmy+BVHvjycD99f9YoHjOTVFXNAS6kLjeK4cHs6Rg0hbU3MV+7Vj7QehLqH2xfS1ZOuv6Muvot0GfJ67X/n4bHjQuf0F74hpboPNp6VMHoPJUzKbZmjWhKZFAte9ngjzEwd2n3VbllgG77JMtP3rLH7xyNcgP5KBD5uoRyUgMmzYHSych2Af0YNy9dqkjt73z8BWNwQWDdnlPqTAN4WCdygPWscdFPtYVBVNKXALXisg80AO8o23sFzmg2a4pBmBZ5uV/EuU7QNyXsr7BnSjxNG+B7G3FDek/WqnSFY1E/NLmi1f8wJTPAzWB/0S4XWBTu3qtug7VXy8p+PqhRCBc2EoJI2w3js5t43gA3n7sssrqnd4dquY64oSEtSCi8CzK15bPmvRkW2ur5MxucxTzHdD9RY5sEeEHtJwKqoZ91altjt5euGStivwciGPSaY7AAuNwfvGDkxY13V5UNMVbXjDpcTw5F/TlOOF78a5VhepfDfJyk862Mr8IrQS91bNUaxvPUy+Ok4gQsW7TQa31+wdU+RIq4mrzJf5g0yqTw4qZl21Lyuh2rYj8J/A2rQfSiCoLVeU7xMscofHMam3TbJ6cc0thDxFztQpn1JdyA9igRhdqkj5XUZNSl661E6lfk4laq9b8a9lDkzZAfSGXhPBlqvsiLoyn7y55aPIHHPjzL+NDCxOqSsrOAT3DwElab58TtByRzR76MWreTq3eu3bRE/8Vbsc1m5F9y7wJxuiLNA8BA2HWsoJJ+e1dwo2/4fFgbXLXs6zYCwRGqDZMBWUzRpf6PP+ChKwVG9tjQwVkTH5hpk+dy0HPRmNKIjFssrDIdZz5K++bWDFuxvxxVveZRqz11hbPznv7AH2W7KkvJEqg7mxRTo/lPiKWLcLIZsWuFc+3IDkrbfWB8h6NDy30VZWXnCiuOUeFbBEGYvEj4oJuU3S9Y1hpHH2z7xYqmg5E2VPn9TIJcgkaC5MS8DzH+2fxA1Ma66qMm/FMtrW20XFBRCuTPPvCotlTYoIZCpmcslEXo9JowhF004Cd9tWGtrKnFnZ1/GaiiiRAzIPZ1ejb77VIW9PAad8q7BYNOheL7DNjqOe9vvyhKa1cJPf9luV+kjZlOq4MV0tAHFNdF7Xr/Lak3Pi7fQ0jC5qF7UFY1E5YOmtKvBSZcfm3qbqVPW3eV43wLGiLpL6y07Ey4d3ZV3QWXO0kLuNDC4PsKvEtmpVXjcQfBGOxtPI0tCjCpGz0efbMxQ9P2RrvvHgc90I5MlQYSCwx5yHMjlOm3IL+77KZeT8+Kp37N2Zw/oKE7r6q5Fr127S0tKqGL/X40MJg5baqFC+p1F2ZtmlvQ+RKg/02uO0EhY+7Bt3k8NuPXVYZi24q7xrxi9dWMrXxoYU+d2d1am3SXqcu1be3wTkle+pyf2rkA2fR4zeEEVFCITN+44BAZSDiNWjKs6e+kGQC4fnAKaLymDj6BFq3MzGjT82i0AR3cP6ChHSvIgvHf2e9CamFsk/nL8tck3cw6VGPW6HMyyt0NnR3vmYMN6P2UhpT/u1DhFVR7HlNg687ObyMDy301ZSWXRILgGCwgKvI+zZSep3j73ahitwqMEShEtVX/InOb9+554pdY6cVPSuQgJG9WHIR2aXKTMSeLpjzwYZVZfbymZNmN/2a5ebPP0VVf4TqGBGCCCs99f20LjOyLqlE/hcjo63lruJZk5fk5hedpSo/U2HV8oLJdwCMy593qlX7KkiD0qwW4SMsW0SoUjQTZBTxI2tqjOjlSwryDqpM4XFbS2Rrhi9DjPd3kO7xXQO1HHVuXzFzcocLpCoBNqQnkpDkqwvXJGPUGGOSERXxfD4JSBJufQJL8TJh/+FngKrRXXhOWMWLqGqN9WxV0DPlMmT3YY9a6DhUakrnT1F4lJjNd4vGXvavOv5uF6qRp1ASFTYI0keFOyK13oDTbi+8zo3KBKALShTR3UCOiDwWW1NrKcggEX4/Nn/+yuUxZUysRXQMMYeTzSqiqF5miPbqUsHXXTHjUD1NxD4Y6530QjnX6D5nAYt+vYlAAiSijEEY0zzNZJwfi8ytyrCLDvYuHbdCWROUiM+VUqB7nN21iPne0oIr2rJZNqLbeidV1Xgp/gTbxXjaRcQkitEuWJspQqqFXmolCaGHEVIV0t3NJKhfE8WGfY7fSRYwKCkogqM+PE1ueJYt03W0iRUQi6hEjEi1+EyV62d3dFPmVhVe8D9WOkdCB2tWOrJkTy3qopgfA0FUH7Q+vc9EHJ8jkuAZ80dUU0AecsUL+TCnovxZRC63rjmlXqdngXtFvKet9f1NRIcj8leLuduoOwfkHBG9gCZCWefWPRf0BbeoWr/E/FgfEMwQL6qtAgbiIcrYQzBQqsLLrnh3ttePuynHrVCuvG9iRU7+/IWgLe1lOwSdsfTBSXNbOg6qYrytGddg5TSNucr1iLqR1MQACWpJEkMQsQFVkhDZl2633krb9OE1WF1k34aOQQgoBATSUfohnCJwRvTGjGJCZfsJzTr6+MRkWXQ4SKkVeaT4gbzPIba+TNeaU4A6I/xlRcGUkvGh0MvVpaPWAGdYq7n184qo8aLPLXnom6typs/7FBiO1aXFsy7/NGf63A+Ac1Sbu8QFnIQeavXHImQ3SUZtjIivXY44YmeLmkEaS6Ny4KeoVKgwUyP2dyviOK23h+O3wI+IKjRN5lQLPClqzl46M68onhbN25J5pVp5WOFm4FIgt95b5wSEngppqhxoqnnkERzky/8sxTG+2BCm6jP7bH3dfVVG673GrGcNQPc1I5QGT7LGX6ZY8XuxKWvbWQMaGBkqDAg8IMIExKwT5IdAK1umiZ/oGYClBVMWOH57pqDfBP4ErGkR9maB7SCvI9wtmNzlmat/Fi+KpL0ct19KgEgw5bWEusrbVERU9R+pmRnr27LH6YasHq7aEC1tmF8ObCxomG3E8q7uIjZF2iFIusJ2f9/SL+1XMnda0SXA9dboEyifo9JPPb5z2u2Fd1c7XY2NVPY2wjpVThbHXJc99ZFlnwedM8UyFNTDmmV6YBlsZFx+4Qir5i7K5EPqs95bq/k+h90aS6xch2uj6pjKWPUqc+Zptxf+w3OZqK2/hlrv6VVEKDQve1t2kPRaf+LepH1DRarn7qz1R9YXXPRFkkE3clwL5ap7LqwGHmjPsa7j3QAy5IAHdixKzDvEAyoVPgU+FWW9iGxUqxtdnI3BaOo2Bq932TdDVgCRWAmihn8f4b63GxX5FXAKqh5oAcL/KnKnG5VbEqKVPoXNCD8D/qKqU00gc6K12gUIisi8DAm+V6r7LZnSDE9NvsDVAhu13kPHGHlRrQaBAIhVx+kK9h8o56tyuxs1M0Cc/fqjhEK2+AC1WzqC41oo24vq4AR3857LD3zkoTcBhFFqRdityjqEdWpljRg+8TneZ/TevVWkLUVN2154X2ZhbEBVXhKxPRF5zYYHPeH4P9ujwnSQHhK7L4u9SNlcJyEDa/mRiPYC3aHIU1HH3PPy/ReFc6bPfRtIUfXqtc26VqAHRj4FUGGVUZaoMZ/ieWWITFTV/8PKHzB6H9YOVZFPgc1AF091D9GyRySQ0Ru4KnYn7UJETlRYdbTuFRzHdsqDQT8bGHSdqjcgloj3CyG4KJWKVgiyCShW5SNxWO8Tu37/wnf8Mi5/QZclBRc1M99kT33EXzxnqtvcVVDlK7c923XI1mjlF4nHPOPG51Lf7r+iusFonzttfkZbdUPH37AwGE4vkcNdY7O97FcoT77zlWS/W9Wl+L4rdrTlXnS8EN2UGaqfQh3MQBUVKFVhB5b1GC0WK2sd42wk6G2U7qVfgpT9nRxr7PcFzJ02P0NFZwlqVfQlI7K0/3a74ZiOKG+D2o09BvmM9yZxstABILii7FTYIugaK2aliK72qWymb9fNIus7ZJHfSScH/CqMnT7vDBGeRTWzPsToI8UsVMsbjsiqpbOuiBcuc0wS/TzzTmLpPHwIu7DyqaJrHNGV1uoKV+22oC9lp/Tb8qWY5hyr5OUVOpuyfGle0P+Fl0+pqSl7DhThcqzRjpuikpP/TD5qf0/zDAS1QKkq74mwUNQudQKs/LLMyw8F/WRwghfce4ladkQdd1Oiz18uPXe2lR3g3xNVyZ3+TDfPRNKMl5BqHDfLUxMUoRuqXRVNE5VuAikqkgSNGeYz2FdjQ4BgR6g0FA1L8wD5GuorO6PqIrJTFE+FSkXLRU0Ew3ZUXYwpJerWIv4K64/u9sS/d38Vwo8U7bor2VMf8Yu/21PSZi0JUdBaYDfoeyryFirvpFjv/cZ4uE6+9IwPLQxW79zdW3y2j1XJQulpYABGeip0F+iuaG8QP6o+BZ/EoiIM8XMTfZlRYlkkPAVP0CiICxIF3SawC2UHIptVdCue3YyYzcbUbd6XPf/w0O6hKvuOFzKdcHi5tg5/aosoUCMiH6C6DHSx8bnLgivXbVk0HnswoSydfCGEUEjy1oyQqp4pvlJfbR9cTkA5QZQBGO2nykCUgQiZxATMATWHmkXvOESJfY09wBPYpfCRwForrBbPvpdcU/3RooGbIh3xXh/U/GHs9HlniNpX44VBHQQlAssUfV/ULEP8K/01WrozeVNkfcGMTmXJoRAKma+X5fprvSp/hUOiX80AVU5AOEFhsAgDUU4g5s97rH3RjhVqgKWi8o6qfcmXoCsOdSl3cJP6UMjklI76AfA/dKzf7BZgvcBqq3xkxH6oNvCJLyFSnVBeXVNfZPPfmvGhhb7asq1JmNREa9xkicpA0EGKDiZW+HQA0I9YXF+n4B1dqlG+v2zW5IcO5eSDXmnHIrHr/gbyjUNp8CCoBTaDbEH1cxHWW9VPjch6x9o9Yn17w7akqnjOTYfd7elIkD11uT/irEtJ8gWTXdUUR7S7RfqKlYGIDlS0jyC9iAldFh2ch/dIE/A7DOqRSlZaIiLw8dYKduw+Lh7lalV+uHzW5LglLdrDIam/cqfNPwmxL2mcwq9HiN2oliBSqqqlCJ8Lsk2NbBWPTWq00lhTrRqujQaCldGt0Zo1RQcf19YByPhbCpPDCQQilhSfJQUh0bOSqmhvQfoakR6q0g/IAO0mkF4fzf6FqgF/mUlLSeDWy0dz7pi+BP2xsWX+Wxv4zd+P2XpAAHsRedSY8O+WPHD1/rITHpBD1UlLTn7R5aLyp3hJfY8+Wi1INVCrUIVSg1CHsB1LjYjuimnc2K7giZqIGt0ptv2prjUWxt5bDI6KGlEnCyGgql1NLNtfV1XSEJJVCYiQAiSDBEG/jJEoB6Rf9xTGDM7k9VXbqKhu3xiXlODDtUokGvM3MSLkTxzNVRMG83/Fm3lpySb8jkNlbYQPPtvNmMGZ5AzNwvUsi97fxqfbKjjlxEwG9+6KVcWIsPzjXQzrl07Us7z74Q6q61yG90+nNuziGMGqsmlXFdYeESc0RWS5Wrlr0C73Xx3hWHOoDulqw7tfMIGMh4Hv0cb60u8YvnPRCAJ+wyMvraU2fKRsvJKsTevONww99Vn1G6L9G0MuREGJ1XRtdxNNAplVYlerj/vRJscALbKRHLveipeMG8D15w9lT1WYN1fvoGuSn64pCfRMT2TTrip27K7B7zNMPH0QF+X2x4iQlODjsVc+4uVlsWySXZIDnDmqJ59tr+T381axp2qfbm/CKX24+9qxeJ4l4He4ZNwAbnvobc4c1ZPrzosVaFOFPdVh0pIDWIV5b37KffNX8ZtvnUow4GAkJpQvLtnEwy+uIe+sE7lwbD+MEV5bsYUn/m8duUOzGN4/naraKAG/wztrd1BVGyU9NYGyvXWUV7Zb37gXZJYx4QeWFFy9c3kH3edDjhIpnnNTdOz0ec+K2hvaqsaVOyyLK8cPJhhw+Od7W1izcT+5njs5rKQk+jlzVC9O6NmFLkl+VnxaymsrtuJ6bWvwE/wO4ajHib26MGJAOuVVYaKeJRjwcc05Q7jmnCH4fYbEgI+SvXXcNvstBvZI5dbLT2bH7mpA6J+VQlrKvjSoQb9D16QA67bsaSaQRoTJZ51A1LXMmP0WIwek8/28MZzzlT4k1E9x73p8CXlfO5Gh/dL4zd9XctWEweQO60Fyop9gwCEl6OexVz5i/Cm9mXTmCby2Ygv9uqdQureOQT27cNPFI1ny0S5GDEjnlktHNbY96cwTuP+ZVdx11VdZ/OFOfvP3FYSuHUvvjGR++sRSNpfEM7XrUiy3DyyxS4qKru5Qt9NDEspx+Qu6WGruECVfRVqVgwNIDvq58cJhBAOxG9ovM4U1G3eTHPRTXXdoFRI6OXSG9O5K6NqxWKt4Vrns9EF0SQrwyvLNDO2XxqadlaQm+fmvC4bx8dYKvnHaQMoq6pgx+y2+c9EIcoZmUfDsByT4HfpnpbB9dw0ZXYIUf1LC2k3lXHveSYw/pQ+9M5JQVX7+5HKCAR+/v+l0uqXus6DVRlz2VEXok5lCZtcgpRUxxboIZKUlUlPn8snWCkQg4npkdgmSmhwT6rWfl1NRHaE27LH8411cOLYfGakJjROhDzeX88d/fEh5VZgffXMMQ/umUVZZx9kn9yYtJYAxQr/uKaSnJOB6lnvnvs+AHqlcOX4wNWGXytoopw/vwZDeXRl/cm/eXL2DbWUtHLpU61TMbyLB1HtW3XNh9eGILD8oocye+ojfCWRcbLXmf4GT4pXkaODrOf0YPSiD9zeUMaxfGv26JyMi/OZb4+idkczU+19n7EndSQn6+cfyz6mLegQcB9daoq5lQI9Urj33JF5ftY03Vx8467vPEfpkpLC7so7K2uNP6DO7BJl4xiC+cmImPsfw2ootzH1zA9piGSwCjjE4JvaqhuvXciUVtajCgqWfs2DpJu777hn0z0ph7End+fWNp3LvvJWs/mw3F2T3Y2d5Las+LeOSUwcw/pTejByQTmlFLcs/KSHqWfpkJLN6425cz7Js3S5eeHcj1553EoN6plIbdhERAj6H2rCLZ5XuXffVUd1bE+HttTu4esIQfnXDOBYs2URKop+uKQE+2VbB2aN7c9NFIxjQM5WAz2H1pnJOH9EDoHEdG456VNbE/u2pkpjgw4iQEvSTkujnxF5d8KySlpLA9ecPZcP2vazfVsG4YT0orwqTEHCornNZuaGMlMR665Eqb63ezlUThvDfV30V1ypFb6zHa74u9VT4+vKZzcs7dDTtE0pVGTejaLin5n8UJh7o8Ky0RP7z3JMA6NUtCZ9j6JOZgmOEE3t1oSbsUVkbZeLpg+iTkcx760uZevEIzh7di892VPLkax9zUe4Axg3LYktpNe9viPm8R+unWnVht9VwMCArlUdvH88bH2znj//4kImnD2LeWxtaj3RAav10Z091hKjbevomgM9nGr8qRwIR6JGexIj+6by9ZkejMEHsHj5wy5n0zUxmW1kNEdcjPSUBnyOM6N+NYf3S2VJaxZKPdnHq8B5cf/5QeqYnUro3zLd/vxDPKnVRj/LKMGeN7sXpI3qSmOBjZ3ktW8uqEYHe3ZJZvHYnlbVRenZL4pGX1nD6yJ7kXzaa7l0TmffWBsIRj4rqCD3Sk9hbHSEc9chKS6S8KnYfs9IS+dM/13HxuAGErh2L6ylJCT7SUxMQia0HVeGPL39IWnKAs0/pzeiBY/CssmH7Xu7+yzL6Z6Uy+WsnYC08v3gjC9/fSvaQTKrrXGrDLq5ncT2Lz2cwAtbG2jBGOKFXF57/+ddJDvpZsb6EdVv2YEQQgUE9Y7WgPKt0Sw3iWksk6jUKZXWdy+urtnH1OUM4qU9Xln60ixXrS1s+JgflN+PyF1zQMja0IzmgUJ783flZCflzb7KYOyR+XcdmGCN88+zB9ExPYtH720gK+khPSaBHeiJpKQEyuybyr5VbSQ76yOgSpGRvHUP6xKYL67bswVc/xTj5hFjx4ZsvHYnfZzh7dC9cT/FUeej51Qzp05WkoI9l60pYs2k3qUkBfI6htKKWs0b14ppzh7BxZ2Vcofzpf45l7JDuXH/Pv9i8q/V6ISstkbuuzuaf723hhXc3tuc+HjIJfgdrFb/P8KsbcklPSWDnnlrWb60gHPUQEa45Zwh9M5OZs2Atf/3XJ3ieNipU7ph8CrVhlwS/w73z3qe0oo6TB2VQXhXm/U9LGwevuojH7qowfTOT+XjnHoIJDtedP5S318RmIb0zkqmNuOytiZDZNciO8lqeW/wZN5w/DEVZ+WkpdRGX8sowqUl+op4lHLVkdo1Vkd9RXkNqop9l63Yx6/nV/EdOf6xVstISW+m2quqi/OqpYv7y2sdkdU2kJuzy8dY91EU8vvP7RfTJTKYu6rGttBqryqMvf8jTiz7FWuWxVz4iJdFPZU2Umc+tJpgQW/cK8MFnu/loSzm794Z5fvFnVNZGeXrRes4Y1ZO9NRFqIy5R11IXdimtqKOqNkqXpABWlcraCBt2xLYF/Q5//dfHcQdkERnnafVTo29+8doPHrqk/HC8E20K5Wm3FyZa17nYqv0JyMm003zSu1sSl546gI+3VvCrp4qprI3wtx+fT5+MZPp3j2X/27Wnlu5dE+neNci6LXvYsH0v5VVhBmSlMPfNDfz1Xx8ztF8aowZ24+EX11BaUceVZw8m4DdsKa3mtBE9mXjGIFSVa88byl2PL8GI4HOE0r11GCNEXcu2smq+cmImpw3vgWeVhe9vZVtZNV8dnMmKT0vZWx1hWL90quqibCurblSh98lM4dThPfhoc/OAAb9jSEtJIOp67KmOYIyQ2SW2XgoGHHbsriHgc+jTPRnPU4IBh5I9tZRU1DGsfxpjh2RRVRdl4cqtVNZGuf78oeQOzaIm7LJ+WwUn9UnD7zM89r0JfOf+RazaUEbAZxgxoBsle+p4ccmmxi97OOqxdlM5r6/aRlpKAmNOzOT8MX2Z9cJq6qIu76zZwQPPrGqUh3DUo7yyjpSgj588sZSbLxnJxeMG0C01tq4bPagbU84eTEZqENe1pAR9PL1wPZedNojkoI9VG8qoi3qs31ZBapKf6jqXF9/dyJbSajxV7v7zssaZzIj+6eytjpCWkoAxwuIPd7Sqq9rwddywvfkHpzYSuxdN2bG7hh31qXE+2bpv36rPYjOok/qm4TjCZzv28rvC5mVAC577gILnPgBiyiRjhPufWUVigo+Kmgh/W/gJb3ywjairXJDdj8SAj+JPSli6bhdtIchFQV+4YOQthd9dcxgCLloLpaqMnTHvK9GI/lhEL+Ugi8KWV0X44R/fpaYuNuoCfLKlgglf6UNFdZhI1OP87L6cOqwHyUE/G7bvpVtqArOfX831Fwzlm2fH7FfpKQnsqQrz6ntbGNovjYSA4fnFm3joxdUM7ZvGwB6p9M5I4sTeXckZmsWn2yrwOYbdlWGG90/HWiXiWq4/7/+3d+7BcZVlHH6+c87uZpNsLptstmmTJunV3mxDsFiK0FpQ0ZHLaFHREXXGjjiiwOgwo47WyzjecMYbiAwqoEVb6lDFWq3cSilDU6ulN0qakqRpkt3NJtlN9n7O9/rH2aZFeoWALfaZ2T92d3b27Oz3ne+9/t5ZzG0KUuqzuO7SFu7btJ9EKs+m9h5+fPNlzGqoJJku8JVfP8c/O04ull4fLOWLKxcxrb6CfEFz36b9bD8Q5a7PX45luKH/1Q/u4MZ3zqR1ei22o/H7LO5+dC/PH4rznU9dgqEUZSUWl84Ns/7pQ6x671w6+xNoETr7k8QSGRpD5fx0w24iw8eqW0Rc89b4r5SNZRksnh0mV3BIZQtUlHkp2OKenF4DZSikeKMp2JrBRJbW6bV89cY25jcHiSezHOxLcP/mF/jsNQv46PKZHImniI5kMA2DqnIvHtNgf88IA8Xr+cG6f5O3XdPvZ3/aM34te4qRda9lcCSeoiFUTjpX4K4/7+GRbS+dzRI6a3pjY6x+YAfRxKlLTbUI2hGGRnNQTHt0RUbpiozynoun8pWPXER0JMOP/rjrdG6LQuTDpaaZWfqpDbc/86trJ1Rh4mWbsm3Vmlrjc+tvQXEzSp1IWfy0pLKFV9jid67fxZonOuiLp/nhw7u4qq2BEo9FIpUnnsjyuWvnEwyU4POYFGzXZwgGfORtTUNtOXVVfryWyb6eIfIFzR03tDIpWEp/sSwrlSmMR/iGx3IEAz5s7Zokzx2I4vWYTJ9cQajST97WfOYnW5jfFGRuUzU7XoxxqD95QjP3eETA77XoiY7RNjPELdcu4GPf+wflJRZ+n8WW5/u56qIG3jarjj88dRCfx+T6pS34vRbXLW0h4Pfw7P4IcxqruWx+PY/96whahIDfw96uIdoPRJkxuZKPXzmLrXv6iQy7Cyxva144PMzcpmm8u62Rh548iIgwq6GKdy6cTInXZN3TnVzZOqXoHwnpnEOo0o/HNMjpY75pV2SUsUyBUJWfbfsG+MNTnSRTeR5++hDtL8YwDcVgIku24FDqs/jWTYvxeU3u33xsHOfYaYJoeVvzy7/s4/7NB3C0nNBnn2jSOZsndp3xUKsT8kLvML/cuI/NO3s5MnhGLbQmwifyZXb86ls2fv2vEyQvCcdtypUr15pdXuuroD8JvIoJySdnZCw3npN6ZNtLbNzejWkaBPwexrIFeuMpVixyF9Wm9h764mm6I6NcMifMze+fNx7o6Y+nCQZ8NIUD7O0eorMvSXM4QGQkw1sa3czM8GiOmooSbEcTqvDz6avnIBxbTANDaWIjGQ6YI8QSGRZOq8Eu+kenwnY0jtbMmVqNZSoqi2F6EeiOjLH6wXa+/YnFKAW/e7yD6nIv1y9twWMZ1ARKMJRiflOQTN4N+e/tGuJH63fx3sVNXLOkhWgiO25ZzGqoIp1ziAynERHWbz3EitYGVr1vLle1NWIaisk1pfz2sQ4APrp8JqahSGULCPDvzkEKZIvoAAAGK0lEQVTSWfsVJuPaLZ1s3N5NtqBJZQvj5vpRU/J4cnmHLbv7ONiXZNu+s6saE1wf9nyia2CU3wycdCzlSRALkdsHJVWYt3LttyaqlHN8U65bd4Mz45aNdwQk8X1Tea4wNFeKYhnQwgSr3uVtDbYer/DZ2RFjZ0dsPEIH8LUH2lnQUkMilSMYKOEv27vpjo4yMpan/cUoF890qzIAMjmb6mKCOjKSpqLUS8HW+H0mVeU+Nu/sJRjw0RgqZ6yYIzUNxU8f2c3SefW8q62RhdNqXnG3TeeOnQorWhtYPDvM+q2HeGtLkKZwgMpS9zuPRmmP5tyWzAljmW6Rk6M13dFRWmfUsnnnYXpiYzSGyskWHK5Z0szh6BjzmqopK7HY0xXHdjRf/shF3P/3A/zqb+4J9dJAktvveYYPXTGDxlA56Zxmw7YuNjz7Eu0HooSqSnixN8FYpkAynee7v9+Jc4LIcSZnn3FVlRbhF4/u4ywqD/9PUR4UXyoLE125cu1dE15mV1R47gMeQuT3825Y5ymrs5o1+iqlWI7IFSijCrcJdsLlKY///xOpPFuPy09u2d03/v6tdz1DY1158cQo4+AR15+MJ3Pk8m7ULpnOs7d7mEP9SZYvdLWwtBbXPwM++I5prLx8BiBk8jaDyVd2h3366rlcd2kLtqN5/lAcpaBtZi2NoXK0gMcyXrbINzzbxYqLGrjjQ63jr9VW+Llv035ap9fygXdMR0QYSeX5247D+Dwml86bxJbn+1jzeAfxZJZv/vafTK0rf9npJAL7uodZ/eAOiulH97fA+I3geCYqjfMqN6Sc6CHugulT4AhqCI4bnY7Rq0ROaaooJSHh2MRl94OqRCnqjj2lHhlvWzu6Po2TPJ9IfAJ3doeNAiL3vFblx7Pup7w4Pn+hIVwioi5DyWIg7I5yk3NS2NnvtYonk01lmY+DfQkyOZtwtZ/3XDyVilIvz+wd4F+dsfFNP63eLck6njVPdLBi0RTmTK2mfyiFZRr84tG9XL5gMlqENY93YCjFTe+aTUmx6mVFawP3/nU/927ch89jMq2+Ai1CT2SUzHlm3hUpFOUyCoANxIABBf0aBhRGnxIdQ5EQQ6JaqyFLqbHnanb3vZFKE27v6dAkAGwnLAZejaozFF5Rql7Ap4QpgqpWItUoCSOqDkUAtyXOi3tgWZzdJs4ojJu2/+z6h08z9v6UvKbTbtnqJ6xcItlcKBQWKni7iLxdKdWsoMqdOzjxp+m5zJTaMu69bdl4mqQvnuYLd2+lO3LeyL8WcDvoM8VHL9ANchiMLhEdEdQAlu4PVIeiT65e/qZqPl9y21p/tuBUe/BMVkqCWlQdSoURacRVbWjC7WX1K/CLO3fmvzdtRoQPvuH9lKdiwc2/qy61SmZr0XNALQRZBEf7BU9ffHA+47EM3jarjuZJAbJ5h+deiJxpJO+NJA0kgaTAsBK6FeqgGNIlmiMY9DviiVTWVkTfbNKNE0Hbqj+Xmt5MWCkz7IhMURgtoGcCb0ERRggCDiIfa//5ysdezXe8/ieZiLrk1ofqbNs3RSlpMZAFgloAqgkkJBBWZ5kLvcApESABDAPDCgYE6VJKdQnSicOAUs5gRjux3XffOPJazKwLvJxFt/66yueUTXY0U5SounRM1r2aiOz/zLx86xcfKPMUSmqwzVpDMRP0LJQxG5HG4h2nnglOzbyJSCIMYagYIkMCvUqpLkS6EKfHMHyDRiGfSBokXo+Kkwu8vpxzPt+S29b6VcYKZA27wjAJGhjTRUszShV1agiBKmqQnouqB68RxSjCCG4QZQgYAAZE5AhKHUaZh7VTGBLDSXtV5Zi/xp++YGa+uTjnNuWpaFt1jydrVfsqfHjzYvosx6kWsSaJcurBmIToSSijSiEh0YRQUqpQoaIKQdX/4JIFV607B8RBpREZVDAiSo0qpXsElTRQMdHqiHglolNkTI/Ke8rM/EQOIr3A+cN5tSnPDFHLln3DjC2ba0yNl6tozjGzVsYoN/NGXsxy0/AFRdvKEqMRQBuYSksYpc46pSMKx9CMVxw4hh5EWWlt5x1lG32WLy8Zn3Y8yWoJ5Ad1rLlMhwjpJ3nqghj1BU7KfwDfySCyBI8C6AAAAABJRU5ErkJggg==";

// returns nothing, modifies a doc object
function addDocSettings(doc) {
  doc.settings = {};
  doc.settings.pageWidth = 210; // mm
  doc.settings.marginX = 10; // mm
  doc.settings.marginY = 16; // mm
  doc.settings.contentBottomY =
    doc.internal.pageSize.height - doc.settings.marginY;
  doc.settings.contentWidth = doc.settings.pageWidth - doc.settings.marginX * 2;
  doc.settings._y = doc.settings.marginY;
}

function generateSalesContract() {
  var doc = new jsPDF("p", "mm", "a4");
  addDocSettings(doc);

  // some number variables
  var fontSm = 10;
  var fontMd = 14;
  var fontLg = 16;
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;

  var xStartLeft = doc.settings.marginX;
  var xStartMid = doc.settings.contentWidth / 2 + doc.settings.marginX;

  // logo
  var logoWidth = doc.settings.contentWidth / 5;
  var logoHeight = logoWidth / 229 * 115;
  doc.addImage(
    logoDataString,
    xStartMid - logoWidth / 2,
    doc.settings._y,
    logoWidth,
    logoHeight
  );

  doc.settings._y += logoHeight + spaceLg;

  // title
  doc.setFontSize(20);
  doc.addText("Contract of Sale", xStartLeft);
  doc.settings._y += spaceLg;

  // // label row 1
  doc.setFontSize(fontSm);
  doc.addText("Make", xStartLeft);
  doc.addText("Year", xStartMid);
  doc.settings._y += spaceSm;

  // content row 1
  doc.setFontSize(fontLg);
  doc.addText($("input#make-1").val(), xStartLeft);
  doc.addText($("input#year-1").val(), xStartMid);
  doc.settings._y += spaceMd;

  // label row 2
  doc.setFontSize(fontSm);
  doc.addText("Model", xStartLeft);
  doc.addText("Kilometres", xStartMid);
  doc.settings._y += spaceSm;

  // content row 2
  doc.setFontSize(fontMd);
  doc.addText($("input#model-1").val(), xStartLeft);
  doc.addText($("input#kilometres-1").val(), xStartMid);
  doc.settings._y += spaceMd;

  // content row 3
  doc.addText("I, " + $("input#contractCustomerName").val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 4
  doc.addText("of, " + $("input#contractCustomerAddress").val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 5
  doc.addText(
    "hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of:",
    xStartLeft
  );
  doc.settings._y += spaceMd;

  // content row 6
  doc.addText("$ " + $("input#contractAgreedPrice").val(), xStartLeft);
  doc.settings._y += spaceLg;

  // contract content
  $(".contract__content > p").each(function() {
    doc.addText($(this).text(), xStartLeft);
    // add gap for each paragraph
    doc.settings._y += spaceSm;
  });

  // bottom label row 1
  doc.setFontSize(fontSm);
  doc.addText("Customer Signature", xStartLeft);
  doc.addText("AreYouSelling Rep (Witness) Signature", xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 1

  var signatureAspectRatio = 1 / 8;
  var signatureWidth = doc.settings.contentWidth / 3;
  var signatureHeight = signatureWidth * signatureAspectRatio;

  var customerSig = $("input#customer-signature-string").val();
  if (customerSig) {
    doc.addImage(
      customerSig,
      "PNG",
      xStartLeft,
      doc.settings._y,
      signatureWidth,
      signatureHeight
    );
  }

  var repSig = $("input#rep-signature-string").val();
  if (repSig) {
    doc.addImage(
      repSig,
      xStartMid,
      doc.settings._y,
      signatureWidth,
      signatureHeight
    );
  }

  doc.settings._y += signatureHeight + spaceMd;

  // bottom label row 2
  doc.setFontSize(fontSm);
  doc.addText("Model", xStartLeft);
  doc.addText("Kilometres", xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 2
  doc.setFontSize(fontLg);
  doc.addText($("input#model-1").val(), xStartLeft);
  doc.addText($("input#kilometres-1").val(), xStartMid);
  doc.settings._y += spaceMd;

  // bottom label row 3
  doc.setFontSize(fontSm);
  doc.addText("Customer Name", xStartLeft);
  doc.addText("AreYouSelling Rep (Witness) Name", xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 3
  doc.setFontSize(fontLg);
  doc.addText($("input#customerName-3").val(), xStartLeft);
  doc.addText($("input#repName-1").val(), xStartMid);
  doc.settings._y += spaceMd;

  // bottom label row 4
  doc.setFontSize(fontSm);
  doc.addText("Date", xStartLeft);
  doc.settings._y += spaceSm;

  // bottom content row 4
  doc.setFontSize(fontLg);
  doc.addText($("input#contractDate-1").val(), xStartLeft);

  doc.save("ays-contract.pdf");
}

function generateInternalRecord() {
  var doc = new jsPDF("p", "mm", "a4");
  addDocSettings(doc);

  // some number variables
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;

  var xStartLeft = doc.settings.marginX;
  var xStartMid = doc.settings.contentWidth / 2 + doc.settings.marginX;

  // logo
  var logoWidth = doc.settings.contentWidth / 5;
  var logoHeight = logoWidth / 229 * 115;
  doc.addImage(
    logoDataString,
    xStartMid - logoWidth / 2,
    doc.settings._y,
    logoWidth,
    logoHeight
  );

  doc.settings._y += logoHeight + spaceLg;

  // title
  doc.setFontSize(20);
  doc.addText("Internal Record", xStartLeft);
  doc.settings._y += spaceMd;
  console.log("Internal Record");

  // signature sizing
  var signatureAspectRatio = 1 / 8;
  var signatureWidth = doc.settings.contentWidth / 3;
  var signatureHeight = signatureWidth * signatureAspectRatio;

  doc.setFontSize(12);
  $(".field").each(function(index) {
    var xStart = index % 2 == 0 ? xStartLeft : xStartMid;
    var yIncrease = index % 2 == 0 ? spaceSm : 0;
    var $field = $(this);
    var fieldName = $field.find(".fieldName").html();
    var fieldValue = $field.find(".fieldValue").html();
    doc.settings._y += yIncrease;
    doc.addText(fieldName + ": " + fieldValue, xStart, { lineWidth: 1/2 });
  });

  // photos
  doc.settings._y += spaceMd;
  // photo sizing
  var photoAspectRatio = 3 / 5;
  var photoWidth = doc.settings.contentWidth / 2;
  doc.setFontSize(16);

  $("#licenseAndRegistrationPhotos img").each(function(index) {
    var photoHeight = photoWidth * photoAspectRatio;
    doc.checkOrUpdatePaging(
      photoHeight + px2mm(doc.internal.getLineHeight()) + spaceMd
    );
    if (index == 0) {
      doc.addText("License and Registration Photos", xStartLeft);
      doc.settings._y += spaceMd;
    }

    doc.addImage(
      $(this).attr("src"),
      "PNG",
      xStartLeft,
      doc.settings._y,
      photoWidth,
      photoHeight
    );
    doc.settings._y += photoHeight + spaceMd;
  });

  doc.save("ays-internal-record.pdf");
}

$(document).ready(function() {
  var $wrapper = $(".contract-page");
  if (!$wrapper) return;
  $("#save-contract").click(function(e) {
    generateSalesContract();
  });
});

$(document).ready(function() {
  var $wrapper = $(".internalRecord-page");
  if (!$wrapper) return;
  var imageCount = $(".inspection-image").length;
  var updatedImageCount = 0;
  $(".inspection-image").each(function() {
    var $img = $(this);
    toDataURL($img.attr("src"), function(dataURL) {
      $img.attr("src", dataURL);
      updatedImageCount++;
    });
  });

  function ensureAllImagesUpdated() {
    if (imageCount == updatedImageCount) {
      // only generateInternalRecord after all image url updated to data uri format
      generateInternalRecord();
      return;
    } else {
      setTimeout(ensureAllImagesUpdated, 300);
    }
  }

  $("#save-record").click(function(e) {
    ensureAllImagesUpdated();
  });
});

// *************************************
//
//   AYS Image Upload
//   -> Upload images one at a time
//
// *************************************
$(function() {
  var $wrappers = $('.image-upload');
  if (!$wrappers.length) return;

  $wrappers.each(function() {
    var $wrapper = $(this);
    $wrapper.find('.image-upload__trigger').click(function() {
      var $node = cloneDomTemplate($wrapper);
      $wrapper.append($node);
      $node.find('.image-upload__input').trigger('click');
    });
  });

  function cloneDomTemplate($el) {
    var clone = $el
      .find('[template]')
      .clone()
      .removeAttr('template');

    console.log(clone);
    return $el
      .find('[template]')
      .clone()
      .removeAttr('template');
  }

  function setPreviewImage(file, $node) {
    var reader = new FileReader();
    // read the image file as a data URL.
    reader.readAsDataURL(file);
    reader.onload = function(e) {
      // get loaded data and render thumbnail.
      $node
        .show()
        .find('.image-wrapper img')
        .attr('src', e.target.result);
    };
  }

  $(document).on('change', '.image-upload__input', function() {
    var $input = $(this);
    var $complex = $input.closest('.image-upload__complex');
    setPreviewImage($input[0].files[0], $complex);
  });

  $(document).on('click', '.image-upload__remove', function() {
    $(this)
      .closest('.image-upload__complex')
      .remove();
  });
});

// *************************************
//
//   AYS Signature
//   -> Signature capture
//
// *************************************
$(function(){
  var $wrapper = $("#signature-pad");
  if (!$wrapper) return;

  var $clearButton = $wrapper.find("[data-action=clear]");
  var $saveButton = $wrapper.find("[data-action=save-png]"); $wrapper.find("[data-action=save-svg]");
  var canvas = $wrapper.find("canvas")[0];
  var signaturePad = new SignaturePad(canvas);
  var currentSignatureTarget = '';

  // function to correctly size canvas
  function resizeCanvas() {
    var ratio =  Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear(); // otherwise isEmpty() might return incorrect value
  }

  function openModal() {
    $('#signature-modal').addClass('md-show');
  }
  function closeModal() {
    $('#signature-modal').removeClass('md-show');
  }

  $clearButton.click( function (event) {
    signaturePad.clear();
  });

  $saveButton.click( function (event) {
    if (signaturePad.isEmpty()) {
      alert("Please provide signature first.");
    } else {
      // hide signaturePad
      $('#signature-modal').removeClass('md-show');

      // clone signaturePad so the canvas is not messed up by the trim if the user decides sign again
      var signatureClone = jQuery.extend(true, {}, signaturePad);
      // trim white spaces
      signatureClone.removeBlanks();
      var imageData = signatureClone.toDataURL();
      $('#'+currentSignatureTarget+'-signature-image')
        .attr('src',imageData)
        .show();
      $('#'+currentSignatureTarget+'-signature-string').val(imageData);
    }

    $(window).resize(function(){
      resizeCanvas();
    });

  });

  // modal
  $('.md-launch').click(function(){
    currentSignatureTarget = $(this).data('target');
    console.log(currentSignatureTarget)
    resizeCanvas();
    openModal();
  });
  $('.md-overlay').click(function(){
    closeModal();
  });
  $('#close-modal').click(function() {
    closeModal();
  });
});

// helper to remove blank space
SignaturePad.prototype.removeBlanks = function () {
  var imgWidth = this._ctx.canvas.width;
  var imgHeight = this._ctx.canvas.height;
  var imageData = this._ctx.getImageData(0, 0, imgWidth, imgHeight),
  data = imageData.data,
  getAlpha = function(x, y) {
    return data[(imgWidth*y + x) * 4 + 3]
  },
  scanY = function (fromTop) {
    var offset = fromTop ? 1 : -1;

    // loop through each row
    for(var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

      // loop through each column
      for(var x = 0; x < imgWidth; x++) {
        if (getAlpha(x, y)) {
          return y;
        }
      }
    }
    return null; // all image is white
  },
  scanX = function (fromLeft) {
    var offset = fromLeft? 1 : -1;

    // loop through each column
    for(var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

      // loop through each row
      for(var y = 0; y < imgHeight; y++) {
        if (getAlpha(x, y)) {
          return x;
        }
      }
    }
    return null; // all image is white
  };

  var cropTop = scanY(true),
  cropBottom = scanY(false),
  cropLeft = scanX(true),
  cropRight = scanX(false);

  var relevantData = this._ctx.getImageData(cropLeft, cropTop, cropRight-cropLeft, cropBottom-cropTop);
  this._canvas.width = cropRight-cropLeft;
  this._canvas.height = cropBottom-cropTop;
  this._ctx.clearRect(0, 0, cropRight-cropLeft, cropBottom-cropTop);
  this._ctx.putImageData(relevantData, 0, 0);

  return relevantData;
};

// show signature images if they already exist
$(document).ready(function(){
  $('.signature-image').each(function(){
    var $this = $(this);
    if ($this.attr('src')) {
      $this.show();
    }
  });
});

// AMD support (Thanks to @FagnerMartinsBrack)
;(function(factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
})(function($){
  'use strict';

  var instances = [],
      matchers  = [],
      defaultOptions  = {
        precision: 100, // 0.1 seconds, used to update the DOM
        elapse: false,
        defer: false
      };
  // Miliseconds
  matchers.push(/^[0-9]*$/.source);
  // Month/Day/Year [hours:minutes:seconds]
  matchers.push(/([0-9]{1,2}\/){2}[0-9]{4}( [0-9]{1,2}(:[0-9]{2}){2})?/
    .source);
  // Year/Day/Month [hours:minutes:seconds] and
  // Year-Day-Month [hours:minutes:seconds]
  matchers.push(/[0-9]{4}([\/\-][0-9]{1,2}){2}( [0-9]{1,2}(:[0-9]{2}){2})?/
    .source);
  // Cast the matchers to a regular expression object
  matchers = new RegExp(matchers.join('|'));
  // Parse a Date formatted has String to a native object
  function parseDateString(dateString) {
    // Pass through when a native object is sent
    if(dateString instanceof Date) {
      return dateString;
    }
    // Caste string to date object
    if(String(dateString).match(matchers)) {
      // If looks like a milisecond value cast to number before
      // final casting (Thanks to @msigley)
      if(String(dateString).match(/^[0-9]*$/)) {
        dateString = Number(dateString);
      }
      // Replace dashes to slashes
      if(String(dateString).match(/\-/)) {
        dateString = String(dateString).replace(/\-/g, '/');
      }
      return new Date(dateString);
    } else {
      throw new Error('Couldn\'t cast `' + dateString +
        '` to a date object.');
    }
  }
  // Map to convert from a directive to offset object property
  var DIRECTIVE_KEY_MAP = {
    'Y': 'years',
    'm': 'months',
    'n': 'daysToMonth',
    'd': 'daysToWeek',
    'w': 'weeks',
    'W': 'weeksToMonth',
    'H': 'hours',
    'M': 'minutes',
    'S': 'seconds',
    'D': 'totalDays',
    'I': 'totalHours',
    'N': 'totalMinutes',
    'T': 'totalSeconds'
  };
  // Returns an escaped regexp from the string
  function escapedRegExp(str) {
    var sanitize = str.toString().replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    return new RegExp(sanitize);
  }
  // Time string formatter
  function strftime(offsetObject) {
    return function(format) {
      var directives = format.match(/%(-|!)?[A-Z]{1}(:[^;]+;)?/gi);
      if(directives) {
        for(var i = 0, len = directives.length; i < len; ++i) {
          var directive   = directives[i]
              .match(/%(-|!)?([a-zA-Z]{1})(:[^;]+;)?/),
            regexp    = escapedRegExp(directive[0]),
            modifier  = directive[1] || '',
            plural    = directive[3] || '',
            value     = null;
            // Get the key
            directive = directive[2];
          // Swap shot-versions directives
          if(DIRECTIVE_KEY_MAP.hasOwnProperty(directive)) {
            value = DIRECTIVE_KEY_MAP[directive];
            value = Number(offsetObject[value]);
          }
          if(value !== null) {
            // Pluralize
            if(modifier === '!') {
              value = pluralize(plural, value);
            }
            // Add zero-padding
            if(modifier === '') {
              if(value < 10) {
                value = '0' + value.toString();
              }
            }
            // Replace the directive
            format = format.replace(regexp, value.toString());
          }
        }
      }
      format = format.replace(/%%/, '%');
      return format;
    };
  }
  // Pluralize
  function pluralize(format, count) {
    var plural = 's', singular = '';
    if(format) {
      format = format.replace(/(:|;|\s)/gi, '').split(/\,/);
      if(format.length === 1) {
        plural = format[0];
      } else {
        singular = format[0];
        plural = format[1];
      }
    }
    // Fix #187
    if(Math.abs(count) > 1) {
      return plural;
    } else {
      return singular;
    }
  }
  // The Final Countdown
  var Countdown = function(el, finalDate, options) {
    this.el       = el;
    this.$el      = $(el);
    this.interval = null;
    this.offset   = {};
    this.options  = $.extend({}, defaultOptions);
    // console.log(this.options);
    // This helper variable is necessary to mimick the previous check for an
    // event listener on this.$el. Because of the event loop there might not
    // be a registered event listener during the first tick. In order to work
    // as expected a second tick is necessary, so that the events can be fired
    // and handled properly.
    this.firstTick = true;
    // Register this instance
    this.instanceNumber = instances.length;
    instances.push(this);
    // Save the reference
    this.$el.data('countdown-instance', this.instanceNumber);
    // Handle options or callback
    if (options) {
      // Register the callbacks when supplied
      if(typeof options === 'function') {
        this.$el.on('update.countdown', options);
        this.$el.on('stoped.countdown', options);
        this.$el.on('finish.countdown', options);
      } else {
        this.options = $.extend({}, defaultOptions, options);
      }
    }
    // Set the final date and start
    this.setFinalDate(finalDate);
    // Starts the countdown automatically unless it's defered,
    // Issue #198
    if (this.options.defer === false) {
      this.start();
    }
  };
  $.extend(Countdown.prototype, {
    start: function() {
      if(this.interval !== null) {
        clearInterval(this.interval);
      }
      var self = this;
      this.update();
      this.interval = setInterval(function() {
        self.update.call(self);
      }, this.options.precision);
    },
    stop: function() {
      clearInterval(this.interval);
      this.interval = null;
      this.dispatchEvent('stoped');
    },
    toggle: function() {
      if (this.interval) {
        this.stop();
      } else {
        this.start();
      }
    },
    pause: function() {
      this.stop();
    },
    resume: function() {
      this.start();
    },
    remove: function() {
      this.stop.call(this);
      instances[this.instanceNumber] = null;
      // Reset the countdown instance under data attr (Thanks to @assiotis)
      delete this.$el.data().countdownInstance;
    },
    setFinalDate: function(value) {
      this.finalDate = parseDateString(value); // Cast the given date
    },
    update: function() {
      // Stop if dom is not in the html (Thanks to @dleavitt)
      if(this.$el.closest('html').length === 0) {
        this.remove();
        return;
      }
      var now = new Date(),
          newTotalSecsLeft;
      // Create an offset date object
      newTotalSecsLeft = this.finalDate.getTime() - now.getTime(); // Millisecs
      // Calculate the remaining time
      newTotalSecsLeft = Math.ceil(newTotalSecsLeft / 1000); // Secs
      // If is not have to elapse set the finish
      newTotalSecsLeft = !this.options.elapse && newTotalSecsLeft < 0 ? 0 :
        Math.abs(newTotalSecsLeft);
      // Do not proceed to calculation if the seconds have not changed or
      // during the first tick
      if (this.totalSecsLeft === newTotalSecsLeft || this.firstTick) {
        this.firstTick = false;
        return;
      } else {
        this.totalSecsLeft = newTotalSecsLeft;
      }
      // Check if the countdown has elapsed
      this.elapsed = (now >= this.finalDate);
      // Calculate the offsets
      this.offset = {
        seconds     : this.totalSecsLeft % 60,
        minutes     : Math.floor(this.totalSecsLeft / 60) % 60,
        hours       : Math.floor(this.totalSecsLeft / 60 / 60) % 24,
        days        : Math.floor(this.totalSecsLeft / 60 / 60 / 24) % 7,
        daysToWeek  : Math.floor(this.totalSecsLeft / 60 / 60 / 24) % 7,
        daysToMonth : Math.floor(this.totalSecsLeft / 60 / 60 / 24 % 30.4368),
        weeks       : Math.floor(this.totalSecsLeft / 60 / 60 / 24 / 7),
        weeksToMonth: Math.floor(this.totalSecsLeft / 60 / 60 / 24 / 7) % 4,
        months      : Math.floor(this.totalSecsLeft / 60 / 60 / 24 / 30.4368),
        years       : Math.abs(this.finalDate.getFullYear()-now.getFullYear()),
        totalDays   : Math.floor(this.totalSecsLeft / 60 / 60 / 24),
        totalHours  : Math.floor(this.totalSecsLeft / 60 / 60),
        totalMinutes: Math.floor(this.totalSecsLeft / 60),
        totalSeconds: this.totalSecsLeft
      };
      // Dispatch an event
      if(!this.options.elapse && this.totalSecsLeft === 0) {
        this.stop();
        this.dispatchEvent('finish');
      } else {
        this.dispatchEvent('update');
      }
    },
    dispatchEvent: function(eventName) {
      var event = $.Event(eventName + '.countdown');
      event.finalDate     = this.finalDate;
      event.elapsed       = this.elapsed;
      event.offset        = $.extend({}, this.offset);
      event.strftime      = strftime(this.offset);
      this.$el.trigger(event);
    }
  });
  // Register the jQuery selector actions
  $.fn.countdown = function() {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);
    return this.each(function() {
      // If no data was set, jQuery.data returns undefined
      var instanceNumber = $(this).data('countdown-instance');
      // Verify if we already have a countdown for this node ...
      // Fix issue #22 (Thanks to @romanbsd)
      if (instanceNumber !== undefined) {
        var instance = instances[instanceNumber],
          method = argumentsArray[0];
        // If method exists in the prototype execute
        if(Countdown.prototype.hasOwnProperty(method)) {
          instance[method].apply(instance, argumentsArray.slice(1));
        // If method look like a date try to set a new final date
        } else if(String(method).match(/^[$A-Z_][0-9A-Z_$]*$/i) === null) {
          instance.setFinalDate.call(instance, method);
          // Allow plugin to restart after finished
          // Fix issue #38 (thanks to @yaoazhen)
          instance.start();
        } else {
          $.error('Method %s does not exist on jQuery.countdown'
            .replace(/\%s/gi, method));
        }
      } else {
        // ... if not we create an instance
        new Countdown(this, argumentsArray[0], argumentsArray[1]);
      }
    });
  };
});

'use strict';

window.n = window.n || {};


n.init = function() {

  $('#date').inputmask('99/99/9999');

  $('#damageAndFaults').characterCounter();
  $('select').material_select();
  $('.scrollspy').scrollSpy({scrollOffset: 20});
  $('.datepicker').pickadate({
    format: 'yyyy/mm/dd',
    formatSubmit: 'yyyy/mm/dd H:i:s',
    hiddenName: true
  });
}

//main body function go here
$(function(){
  n.init();
});
