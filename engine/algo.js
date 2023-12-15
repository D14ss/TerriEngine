import constants from './constants.js';
import * as utils from './utils.js';

class Algo {
    constructor(deps) {
        this.deps = deps;
        this.players = deps.players;
        this.attacks = deps.attacks;
        this.pixel = deps.pixel;
        
        this.neutCost = 2;
    }
    
    attackMatrixInint() {
        this.lastBorderLength = 0;
        this.lastArrayMaxLength = 2048;
        this.lastBorderLand = new Uint32Array(4 * this.lastArrayMaxLength);
        this.lastLandGained = 0;
        this.lastInnerPixels = new Uint32Array(this.lastArrayMaxLength);
        this.offset = new Int32Array(4);
        this.offset[0] = -4 * this.pixel.mapDims.x;
        this.offset[1] = 4;
        this.offset[2] = -this.offset[0];
        this.offset[3] = -this.offset[1];
        this.editingMatrix = new Uint8Array(this.pixel.mapDims.x * this.pixel.mapDims.y);
    }

    attackProcessInit(id) {
        this.lastBorderTaken = false;
        this.setBorderToInnerPixels(id);
        this.setMarkedLandToBorderPixel(id);

        for (let attackIndex = this.attacks.getCurrentAttackCount(id) - 1; 0 <= attackIndex; attackIndex--) {
            if (0 === this.attacks.getBoatIDFromIndex(id, attackIndex)) {
                this.lastAttackIndex = attackIndex;
                this.startTestingTakingProcess(id);
            }
        }
        if (this.lastBorderTaken) this.updateTakenPixelArrays()
    }

    setBorderToInnerPixels(id) {
        let potentialBorderLength = this.players.potentialBorderAdvances[id].length;
        potentialBorderLength = potentialBorderLength > this.lastArrayMaxLength ? this.lastArrayMaxLength : potentialBorderLength;
        this.lastLandGained = 0;
        for (--potentialBorderLength; potentialBorderLength >= 0; potentialBorderLength--) this.lastInnerPixels[this.lastLandGained++] = this.players.potentialBorderAdvances[id][potentialBorderLength]
    }

    setMarkedLandToBorderPixel(id) {
        for (let i = this.players.potentialBorderAdvances[id] - 1; i >= 0; i--) {
            if (this.pixel.canOwn(this.players.potentialBorderAdvances[id][i])) {
                this.pixel.changeToBorderPixel(this.players.potentialBorderAdvances[id][i], id);
            }
        }
        this.players.potentialBorderAdvances[id] = [];
    }

    startTestingTakingProcess(id) {
        this.lastTargetID = this.attacks.getTargetFromIndex(id, this.lastAttackIndex);
        this.lastRemaining = this.attacks.getRemainingTroopsFromIndex(id, this.lastAttackIndex);
        this.markPossibleExpansion();
        if (0 === this.lastBorderLength) this.returnRemaining(id);
        else {
            this.resetEditingMatrix();
            if (this.canTakeMarkedPixels()) this.tryTakingMarkedPixels(id)
            else this.returnRemaining(id)
        }
    }

    markPossibleExpansion() {
        this.lastBorderLength = 0;
        this.lastTargetID === constants.MAX_ENTITIES ? this.markPossibleExpansionForNeutral() : this.markPossibleExpansionForPlayer();
    }

    markPossibleEntityExpansion() {
        for (let side = 3; side >= 0; side--) {
            for (let landIndex = this.lastLandGained - 1; landIndex >= 0; landIndex--) {
                const pIndex = this.lastInnerPixels[landIndex] + this.offset[side];
                const coord = utils.divideFloor(pIndex, 4);
                if (0 === this.editingMatrix[coord] && this.pixel.entityControlled(pIndex) && this.pixel.getOwner(pIndex) === this.lastTargetID) {
                    this.editingMatrix[coord] = 1;
                    this.lastBorderLand[this.lastBorderLength++] = pIndex;
                }
            }
        }
    }

    markPossibleExpansionForNeutral() {
        for (let side = 3; side >= 0; side--) {
            for (let landIndex = this.lastLandGained - 1; landIndex >= 0; landIndex--) {
                const pIndex = this.lastInnerPixels[landIndex] + this.offset[side];
                const coord = utils.divideFloor(pIndex, 4);
                if (0 === this.editingMatrix[coord] && this.pixel.isNeutral(pIndex)) {
                    this.editingMatrix[coord] = 1;
                    this.lastBorderLand[this.lastBorderLength++] = pIndex;
                }
            }
        }
    }

    returnRemaining(id) {
        if (this.attacks.getCurrentAttackCount(id) === 1) {
            this.deps.speed.removeEntry(id);
        }
        this.players.troops[id] += this.lastRemaining;
        this.deps.interest.limitTroops(id);
        this.attacks.removeAttack(id, this.lastAttackIndex);
    }

    resetEditingMatrix() {
        for (let bIndex = this.lastBorderLength - 1; 0 <= bIndex; bIndex--) {
            this.editingMatrix[utils.divideFloor(this.lastBorderLand[bIndex], 4)] = 0;
        }
    }
    canTakeMarkedPixels() {
        this.lastRemainingPerPixel = utils.divideFloor(this.lastRemaining, this.lastBorderLength);
        return this.lastRemainingPerPixel > constants.NEUTRAL_LAND_COST;
    }

    tryTakingMarkedPixels(id) {
        if (this.stillCanTakeMarkedPixels(id)) {
            this.takeBorderPixels(id);
            if (this.lastTargetID !== constants.MAX_ENTITIES) this.updateTargetPixelArrays();
        } else this.returnRemaining(id);
    }

    stillCanTakeMarkedPixels(id) {
        return this.lastTargetID === constants.MAX_ENTITIES ? this.deductTroopsTakingNeutralPixels() : this.deductTroopsTakingTargetPixels(id);
    }

    deductTroopsTakingNeutralPixels() {
        this.lastRemaining -= this.lastBorderLength * constants.NEUTRAL_LAND_COST;
        return true;
    }

    deductTroopsTakingTargetPixels(id) {
        const troopsNeededToTakeBasePixels = this.lastBorderLength * constants.NEUTRAL_LAND_COST;
        let totalTroopsNeededToTakePixels = this.getTroopsNeededToKillTargetTroopsAtBorderPixels();
        const remainingTroopsLeft = this.getLastAttackRemaining(id);
        totalTroopsNeededToTakePixels = troopsNeededToTakeBasePixels + 2 * totalTroopsNeededToTakePixels + remainingTroopsLeft;
        const tempLastRemaining = this.lastRemainingPerPixel * this.lastBorderLength;

        if (tempLastRemaining > totalTroopsNeededToTakePixels) {
            this.lastRemaining -= totalTroopsNeededToTakePixels;
            this.killAllTroops(totalTroopsNeededToTakePixels - troopsNeededToTakeBasePixels, remainingTroopsLeft, id);
            return true;
        }
        this.lastRemaining -= tempLastRemaining;
        this.killAllTroops(tempLastRemaining - troopsNeededToTakeBasePixels, remainingTroopsLeft, id);
        return false;
    }

    getTroopsNeededToKillTargetTroopsAtBorderPixels() {
        return utils.divideFloor(this.lastBorderLength * this.players.troops[this.lastTargetID], 1 + this.estimateBorderLength() * this.getWeightedBorderTroopDensity());
    }

    estimateBorderLength() {
        return Math.floor(2 + utils.sqrtEstimation(utils.divideFloor(this.players.land[this.lastTargetID], 100), 8));
    }

    getWeightedBorderTroopDensity() {
        let normalBorder = this.players.landBorderPixels[this.lastTargetID].length;
        let waterBorder = this.players.waterBorderPixels[this.lastTargetID].length;
        let mountainBorder = this.players.mountainBorderPixels[this.lastTargetID].length;
        
        return normalBorder + utils.divideFloor(waterBorder + mountainBorder, 50);
    }

    getLastAttackRemaining(id) {
        return this.attacks.getRemainingTroopsFromTarget(this.lastTargetID, id);
    }

    killAllTroops(troopsNeededToKillTargetTroops, remainingTroops, id) {
        if (0 < remainingTroops) {
            if (troopsNeededToKillTargetTroops >= remainingTroops) {
                this.attacks.setRemainingTroopsFromTarget(this.lastTargetID, id, 0);
                troopsNeededToKillTargetTroops -= remainingTroops;
            } else {
                this.attacks.setRemainingTroopsFromTarget(this.lastTargetID, id, remainingTroops - troopsNeededToKillTargetTroops);
                return
            } 
            troopsNeededToKillTargetTroops = utils.divideFloor(troopsNeededToKillTargetTroops, 2);
            
            if (this.players.troops[this.lastTargetID] >= troopsNeededToKillTargetTroops) {
                this.players.troops[this.lastTargetID] -= troopsNeededToKillTargetTroops;
            } else {
                this.players.troops[this.lastTargetID] = 0;
            }        
        }
    }

    takeBorderPixels(id) {
        this.lastBorderTaken = true;
        this.attacks.setRemainingTroopsFromIndex(id, this.lastAttackIndex, this.lastRemaining);
        this.players.land[id] += this.lastBorderLength;
        this.players.updateAuthorXYMinMax(id);
        this.constructNewLandBorder(id);
    }

    updateAuthorXYMinMax(id) {
        for (let xCoord, yCoord, bIndex = this.lastBorderLength - 1; 0 <= bIndex; bIndex--) {
            xCoord = utils.divideFloor(this.lastBorderLand[bIndex], 4) % this.pixel.mapDims.x;
            yCoord = utils.divideFloor(this.lastBorderLand[bIndex], 4 * this.pixel.mapDims.x);
            this.players.xMin[id] = utils.getMin(this.players.xMin[id], xCoord);
            this.players.yMin[id] = utils.getMin(this.players.yMin[id], yCoord);
            this.players.xMax[id] = utils.getMax(this.players.xMax[id], xCoord);
            this.players.yMax[id] = utils.getMax(this.players.yMax[id], yCoord);
        }
    }

    constructNewLandBorder(id) {
        for (let bIndex = this.lastBorderLength - 1; 0 <= bIndex; bIndex--) {
            this.players.potentialBorderAdvances[id].push(this.lastBorderLand[bIndex]);
            this.players.landBorderPixels[id].push(this.lastBorderLand[bIndex]);
            this.pixel.changeToBorderPixel(this.lastBorderLand[bIndex], id);
        }
    }

    updateTargetPixelArrays() {
        this.deductTargetLand();
        this.removeTargetTerrainBorderPixels(this.players.landBorderPixels[this.lastTargetID]);
        this.removeTargetTerrainBorderPixels(this.players.waterBorderPixels[this.lastTargetID]);
        this.removeTakenPixelsInPotentialAdvances(this.players.potentialBorderAdvances[this.lastTargetID]);
        this.constructNewBorderTerrain(this.players.waterBorderPixels[this.lastTargetID]);
        this.constructNewBorderTerrain(this.players.mountainBorderPixels[this.lastTargetID]);
        this.convertLastInnerPixelsToBorder();
        this.updateTargetXYMinMax();
    }


    deductTargetLand() {
        this.players.land[this.lastTargetID] -= this.lastBorderLength;
    }

    removeTargetTerrainBorderPixels(terrainBorderPixels) {
        for (let borderLength = terrainBorderPixels.length, bIndex = borderLength - 1; 0 <= bIndex; bIndex--) {
            if (!this.pixel.strongIsOwner(this.lastTargetID, terrainBorderPixels[bIndex]))  {
                terrainBorderPixels[bIndex] = terrainBorderPixels[borderLength - 1];
                terrainBorderPixels.pop();
                borderLength--
            }
        }
    }

    removeTakenPixelsInPotentialAdvances(potentialAdvances) {
        for (let borderLength = potentialAdvances.length, bIndex = borderLength - 1; 0 <= bIndex; bIndex--) {
            if (!this.pixel.strongIsOwner(this.lastTargetID, potentialAdvances[bIndex]) && this.pixel.canOwn(potentialAdvances[bIndex])) {
                potentialAdvances[bIndex] = potentialAdvances[borderLength - 1];
                potentialAdvances.pop();
                borderLength--;
            }
        }
    }

    constructNewBorderTerrain(terrainBorderPixels) {
        let borderLength = terrainBorderPixels.length;
        for (let bIndex = borderLength - 1,; 0 <= bIndex; bIndex--) {
            for (let side = 3; 0 <= side; side--) {
                let pIndex = terrainBorderPixels[bIndex] + this.offset[side];
                if (this.pixel.canTake(pIndex, this.lastTargetID)) {
                    this.players.landBorderPixels[this.lastTargetID].push(terrainBorderPixels[bIndex]);
                    terrainBorderPixels[bIndex] = terrainBorderPixels[borderLength - 1];
                    terrainBorderPixels.pop();
                    borderLength--;
                    break;
                }
            }
        }
    }

    convertLastInnerPixelsToBorder() {
        for (let bIndex = this.lastBorderLength - 1; 0 <= bIndex; bIndex--) {
            for (let side = 3; 0 <= side; side--) {
                let pIndex = this.lastBorderLand[bIndex] + this.offset[side];
                if (this.pixel.isOwner(this.lastTargetID, pIndex) && this.pixel.isInnerPixel(pIndex)) {
                    this.players.landBorderPixels[this.lastTargetID].push(pIndex);
                    this.pixel.changeToBorderPixel(pIndex, this.lastTargetID);
                }
            }
        }
    }

    updateTargetXYMinMax() {
        let p = this.players;
        let cIndex;
        loop: for (; p.yMin[this.lastTargetID] < p.yMax[this.lastTargetID]; p.yMin[this.lastTargetID]++) {
            for (cIndex = p.xMax[this.lastTargetID]; cIndex >= p.xMin[this.lastTargetID]; cIndex--) {
                if (this.pixel.strongIsOwner(this.lastTargetID, 4 * (p.yMin[this.lastTargetID] * this.pixel.mapDims.x + cIndex))) {
                    break loop;
                }
            }
        }
        loop: for (; p.yMin[this.lastTargetID] < p.yMax[this.lastTargetID]; p.yMax[this.lastTargetID]--) {
            for (cIndex = p.xMax[this.lastTargetID]; cIndex >= p.xMin[this.lastTargetID]; cIndex--) {
                if (this.pixel.strongIsOwner(this.lastTargetID, 4 * (p.yMax[this.lastTargetID] * this.pixel.mapDims.x + cIndex))) {
                    break loop;
                }
            }
        }
        loop: for (; p.xMin[this.lastTargetID] < p.xMax[this.lastTargetID]; p.xMin[this.lastTargetID]++) {
            for (cIndex = p.yMax[this.lastTargetID]; cIndex >= p.yMin[this.lastTargetID]; cIndex--) {
                if (this.pixel.strongIsOwner(this.lastTargetID, 4 * (cIndex * this.pixel.mapDims.x + p.xMin[this.lastTargetID]))) {
                    break loop;
                }
            }
        }
        loop: for (; p.xMin[this.lastTargetID] < p.xMax[this.lastTargetID]; p.xMax[this.lastTargetID]--) {
            for (cIndex = p.yMax[this.lastTargetID]; cIndex >= p.yMin[this.lastTargetID]; cIndex--) {
                if (this.pixel.strongIsOwner(this.lastTargetID, 4 * (cIndex * this.pixel.mapDims.x + p.xMax[this.lastTargetID]))) {
                    break loop;
                }
            }
        }
    }

    updateTakenPixelArrays() {
        this.updateEditingBorderPixels();
        this.updatePixelsBorderingTerrain()
    }

    updateEditingBorderPixels() {
        let advancesLength = this.players.potentialBorderAdvances[this.lastTargetID].length;
        
        loop: for (let bIndex = advancesLength - 1; 0 <= bIndex; bIndex--) {
            for (let side = 3; 0 <= side; side--) {
                let pIndex = this.players.potentialBorderAdvances[this.lastTargetID][bIndex] + this.offset[side];
                if (this.pixel.isNeutral(pIndex) || this.pixel.entityControlled(pIndex) && this.pixel.getOwner(pIndex) !== this.lastTargetID) {
                    this.pixel.changeToMovingPixel(this.players.potentialBorderAdvances[this.lastTargetID][bIndex], this.lastTargetID);
                    continue loop
                }
            }
            this.players.potentialBorderAdvances[this.lastTargetID][bIndex] = this.players.potentialBorderAdvances[this.lastTargetID][advancesLength - 1];
            this.players.potentialBorderAdvances[this.lastTargetID].pop();
            advancesLength--
        }
    }

    updatePixelsBorderingTerrain() {
        let landBorderLength = this.players.landBorderPixels[this.lastTargetID].length;

        loop: for (let bIndex = landBorderLength - 1; 0 <= bIndex; bIndex--) {
            let pixelBordersWater = false;
            let pixelBordersMountain = false;

            for (let side = 3; 0 <= side; side--) {
                let pIndex = this.players.landBorderPixels[this.lastTargetID][bIndex] + this.offset[side];
                if (this.pixel.canTake(pIndex, this.lastTargetID)) continue loop;
                pixelBordersWater = pixelBordersWater || this.pixel.isWater(pIndex);
                pixelBordersMountain = pixelBordersMountain || this.pixel.isMountain(pIndex)
            }
            if (pixelBordersWater) {
                this.players.waterBorderPixels[this.lastTargetID].push(this.players.landBorderPixels[this.lastTargetID][bIndex]);
            } else if (pixelBordersMountain) {
                this.players.mountainBorderPixels[this.lastTargetID].push(this.players.landBorderPixels[this.lastTargetID][bIndex]);
            } else {
                this.pixel.changeToInnerPixel(this.players.landBorderPixels[this.lastTargetID][bIndex], this.lastTargetID);
            }
            this.players.landBorderPixels[this.lastTargetID][bIndex] = this.players.landBorderPixels[this.lastTargetID][landBorderLength - 1];
            this.players.landBorderPixels[this.lastTargetID].pop();
            landBorderLength--
        }
    } 
}

module.exports = Algo;