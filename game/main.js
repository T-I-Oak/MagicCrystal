window.onload = async () => {
    const assets = new Assets();
    await assets.load();

    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    const game = new Game(canvas, assets);

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

    game.start();
    console.log("Game Started (Split Version)");
};
