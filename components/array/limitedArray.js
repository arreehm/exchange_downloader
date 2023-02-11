class limitedArray {
    constructor(length) {
        this.length = length
        this.arr = []
    }
    push(element) {
        if(this.arr.length = this.length) {
            this.arr.shift()
        }
        this.arr.push(element)
    }
    map(fn) {
        this.arr.map(fn)
    }
    reduce(fn, a) {
        this.arr.reduce(fn, a)
    }
}
module.exports = limitedArray