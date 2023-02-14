let config = {
    begin    :  (new Date(Date.parse('1 Jan 2019 00:00:00 UTC'))).getTime(),
    end      :  (new Date(Date.parse('31 Jan 2023 00:00:00 UTC'))).getTime(),
    intervals : '3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w'.split(", ")
}

let inc = require('./components/inc.js')

let candleStickIterator = inc('candleSticks/iterator')
let technicalIndicators = inc('technicalAnalysis/technical')
let indicatorsArguments = inc('technicalAnalysis/arguments')

let indicatorsOutput = indicatorsArguments.OUTPUT 
let patternNames     = Object.keys(indicatorsArguments.patterns)

let syncPromise = inc('loops/syncPromise')

let fs = require('fs')

let symbolsIntervalsPairs = []

let symbols = JSON.parse(fs.readFileSync('./~/candlesUsed'))

//symbols = ['ETHBTC', 'BNBBTC', 'LTCBTC']
symbols.forEach((x)=>{
    config.intervals.forEach((y)=>{
        symbolsIntervalsPairs.push([x, y])
    })
})
// Comment line before after tests!!
            
let { Client } = require('pg')
let candles = new Client({database: 'candles'})
let indicators = new Client({database: 'indicators'})
let _ = require('lodash')

Promise.all([candles.connect(), indicators.connect()]).then(()=>{ 
    console.info(`: > : Connecting database...`)
    let createTable = symbolsIntervalsPairs.map((x)=>{
        let indicatorTableFields = []
        Object.entries(indicatorsOutput).forEach((x)=>{
            if(x[1][0]=='val') {
                    indicatorTableFields.push(`"${x[0]}" real`)
            }
            else {
                x[1].forEach((y)=>{
                    indicatorTableFields.push(`"${x[0]}_${y}" real`)
                })
            }
        })
        let indicatorTableName = 'indicators_'+x[0]+'_'+x[1]
        let indicatorTableQuery = 'CREATE TABLE IF NOT EXISTS '+indicatorTableName+' ('
            + '"openTime" BIGINT UNIQUE PRIMARY KEY, '
            + indicatorTableFields.join(',') 
            +');'

        let patternTableFields = []
        patternNames.forEach((x)=>{
            //                    console.log(technicalIndication)
            
            patternTableFields.push(`"${x}" boolean`)
        })
        let patternTableName = 'patterns_'+x[0]+'_'+x[1]
        let patternTableQuery = 'CREATE TABLE IF NOT EXISTS '+patternTableName+' ('
            + '"openTime" BIGINT UNIQUE PRIMARY KEY, '
            + patternTableFields.join(',')
            +');'

        return [indicators.query(indicatorTableQuery), indicators.query(patternTableQuery)]
    })
    Promise.all(_.flatten(createTable)).then(()=>{
        
        let syncdPromise = (new syncPromise((l)=>{
            l.tickIntervals = 1
            l.assignLimit({
                parallel: 1,
            })
        },{
            symbolsIntervalsPairs:  symbolsIntervalsPairs,
            begin                :           config.begin,
            end                  :             config.end,
            pair                 : ['ABSOLUTE','BEGINING']
        })).args((loop)=>{
            let pair = loop.symbolsIntervalsPairs.shift()
            loop.pair = pair
            return { 
                symbol   : pair[0],
                interval : pair[1],
            }
        }).until((loop)=>{
            return loop.symbolsIntervalsPairs.length === 0
        }).work((loop, args)=>{

            let technicalIndication = (new technicalIndicators({
                length: 82,
            }))
                .setSave((meta, ta)=>{

                    let rowInfo = []
                    let rowData = []

                    ta[0].forEach((x)=>{
                        if(typeof x[1] ==='number') {
                            rowInfo.push(`${x[0]}`)
                            rowData.push(x[1])
                        } else if(x[1] instanceof Object) {
                            Object.entries(x[1]).forEach((y)=>{
                                rowInfo.push(`${x[0]}_${y[0]}`)
                                rowData.push(y[1])
                            })
                        }
                    })

                    rowInfo = rowInfo.map((x)=>{
                        return `"${x}"`
                    })

                    let query = 'INSERT INTO '+`indicators_${meta.symbol}_${meta.interval}`+' ('
                        + '"openTime" ,'
                        + rowInfo.join(',')
                        + ") VALUES ($1, "+
                        rowInfo.map((x, i)=>{
                            return "$"+(i+2).toString()
                        }).join(',')
                        +") ON CONFLICT DO NOTHING;"

                        rowData.unshift(meta.openTime)

                    let indicatorsQueryPromise = indicators.query(
                        query,
                        rowData,
                    )
                    let patternRowInfo = []
                    let patternRowData = []

                    ta[1].forEach((x)=>{
                        patternRowInfo.push(x[0])
                        patternRowData.push(x[1])
                    })

                    patternRowInfo = patternRowInfo.map((x)=>{
                        return `"${x}"`
                    })


                    let patternQuery = 'INSERT INTO '+`patterns_${meta.symbol}_${meta.interval}`+' ('
                    + '"openTime" ,'
                        + patternRowInfo.join(',')
                        + ") VALUES ($1, "+
                        patternRowInfo.map((x, i)=>{
                            return "$"+(i+2).toString()
                        }).join(',')
                    +") ON CONFLICT DO NOTHING;"
                    patternRowData.unshift(meta.openTime)
                    let patternQueryPromise = indicators.query(patternQuery, patternRowData)
                    return ([indicatorsQueryPromise, patternQueryPromise])
                })

            
            return new Promise((res, rej)=>{
                    let iterator = (new candleStickIterator({
                        interval : args.interval,
                        symbol   :   args.symbol,
                        begin    :    loop.begin,
                        end      :      loop.end,
                        chunk    :           240,
                        tickIntervals:         3,
                    }, candles))
                        .setCallback((loop, meta, stick)=>{
                            let waitForEnd = technicalIndication.stick(meta, stick)
                            loop._loop.continueAfterResolving(waitForEnd)
                        }).tick((loop)=>{
                            console.info(`: > : Processing sticks from ${loop.symbol} ${loop.interval} ` + (new Date(loop.openTime)).toString())
                        }).onEnd(()=>{
                            res()
                        }).loop()
                })   
        }).tick((loop)=>{
            console.info(`: > :  Currently at : `, loop.pair)
        }).finish((loop)=>{
            console.info(`: x : Disconnecting database`)
            candles.end()
            indicators.end()
        })
        syncdPromise.init()

    })
})