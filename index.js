'use strict'
let args = process.argv
let port = args[2] || 6755
let host = args[3] || 'localhost'

let App = require('./src/app')
let app = new App(port, host)
app.start()
