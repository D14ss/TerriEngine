import constants from './constants.js';

class Speed {
    constructor(deps) {
        this.deps = deps;

        this.newAttackIntervalsLeft = 6;
        this.intervalsLeft = new Uint8Array(constants.MAX_ENTITIES);
        this.attackers = new Uint16Array(constants.MAX_ENTITIES);
        this.attackersCount = 0;
        this.remaining = new Array(constants.MAX_ENTITIES).fill(0);
    }
  
    setSpeedInterval(id) {
        if (this.intervalsLeft[id] === 10) this.intervalsLeft[id] = this.newAttackIntervalsLeft;
        else if(land < 1E3) this.intervalsLeft[id] = 3;
        else if(land < 1E4) this.intervalsLeft[id] = 2;
        else if(land < 6E4) this.intervalsLeft[id] = 1;
        else this.intervalsLeft[id] = 0;
    }
  
    update() {
        for (let i = this.attackersCount - 1; 0 <= i; i--) {
            let id = this.attackers[i];
            if (this.intervalsLeft[id] === 10) this.setSpeedInterval(id);
            else if (this.intervalsLeft[id]-- === 0) {
                this.setSpeedInterval(id);
                this.deps.algo.attackProcessInit(id);
            }
        }
        if (Math.max(...this.deps.players.land) >= 16E4) {
            this.checkHigherSpeed(16E4);
        }
        if (Math.max(...this.deps.players.land) >= 3E5) {
            this.checkHigherSpeed(3E5);
        }
    }
    
    checkHigherSpeed(thresholdLand) {
        for (let i = this.attackersCount - 1; 0 <= i; i--) {
            let id = this.attackers[i];
            let land = this.deps.pixel.getLand(id);
            if (this.intervalsLeft[id] === 0 && land >= thresholdLand) {
                this.deps.algo.attackProcessInit(id);
            }
        }
    }

    removeEntry(id) {
        for (let i = this.attackersCount - 1; i >= 0; i--) {
            if (this.attackers[i] === id) {
                this.attackersCount--;
                for (let j = i; j < this.attackersCount; j++) this.attackers[j] = this.attackers[j + 1];
                break
            }
        }
    }
  
    addEntry(id) {
        for (let i = this.attackersCount - 1; i >= 0; i--) {
            if (this.attackers[i] === id) return;
        }
        this.attackers[this.attackersCount++] = id;
        this.intervalsLeft[id] = 10;
    }
}

module.exports = Speed;