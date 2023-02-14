/*

    This could be so, it's computed from nextVal, but it isn;t.



*/




let inc = require('./../inc.js')
let { parseIntervalStep, candleStickInterval } = inc('candleSticks/interval')
let Args = inc('technicalAnalysis/arguments')

class argumenter {
    constructor(ta, args) {
        this.ta = ta
        this.for = args[0]
        this._required = []
        this._args = {}
        this._fillables = []
        this.makeArgs(args[1])
    }
    makeArgs(args) {
        if(args[0][0] instanceof Object) {
            this._required.push(args[0][0].values)
            this._args = args[0][0]
            this._fillables.push(['values', args[0][0].values])
        } else {
            args[0].filter((x)=>{
                return x instanceof Array
            }).forEach((x)=>{
                if(x[0]=='values') {
                    this._required.push(x[1])
                    this._fillables.push([x[0], x[1]])
                } else {
                    this._args[x[0]] = x[1]
                }
            })
            this._fillables = args[0].filter((x)=>{
                return !(x instanceof Array)
            }).map((x)=>{
                return [x, x]
            })
        }

/*
        if(typeof this._fillables[0] == 'string') this._fillables = [this._fillables]
        this._fillables = this._fillables.map((x)=>{
            if(x[1] instanceof Array) x[1] = 'close'
            return x
        })

*/
    }
    get args() {
        let args = {}
        this._fillables.forEach((x)=>{
            args[x[0]] = this.ta.fill(x[1])
        })
        return Object.assign(this._args, args)
    }
    get argsOne() {
        let args = {}
        this._fillables.forEach((x)=>{
            args[x[0]] = this.ta.fillOne(x[1])
        })
        return Object.assign(this._args, args)
    }
    require(arg) {
        return this._required.includes(arg)
    }
}

class technicalAnalysis {
    constructor(args) {
        Object.assign(this, Object.assign({
            length: 92,
        }, args))
        this.TI = require('technicalindicators')
        this.technicalIndicator = {}
        this.emptySticks()
        this.emptyArgs()
        this.constructArguments()
    }
    emptyArgs() {

        this._args = {
            close: [],
            open: [],
            high: [],
            low: [],
            volume: [],
        }

    }
    emptySticks() {
        this.sticks = []
    }
    stick(meta, data) {
        let r = null
        if(meta.skipped===0) {

            this.sticks.push({
                meta: meta,
                data: data,
            })
            if(this.sticks.length>this.length) this.sticks.shift()

            this.adjustArguments(data)

            if(this.sticks.length===this.length) {

                let TA = this.doTechnicalAnalysis()
                let SA = this.doCandleStickAnalysis()
                
                r = this._save(
                    {
                        openTime : data.opentime,
                        interval : meta.interval,
                        symbol   :   meta.symbol,
                    },
                    [TA, SA]
                )
                    

            }
        } else {
        
            this.emptyArgs()
            this.emptySticks()

        }

        return r
        
    }
    fill(nameOfValues) {
        let r
        if(Object.keys(this._args).includes(nameOfValues)) {
            return this._args[nameOfValues]
        } else if (this.technicalIndicatorArgumentersMap.includes(nameOfValues)) {
            r = this.technicalIndicator[nameOfValues]
            return r
        }
    }
    fillOne(nameOfValues) {
        let r = this.fill(nameOfValues)
        return r[r.length-1]
    }
    adjustArguments(data) {
        
        Object.entries(this._args).map((entry)=>{
            this._args[entry[0]].push(data[entry[0]])
            if(this._args[entry[0]].length>this.length) {
               this._args[entry[0]].shift()
            }
        })

    }
    doTechnicalAnalysis() {
        this.technicalIndicatorArgumenters.map((x)=>{
            this.technicalIndicator[x.for] = this.TI[x.for].calculate(x.args)
        })
        return Object.entries(this.technicalIndicator).map((x)=>{
            return [x[0], x[1][x[1].length - 1]]
        })
    }
    doCandleStickAnalysis() {
        this.candleStickIntervals = this.candleStickCountForAnalysisAll.map((x)=>{
            return this.slice(x)
        })
        
        return this.candleStickCountForAnalysis.map((x)=>{
            if(x[1]==5) x[1]=4
            let r = this.TI[x[0]](this.candleStickIntervals[x[1]-1])
            return [x[0], r]
        })
    }
    slice(y) {
        let r = {}
        Object.entries(this._args).forEach((x)=>{
            r[x[0]] = x[1].slice(x[1].length - (y), x[1].length)
        })
        return r
    }
    constructArguments() {
        this.candleStickCountForAnalysisAll = []
        this.candleStickCountForAnalysis = Object.entries(Args.patterns).sort((a, b)=>{
            return a[1]-b[1]
        })
        this.candleStickCountForAnalysis.forEach((x)=>{
            if( !this.candleStickCountForAnalysisAll.includes(x[1]) )this.candleStickCountForAnalysisAll.push(x[1])
        })
        let technicalIndicators = Object.entries(Args.technicalIndicators).map((ti)=>{        
            return new argumenter(this, [ti[0], ti[1]])
        })
        this.technicalIndicatorArgumenters = technicalIndicators.sort((a, b)=>{
            if(a.require(b.for)) {
                return 1
            } else {
                return -1
            }
        })
        this.technicalIndicatorArgumentersMap = this.technicalIndicatorArgumenters.map((x)=>{
            return x.for
        })
        this.technicalIndicatorArgumentersMapObject = {}
        this.technicalIndicatorArgumentersMap.forEach((x,i)=>{
            this.technicalIndicatorArgumentersMapObject[x] = i
        })
    }
    setSave(fn) {
        this._save = fn
        return this
    }    
}

module.exports = technicalAnalysis