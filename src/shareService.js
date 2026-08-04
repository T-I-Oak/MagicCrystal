import { SHARE_IMAGE_TITLE } from './shareImage.js';

export const EXTRA_MAP_SHARE_FILE_NAME = 'magic-crystal-map.png';
export const X_INTENT_BASE_URL = 'https://twitter.com/intent/tweet';

export function createExtraMapShareText(url, prompt = 'Play my custom stage!', difficulty = null, difficultyLabel = 'Difficulty') {
    const difficultyLine = Number.isInteger(difficulty)
        ? `${difficultyLabel}: ${'★'.repeat(difficulty)}`
        : null;
    return [
        '【MAGIC CRYSTAL】',
        prompt,
        difficultyLine,
        url,
        '#MagicCrystal #GameWorksOAK'
    ].filter(Boolean).join('\n');
}

export async function shareExtraMapImage({
    blob,
    text,
    navigatorRef = globalThis.navigator,
    windowRef = globalThis,
    documentRef = globalThis.document,
    FileCtor = globalThis.File,
    ClipboardItemCtor = globalThis.ClipboardItem,
    xIntentBaseUrl = X_INTENT_BASE_URL,
    confirmLabels = {}
}) {
    if (!blob) throw new Error('[ExtraMapShareService] blob is required.');
    if (!text) throw new Error('[ExtraMapShareService] text is required.');

    if (isDesktop(navigatorRef)) {
        if (!navigatorRef?.clipboard?.write || !ClipboardItemCtor) {
            throw new Error('[ExtraMapShareService] clipboard image writing is required on desktop.');
        }

        await navigatorRef.clipboard.write([
            new ClipboardItemCtor({ [blob.type || 'image/png']: blob })
        ]);
        showShareConfirm(documentRef, windowRef, xIntentBaseUrl, text, confirmLabels);
        return { mode: 'clipboard-confirm' };
    }

    const file = createShareFile(blob, FileCtor);
    if (file && navigatorRef?.canShare?.({ files: [file] })) {
        await navigatorRef.share({
            files: [file],
            title: SHARE_IMAGE_TITLE,
            text
        });
        return { mode: 'file-share' };
    }

    throw new Error('[ExtraMapShareService] Web Share API file sharing is required on mobile.');
}

function createShareFile(blob, FileCtor) {
    if (!FileCtor) return null;
    return new FileCtor([blob], EXTRA_MAP_SHARE_FILE_NAME, { type: blob.type || 'image/png' });
}

function isDesktop(navigatorRef) {
    const agent = navigatorRef?.userAgent || '';
    return /Windows|Macintosh|Linux/i.test(agent) && !/Android/i.test(agent);
}

function openXIntent(windowRef, xIntentBaseUrl, text) {
    windowRef?.open?.(`${xIntentBaseUrl}?text=${encodeURIComponent(text)}`, '_blank');
}

function setShareConfirmButtonLabel(button, keyFace, label) {
    button.textContent = '';
    const key = button.ownerDocument.createElement('span');
    key.className = `share-key-face ${keyFace === 'B' ? 'cancel' : 'confirm'}`;
    key.textContent = keyFace;
    const text = button.ownerDocument.createElement('span');
    text.className = 'share-button-label';
    text.textContent = label;
    button.append(key, text);
}

function showShareConfirm(documentRef, windowRef, xIntentBaseUrl, text, labels = {}) {
    const overlay = documentRef?.querySelector?.('#share-confirm-overlay');
    const title = documentRef?.querySelector?.('#share-confirm-title');
    const message = documentRef?.querySelector?.('#share-confirm-message');
    const xButton = documentRef?.querySelector?.('#share-confirm-x-btn');
    const closeButton = documentRef?.querySelector?.('#share-confirm-close-btn');
    if (!overlay || !title || !message || !xButton || !closeButton) {
        throw new Error('[ExtraMapShareService] share confirmation UI is required on desktop.');
    }

    title.textContent = labels.title || 'SHARE MAP';
    message.textContent = Array.isArray(labels.lines)
        ? labels.lines.join('\n')
        : labels.message || 'The map image has been copied to the clipboard.\nOpen X and paste it?';
    setShareConfirmButtonLabel(xButton, 'A', labels.openX || 'OPEN X');
    setShareConfirmButtonLabel(closeButton, 'B', labels.close || 'CLOSE');

    overlay.hidden = false;
    overlay.classList.remove('state-hidden');
    const nextXButton = xButton.cloneNode(true);
    const nextCloseButton = closeButton.cloneNode(true);
    xButton.replaceWith(nextXButton);
    closeButton.replaceWith(nextCloseButton);
    const openX = () => {
        openXIntent(windowRef, xIntentBaseUrl, text);
        hideShareConfirm(overlay);
    };
    const close = () => hideShareConfirm(overlay);
    nextXButton.addEventListener('click', openX);
    nextCloseButton.addEventListener('click', close);

    if (overlay.shareConfirmKeydown) {
        documentRef.removeEventListener('keydown', overlay.shareConfirmKeydown, true);
    }
    overlay.shareConfirmKeydown = (event) => {
        if (overlay.hidden) return;
        if (isConfirmKey(event)) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            openX();
        } else if (isCancelKey(event)) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            close();
        } else if (isGameControlKey(event)) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
        }
    };
    documentRef.addEventListener('keydown', overlay.shareConfirmKeydown, true);
}

function hideShareConfirm(overlay) {
    overlay.hidden = true;
    overlay.classList.add('state-hidden');
    if (overlay.shareConfirmKeydown && overlay.ownerDocument) {
        overlay.ownerDocument.removeEventListener('keydown', overlay.shareConfirmKeydown, true);
        overlay.shareConfirmKeydown = null;
    }
}

function isConfirmKey(event) {
    return ['z', 'Enter', 'Space', ' ', 'Numpad1'].includes(event.key) ||
        ['KeyZ', 'Enter', 'Space', 'Numpad1'].includes(event.code);
}

function isCancelKey(event) {
    return ['x', 'Escape', 'Numpad3'].includes(event.key) ||
        ['KeyX', 'Escape', 'Numpad3'].includes(event.code);
}

function isGameControlKey(event) {
    return [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'w',
        'a',
        's',
        'd',
        'q',
        'e',
        'z',
        'x',
        'Enter',
        'Space',
        ' ',
        'Numpad1',
        'Numpad2',
        'Numpad3',
        'Numpad4',
        'Numpad5',
        'Numpad6',
        'Numpad7',
        'Numpad8',
        'Numpad9'
    ].includes(event.key) || [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyQ',
        'KeyE',
        'KeyZ',
        'KeyX',
        'Enter',
        'Space',
        'Numpad1',
        'Numpad2',
        'Numpad3',
        'Numpad4',
        'Numpad5',
        'Numpad6',
        'Numpad7',
        'Numpad8',
        'Numpad9'
    ].includes(event.code);
}
