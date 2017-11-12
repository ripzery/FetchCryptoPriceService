const FirestoreService = require('../firestore')
const admin = require('firebase-admin')
const COLOR_RED = '#f44336'
const COLOR_GREEN = '#4caf50'

class CloudMessagingService {
    constructor() {
        /* Build payload based on price is going up or down */
        this.payload = {
            data: {
                type: '',
                title: "Cryptracker",
                body: '',
                color: ''
            }
        }
        this.messaging = admin.messaging()
    }

    async notifyUsers(waitingNotifyUsers, price) {
        let tokens = {
            omg: {
                priceUp: waitingNotifyUsers.omg.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.omg.priceDown.map(v => v.refreshedToken),
            },
            evx: {
                priceUp: waitingNotifyUsers.evx.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.evx.priceDown.map(v => v.refreshedToken)
            },
            btc: {
                priceUp: waitingNotifyUsers.btc.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.btc.priceDown.map(v => v.refreshedToken),
            },
            eth: {
                priceUp: waitingNotifyUsers.eth.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.eth.priceDown.map(v => v.refreshedToken)
            }
        }

        console.log(tokens)

        /* If there're no users should be notified then do nothing. */
        if (tokens.omg.priceUp.length + tokens.omg.priceDown.length + tokens.evx.priceUp.length + tokens.evx.priceDown.length +
            tokens.btc.priceUp.length + tokens.btc.priceDown.length + tokens.eth.priceUp.length + tokens.eth.priceDown.length  == 0) return

        /* If there's users should be know that omg price is going up, then send notification */
        if (tokens.omg.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.currency = "omg"
            this.payload.data.price = `${price.omg}`
            this.payload.data.body = `Hooray! OMG is going up more than 5%!. <current_price>, but the current price is now ${price.omg}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.omg.priceUp, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.omg.priceUp = waitingNotifyUsers.omg.priceUp.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.omg.priceUp, {omg: {bx_price: price.omg}})
        }

        /* If there's users should be know that omg price is going down, then send notification */
        if (tokens.omg.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.currency = "omg"
            this.payload.data.price = `${price.omg}`
            this.payload.data.body = `Boo.. OMG is going down 5% check it out. <current_price>, but the current price is now ${price.omg}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.omg.priceDown, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.omg.priceDown = waitingNotifyUsers.omg.priceDown.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.omg.priceDown, {omg: {bx_price: price.omg}})
        }

        /* If there's users should be know that evx price is going up, then send notification */
        if (tokens.evx.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.currency = "evx"
            this.payload.data.price = `${price.evx}`
            this.payload.data.body = `Hooray! EVX is going up more than 5%!. <current_price>, but the current price is now ${price.evx}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.evx.priceUp, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.evx.priceUp = waitingNotifyUsers.evx.priceUp.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.evx.priceUp, {evx: {bx_price: price.evx}})
        }

        /* If there's users should be know that evx price is going down, then send notification */
        if (tokens.evx.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.currency = "evx"
            this.payload.data.price = `${price.evx}`
            this.payload.data.body = `Boo.. EVX is going down 5% check it out. <current_price>, but the current price is now ${price.evx}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.evx.priceDown, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.evx.priceDown = waitingNotifyUsers.evx.priceDown.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.evx.priceDown, {evx: {bx_price: price.evx}})
        }

        /* If there's users should be know that btc price is going up, then send notification */
        if (tokens.btc.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.currency = "btc"
            this.payload.data.price = `${price.btc}`
            this.payload.data.body = `Hooray! BTC is going up more than 5%!. <current_price>, but the current price is now ${price.btc}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.btc.priceUp, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.btc.priceUp = waitingNotifyUsers.btc.priceUp.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.btc.priceUp, {btc: {bx_price: price.btc}})
        }

        /* If there's users should be know that btc price is going down, then send notification */
        if (tokens.btc.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.currency = "btc"
            this.payload.data.price = `${price.btc}`
            this.payload.data.body = `Boo.. BTC is going down 5% check it out. <current_price>, but the current price is now ${price.btc}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.btc.priceDown, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.btc.priceDown = waitingNotifyUsers.btc.priceDown.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.btc.priceDown, {btc: {bx_price: price.btc}})
        }

        /* If there's users should be know that eth price is going up, then send notification */
        if (tokens.eth.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.currency = "eth"
            this.payload.data.price = `${price.eth}`
            this.payload.data.body = `Hooray! ETH is going up more than 5%!. <current_price>, but the current price is now ${price.eth}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.eth.priceUp, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.eth.priceUp = waitingNotifyUsers.eth.priceUp.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.eth.priceUp, {eth: {bx_price: price.eth}})
        }

        /* If there's users should be know that eth price is going down, then send notification */
        if (tokens.eth.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.currency = "eth"
            this.payload.data.price = `${price.eth}`
            this.payload.data.body = `Boo.. ETH is going down 5% check it out. <current_price>, but the current price is now ${price.eth}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.eth.priceDown, this.payload)
            this.logFCMResponse(response)
            waitingNotifyUsers.eth.priceDown = waitingNotifyUsers.eth.priceDown.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
            await FirestoreService.updateDocument(waitingNotifyUsers.eth.priceDown, {eth: {bx_price: price.eth}})
        }
    }

    async logFCMResponse(response) {
        if (response.failureCount) {
            console.log("Total failed count :", response.failureCount)
            for (let result of response.results) {
                if (result.error)
                    console.log("Error code:", result.error.errorInfo.code);
            }
        }

        if (response.successCount) {
            console.log("Total successfully sent message:", response.successCount);
        }
    }
}

module.exports = new CloudMessagingService()