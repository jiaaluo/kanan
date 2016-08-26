// This script will filter out trading/buying messages from party chat.
//
// This was not the easiest feature to figure out but heres loosely the steps
// I would follow if I needed to reimplement it from scratch.  I may have
// missed some steps because I didn't write as I reversed.
//
// Enter homestead or somewhere that doesn't get a lot of chat messages.
// Type something unique into the chat box and hit enter.
// CE search for the text you entered.
// CE find what accesses that address.
// Open the message list to prompt a read from that address.
// The location CE should find will be the function wcscpy_s.
// CE BP on the function and note the return value.
// The return value is function that mabi's packer has created to hide the
// import.
// Now you can start actively using kanan to aide in development.
// Find the return value of the packers wrapper of wcscpy_s ONLY when its
// copying a string with your name it as you send a chat message (using kanan).
// Of the return values you find, there will be two of interest.
// One will have two loops in it, this is where you get the offset to the buffer
// containing the text in mabi's version of a string.
// The other one will be where you need to find the next return value of.
// I used kanan to help find the return value of interest (since its called a
// lot with things that have nothing to do with chat).
// Finally, we are at where the chat message is being de constructed before it
// is placed into a list of strings for the chat box.
// Find a function that is being passed 7 parameters and thats the one we
// intercept.
//

// Filter messages that look like these. Case insensitive.
var filter = [
    'b>',
    's>',
    't>',
    'tf>',
    'lf>',
    't4>',
    'l4>'
];

// Make all the filters lowercase to be case insensitive.
for (var i = 0; i < filter.length; ++i) {
    filter[i] = filter[i].toLowerCase();
}

Interceptor.attach(ptr('0x636780'), {
    onEnter(args) {
        var msgType = args[6].and(0xFF);

        // Only care about msg type 2 which is PARTY.
        if (msgType != 2) {
            return;
        }

        var mabistr = Memory.readPointer(args[3]);
        var partymsg = Memory.readUtf16String(mabistr.add(0x1c)).toLowerCase();
        var found = false;

        for (var i = 0; i < filter.length; ++i) {
            if (partymsg.indexOf(filter[i]) != -1) {
                found = true;
                break;
            }
        }

        // If we found a match, simply writing an empty string will cause it to
        // not be shown.
        if (found) {
            Memory.writeUtf16String(mabistr.add(0x1c), "");
        }

        if (verbose) {
            dmsg("sub_636780(" + args[0] +
                ", " + args[1] +
                ", " + args[2] +
                ", " + args[3] +
                ", " + args[4] +
                ", " + args[5] +
                ", " + args[6] + ")");
        }
    }
});

