let config = {
    bookInterval  : 10*60*1000,
    depthInterval :       1000,
}

const binance = require('binance-api-node').default()

/*
let intervals =  '1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M'.split(", ")
intervals.map((interval)=>{

    binance.candles({
        symbol: 'XRPBTC',
        interval: interval,
        startTime:  1546387200000,
    }).then((res)=>{
        console.info(`Interval:`,interval)
        console.log(res[0])
        let fs = require('fs')
        fs.writeFileSync('./sticks/'+interval, JSON.stringify(res))
    })
})
*/
binance.candles({
    symbol: 'ETHBTC',
    interval: '4h',
    startTime:  1546502400000 ,
    limit: 1
}).then((res)=>{
    console.log(res)
})