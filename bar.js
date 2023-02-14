let config = {
    begin   :  (new Date(Date.parse('01 Jan 2019 00:00:00 GMT+0000'))).getTime(),
    end     :  (new Date(Date.parse('31 Jan 2023'))).getTime(),
    interval:           '1m',
    longer  : '3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1Mo'.split(", ")
}

let todel = {}

let inc = require('./components/inc.js')

let candleStickComputer = inc('candleSticks/stickComputer')
let candleStickIterator = inc('candleSticks/iterator')

let syncPromise = inc('loops/syncPromise')

let fs = require('fs')

let symbols = JSON.parse(fs.readFileSync('./~/candlesUsed'))
// Comment line before after tests!!
// symbols = ['ETHBTC']

            
let { Client } = require('pg')
let pg = new Client({database: 'candles'})

let _ = require('lodash')

pg.connect().then(()=>{
    console.info(`: > : Connecting database...`)
    console.info(`: > : We're going to make entry of longer frame candlesticks for symbols:`, symbols)
    let createTable = symbols.map((symbol)=>{
        return config.longer.map((interval)=>{
            let tablename = 'candles_'+interval+'_'+symbol
            let createTable = "CREATE TABLE IF NOT EXISTS "+tablename+" ( openTime BIGINT UNIQUE PRIMARY KEY, closeTime BIGINT, trades INT, open real, high real, low real, close real, volume real, qouteVolume real, baseAssetVolume real, qouteAssetVolume real);"
            return pg.query(createTable)
        })
    })
    
    Promise.all(_.flatten(createTable)).then(()=>{
        let syncdPromise = (new syncPromise((l)=>{
            l.assignLimit({
                parallel: 1,
            })
        },{
            intervalsToConvertTo :          config.longer,
            symbols              :                symbols,
            interval             :        config.interval,
            begin                :           config.begin,
            end                  :             config.end,
        })).args((loop)=>{
            loop.symbol = loop.symbols.shift()
            return { 
                symbol: loop.symbol,
            }
        }).until((loop)=>{
            return loop.symbols.length === 0
        }).work((loop, args)=>{

            let stickComputer = new candleStickComputer({
                symbol:          args.symbol,
                from: {
                    interval   : loop.interval,
                    begin      :    loop.begin,
                },
                to: {
                    intervals  : loop.intervalsToConvertTo,
                }
            })
                
            stickComputer.setSave((meta, x)=>{
                // console.info(`: > : Saving stick with:`,meta, x)
                
                let insertStick = 'INSERT INTO candles_'+meta.interval+'_'+meta.symbol+''
                +' (openTime, closeTime, trades, open, high, low, close, volume, quoteVolume, baseAssetVolume, quoteAssetVolume)'
                +' VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING;'
                let values = [
                            x.opentime, x.closetime,
                            x.trades,
                            x.open, x.high, x.low, x.close,
                            x.volume, x.quotevolume, x.baseassetvolume, x.quoteassetvolume
                         ]
                return ([pg.query(insertStick, values)])                 
            })

            return new Promise((res, rej)=>{
                    let iterator = (new candleStickIterator({
                        tickIntervals:       10,
                        interval : loop.interval,
                        symbol   :   args.symbol,
                        begin    :    loop.begin,
                        end      :      loop.end,
                    }, pg))
                        .tick((loop)=>{
                            console.info(`: > : ${loop.symbol} ${loop.interval} | from time: ${new Date(loop.openTime)}`)
                        })
                        .setCallback((loop, meta, stick)=>{
                            stick.opentime  =  Number(stick.opentime)
                            stick.closetime = Number(stick.closetime)        
  
                            let waitForEnd = stickComputer.stick(meta, stick)
                            waitForEnd = _.flatten(waitForEnd)
                            loop._loop.continueAfterResolving(waitForEnd) 
                    }).onEnd(()=>{
                        res()
                    }).loop()
                })   
        }).finish((loop)=>{
            console.info(`: x : Disconnecting database`)
            pg.end()
        })
        syncdPromise.init()

    })
})