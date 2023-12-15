export function divideFloor(n, d) {
    return Math.floor(n / d + 1 / (2 * d))
}

export function allDivideFloor(n, d) {
    return 0 <= n ? divideFloor(n, d) : -divideFloor(-n, d)
}

export function sqrtEstimation(n, trials) {
    return 1 > n ? 0 : babylonianSqrt(n, trials)
}

export function babylonianSqrt(n, trials) {
    for (let estimate = divideFloor(n + 1, 2), trialIndex = 0; trialIndex < trials; trialIndex++) {
        estimate = divideFloor(estimate + divideFloor(n, estimate), 2);
    }
    return estimate
}

export function square(n) {
    return n * n
}

export function getMax(m, n) {
    return m > n ? m : n
}

export function getMin(m, n) {
    return m < n ? m : n
}

export function rangeClamp(min, n, max) {
    return n < min ? min : n > max ? max : n
}

export function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || y1 + h1 <= y2 || x1 >= x2 + w2 || y1 >= y2 + h2);
}

export function rectEqualOrInside(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 <= x2 && y1 <= y2 && x1 + w1 >= x2 + w2 && y1 + h1 >= y2 + h2;
}

export class FakeRandom {
    constructor() {
        this.randomValue;
        this.probiTable;
    }

    init() {
        this.probiTable = Array(101);
        for (let index = this.probiTable.length - 1; index >= 0; index--) {
            this.probiTable[index] = divideFloor(32768 * index, 100);
        }
        this.changeRandomNumber(0);
    }

    value(index) {
        return this.probiTable[index];
    }

    getMedian() {
        return divideFloor(this.randomValue - 1, 2);
    }

    changeRandomNumber(seed) {
        this.randomValue = 2 * seed % 32768 + 1;
    }

    random() {
        return this.randomValue = 167 * this.randomValue % 32768;
    }

    calcFractionalValue(seed) {
        return divideFloor(seed * this.random(), 32768);
    }

    doesValueMeetProbiThreshold(value) {
        return 0 !== value && this.random() < this.value(value);
    }
}