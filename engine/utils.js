export function divideFloor(n, d) {
    return Math.floor(n / d + 1 / (2 * d))
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
