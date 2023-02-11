module.exports = (module)=>{
    let fs = require('fs')
    if(fs.existsSync('./components/'+module+'.js')) {
        return require('./'+module+'.js')
    }
    if(fs.existsSync('./components/'+module+'/inc.js')) {
        return require('./'+module+'/inc.js')
    }
    return require(module)
}