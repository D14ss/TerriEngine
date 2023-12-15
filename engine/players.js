import constants from './constants.js';

class Players {
    constructor(deps) {
        this.deps = deps;
        this.isAlive = new Uint8Array(constants.MAX_ENTITIES);
        this.xMin = new Uint16Array(constants.MAX_ENTITIES);
        this.xMax = new Uint16Array(constants.MAX_ENTITIES);
        this.yMin = new Uint16Array(constants.MAX_ENTITIES);
        this.yMax = new Uint16Array(constants.MAX_ENTITIES);
        this.land = new Uint32Array(constants.MAX_ENTITIES);
        this.tempLand = new Uint32Array(constants.MAX_ENTITIES);
        this.troops = new Uint32Array(constants.MAX_ENTITIES);
        this.potentialBorderAdvances = new Array(constants.MAX_ENTITIES);
        this.landBorderPixels = new Array(constants.MAX_ENTITIES);
        this.waterBorderPixels = new Array(constants.MAX_ENTITIES);
        this.mountainBorderPixels = new Array(constants.MAX_ENTITIES);
    }

}

module.exports = Players;