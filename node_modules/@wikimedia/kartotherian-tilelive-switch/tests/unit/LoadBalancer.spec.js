const LoadBalancer = require('../../lib/LoadBalance');
const assert = require('assert');

const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const assertTasks = (value, expected, message) => {
    const newMessage = `${message}, ${expected * 0.9} >= ${value} <= ${expected * 1.1}`
    // 10% error rate
    assert.ok(value >= expected * 0.9 && value <= expected * 1.1, newMessage);
}

const test = async (options) => {
    const threshold = options.threshold;
    const maxTasksToExecute = options.maxTasksToExecute;
    const bucketSize = options.bucketSize;
    const taskTime = options.taskTime || 10;
    const lb = new LoadBalancer({ bucketSize, threshold });
    const tasksSummary = {
        mirroredTasksExecuted: 0,
    };

    for (let i = 0; i < maxTasksToExecute; i++) {
        if (lb.enableSecondaryLoad()) {
            tasksSummary.mirroredTasksExecuted += 1;
        }
        await sleep(taskTime);
    }
    assertTasks(
        tasksSummary.mirroredTasksExecuted,
        maxTasksToExecute * threshold,
        `${tasksSummary.mirroredTasksExecuted} tasks executed`);
}

describe("LoadBalancer", () => {
    it("Default configuration", () => {
        const lb = new LoadBalancer();
        assert.deepEqual(lb.totalBuckets, 10);
        assert.deepEqual(lb.bucketSize, 1000);
    });

    const testSamples = [
        // Small bucket size such as 10ms will fail because the error rate is too low
        // The following test ist left out for documentation purposes
        { taskTime: 10, threshold: 0.1, maxTasksToExecute: 100, bucketSize: 10, skip: true },
        { taskTime: 10, threshold: 0.1, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 0.1, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 10, threshold: 0.2, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 0.2, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 10, threshold: 0.3, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 0.3, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 10, threshold: 0.5, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 0.5, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 10, threshold: 0.9, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 0.9, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 1, threshold: 0.1, maxTasksToExecute: 1000, bucketSize: 10 },
        { taskTime: 1, threshold: 0.1, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 0.1, maxTasksToExecute: 1000, bucketSize: 1000 },
        { taskTime: 1, threshold: 0.2, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 0.2, maxTasksToExecute: 1000, bucketSize: 1000 },
        { taskTime: 1, threshold: 0.3, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 0.3, maxTasksToExecute: 1000, bucketSize: 1000 },
        { taskTime: 1, threshold: 0.5, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 0.5, maxTasksToExecute: 1000, bucketSize: 1000 },
        { taskTime: 1, threshold: 0.9, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 0.9, maxTasksToExecute: 1000, bucketSize: 1000 },
        // bucket size shouldn't matter for no-throttling behaviour, testing it
        { taskTime: 10, threshold: 1, maxTasksToExecute: 100, bucketSize: 100 },
        { taskTime: 10, threshold: 1, maxTasksToExecute: 100, bucketSize: 1000 },
        { taskTime: 1, threshold: 1, maxTasksToExecute: 1000, bucketSize: 1 },
        { taskTime: 1, threshold: 1, maxTasksToExecute: 1000, bucketSize: 10 },
        { taskTime: 1, threshold: 1, maxTasksToExecute: 1000, bucketSize: 100 },
        { taskTime: 1, threshold: 1, maxTasksToExecute: 1000, bucketSize: 1000 },
    ]

    testSamples.forEach((sample) => {
        const loadString = sample.maxTasksToExecute > 100 ? "high" : "low";
        if (!sample.skip) {
            it(`Test ${sample.threshold * 100}% mirrored ${loadString} load ${sample.bucketSize}ms bucket size`, async () => {
                await test(sample);
            });
        } else {
            xit(`Test ${sample.threshold * 100}% mirrored ${loadString} load ${sample.bucketSize}ms bucket size`, async () => {});
        }
    })
});
