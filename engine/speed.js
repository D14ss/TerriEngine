class Speed {
    constructor(deps) {
        this.deps = deps;

        this.newAttackIntervalsLeft = 6;
        this.intervalsLeft = new Uint8Array(deps.constants.MAX_ENTITIES).fill(0);
        this.attacking = new Uint16Array(deps.constants.MAX_ENTITIES).fill(false);
        this.remaining = new Array(deps.constants.MAX_ENTITIES).fill(0);
    }
  
    setSpeedInterval(id, land) {
        if (this.intervalsLeft[id] === 10) this.intervalsLeft[id] = this.newAttackIntervalsLeft;
        else if(land < 1E3) this.intervalsLeft[id] = 3;
        else if(land < 1E4) this.intervalsLeft[id] = 2;
        else if(land < 6E4) this.intervalsLeft[id] = 1;
        else this.intervalsLeft[id] = 0;
    }

    updateAll() {
        for (let i = 0; i < this.deps.constants.MAX_ENTITIES; i++) {
            if (this.attacking[i]) this.update(i);
        }    
    }
  
    update(id) {
        const land = this.deps.pixel.getLand(id);

        if (!this.attacking[id]) return;
        if (this.intervalsLeft[id] === 10) this.setSpeedInterval(id, land);
        else if (this.intervalsLeft[id]-- === 0) {
            this.setSpeedInterval(id, land);
            this.deps.algo.attackProcessInit(id);
            if(land >= 16E4) this.deps.algo.attackProcessInit(id);
            if(land >= 3E5) this.deps.algo.attackProcessInit(id);
        }
    }
  
    removeEntry(id) {
        this.attacking[id] = false;
        this.remaining[id] = 0;
    }
  
    addEntry(id, amount) {
        if (this.attacking[id]) {
            this.remaining[id] += amount;
        } else {
            this.attacking[id] = true;
            this.intervalsLeft[id] = 10;
            this.remaining[id] = amount;
        }
    }
}

module.exports = Speed;