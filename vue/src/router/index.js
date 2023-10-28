import { createRouter, createWebHistory } from 'vue-router'

// import BridgeView from '../views/BridgeView.vue'
import BorrowView from '../views/BorrowView.vue'
import SupplyView from '../views/SupplyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'bridge',
    //   component: BridgeView
    // },
    {
      path: '/borrow',
      name: 'borrow',
      component: BorrowView
    },
    {
      path: '/supply',
      name: 'supply',
      component: SupplyView
    }
  ]
})

export default router
