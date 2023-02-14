let inc = require('./components/inc.js')

let exchangeDownloader = inc('exchangeDownloadContainment/binance')

/* 

    ----------------------

    // Fetches Binance Data

    ----------------------

*/

// let dateToBeginFetchFrom = '2019-1-1'
let dateToBeginFetchFrom = '01 Jan 2017 00:00:00 UTC'
let interval = '6h'
let binance = require('binance-api-node').default()

binance.exchangeInfo()
    .then(
        (exchangeInfo)=>{
            let symbols = exchangeInfo.symbols
                .filter( (x)=>{
                        return x.isMarginTradingAllowed
                    })
                .slice(0, 49)
                .map( (x)=>{
                        return x.symbol
                    })
            console.info(`: > : We'll be downloading following symbols:`, symbols)

            
            let { Client } = require('pg')
            let pg = new Client({database: 'candles'})
            pg.connect().then(()=>{

                console.info(`: > :   ~ Database connected ~`)
                // Database Connection Opened
                let createTable = Promise.all(
                    symbols
                        .map((x)=>{
                            return `candles_${interval}_${x}`
                        })
                        .map(
                            (x)=>{
                                text = "CREATE TABLE IF NOT EXISTS "+x+" ( openTime BIGINT UNIQUE PRIMARY KEY, closeTime BIGINT, trades INT, open real, high real, low real, close real, volume real, quoteVolume real, baseAssetVolume real, quoteAssetVolume real);"
                                return pg.query(text)
                            }
                    )
                )
                .then(res => {
                    let downloader = (new exchangeDownloader(
                        dateToBeginFetchFrom,
                        symbols,
                        interval,
                    ))
                    downloader
                        .setThen((loop)=>{
                            return {
                                resolved: (data, args)=>{
                                    let insertStatement = 'INSERT INTO '+`candles_${interval}_${args.symbol}`
                                    +' (openTime, closeTime, trades, open, high, low, close, volume, quoteVolume, baseAssetVolume, quoteAssetVolume)'
                                    +' VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING;'
                                    let save = data.map((x)=>{ 
                                            return pg.query(insertStatement,[
                                            x.openTime, x.closeTime,
                                            x.trades,
                                            x.open, x.high, x.low, x.close,
                                            x.volume, x.quoteVolume, x.baseAssetVolume, x.quoteAssetVolume])
                                    })
                                    loop.mustEnd(save)
                                },
                                rejected: (data, args)=>{
                                    console.error(`: ! : API Promise Rejected!`, data, args)
                                }
                            }
                        })
                        .tick((loop, limit)=>{
                            console.info(`: > : Tick >` )
                            console.info(`        Currently having ${loop.i} querries done... `)
                            console.info(`        We're at ${loop.symbol}`)
                        })
                        .finish((loop)=>{
                            pg.end()
                            console.info(`: # : Finished, made ${loop.i} querries on API...`)
                        })
                        downloader.go() 
                }) 
                .catch(err => console.error(': ! : Querry error < CREATE TABLE >!: ',err.stack))
                
            })
            .catch((err) => console.error(': ! : Connection to database error!: ', err.stack))

        },
    )
