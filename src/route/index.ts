import { createWebHistory, createRouter } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import BumdView from '../views/BumdView.vue';
import AsetView from '../views/AsetView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/bumd',
      name: 'bumd',
      component: BumdView,
    },
    {
      path: '/aset',
      name: 'aset',
      component: AsetView,
    },
  ],
});

export default router;
