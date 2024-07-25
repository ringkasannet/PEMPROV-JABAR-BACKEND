<template>
  <div id="main_container">
    <div id="header_tittle" class="fadeIn">
      <h1 class="tittle">Smart <span style="color: green;"> Assistant </span></h1>
      <h2 class="tittle">Pemerintah Provinsi Jawa Barat</h2>
    </div>
    <div id="card_container" class="fadeIn">
        <div class="card_tools" @click="navigateToBUMD">
          <h2 class="card_tittle">Matching Penugasan BUMD</h2>
          <img src ="../assets/infographic.gif" alt="" class="logo_card">
          <p>Sistem pintar yang dapat membantu memetakan potensi penugasan BUMD sesuai dengan Tujuan dan Ruang Lingkup Pendirian</p>
        </div>
        <div class="card_tools" @click="navigateToAset" >
          <h2 class="card_tittle">Chatbot Pemanfaatan Aset</h2>
          <img src ="../assets/connection.gif" alt="" class="logo_card">
          <p>Asisten pintar yang dapat membantu menjawab pertanyaan terkait peraturan dan kebijakan terkait pemanfaatan aset</p>
        </div>
        <div class="card_tools">
          <h2 class="card_tittle">Smart Asisten Dokumen Hukum</h2>
          <img src ="../assets/sun.gif" alt="" class="logo_card">
          <p>Sistem pintar yang dapat membantu menjawab pertanyaan dan memahami terkait dokumen hukum di lingkungan Pemerintah Provinsi Jawa Barat</p>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function navigateToBUMD() {
  router.push('/bumd')
}
function navigateToAset() {
  router.push('/aset')
}

</script>

<style scoped>

#main_container {
  width: 100vw;
  min-height: 100vh;
  background-image: url("../assets/19449741.jpg");
  background-size: cover;
  background-repeat: repeat-x;
  display: flex;
  flex-direction: column;
}

#header_tittle {
 margin: 20px;
}

.tittle {
  display: flex;
  justify-content: end;
}
h1.tittle {
  font-family: Helvetica;
  font-weight: lighter;
  font-size: 5em;
  margin: 0;
  padding: 0;
}
h2.tittle {
  font-family: Helvetica;
  font-weight: lighter;
  font-size: 3em;
  margin: 0;
  padding: 0;
}

#card_container {
  margin-top: 50px;
  display: flex;
  justify-content: space-around;
}

.card_tittle {
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
}

.card_tools {
  width: 300px;
  margin: 0 20px;
  border: 1px solid rgba(26, 192, 170, 0.5);
  border-radius: 10px;
  box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  transition: transform 0.1s;
}
.card_tools:hover {
  transform: scale(1.05);
}

.logo_card {
  width: 200px;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 10px;
  margin: 10px auto;
}

@media (max-width: 720px) {
  .main_container {
    width: 100vw;
    min-height: 100vh;
    background-image: url("../assets/19449741.jpg");
    background-size: cover;
    background-repeat: repeat-x;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #header_title{
    padding-top:10px;
  }
  h1.tittle {
    font-family: Helvetica;
    font-weight: lighter;
    font-size: 3em;
    margin: 0;
    padding: 0;
  }
  h2.tittle {
    font-family: Helvetica;
    font-weight: normal;
    font-size: 2em;
    margin: 0;
    padding: 0;
  }

  #card_container {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .card_tools {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    width: 70%;
    margin: 20px auto;
  }
}

.fadeIn {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>