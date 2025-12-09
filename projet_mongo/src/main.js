import Vue from 'vue'
import App from './App'
import router from '.Router'

Vue.config.productionTip = false

new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>'
})