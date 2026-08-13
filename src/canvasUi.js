export function createCanvasPointerMapper(canvas) {
    return {
        toCanvasPoint(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }
    };
}

export function createRectAction(rect, callback) {
    return {
        rect,
        callback
    };
}

export function dispatchRectAction(actions, point) {
    const action = actions.find(({ rect }) => containsPoint(rect, point));
    if (!action) {
        return false;
    }

    action.callback(point);
    return true;
}

export function containsPoint(rect, point) {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
}
