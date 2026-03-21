// Input.js Test Cases
function assert(condition, message) {
    if (!condition) {
        const errorMsg = `[FAIL] ${message}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

async function runInputTests(InputClass, log) {
    const input = new InputClass();

    // Test 1: Initial State
    assert(input.isPressed('confirm') === false, "Initial confirm is false");
    
    // Test 2: Set Virtual Key
    input.setVirtualKey('Enter', true);
    assert(input.isPressed('confirm') === true, "Confirm is true after setting Enter");
    assert(input.isJustPressed('confirm') === true, "Confirm is justPressed initially");

    // Test 3: Update cycles prevActions
    input.update(); 
    assert(input.isPressed('confirm') === true, "Confirm remains true because key is still held");
    assert(input.isJustPressed('confirm') === false, "Confirm is NOT justPressed after update if still held");

    // Test 4: Release
    input.setVirtualKey('Enter', false);
    assert(input.isPressed('confirm') === false, "Confirm is false after release");
    
    input.update();
    assert(input.isPressed('confirm') === false, "Confirm remains false");

    // Test 5: Buffering (Rapid Tap)
    input.setVirtualKey('z', true);
    input.setVirtualKey('z', false);
    assert(input.isPressed('confirm') === true, "Confirm is true due to buffering even after rapid release");
    assert(input.isJustPressed('confirm') === true, "Confirm is justPressed due to buffering");

    input.update();
    assert(input.isPressed('confirm') === false, "Confirm is false after update following buffered tap");

    // Test 6: Mapping multiple keys
    input.setVirtualKey('ArrowUp', true);
    assert(input.isPressed('up') === true, "Up is true for ArrowUp");
    input.setVirtualKey('ArrowUp', false);
    input.update();
    
    input.setVirtualKey('w', false);
    input.update();
    input.clear();
    
    // Ensure all actions are false before gamepad test
    for (const action in input.actions) {
        input.actions[action] = false;
    }
    input.updateStickFromActions();

    // Test 7: Gamepad Mocking
    const mockGamepad = {
        axes: [0, 0, 0, 0],
        buttons: Array(16).fill(0).map(() => ({ pressed: false }))
    };
    window.navigator.getGamepads = () => [mockGamepad];

    // L-Stick Left
    mockGamepad.axes[0] = -0.5;
    mockGamepad.axes[1] = 0; // Explicitly zero
    input.update(); // Polls gamepad
    assert(input.isPressed('left') === true, "Left is true for Gamepad L-Stick Left");
    assert(input.stick === 4, "Stick is 4 (Left) for Gamepad L-Stick Left");
    
    // L-Stick Up (Jump)
    mockGamepad.axes[0] = 0;
    mockGamepad.axes[1] = -0.8;
    input.update();
    assert(input.isPressed('up') === true, "Up is true for Gamepad L-Stick Up");
    assert(input.isPressed('jump') === true, "Jump is true for Gamepad L-Stick Up");
    assert(input.stick === 8, `Stick is 8 (Up) for Gamepad L-Stick Up but got ${input.stick}`);

    // Deadzone check
    mockGamepad.axes[1] = -0.1;
    input.update();
    assert(input.isPressed('up') === false, "Up is false within deadzone");

    // Buttons (A -> Confirm)
    mockGamepad.buttons[0].pressed = true;
    input.update();
    assert(input.isPressed('confirm') === true, "Confirm is true for Button 0");
    assert(input.isPressed('jump') === true, "Jump is true for Button 0");

    // Buttons (L1 -> SmartLeft)
    mockGamepad.buttons[0].pressed = false;
    mockGamepad.buttons[4].pressed = true;
    input.update();
    assert(input.isPressed('smartLeft') === true, "SmartLeft is true for Button 4");

    if (log) log("All Input tests (including Gamepad) passed!");
    return true;
}
