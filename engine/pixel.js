import constants from './constants.js';
import * as utils from './utils.js';

class Pixel {
    constructor(deps) {
        this.deps = deps;
        this.algo = deps.algo;
        this.gameInit = deps.gameInit;
        this.mapUpdate = deps.mapUpdate;

        this.boatBaseColor = [224, 224, 224];
    }

    init(playerInfo) {
        this.innerR = new Uint8Array(constants.MAX_ENTITIES);
        this.innerG = new Uint8Array(constants.MAX_ENTITIES);
        this.innerB = new Uint8Array(constants.MAX_ENTITIES);
        this.alphaVariation = new Uint8Array(constants.MAX_ENTITIES);
        this.borderR = new Uint8Array(constants.MAX_ENTITIES);
        this.borderG = new Uint8Array(constants.MAX_ENTITIES);
        this.borderB = new Uint8Array(constants.MAX_ENTITIES);
        this.movingR = new Uint8Array(constants.MAX_ENTITIES);
        this.movingG = new Uint8Array(constants.MAX_ENTITIES);
        this.movingB = new Uint8Array(constants.MAX_ENTITIES);
        this.shading = new Uint8Array(constants.MAX_ENTITIES);
        this.algo.attackMatrixInit();
        
        let idIndex;
        for (idIndex = constants.MAX_ENTITIES - 1; idIndex >= this.gameInit.playerCount; idIndex--) {
            this.innerR[idIndex] = 4 * utils.divideFloor(64 * utils.FakeRandom.random(), utils.FakeRandom.value(100));
            this.innerG[idIndex] = 4 * utils.divideFloor(64 * utils.FakeRandom.random(), utils.FakeRandom.value(100));
            this.innerB[idIndex] = 4 * utils.divideFloor(64 * utils.FakeRandom.random(), utils.FakeRandom.value(100));
        }
        for (idIndex = this.gameInit.playerCount - 1; idIndex >= 0; idIndex--) {
            this.innerR[idIndex] = 4 * playerInfo[idIndex].color[0];
            this.innerG[idIndex] = 4 * playerInfo[idIndex].color[1];
            this.innerB[idIndex] = 4 * playerInfo[idIndex].color[2];
        }

        for (let idIndex = this.maxEntities - 1; idIndex >= 0; idIndex--) {
            const innerBase = utils.divideFloor(this.innerR[idIndex] + this.innerG[idIndex] + this.innerB[idIndex], 3);
            this.innerR[idIndex] += utils.allDivideFloor(innerBase - this.innerR[idIndex], 2);
            this.innerG[idIndex] += utils.allDivideFloor(innerBase - this.innerG[idIndex], 2);
            this.innerB[idIndex] += utils.allDivideFloor(innerBase - this.innerB[idIndex], 2);
            this.innerR[idIndex] -= this.innerR[idIndex] % 4;
            this.innerG[idIndex] -= this.innerG[idIndex] % 4;
            this.innerB[idIndex] -= this.innerB[idIndex] % 4;
        }

        for (let idIndex = this.maxEntities - 1; idIndex >= 0; idIndex--) {
            this.innerR[idIndex] += utils.divideFloor(idIndex, 128);
            this.innerG[idIndex] += utils.divideFloor(idIndex % 128, 32);
            this.innerB[idIndex] += utils.divideFloor(idIndex % 32, 8);
            this.alphaVariation[idIndex] = idIndex % 8;
        }
        this.setFontColor();
        for (idIndex = constants.MAX_ENTITIES - 1; idIndex >= 0; idIndex--) {
            this.borderR[idIndex] = 32 > this.innerR[idIndex] ? this.innerR[idIndex] + 32 : this.innerR[idIndex] - 32;
            this.borderG[idIndex] = 32 > this.innerG[idIndex] ? this.innerG[idIndex] + 32 : this.innerG[idIndex] - 32;
            this.borderB[idIndex] = 32 > this.innerB[idIndex] ? this.innerB[idIndex] + 32 : this.innerB[idIndex] - 32;
        }

        for (idIndex = constants.MAX_ENTITIES - 1; idIndex >= 0; idIndex--) {
            let movingOffset = 20;
            this.movingR[idIndex] = 235 < this.innerR[idIndex] ? this.innerR[idIndex] - movingOffset : this.innerR[idIndex] + movingOffset;
            this.movingG[idIndex] = 235 < this.innerG[idIndex] ? this.innerG[idIndex] - movingOffset : this.innerG[idIndex] + movingOffset;
            this.movingB[idIndex] = 235 < this.innerB[idIndex] ? this.innerB[idIndex] - movingOffset : this.innerB[idIndex] + movingOffset;
        }
    }

    setFontColor() {
        for (let idIndex = constants.MAX_ENTITIES - 1; idIndex >= 0; idIndex--) {
            this.shading[idIndex] = 280 > this.innerR[idIndex] + this.innerG[idIndex] + this.innerB[idIndex] ? 0 : 1;
        }
    }

    getInnerColors(id) {
        return [this.innerR[id], this.innerG[id], this.innerB[id], this.alphaVariation[id]];
    }

    toX(pIndex) {
        return utils.divideFloor(pIndex, 4) % this.gameInit.mapWidth;
    }

    toY(pIndex) {
        return utils.divideFloor(pIndex, 4 * this.gameInit.mapWidth);
    }

    toIndex(xCoord, yCoord) {
        return utils.divideFloor(4 * (yCoord * this.gameInit.mapWidth + xCoord));
    }

    bordersMountain(pIndex) {
        return this.isMountain(pIndex + this.algo.offset[0]) || this.isMountain(pIndex + this.algo.offset[1]) || this.isMountain(pIndex + this.algo.offset[2]) || this.isMountain(pIndex + this.algo.offset[3]);
    }

    canExpandFromPixel(pIndex, id) {
        return this.canTake(pIndex + this.algo.offset[0], id) || this.canTake(pIndex + this.algo.offset[1], id) || this.canTake(pIndex + this.algo.offset[2], id) || this.canTake(pIndex + this.algo.offset[3], id);
    }

    entityControlled(pIndex) {
        return 208 <= this.pixelRGBA[pIndex + 3];
    }

    strongIsOwner(id, pIndex) {
        return this.entityControlled(pIndex) && this.isOwner(id, pIndex);
    }

    isOwner(id, pIndex) {
        return id === this.getOwner(pIndex);
    }

    isInnerPixel(pIndex) {
        return 208 <= this.pixelRGBA[pIndex + 3] && 224 > this.pixelRGBA[pIndex + 3];
    }

    isBorder(pIndex) {
        return 224 <= this.pixelRGBA[pIndex + 3] && 248 > this.pixelRGBA[pIndex + 3];
    }

    bordersWater(pIndex) {
        for (let side = 3; 0 <= side; side--) {
            if (this.isWater(pIndex + this.algo.offset[side])) {
                return true;
            }
        }
        return false;
    }

    isBoat(pIndex) {
        return 192 <= this.pixelRGBA[pIndex + 3] && 208 > this.pixelRGBA[pIndex + 3];
    }

    strongIsBoat(pIndex, id) {
        return this.isBoat(pIndex) && id === this.getOwner(pIndex);
    }

    canOwn(pIndex) {
        return this.entityControlled(pIndex) || this.isNeutral(pIndex);
    }

    isWater(pIndex) {
        return 0 === this.pixelRGBA[pIndex + 3] && 2 === this.pixelRGBA[pIndex + 2] || this.isBoat(pIndex);
    }

    isNeutral(pIndex) {
        return 0 === this.pixelRGBA[pIndex + 3] && 1 === this.pixelRGBA[pIndex + 2];
    }

    isMountain(pIndex) {
        return 0 === this.pixelRGBA[pIndex + 3] && 3 === this.pixelRGBA[pIndex + 2];
    }

    canTake(pIndex, id) {
        return this.isNeutral(pIndex) || this.entityControlled(pIndex) && id !== this.getOwner(pIndex);
    }

    getOwner(pIndex) {
        return this.pixelRGBA[pIndex] % 4 * 128 + this.pixelRGBA[pIndex + 1] % 4 * 32 + this.pixelRGBA[pIndex + 2] % 4 * 8 + this.pixelRGBA[pIndex + 3] % 8;
    }

    revertToNeutralPixel(pIndex) {
        this.revertToDefaultPixel(pIndex, 1);
    }

    revertToWaterPixel(pIndex) {
        this.revertToDefaultPixel(pIndex, 2);
    }

    changeToInnerPixel(pIndex, id) {
        this.pixelRGBA[pIndex] = this.innerR[id];
        this.pixelRGBA[pIndex + 1] = this.innerG[id];
        this.pixelRGBA[pIndex + 2] = this.innerB[id];
        this.pixelRGBA[pIndex + 3] = 208 + this.alphaVariation[id];
        this.checkShouldUpdateMap(pIndex);
    }

    changeToBorderPixel(pIndex, id) {
        this.pixelRGBA[pIndex] = this.borderR[id];
        this.pixelRGBA[pIndex + 1] = this.borderG[id];
        this.pixelRGBA[pIndex + 2] = this.borderB[id];
        this.pixelRGBA[pIndex + 3] = 224 + this.alphaVariation[id];
        this.checkShouldUpdateMap(pIndex);
    }

    changeToMovingPixel(pIndex, id) {
        this.pixelRGBA[pIndex] = this.movingR[id];
        this.pixelRGBA[pIndex + 1] = this.movingG[id];
        this.pixelRGBA[pIndex + 2] = this.movingB[id];
        this.pixelRGBA[pIndex + 3] = 248 + this.alphaVariation[id];
        this.checkShouldUpdateMap(pIndex);
    }

    changeToBoatPixel(pIndex, id) {
        this.pixelRGBA[pIndex] = this.boatBaseColor[0] + this.innerR[id] % 4;
        this.pixelRGBA[pIndex + 1] = this.boatBaseColor[1] + this.innerG[id] % 4;
        this.pixelRGBA[pIndex + 2] = this.boatBaseColor[2] + this.innerB[id] % 4;
        this.pixelRGBA[pIndex + 3] = 192 + this.alphaVariation[id];
        this.checkShouldUpdateMap(pIndex);
    }

    revertToDefaultPixel(pIndex, type) {
        this.pixelRGBA[pIndex] = 0;
        this.pixelRGBA[pIndex + 1] = 0;
        this.pixelRGBA[pIndex + 2] = type;
        this.pixelRGBA[pIndex + 3] = 0;
        this.checkShouldUpdateMap(pIndex);
    }

    checkShouldUpdateMap(pIndex) {
        if (!this.mapUpdate.shouldUpdate) {
            const xCoord = this.toX(pIndex);
            const yCoord = this.toY(pIndex);
            this.mapUpdate.shouldUpdate = xCoord >= this.viewport.viewportCoords[0] && xCoord <= this.viewport.viewportCoords[2] && yCoord >= this.viewport.viewportCoords[1] && yCoord <= this.viewport.viewportCoords[3];
        }
    }
}

module.exports = Pixel;