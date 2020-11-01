// RSA Public Key
const PUBLIC_KEY = '30820122300d06092a864886f70d01010105000382010f003082010a0282010100f357429c22add0d547ee3e4e876f921a0114d1aaa2e6eeac6177a6a2e2565ce9593b78ea0ec1d8335a9f12356f08e99ea0c3455d849774d85f954ee68d63fc8d6526918210f28dc51aa333b0c4cdc6bf9b029d1c50b5aef5e626c9c8c9c16231c41eef530be91143627205bbbf99c2c261791d2df71e69fbc83cdc7e37c1b3df4ae71244a691c6d2a73eab7617c713e9c193484459f45adc6dd0cba1d54f1abef5b2c34dee43fc0c067ce1c140bc4f81b935c94b116cce404c5b438a0395906ff0133f5b1c6e3b2bb423c6c350376eb4939f44461164195acc51ef44a34d4100f6a837e3473e3ce2e16cedbe67ca48da301f64fc4240b878c9cc6b3d30c316b50203010001'

// https://github.com/travist/jsencrypt/issues/147#issuecomment-534359519
global.navigator = {appName: 'nodejs'} // fake the navigator object
global.window = {} // fake the window object

const JSEncrypt = require('jsencrypt').default
const RSA = new JSEncrypt
RSA.setPublicKey(PUBLIC_KEY)

const got = require('got')

async function run() {
  console.info(`orgcode info: Lctn/Crse/ScName: ${process.env.Lctn}/${process.env.Crse}/${process.env.SCHOOL_NAME}`)
  console.info(`Student Info: NAME/BIRTH: ${process.env.STUDENT_NAME}/${process.env.STUDENT_BIRTHDAY}`)
  let SCCODE = await getSchoolCode(process.env.Lctn, process.env.Crse, process.env.SCHOOL_NAME)
  await coronaCheck(SCCODE, process.env.STUDENT_NAME, process.env.STUDENT_BIRTHDAY, process.env.STUDENT_PASSWORD)
}

async function coronaCheck(orgcode, Name, Birth, Password) {
  let token = await getToken(orgcode, Enc(Name), Enc(Birth)) // Generate Token. 
  await loginToken(token, Enc(Password)) // Login token.
  let UploadDate = await sendResult(token) // Upload Data
  let isVaild = await getToken(orgcode, Enc(Name), Enc(Birth), true) // Upload Validation.

  console.log(`Student CoronaCheck OK. isVaild: ${typeof isVaild === "boolean" ? true : false}, Upload Date: ${UploadDate}`)
}

async function getSchoolCode(lctn, Crse, ScName, cb) {
  try {
    let res = await got('https://hcs.eduro.go.kr/v2/searchSchool',{
      searchParams : {
          lctnScCode : lctn,
          schulCrseScCode : Crse,
          orgName : ScName,
          currentPageNo : 1
        }
      }
    )
    return JSON.parse(res.body).schulList[0].orgCode
  } catch (e) {
    throw e
  }
}

async function getToken(orgcode, NameEnc, BirthEnc, VaildCheck) {
  try {
    let res = await got.post('https://goehcs.eduro.go.kr/loginwithschool', {
      // JSON Data POST
      json: {
        orgcode: orgcode,
        name: NameEnc,
        birthday: BirthEnc
      }
    })
    if (VaildCheck === true && JSON.parse(res.body).VaildRegisterDtm !== null) {
      // Vaildated.
      return true
    } else {
      // Return Token.
      return JSON.parse(res.body).token
    }
  } catch (e) {
    console.dir(
      JSON.stringify(
        {
          orgcode: new String(orgcode),
          name: new String(NameEnc),
          birthday: new String(BirthEnc)
        }
      )
    )
    throw e.stack
  }
}

async function loginToken(token, PassEnc) {
  try {
    let res = await got.post('https://goehcs.eduro.go.kr/secondlogin', {
      // JSON Data POST
      json: {
        password: PassEnc,
        deviceUuid: ""
      },

      headers: {
        Authorization: token
      }
    })

  return JSON.parse(res.body).sndLogin

  } catch (e) {
    console.info('TOKEN: ' + token)
    console.info('PASSWORD: ' + PassEnc)
    throw e.stack
  }
}

async function sendResult(AuthToken) {
  try {
    let res = await got.post('https://goehcs.eduro.go.kr/registerServey', {
      // JSON Data POST
      json: {
        rspns01: "1",
        rspns02: "1",
        rspns03: null,
        rspns04: null,
        rspns05: null,
        rspns06: null,
        rspns07: "0",
        rspns08: "0",
        rspns09: "0",
        rspns10: null,
        rspns11: null,
        rspns12: null,
        rspns13: null,
        rspns14: null,
        rspns15: null,
        rspns00: "Y"
      },

      headers: {
        Authorization: AuthToken
      }
    })

  return JSON.parse(res.body).registerDtm

  } catch (e) {
    console.info('TOKEN: ' + AuthToken)
    throw e.stack
  }
}

function Enc (val) {
  return RSA.encrypt(val)
}

module.exports = {
  getSchoolCode: async (lctn, Crse, ScName) => getSchoolCode(lctn, Crse, ScName),
  getToken: async (orgcode, NameEnc, BirthEnc, isVaild) => getToken(orgcode, NameEnc, BirthEnc, isVaild),
  loginToken: async (token, PassEnc) => loginToken(token, PassEnc),
  sendResult: async (AuthToken) => sendResult(AuthToken),
  ENVRun: async () => run()
}