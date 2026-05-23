// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

(function () {
	'use strict';

	const VERSION = '1.0.6';
	const LAST_CHANGE = 'Show version number in the hover mode button';
	console.log(`[CookiePad] v${VERSION} loaded — last change: ${LAST_CHANGE}`);

	const PAD_SIZE = 180;
	const BTN_SIZE = 50;

	// State
	let hoverMode = false;

	// Create the container
	const pad = document.createElement('div');
	pad.id = 'cookiepad';
	pad.style.cssText = `
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: ${PAD_SIZE}px;
		height: ${PAD_SIZE}px;
		z-index: 100000000;
		user-select: none;
		touch-action: none;
	`;
	document.body.appendChild(pad);

	function createButton(label, x, y, onClick) {
		const btn = document.createElement('div');
		btn.textContent = label;
		btn.style.cssText = `
			position: absolute;
			left: ${x}px;
			top: ${y}px;
			width: ${BTN_SIZE}px;
			height: ${BTN_SIZE}px;
			line-height: ${BTN_SIZE}px;
			text-align: center;
			background: rgba(0, 0, 0, 0.6);
			color: white;
			border-radius: 8px;
			font-size: 20px;
			cursor: pointer;
			border: 1px solid rgba(255, 255, 255, 0.3);
		`;
		btn.addEventListener('pointerdown', function (e) {
			e.preventDefault();
			e.stopPropagation();
			onClick();
		});
		pad.appendChild(btn);
		return btn;
	}

	const KEY_CODES = {
		'ArrowUp': 38,
		'ArrowDown': 40,
		'ArrowLeft': 37,
		'ArrowRight': 39,
	};

	function sendKey(key) {
		const code = KEY_CODES[key] || 0;

		// Cookie Clicker tracks key state in Game.keys and checks it
		// in its game loop — synthetic KeyboardEvent dispatch doesn't
		// update that map reliably. Set the state directly.
		if (typeof Game !== 'undefined' && Game.keys) {
			Game.keys[code] = 1;
			setTimeout(function () {
				Game.keys[code] = 0;
			}, 150);
			return;
		}

		// Fallback: dispatch events if Game.keys isn't available yet
		const opts = {
			key: key,
			code: key,
			keyCode: code,
			which: code,
			bubbles: true,
			cancelable: true,
		};
		document.dispatchEvent(new KeyboardEvent('keydown', opts));
		window.dispatchEvent(new KeyboardEvent('keydown', opts));
		setTimeout(function () {
			document.dispatchEvent(new KeyboardEvent('keyup', opts));
			window.dispatchEvent(new KeyboardEvent('keyup', opts));
		}, 50);
	}

	// Layout: center of pad
	const cx = (PAD_SIZE - BTN_SIZE) / 2;
	const cy = (PAD_SIZE - BTN_SIZE) / 2;
	const offset = BTN_SIZE + 5;

	createButton('▲', cx, cy - offset, function () { sendKey('ArrowUp'); });
	createButton('▼', cx, cy + offset, function () { sendKey('ArrowDown'); });
	createButton('◀', cx - offset, cy, function () { sendKey('ArrowLeft'); });
	createButton('▶', cx + offset, cy, function () { sendKey('ArrowRight'); });

	// Center button: toggle hover mode
	const hoverBtn = createButton('👆', cx, cy, function () {
		hoverMode = !hoverMode;
		hoverBtn.style.background = hoverMode
			? 'rgba(0, 150, 0, 0.8)'
			: 'rgba(0, 0, 0, 0.6)';
	});
	hoverBtn.innerHTML = `<span style="font-size:20px">👆</span><span style="font-size:8px;display:block;line-height:1;margin-top:-4px;opacity:0.6">${VERSION}</span>`;
	hoverBtn.style.lineHeight = 'normal';
	hoverBtn.style.display = 'flex';
	hoverBtn.style.flexDirection = 'column';
	hoverBtn.style.alignItems = 'center';
	hoverBtn.style.justifyContent = 'center';

	// Hover mode: intercept taps and trigger mouseover/tooltip instead of click.
	// We need to block the entire tap sequence (pointerdown, pointerup, click,
	// touchstart, touchend) to prevent the normal click from firing.
	let hoverConsuming = false;

	function blockEvent(e) {
		if (!hoverMode && !hoverConsuming) return;
		if (pad.contains(e.target)) return;
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	}

	document.addEventListener('pointerdown', function (e) {
		if (!hoverMode) return;
		if (pad.contains(e.target)) return;

		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		hoverConsuming = true;

		// Dispatch mouseover/mouseenter to trigger tooltip
		const target = document.elementFromPoint(e.clientX, e.clientY) || e.target;
		target.dispatchEvent(new MouseEvent('mouseenter', {
			bubbles: true,
			clientX: e.clientX,
			clientY: e.clientY,
		}));
		target.dispatchEvent(new MouseEvent('mouseover', {
			bubbles: true,
			clientX: e.clientX,
			clientY: e.clientY,
		}));
		target.dispatchEvent(new MouseEvent('mousemove', {
			bubbles: true,
			clientX: e.clientX,
			clientY: e.clientY,
		}));

		// Deactivate hover mode after one use
		hoverMode = false;
		hoverBtn.style.background = 'rgba(0, 0, 0, 0.6)';
	}, true);

	// Block the rest of the tap sequence so the click never fires
	document.addEventListener('pointerup', function (e) {
		if (!hoverConsuming) return;
		if (pad.contains(e.target)) return;
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		hoverConsuming = false;
	}, true);
	document.addEventListener('click', blockEvent, true);
	document.addEventListener('touchstart', blockEvent, true);
	document.addEventListener('touchend', blockEvent, true);

})();
