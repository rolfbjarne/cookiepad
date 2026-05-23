// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

(function () {
	'use strict';

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
		const opts = {
			key: key,
			code: key,
			keyCode: code,
			which: code,
			bubbles: true,
			cancelable: true,
		};
		// Dispatch on both document and window — Cookie Clicker listens
		// in different places depending on the screen.
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

	// Hover mode: intercept taps and trigger mouseover/tooltip instead of click
	document.addEventListener('pointerdown', function (e) {
		if (!hoverMode) return;
		// Don't intercept taps on the pad itself
		if (pad.contains(e.target)) return;

		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		// Dispatch mouseover/mouseenter to trigger tooltip
		const target = e.target;
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
	}, true); // capture phase to intercept before anything else

})();
