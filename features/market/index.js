class MarketService {
    constructor() {
        this.ENDPOINT_BX = 'https://bx.in.th/api/'
        this.ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/'
        this.BX_KEY_OMG = '26'
        this.BX_KEY_EVX = '28'
        this.BX_KEY_BTC = '1'
        this.BX_KEY_ETH = '21'
        this.CMC_KEY_OMG = 'omisego'
        this.CMC_KEY_EVX = 'everex' // it doesn't has
        this.CMC_KEY_BTC = 'bitcoin'
        this.CMC_KEY_ETH = 'ethereum'
    }

    /* Fetch Bx.in.th price */
    async fetchBx() {
        let response = await fetch(this.ENDPOINT_BX)
        let bx = await response.json()
        return {
            omg: bx[this.BX_KEY_OMG].last_price,
            evx: bx[this.BX_KEY_EVX].last_price,
            btc: bx[this.BX_KEY_BTC].last_price,
            eth: bx[this.BX_KEY_ETH].last_price
        }
    }

    /* Fetch coinmarketcap.com price */
    async fetchCoinmarketCap() {
        let response = await fetch(this.ENDPOINT_COIN_MARKET_CAP)
        let cmc = await response.json()
        let [btc, eth, omg] = await cmc.filter(v => v.id == this.CMC_KEY_OMG || v.id == this.CMC_KEY_BTC || v.id == this.CMC_KEY_ETH).map(v => v.price_usd)
        return {
            btc,
            eth,
            omg
        }
    }
}

module.exports = new MarketService()