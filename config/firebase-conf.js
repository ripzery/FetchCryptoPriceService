const firebase = require('firebase')

const config = {
    apiKey: "AIzaSyDwSTBV2N25-eYVXty2W-59Mm117Sg9krc",
    authDomain: "cryptracker.firebaseapp.com",
    databaseURL: "https://cryptracker.firebaseio.com",
    projectId: "cryptracker",
    storageBucket: "cryptracker.appspot.com",
    messagingSenderId: "602641586193"
  };

firebase.initializeApp(config)
let query = firebase.firestore().collection('users')
console.log(query)

module.exports = firebase