

let parseIntervalStep = (interval) => {
    interval = interval.split("")
    let multiplier = 1
    switch(interval[interval.length-1]) {
        case "w": 
            multiplier *= 7
        case "d":
            multiplier *= 24
        case "h":
            multiplier *= 60
        case "m":
            multiplier *= (60 * 1000) 
    }
    let r = multiplier*Number(interval.slice(0, interval.length-1).join(""))
    return r
}

let moment = require('moment')

class candleStickInterval {
    constructor(interval, begin) {
        this.interval = interval
        this.intervalStep = parseIntervalStep(this.interval)/1000
        this.begin(begin)
    }
    begin(after) {
        let diff, remainder, _moment, milliseconds
        this.moment = moment.utc(after)
        switch(this.interval) {
            case '1Mo':
                this.moment = this.moment.add(1, 'month')
                this.moment.startOf('month')
                break;

            case '1w':
                this.moment = this.moment.add(1, 'week')
                this.moment.startOf('week')
                break;

            case '3d':
                milliseconds = parseIntervalStep('3d') 
                diff = this.moment.diff(1546387200000)
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '1d':
                this.moment.utc().startOf('day').add(1, 'days')
                break;
            case '12h':
                milliseconds = parseIntervalStep('12h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '8h':
                milliseconds = parseIntervalStep('8h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '6h':
                milliseconds = parseIntervalStep('6h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '4h':
                milliseconds = parseIntervalStep('4h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '2h':
                milliseconds = parseIntervalStep('2h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '1h':
                milliseconds = parseIntervalStep('1h') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                this.moment = _moment
                break;
            case '30m':
                milliseconds = parseIntervalStep('30m') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '15m':
                milliseconds = parseIntervalStep('15m') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '5m':
                milliseconds = parseIntervalStep('5m') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '3m':
                milliseconds = parseIntervalStep('1Mo') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
            case '1Mo':
                milliseconds = parseIntervalStep('1Mo') 
                diff = this.moment.diff(moment.utc().startOf('day'))
                remainder = Math.abs(diff%milliseconds)/1000
                _moment = this.moment.add(remainder, 'seconds')
                this.moment = _moment
                break;
        }
        return this
    }
    get openTime() {
        return (new Date(this.moment.utc().toString())).getTime()
    }
    get closeTime() {
        let r
        let _moment = this.moment.clone() 
        switch(this.interval) {
            case '1Mo':
                r = _moment.add(1, 'month')
                break;
            default:
                r = _moment.add(this.intervalStep, 'seconds')
                break;
        }
        return (new Date(r.utc().toString())).getTime() - 1
    }
    findOpenTime(time) {
        return this.begin(time)
    }
    next() {
        switch(this.interval) {
            case '1Mo':
                this.moment = this.moment.add(1, 'month')
                break;
            default:
                this.moment = this.moment.add(this.intervalStep, 'seconds')
                break;
        }
        return this
    }
}

class integrityVerifier {
    constructor(interval, begin) {
        this.interval = new candleStickInterval(interval, begin)
        this.should = {
            open: this.interval.openTime,
            close: this.interval.closeTime,
        }
        this.status = {
            skipped: 0,
        }
    }
    roll() {
        this.should = {
            open: this.interval.openTime,
            close: this.interval.closeTime,
        }
        this.status.skipped = 0
    }
    stick(meta, data){
        this.interval.next()
        this.roll()
        if(data.closetime>this.should.close){
            this.closeUnexpected(data)
        }
        Object.assign(meta, this.status)
        return [meta, data]
    }
    closeUnexpected(data) {
        while(!(this.interval.openTime==data.opentime)) {
            this.status.skipped++
            this.interval.next()
        }
    }
}
module.exports = {
    parseIntervalStep,
    candleStickInterval,
    integrityVerifier,
}
