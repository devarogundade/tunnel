import './assets/main.css'

import { createApp } from 'vue'
import { createStore } from 'vuex'

import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import router from './router'
import utils from './plugins/utils'

const store = createStore({
    state() {
        return {
            wallet0: null,
            wallet1: null,
            prices: {
                "WShares": 1
            },
            state: {
                borrow_apr: 120,
                collateral: 468701001,
                ltv: 800000,
                min_supply: 1000000,
                rate_divider: 1000000,
                supply_apr: 100,
                total_borrow: 0,
                total_supply: 0
            },
            localState: {
                borrowed_amount: 0,
                borrowed_start_at: 0,
                supplied_amount: 0,
                supplied_start_at: 0,
            }
        }
    },
    mutations: {
        setWallet0(state, wallet0) {
            state.wallet0 = wallet0;
        },
        setWallet1(state, wallet1) {
            state.wallet1 = wallet1;
        },
        setState(state, value) {
            state.state = value;
        },
        setLocalState(state, value) {
            state.localState = value;
        }
    }
})

const app = createApp(App)

app.use(router)
app.use(VueAxios, axios)
app.use(utils)
app.use(store)

app.mount('#app')
