let args = {
    technicalIndicators: {    
        ADL: [[
            'high',
            'low',
            'close',
            'volume',
        ],[
            'val'
        ]],
        ADX: [[
            'high',
            'close',
            'low',
            ['period', 14]
        ],[
            'adx',
            'mdi',
            'pdi',
        ]],
        ATR: [[
            'high',
            'close',
            'low',
            ['period', 14]
        ],[
            'val'
        ]],
        AwesomeOscillator: [[
            'high',
            'low',
            ['fastPeriod',  5],
            ['slowPeriod', 34],
        ],[
            'val'
        ]],
        BollingerBands: [[{
            values: 'SMA',
            period: 14,
            stdDev: 2
        }],[
            'upper',
            'lower',
            'middle',
            'pb'
        ]],
        CCI:[[
            'open',
            'high',
            'low',
            'close',
            ['period', 20],
        ],[
            'val'
        ], 'nextValue'],
        ForceIndex:[[
            'open',
            'high',
            'low',
            'close',
            'volume',
            ['period', 20],
        ],[
            'val'
        ], 'nextValue'],
        KST:[[{
            values      : 'close',
            ROCPer1     :      10,
            ROCPer2     :      15,
            ROCPer3     :      20,
            ROCPer4     :      30,
            SMAROCPer1  :      10,
            SMAROCPer2  :      10,
            SMAROCPer3  :      10,
            SMAROCPer4  :      15,
            signalPeriod:       3,
        }],
        [
            'kst',
            'signal'
        ]],
        MFI:[[
            'high',
            'low',
            'close',
            'volume',
            ['period', 14],
        ], [
            'val'
        ], 'nextValue'],
        MACD:[[{
            values            : 'EMA',
            fastPeriod        :     5,
            slowPeriod        :     8,
            signalPeriod      :     3,
            SimpleMAOscillator: false,
            SimpleMASignal    : false,
        }],
        [
            'MACD',
            'signal',
            'histogram',
        ]],
        OBV:[[
            'close',
            'volume',
        ],[
            'val'
        ]],
        PSAR:[[
            'high',
            'low',
            ['step', 0.02],
            ['max',   0.2]
        ],[
            'val'
        ],' nextValue'],
        ROC:[[{
            values: 'close',
            period: 12,
        }],[
            'val'
        ]],
        RSI: [[{
            values: 'close',
            period: 14,
        }],[
            'val'
        ], 'nextValue'],
        SMA: [[{
            values: 'close',
            period: 8,
        }],[
            'val'
        ]],
        Stochastic: [[
            'high',
            'low',
            'close',
            ['period', 14],
            ['signalPeriod', 3]
        ], [
            'k',
            'd',
        ]],
        StochasticRSI:[[{
                values: 'close',
                rsiPeriod: 14,
                stochasticPeriod: 14,
                kPeriod: 14,
                dPeriod: 14,
            }],[
                'stochRSI',
                'k',
                'd'
            ],
            'nextValue'],
        TRIX:[[{
            values: 'close',
            period: 18,
        }],[
            'val'
        ]],
        /*TypicalPrice: [[
            'high',
            'low',
            'close',
        ],[
            'val'
        ], 'nextValue'],
        */VWAP: [[
            'open',
            'high',
            'low',
            'close',
            'volume',
        ], [
            'val'
        ], 'nextValue'],
        VolumeProfile: [[
            'high',
            'open',
            'low',
            'close',
            'volume',
            ['noOfBars', 14]
        ], [
            'bearishVolume',
            'bullishVolume',
            'rangeEnd',
            'rangeStart',
            'totalVolume',
        ]],
        EMA:[[{
            values: 'close',
            period: 8,
        }],[
            'val'
        ]],
        WMA:[[{
            values: 'close',
            period: 8,
        }],[
            'val'
        ]],
        WEMA:[[{
            values: 'close',
            period: 8,
        }],[
            'val'
        ]],
        WilliamsR:[[
            'high',
            'low',
            'close',
            ['period', 14],
        ],[
            'val'
        ]],
        IchimokuCloud:[[
            'high',
            'low',
            ['conversionPeriod', 9],
            ['basePeriod',      26],
            ['spanPeriod',      52],
            ['displacement',    26],
        ],[        
            'conversion',
            'base',
            'spanA',
            'spanB',
        ]]
    },

    patterns: {
        abandonedbaby: 3,
        bearishengulfingpattern: 2,
        bullishengulfingpattern: 2,
        darkcloudcover: 2,
        downsidetasukigap: 3,
        doji: 1,
        dragonflydoji: 1,
        gravestonedoji: 1,
        bullishharami: 2,
        bearishharamicross: 2,
        bullishharamicross: 2,
        bullishmarubozu: 1,
        bearishmarubozu: 1,
        eveningdojistar: 3,
        eveningstar: 3,
        bearishharami: 2,
        piercingline: 2,
        bullishspinningtop: 1,
        bearishspinningtop: 1,
        morningdojistar: 3,
        morningstar: 3,   
        threeblackcrows: 3,
        threewhitesoldiers: 3,
        bearishhammerstick: 1,
        bullishhammerstick: 1,
        bearishinvertedhammerstick: 1,
        bullishinvertedhammerstick: 1,
        tweezertop: 5,
        tweezerbottom: 5,
        hammerpattern: 5,
        
     
    }
}
let out = {}
Object.entries(args.technicalIndicators).map((x)=>{
    out[x[0]] = x[1][1]
})
args.OUTPUT = out
module.exports = args