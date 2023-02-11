let { Client } = require('pg')
let pg = new Client({database: 'ground'})
pg.connect().then(()=>{
    let sql = "SELECT tablename "
    + "FROM pg_catalog.pg_tables "
    + "WHERE schemaname != 'pg_catalog' AND "
    + " schemaname != 'information_schema';"
    pg.query(sql).then(
        (res)=>{
            console.info(` Database is having currently ${res.rows.length} tables with 5m candlesticks` )
            let fs = require('fs')
            fs.writeFileSync('./~/candlesUsed', JSON.stringify(res.rows.map((x)=>{
                let a = x.tablename.split('_')
                return a[a.length - 1].toUpperCase()
            })))
        })

})