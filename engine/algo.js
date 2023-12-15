import * as constants from './constants.js';
import * as utils from './utils.js';

class Algo {
    constructor(deps) {
        this.deps = deps;
        
        this.neutCost = 2;
        this.markedPixels = [];
    }
    
    attackMatrixInint() {
        this.lastBorderLength = 0;
        this.lastArrayMaxLength = 2048;
        this.lastBorderLand = new Uint32Array(4 * this.lastArrayMaxLength);
        this.lastLandGained = 0;
        this.lastInnerPixels = new Uint32Array(this.lastArrayMaxLength);
        this.offset = new Int32Array(4);
        this.offset[0] = -4 * this.deps.pixel.mapDims.x;
        this.offset[1] = 4;
        this.offset[2] = -this.offset[0];
        this.offset[3] = -this.offset[1];
        this.editingMatrix = new Uint8Array(this.deps.pixel.mapDims.x * this.deps.pixel.mapDims.y);
    }

    attackProcessInit(id) {
        this.lastBorderTaken = false;
        this.setBorderToInnerPixels(id);
        this.setMarkedLandToBorderPixel(id);

        for (let attackIndex = this.deps.attacks.getCurrentAttackCount(id) - 1; 0 <= attackIndex; attackIndex--) {
            if (0 === this.deps.attacks.getBoatIDFromIndex(id, attackIndex)) {
                this.lastAttackIndex = attackIndex;
                this.startTestingTakingProcess(id);
            }
        }
        // working on this
        lastBorderTaken && updateTakenPixelArrays()
    }

    setBorderToInnerPixels(id) {
        let potentialBorderLength = this.deps.players.potentialBorderAdvances[id].length;
        potentialBorderLength = potentialBorderLength > this.lastArrayMaxLength ? this.lastArrayMaxLength : potentialBorderLength;
        this.lastLandGained = 0;
        for (--potentialBorderLength; potentialBorderLength >= 0; potentialBorderLength--) this.lastInnerPixels[this.lastLandGained++] = this.deps.players.potentialBorderAdvances[id][potentialBorderLength]
    }

    setMarkedLandToBorderPixel(id) {
        for (let i = this.deps.players.potentialBorderAdvances[id] - 1; i >= 0; i--) {
            if (this.deps.pixel.canOwn(this.deps.players.potentialBorderAdvances[id][i])) {
                this.deps.pixel.changeToBorderPixel(this.deps.players.potentialBorderAdvances[id][i], id);
            }
        }
        this.deps.players.potentialBorderAdvances[id] = [];
    }

    startTestingTakingProcess(id) {
        this.lastTargetID = this.deps.attacks.getTargetFromIndex(id, this.lastAttackIndex);
        this.lastRemaining = this.deps.attacks.getRemainingTroopsFromIndex(id, this.lastAttackIndex);
        this.markPossibleExpansion();
        if (0 === this.lastBorderLength) this.returnRemaining(id);
        else {
            this.resetEditingMatrix();
            if (this.canTakeMarkedPixels()) tryTakingMarkedPixels(id)
            else returnRemaining()
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
                if (0 === this.editingMatrix[coord] && this.deps.pixel.entityControlled(pIndex) && this.deps.pixel.getOwner(pIndex) === this.lastTargetID) {
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
                if (0 === this.editingMatrix[coord] && this.deps.pixel.isNeutral(pIndex)) {
                    this.editingMatrix[coord] = 1;
                    this.lastBorderLand[this.lastBorderLength++] = pIndex;
                }
            }
        }
    }

    returnRemaining(id) {
        if (this.deps.attacks.getCurrentAttackCount(id) === 1) {
            this.deps.speed.removeEntry(id);
        }
        this.deps.players.troops[id] += this.lastRemaining;
        this.deps.interest.limitTroops(id);
        this.deps.attacks.removeAttack(id, this.lastAttackIndex);
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
            // if (this.lastTargetID !== constants.MAX_ENTITIES) this.updateTargetPixelArrays();
        }
    }
    // working on this
    function tryTakingMarkedPixels() {
        if (stillCanTakeMarkedPixels()) {
            TakeBorderPixels();
            if (lastTargetID !== maxEntities) updateTargetPixelArrays()
        } else returnRemaining()
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
        return utils.divideFloor(this.lastBorderLength * this.deps.players.troops[this.lastTargetID], 1 + this.estimateBorderLength() * this.getWeightedBorderTroopDensity());
    }

    estimateBorderLength() {
        return Math.floor(2 + utils.sqrtEstimation(utils.divideFloor(this.deps.players.land[this.lastTargetID], 100), 8));
    }

    getWeightedBorderTroopDensity() {
        let normalBorder = this.deps.players.landBorderPixels[this.lastTargetID].length;
        let waterBorder = this.deps.players.waterBorderPixels[this.lastTargetID].length;
        let mountainBorder = this.deps.players.mountainBorderPixels[this.lastTargetID].length;
        
        return normalBorder + utils.divideFloor(waterBorder + mountainBorder, 50);
    }

    getLastAttackRemaining(id) {
        return this.deps.attacks.getRemainingTroopsFromTarget(this.lastTargetID, id);
    }

    killAllTroops(troopsNeededToKillTargetTroops, remainingTroops, id) {
        if (0 < remainingTroops) {
            if (troopsNeededToKillTargetTroops >= remainingTroops) {
                this.deps.attacks.setRemainingTroopsFromTarget(this.lastTargetID, id, 0);
                troopsNeededToKillTargetTroops -= remainingTroops;
            } else {
                this.deps.attacks.setRemainingTroopsFromTarget(this.lastTargetID, id, remainingTroops - troopsNeededToKillTargetTroops);
                return
            } 
            troopsNeededToKillTargetTroops = utils.divideFloor(troopsNeededToKillTargetTroops, 2);
            
            if (this.deps.players.troops[this.lastTargetID] >= troopsNeededToKillTargetTroops) {
                this.deps.players.troops[this.lastTargetID] -= troopsNeededToKillTargetTroops;
            } else {
                this.deps.players.troops[this.lastTargetID] = 0;
            }        
        }
    }

    takeBorderPixels(id) {
        this.lastBorderTaken = true;
        this.deps.attacks.setRemainingTroopsFromIndex(id, this.lastAttackIndex, this.lastRemaining);
        this.deps.players.land[id] += this.lastBorderLength;
        this.deps.players.updateAuthorXYMinMax(id);

    function TakeBorderPixels() {
        lastBorderTaken = true;
        attacks.setRemainingTroopsFromIndex(lastAuthorID, lastAttackIndex, lastRemaining);
        land[lastAuthorID] += lastBorderLength;
        updateAuthorXYMinMax();
        constructNewLandBorder()
    }

    updateAuthorXYMinMax(id) {
        for (let xCoord, yCoord, bIndex = this.lastBorderLength - 1; 0 <= bIndex; bIndex--) {

    function updateAuthorXYMinMax() {
        for (var xCoord, yCoord, bIndex = lastBorderLength - 1; 0 <= bIndex; bIndex--) {
            xCoord = divideFloor(lastBorderLand[bIndex], 4) % currentMapWidth;
            yCoord = divideFloor(lastBorderLand[bIndex], 4 * currentMapWidth);
            xMin[lastAuthorID] = getMin(xMin[lastAuthorID], xCoord);
            yMin[lastAuthorID] = getMin(yMin[lastAuthorID], yCoord);
            xMax[lastAuthorID] = getMax(xMax[lastAuthorID], xCoord);
            yMax[lastAuthorID] = getMax(yMax[lastAuthorID], yCoord);
        }
    }

    markPossiblePixels() {
        this.markedPixels = [];
        const borderPixels = this.deps.pixel.getBorderPixels();
        for (let borderPixel of borderPixels) {
            for (let side = 0; side <= 3; side++) {
                let x = this.deps.pixel.getX(borderPixel),
                    y = this.deps.pixel.getY(borderPixel);
                switch (side) {
                    case 0:
                        x--;
                        break;
                    case 1:
                        x++;
                        break;
                    case 2:
                        y--;
                        break;
                    case 3:
                        y++;
                        break;
                }
                const pIndex = this.deps.pixel.getIndex(x, y);
                if (this.deps.pixel.mapArray[pIndex] === 0 && !this.markedPixels.includes(pIndex)) {
                    this.markedPixels.push(pIndex);
                }
            }
        }
    }
  
    returnRemaining() {
        this.deps.interest.troops += this.deps.speed.remaining;
        this.deps.gameStatistics.expenses[1] -= this.deps.speed.remaining;
        this.deps.speed.removeEntry();
    }
  
    takeBorderPixels() {
        this.deps.speed.remaining -= this.markedPixels.length * this.neutCost;
        for (let pIndex of this.markedPixels) {
            this.deps.pixel.mapArray[this.deps.pixel.getIndex(this.deps.pixel.getX(pIndex), this.deps.pixel.getY(pIndex))] = 2;
        }
        this.deps.pixel.updatePixels();
    }
}

module.exports = Algo;