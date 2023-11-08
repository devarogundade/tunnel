import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import BridgeView from '../views/BridgeView.vue'
import BorrowView from '../views/BorrowView.vue'
import SupplyView from '../views/SupplyView.vue'
import SnipeView from '../views/SnipeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/bridge',
      name: 'bridge',
      component: BridgeView
    },
    {
      path: '/borrow',
      name: 'borrow',
      component: BorrowView
    },
    {
      path: '/supply',
      name: 'supply',
      component: SupplyView
    },
    {
      path: '/snipe',
      name: 'snipe',
      component: SnipeView
    }
  ]
})

export default router
