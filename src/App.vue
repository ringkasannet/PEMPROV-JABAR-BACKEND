<template>
  <div id="outer_container">
    <div id="main_container">
      <HeaderContainer />
      <div id="chat_container">
        <UserInputChat />
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderContainer from './components/HeaderContainer.vue';
import UserInputChat from './components/UserInputChat.vue';
</script>

<style scoped>
#outer_container {
  width: 1000%;
  max-width: 1000px;
  display: flex;
  justify-content: center;
  position: relative;
}

#main_container {
  width: 100%;
}

#chat_container {
  margin-top: 50px;
}

#answer_container {
  background: red;
  width: 1000px;
}
</style>