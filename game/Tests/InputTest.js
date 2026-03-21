// Input.js Test Cases
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
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
    
    input.setVirtualKey('w', true);
    assert(input.isPressed('up') === true, "Up is true for 'w'");

    if (log) log("All Input tests passed!");
    return true;
}
