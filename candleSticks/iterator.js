let inc = require('./../inc.js')
let { 
    parseIntervalStep,
    candleStickInterval,
    integrityVerifier,
} = inc('candleSticks/interval')
let syncPromise = inc('loops/syncPromise')

class candleStickIterator {
    constructor(args, db) {
        Object.assign(this, Object.assign(
            {
                symbol   : null,
                interval : null,
                begin    : null,
                end      : null,
                chunk    :  120,                 
            },
            args
        ))
        this.stickTiming = new candleStickInterval(this.interval)
        this.stickTiming.begin(this.begin)
        this.db = db
        this.currentTime = this.begin
        this.stepTime = parseIntervalStep(this.interval)
        this.verify = new integrityVerifier(this.interval, this.begin)
    }
    tick(cb) {
        this._tick = cb
        return this
    }
    setCallback(cb) {
        this.cb = (loop, meta, data)=>{
            let r = this.verify.stick(meta, data)
            cb(loop, r[0], r[1])
        }
        return this
    }
    loop() {

        let loo = (new syncPromise(
            (loop)=>{ 
                loop.tickIntervals = this.tickIntervals
                loop.assignLimit({
                    parallel: 1,
                })
            }))
            .work(
                (loop, x)=>{
                    let r = this.next()
                    this.updateTime()
                    return r
                }        
            )
            .args(
                (loop)=>{
                    loop.symbol   = this.symbol
                    loop.interval = this.interval
                    loop.openTime = this.currentTime
                }
            )
            .then((loop)=>{
                return {
                    resolved: (data, args)=>{
                        data.rows.map((x)=>{
                            x.opentime = Number(x.opentime)
                            x.closetime = Number(x.closetime)
                            this.cb(
                                loop, {
                                    symbol: this.symbol,
                                    interval: this.interval,
                                }, x)
                        })
                        
                    },
                    rejected: (data, args)=>{
                        console.error(`: > : Promise rejected in candleStick iterator:`, data , args)
                    } 
                }
            })
            .until((loop)=>{
                return (this.currentTime>=this.end)
                    ? true
                    : false
            })
            .finish((loop)=>{
                this._onEnd()
            })
        if(typeof this._tick === 'function') loo.tick((loop)=>{
            this._tick(loop)
        })
        loo.init()
    }
    next() {
        let query = 
        "SELECT * FROM candles_"+this.interval+"_"+this.symbol + " "
        +"WHERE (openTime >= $1) "
        +"AND (openTime < $2) ORDER BY openTime ASC;"
        let r = this.db.query(
            query, [this.openTimeGreaterEqualThan, this.openTimeLessThan]
        )
        return r
    }
    get openTimeGreaterEqualThan() {
        return this.currentTime
    }
    get openTimeLessThan() {
        return this.currentTime + (this.chunk * this.stepTime)
    }
    updateTime() {
        this.currentTime = this.openTimeLessThan
    }
    onEnd(onEnd) {
        this._onEnd = onEnd
        return this
    }
}

module.exports = candleStickIterator