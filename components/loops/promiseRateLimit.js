class promiseRateLimitWorker {
    constructor(loop, id, work, then) {
        this.loop = loop
        this.id = id
        this.hasArgs = false
        this.setWork(work)
        this.setThen(then)
        this.good = true 
    }
    setWork(work) {
        this._work = work
        return this
    }
    setArgs(args) {
        this._args = args
        return this
    }
    makeArgs() {
        this.hasArgs = true
        this.__args = this._args(this.loop.data)
        return this
    }
    setThen(then) {
        this.__then = then
        return this
    }
    retry() {
        this.loop.retry(this.id)
    }
    next() {
        this.loop.next(this.id)
    } 
    get _then() {
        return {
            resolved: (passed)=>{
                this.__then.resolved(passed, this.__args)
                this.hasArgs = false
                this.good = true
                this.next()

            },
            rejected: (passed)=>{
                this.good = false
                this.__then.rejected(passed, this.__args)
                this.retry()
            }

        }
    }
    makeWork() {
        if(!this.loop._until(this.loop.data)){
            if(!this.hasArgs) this.makeArgs()
            this.good = false
            this._work(this.loop.data, this.__args, this)
            .then(
                this._then.resolved,
                this._then.rejected
            )
        } else {
            this.loop.over()
            this.loop.makeEndHappen()
        }
    }
}
class promiseRateLimit {
    constructor(limit, loop) {
        this.limit = {
            count: 12,
            timeInterval: 1100,
            parallel: 3,
            updateEvery: 1,
        }
        limit(this)
        this.data = {
            _loop: this
        }
        Object.assign(this.data, loop)
        this.updateLimitWith = limit
        this._overToPromises = 0
        this._toLimit = 0
        this._intervals = 0
        this._unpause = []
        this._over = false
        this._mustEnd = []
    }
    assignLimit(limit) {
        Object.assign(this.limit, limit)
    }
    updateLimit() {
        this.updateLimitWith(this)
    }
    work(work) {
        this._work = work
        return this
    }
    args(args) {
        this._args = args
        return this
    }
    then(then) {
        this._then = then
        return this
    }
    tick(tick) {
        this._tick = tick 
        return this
    }
    finish(finish) {
        this._finish = finish
        return this
    }
    until(until) {
        this._until = until
        return this
    }
    init() {
        this.parallelWorkers = []
        for(let i = 0; i < this.limit.parallel; i++) {
            this.parallelWorkers[i] = this.workerInit(i)
        }
        this.rateLimitStartedAt = Date.now()
        this._limitInterval = setInterval(()=>{
            this._tick(this.data, this.limit)
            this._intervals++
            if(this._intervals%this.limit.updateEvery==0){
                this.updateLimit()
            }
            this._toLimit = 0
            this.unpause()
        }, this.limit.timeInterval)
        this.loopTrought()
        return this
    }
    get rateLimitReached() {
        if(this._toLimit >= this.limit.count) {
            return true
        } else {
            return false
        }
    }
    mustEnd(promises) {
        this._overToPromises++
        Promise.all(promises)
            .then(()=>{
                this._overToPromises--
                this.makeEndHappen()
            })
    }
    over() {
        if(this.parallelWorkers.reduce(
            (a, r)=>{
                return r.good && a
            },
            true
            )) {
                this._over = true
            }     
    }
    makeEndHappen() {
        if(this._over&&this._overToPromises===0) {
            if(this.parallelWorkers.reduce(
                (a, r)=>{
                    return r.good && a
                },
                true
                )) {
                    clearInterval(this._limitInterval)
                    this._finish(this.data)
                }
            }
    }
    unpause() {
        let toUnpause
        while(toUnpause = this._unpause.shift()) {
            toUnpause()
        }
    }
    _next(i) {
            this._toLimit++
            this.parallelWorkers[i].setArgs(
                this._args
            ).makeWork()
    }
    next(i) {
        if(!this.rateLimitReached) {
                this._next(i)
        } else if(this.rateLimitReached){
                this._unpause.push(()=>{
                    this._next(i)
                })
        }
    }
    _retry(i) {
            this._toLimit++
            this.parallelWorkers[i].makeWork()
    }
    retry(i) {
        if(!this.rateLimitReached) {
            this._retry(i)
            this.good = true
        } else if(this.rateLimitReached){
            this._unpause.push(()=>{
                this._retry(i)
            })
        }
    }
    workerInit(i) {
        return new promiseRateLimitWorker(
            this,
            i,
            this._work,
            this._then(this)
            )
    }
    loopTrought() {
        this.parallelWorkers.forEach((x)=>{
            x.next()
        })
    }
}

module.exports = promiseRateLimit