window.onload = async () => {
    const assets = new Assets();
    await assets.load();

    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    const game = new Game(canvas, assets);

    // Basic Scaling Logic
    const scaleGame = () => {
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('game-container');
        if (!viewport || !container) return;

        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;

        // Base size
        const bw = 960;
        const bh = 640;

        let scale = Math.min(vw / bw, vh / bh);

        if (game && game.screenSize) {
            scale *= (game.screenSize / 100);
        }

        // Apply Box Scale to container
        container.style.transform = `scale(${scale})`;
    };

    window.addEventListener('resize', scaleGame);
    scaleGame(); // Initial Scale

    // Drag Handle Logic
    const handles = document.querySelectorAll('.drag-handle');
    let isDragging = false;

    const onDragStart = (e) => {
        if (!game || game.state !== 'TITLE' || game.titleCursor !== 5) return;
        isDragging = true;
        e.preventDefault();
        e.stopPropagation();
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const viewport = document.getElementById('viewport');
        const rect = viewport.getBoundingClientRect();

        // Convert to Percentage (0-100)
        let px = ((clientX - rect.left) / rect.width) * 100;
        let py = ((rect.bottom - clientY) / rect.height) * 100; // Bottom is 0

        // Clamp
        px = Math.max(0, Math.min(100, px));
        py = Math.max(0, Math.min(100, py));

        game.padPosX = Math.floor(px);
        game.padPosY = Math.floor(py);
        game.updatePadLayout();
    };

    const onDragEnd = (e) => {
        isDragging = false;
        if (game) game.saveSettings();
    };

    handles.forEach(h => {
        h.addEventListener('mousedown', onDragStart);
        h.addEventListener('touchstart', onDragStart, { passive: false });
    });

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    // Touch Controls Binding
    const btns = document.querySelectorAll('#touch-controls .btn');
    btns.forEach(btn => {
        const key = btn.getAttribute('data-key');

        const down = (e) => {
            e.preventDefault();
            game.input.setVirtualKey(key, true);
        };
        const up = (e) => {
            e.preventDefault();
            game.input.setVirtualKey(key, false);
        };

        // Touch Events
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });

        // Mouse Events (for testing on Desktop)
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
        btn.addEventListener('mouseleave', up); // Ensure release if slide out
    });

    // Disable double tap zoom on buttons
    document.addEventListener('dblclick', function (event) {
        event.preventDefault();
    }, { passive: false });

    game.start();
    console.log("Game Started (Responsive Version)");
};
