// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator
        .requestMIDIAccess({
            // sysex: true,
        })
        .then(onMIDISuccess, onMIDIFailure);
} else {
    alert('No MIDI support in your browser.');
}

let midi;

function onMIDISuccess(midiAccess) {
    midi = midiAccess;
    midiAccess.inputs.forEach((midiInput) => {
        console.log('midiInput', midiInput.name, midiInput);
        midiInput.onmidimessage = onMIDIMessage;
    });

    midiAccess.outputs.forEach((midiOutput, key) => {
        console.log('midiOutput', midiOutput.name, midiOutput);
        document.getElementById(
            'output',
        ).innerHTML += `<option value="${key}">${midiOutput.name}</option>`;
    });
}

function onMIDIFailure(error) {
    console.error(
        "No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim ",
        error,
    );
}

function onMIDIMessage({ data }) {
    console.log('MIDI data', data);
}

// send

document.getElementById('note').innerHTML = Array(255)
    .fill()
    .map(
        (_, key) =>
            `<option value="${(key + 24) % 255}">${(key + 24) % 255}</option>`,
    )
    .join('');

document.getElementById('send').onclick = () => {
    const { value: data } = document.getElementById('data');
    const { value: key } = document.getElementById('output');
    const output = midi.outputs.get(key);
    const msg = JSON.parse(data);
    console.log(`Send to ${output.name}:`, msg);
    output.send(msg);
};

document.getElementById('sendHex').onclick = () => {
    const { value: data } = document.getElementById('dataHex');
    const { value: key } = document.getElementById('output');
    const output = midi.outputs.get(key);
    const msg = data.split(' ').map(v => parseInt(`0x${v}`));
    console.log(`Send to ${output.name}:`, msg);
    output.send(msg);
    // output.send([0x80, 60, 0x40]);
};

document.getElementById('play').onclick = () => {
    const { value: note } = document.getElementById('note');
    const { value: key } = document.getElementById('output');
    const output = midi.outputs.get(key);
    console.log(`Play to ${output.name}:`, note);
    // output.send([144, note, 127]);
    // setTimeout(() => output.send([128, note, 127]), 1000);

    output.send([144, note, 100]);
    setTimeout(() => output.send([128, note, 0]), 1000);

    // // slide
    // output.send([0x90, note, 0x4F]);
    // setTimeout(() => {
    //     output.send([0x90, 0x30, 0x4F]);
    //     output.send([0x80, note, 0x00]);
    // }, 500);
    // setTimeout(() => {
    //     output.send([0x80, 0x30, 0x00]);
    // }, 1000);
};

// Custom console.log

rewireLoggingToElement(
    () => document.getElementById('log'),
    () => document.getElementById('log-container'),
    true,
);

function rewireLoggingToElement(eleLocator, eleOverflowLocator, autoScroll) {
    fixLoggingFunc('log');
    fixLoggingFunc('debug');
    fixLoggingFunc('warn');
    fixLoggingFunc('error');
    fixLoggingFunc('info');

    function fixLoggingFunc(name) {
        console['old' + name] = console[name];
        console[name] = function (...arguments) {
            const output = produceOutput(name, arguments);
            const eleLog = eleLocator();

            if (autoScroll) {
                const eleContainerLog = eleOverflowLocator();
                const isScrolledToBottom =
                    eleContainerLog.scrollHeight -
                        eleContainerLog.clientHeight <=
                    eleContainerLog.scrollTop + 1;
                eleLog.innerHTML += output + '<br>';
                if (isScrolledToBottom) {
                    eleContainerLog.scrollTop =
                        eleContainerLog.scrollHeight -
                        eleContainerLog.clientHeight;
                }
            } else {
                eleLog.innerHTML += output + '<br>';
            }

            console['old' + name].apply(undefined, arguments);
        };
    }

    function produceOutput(name, args) {
        return args.reduce((output, arg) => {
            return (
                output +
                '<span class="log-' +
                typeof arg +
                ' log-' +
                name +
                '">' +
                (typeof arg === 'object' ? JSON.stringify(arg) : arg) +
                '</span>&nbsp;'
            );
        }, '');
    }
}
