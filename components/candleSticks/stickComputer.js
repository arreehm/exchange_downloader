const { xorWith } = require('lodash')
let inc = require('./../inc.js')
let { parseIntervalStep, candleStickInterval } = inc('candleSticks/interval')
let { stick } = inc('candleSticks/stick')

class stickComputer {
    constructor(args) {
        this.sticks = 0
        Object.assign(this, Object.assign({
            symbol: null,
            from: {
                interval :       null,
                begin    :       null,
            },
            to: {
                intervals:       null,
            }
        }, args))
        this.intervals = this.to.intervals.map((x)=>{
            return (new candleStickInterval(x, this.from.begin))
        })
        
        this.sticks = this.intervals.map((x)=>{
            return new stick(x.interval)
        })
    }
    stick(meta, data) {
        if(meta.skipped>0) {
            this.skip(meta.skipped, {
                meta: meta,
                data: data,
            })
        }
        
        this.intervals.map((interval,i)=>{
            if(interval.openTime == data.opentime) {
                this.sticks[i].openCandle(data, interval.closeTime)
            } else {
                this.sticks[i].continue(data)
            }
            if(interval.closeTime==data.closetime) {
                if(this.sticks[i].opened) {
                    this._save({
                        interval: interval.interval,
                        symbol: meta.symbol,
                    }, this.sticks[i].candlestick)
                }
                this.sticks[i].closeCandle()
                interval.next()
            }
        })

    }
    skip(skipped, x) {
        this.intervals.map((interval, i)=>{
            if(interval.closeTime < x.data.closetime) {
                if(this.sticks[i].opened) this._save({
                    interval: interval.interval,
                    symbol: x.meta.symbol,
                }, this.sticks[i].candlestick)

                this.sticks[i].closeCandle()
                interval.findOpenTime(x.data.opentime)
            }
        })
    }
    setSave(fn) {
        this._save = fn
    }
}

module.exports = stickComputer