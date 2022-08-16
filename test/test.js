import { Thrivecart } from '../src/index.js';

const usr = '###'
const pwd = '###'

const tc = new Thrivecart()

await tc.startLocal(false)

console.log('Logging in')
await tc.login(usr, pwd)

console.log('Giving access to course')
await tc.studentGiveAccess('ruben', 'Lite', true)
await tc.studentGiveAccess('ruben', 'P3', true)

//await tc.finish()