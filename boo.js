let config = {
    bookInterval  : 10*60*1000,
    depthInterval :       1000,
}
// 2021-2-4;08:45:00 LOCAL DISCONECTION
const binance = require('binance-api-node').default()

const fs = require('fs')

const pg = new (require('pg').Client)({database: 'book'})

let symbols = JSON.parse(fs.readFileSync('./~/candlesUsed')).slice(0, 37)

// <//Comment Line Below>>
//symbols = ['ETHUSDT']

let makeTablesIfNon  = (pg, symbol)=>{
    let createBookTable  = 'CREATE TABLE IF NOT EXISTS book_5m_'+symbol+' (lastUpdateId BIGINT UNIQUE PRIMARY KEY, ask text, bid text);'
    let createDepthTable = 'CREATE TABLE IF NOT EXISTS depth_'+config.depthInterval+'ms_'+symbol+' ('
        +'lastUpdateId BIGINT UNIQUE PRIMARY KEY,'
        +'firstUpdateId BIGINT,'
        +'time BIGINT,'
        +'askDepth text,'
        +'bidDepth text'
        +');'
    return [createBookTable, createDepthTable].map((x)=>{
        return pg.query(x)
    })
}

let saveBinanceBook  = (pg, symbol, book)=>{
    let saveBook = 'INSERT INTO book_5m_'+symbol+' (lastUpdateId, ask, bid) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;'
    let values = [book.lastUpdateId, JSON.stringify(book.asks), JSON.stringify(book.bids)]
    pg.query(saveBook, values)
}
let saveBinanceDepth = (pg, symbol, depth)=>{
    let saveDepth = 'INSERT INTO depth_'+config.depthInterval+'ms_'+symbol+' (lastUpdateId, firstUpdateId, time, askDepth, bidDepth) '
        + 'VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING'
    let values = [
        depth.firstUpdateId,
        depth.finalUpdateId,
        depth.eventTime,
        JSON.stringify(depth.askDepth),
        JSON.stringify(depth.bidDepth),
    ]
    pg.query(saveDepth, values)
}
let fetchBinanceBook = (pg, symbol)=>{
    binance.book({ symbol: symbol })
        .then((response)=>{
            saveBinanceBook(pg, symbol, response)
        })
}

/*
binance.futuresExchangeInfo()
    .then((res)=>{
        console.log(res)
    })
*/

let bookSaves = 0
let depthSaves = 0

pg.connect().then(()=>{
    setInterval(()=>{
        console.info(`: LIVE : currently have ${bookSaves} book saves and ${depthSaves} depth saves.`)
    }, 30*1000 )
    setTimeout(()=>{
    }, 30*60*1000)
    Promise.all(...symbols.map((symbol)=>{
        return makeTablesIfNon(pg, symbol)
    })).then(()=>{

        symbols.forEach((symbol)=>{
            fetchBinanceBook(pg, symbol)
            bookSaves++
            setInterval(()=>{        
                fetchBinanceBook(pg, symbol)
                bookSaves++        
            }, config.bookInterval)
                
            binance.ws.depth(`${symbol}@${config.depthInterval}ms`, (depth)=> {
                saveBinanceDepth(pg, symbol, depth)
                depthSaves++
            })
        
        })
    
    })

})