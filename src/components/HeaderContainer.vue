<template>
    <div id="header_container" class="horizontal_container">
      <div id="logo_container"> 
        <img src="/Logo Pemprov Jabar.png" alt="Logo"
         style=
          "max-width: 50px;
           margin: 5px;">
      </div>
      <div id="tittle_logo" class="horizontal_container">
        Pemerintah <br> Provinsi Jawa Barat
      </div>
      <div id="title_container" class="centered_text">
        <h2 class="main_tittle">Pemetaan Fungsi BUMD Pemprov Jawa Barat</h2>
      </div>
    </div>
  </template>
  
<script setup>
</script>
  
<style scoped>
.main_tittle {
    font-family: Helvetica;
    font-weight: lighter;
    margin: 15px;
}
  
.horizontal_container {
    display: flex;
    flex-direction: row;
}

.centered_text {
    margin: 0 auto;
}
  
#tittle_logo {
    margin: 10px;
}

</style>
  