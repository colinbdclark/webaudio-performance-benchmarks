var numberOfOscillators = 50

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
        numSamples: numSamples || 44100,
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
    
    for( var i = 0; i < numberOfOscillators; i++ ) {
      var synth = flock.synth({
          synthDef: {
              ugen: "flock.ugen.sinOsc",
              freq: 440 + i * 20,
              mul: 1 / length
          }
      }).play()
    }

    flock.enviro.shared.audioStrategy.jsNode.disconnect(0);
    var writeSamplesFn = flock.enviro.shared.audioStrategy.writeSamples;
    var timer = scriptProcessorNodeTester(writeSamplesFn, 1024, 4410);

    return timer.test;
};

function gibberishTest() {
    Gibberish.init(1024);
        
    for( var i = 0; i < numberOfOscillators; i++ ) {
      new Gibberish.Sine(440 + i * 20, 1 / length ).connect()
    }
    
    Gibberish.node.disconnect(0);
    var timer = scriptProcessorNodeTester(Gibberish.audioProcess, 1024, 4410);

    return timer.test;
};

function runBenchmarks() {
    sheep.test([
        {
            name: "Gibberish",
            test: gibberishTest(),
            onSuccess: function () {
                Gibberish.clear();
            }
        },
        {
            name: "Flocking",
            test: flockingTest(),
            onSuccess: function () {
                flock.enviro.shared.stop();
            }
        }
    ], true);
}
