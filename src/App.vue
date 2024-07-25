<template>
  <div id="outer_container">
    <div id="main_container">
      <header id="header">
        <HeaderContainer />
      </header>
      <body>
        <RouterView />    
      </body>
      <footer>
        <!-- <h1>FOOTER</h1> -->
      </footer>
    </div>
  </div>
</template>

<script setup>

import HeaderContainer from './components/HeaderContainer.vue'

</script>

<style scoped>
body,html {
  margin: 0;
  padding: 0;
}

#outer_container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: relative;
}

#header {
  width: 100%;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
