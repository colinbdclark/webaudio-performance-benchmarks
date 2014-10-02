function makeMockAudioProcessEvent(blockSize) {
    var buffer = new Float32Array(blockSize),
        e = {
            outputBuffer: {
                length: 1024
            },
            inputBuffer: {}
        },
        getChannelData = function () {
            return buffer;
        };

    e.outputBuffer.getChannelData = getChannelData;
    e.inputBuffer.getChannelData = getChannelData;

    return e;
}

function scriptProcessorNodeTester(audioProcessHandlerFn, blockSize, numSamples) {
    var that = {
        audioProcessHandlerFn: audioProcessHandlerFn,
        numSamples: numSamples || (44100 * 10), // Ten seconds worth of samples by default.
        blockSize: blockSize,
        startTime: undefined,
        endTime: undefined
    };

    that.mockEvent = makeMockAudioProcessEvent(that.blockSize);

    that.test = function () {
        var e = that.mockEvent,
            processor = that.audioProcessHandlerFn,
            numCalls = Math.ceil(that.numSamples / that.blockSize),
            i;

        for (i = 0; i < numCalls; i++) {
            processor(e);
        }
    };

    return that;
};

function flockingTest() {
    flock.init({
        bufferSize: 1024
    });

    var synth = flock.synth({
        synthDef: {
            ugen: "flock.ugen.sinOsc",
            freq: {
                ugen: "flock.ugen.sinOsc",
                freq: 4,
                mul: {
                    ugen: "flock.ugen.sinOsc",
                    freq: 0.1,
                    mul: 50
                },
                add: 440
            },
            mul: 0.25
        }
    });

    synth.play();
    flock.enviro.shared.audioStrategy.jsNode.disconnect(0);
    var writeSamplesFn = flock.enviro.shared.audioStrategy.writeSamples;
    var timer = scriptProcessorNodeTester(writeSamplesFn, 1024, 44100);

    return timer.test;
};

function gibberishTest() {
    Gibberish.init(1024);
    Gibberish.Time.export();
    Gibberish.Binops.export();

    var mod1 = new Gibberish.Sine(4, 0),
        mod2 = new Gibberish.Sine(0.1, 50);

    mod1.amp = mod2;
    var sin = new Gibberish.Sine( Add(mod1, 440), 0.25 ).connect();

    Gibberish.node.disconnect(0);
    var timer = scriptProcessorNodeTester(Gibberish.audioProcess, 1024, 44100);

    return timer.test;
};

function runBenchmarks() {
    sheep.test([
        {
            name: "Gibberish",
            test: gibberishTest(),
            onSuccess: function () {
                Gibberish.clear();
            },
            numReps: 100
        },
        {
            name: "Flocking",
            test: flockingTest(),
            onSuccess: function () {
                flock.enviro.shared.stop();
            },
            numReps: 100
        }
    ], true);
}
