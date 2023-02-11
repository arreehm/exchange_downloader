let inc = require('./../inc.js')

let promiseRateLimit = inc('loops/promiseRateLimit')


const Binance = require('binance-api-node').default
const client = Binance()

class exchangeDownloader {
    constructor(date, symbols) {
        this.symbols = symbols
        this.dateToBeginFetch = new Date(Date.parse(date))
        this.currentSymbol = this.symbols.shift()
    }
    getArgs() {
        return (loop)=>{
            // Generate arguments parameter for worker...
            let x = {
                symbol: this.currentSymbol,
                limit: loop.limit,
                interval: loop.interval,
                startTime: loop.currentFrame, 
                endTime: loop.currentFrame + 501 * 1 * 60 * 1000
            }

            loop.symbol = this.currentSymbol
            loop.currentFrame += 500 * 1 * 60 * 1000
            loop.i++ 
            return x
        }
    }
    getWork() {
        return (loop, x)=>{
            return client.candles({
                symbol: x.symbol,
                interval: x.interval,
                limit: x.limit,
                startTime: x.startTime,
                endTime: x.endTime,
            })
        }
    }
    setThen(then) {
        this.then = then
        return this
    }
    getThen() {
        return this.then
    }
    checkAndGetNextSymbol() {
        if(this.loop.data.currentFrame>=this.loop.data.endTime&&this.symbols.length>0) {
            this.currentSymbol = this.symbols.shift()
            this.loop.data.currentFrame = this.dateToBeginFetch.getTime()
        }
    }
    getUntil() {
        return (loop)=>{
            // Statement to execute loop up to
            this.checkAndGetNextSymbol()
            return (loop.currentFrame>=loop.endTime&&this.symbols.length==0)
                ? true
                : false
        }
    }
    getTick() {
        return this._tick
    }
    getFinish() {
        return this._finish
    }
    tick(tick) {
        this._tick = tick
        return this
    }
    finish(finish) {
        this._finish = finish
        return this
    }
    getData() {
        return {
            i: 0, // Initial state of the loop
            limit: 500,
            interval: '1m',
            endTime: Date.now(),
            startTime: this.dateToBeginFetch.getTime(),
            currentFrame: this.dateToBeginFetch.getTime()
        }
    }
    go() {
        client.exchangeInfo()
            .then(
                (res)=>{
                    this.loop = (new promiseRateLimit(
                        (loop)=>{
                            loop.assignLimit({
                                count: Math.floor(res.rateLimits[3].limit/13),
                                timeInterval: res.rateLimits[3].intervalNum*60*1000,
                                parallel: 32,
                                updateEvery: 5,
                            })
                        },this.getData()))
                        .work(
                            this.getWork()
                        )
                        .args(
                            this.getArgs()
                        )
                        .then(
                            this.getThen()
                        )
                        .tick(
                            this.getTick()
                        )
                        .until(
                            this.getUntil()
                        )
                        .finish(
                            this.getFinish()
                        )
                    
                        this.loop.init()
                },
                (err)=>{
                    console.error(err)
                }
            )
            return this
    }
}

module.exports = exchangeDownloader