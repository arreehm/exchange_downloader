class stick {
    constructor(interval) {
        this.interval = interval
        this.candlestick = {}
    }
    set openTime (time) {
        this.candlestick.openeime = time
    }
    set closeTime (time) {
        this.candlestick.closetime = time
    }
    set open (open) {
        this.candlestick.open = open
    }
    set close (close) {
        this.candlestick.close = close
    }
    set high (high) {
        this.candlestick.high = high
    } 
    set low (low) {
        this.candlestick.low = low
    }
    set trades (trades) {
        this.candlestick.trades = trades
    }
    set volume (volume) {
        this.candlestick.volume = volume
    }
    set quoteVolume (quoteVolume) {
        this.candlestick.quotevolume = quoteVolume
    }
    set quoteAssetVolume (quoteAssetVolume) {
        this.candlestick.quoteassetvolume = quoteAssetVolume
    }
    set baseAssetVolume (baseAssetVolume) {
        this.candlestick.baseassetvolume = baseAssetVolume
    }
    get openTime () {
        return this.candlestick.opentime
    }
    get closeTime () {
        return this.candlestick.closecime
    }
    get open () {
        return this.candlestick.open
    }
    get close () {
        return this.candlestick.close
    }
    get high () {
        return this.candlestick.high
    }
    get low () {
        return this.candlestick.low
    }
    get trades () {
        return this.candlestick.trades
    }
    get volume () {
        return this.candlestick.volume
    }
    get quoteAssetVolume () {
        return this.candlestick.quoteassetvolume
    }
    get quoteVolume () {
        return this.candlestick.quotevolume
    }
    get baseAssetVolume () {
        return this.candlestick.baseassetvolume
    }
    addVolume(vol) {
        this.volume += vol
    } 
    addQuoteVolume(vol) {
        this.quoteVolume += vol
    }
    addQuoteAssetVolume(vol) {
        this.quoteAssetVolume += vol
    }
    addTrades(trades) {
        this.trades += trades
    }
    addBaseAssetVolume(vol) {
        this.baseAssetVolume += vol
    }
    setHighIfHigher(high) {
        this.high = this.candlestick.high>high?this.candlestick.high:high
    }
    setLowIfLower(low) {
        this.low = this.candlestick.low<low?this.candlestick.low:low
    }
    openCandle(data, closeTime) {
        this.opened = true
        this.open = data.open
        Object.assign(this.candlestick, data)
        this.closeTime = closeTime
    }
    closeCandle() {
        this.opened = false
        this.candlestick = {}
    }
    continue(data) {
        this.setHighIfHigher(data.high)
        this.setLowIfLower(data.low)
        this.close = data.close
        this.addTrades(data.trades)
        this.addVolume(data.volume)
        this.addQuoteVolume(data.quotevolume)
        this.addQuoteAssetVolume(data.quoteassetvolume)
        this.addBaseAssetVolume(data.baseassetvolume)
    }
}

module.exports = {
    stick: stick,
 }