const schedule = require('node-schedule')
let CoronaCheck = require(require('path').join(__dirname, 'checker.js'))

// dotenv .env load
require('dotenv').config({path: require('path').join(__dirname, 'INFO.ENV')})

console.info(`First Run > AutoCheck Start.`)
CoronaCheck.ENVRun()

let a = schedule.scheduleJob('42 7 * * *', function(){
  console.info(`schedule task > AutoCheck Start.`)
  CoronaCheck.ENVRun()
});

// docker adjust (+ 9 Hour)
let b = schedule.scheduleJob('42 16 * * *', function(){
  console.info(`schedule task +9 Hour > AutoCheck Start.`)
  CoronaCheck.ENVRun()
});