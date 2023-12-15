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
