<template>
    <div id="header_container">
        <div class="logo_container">
            <img src="/Logo Pemprov Jabar.png" alt="logo" class="logo_image">
            <div class="tittle_logo">
                <h2>
                    <RouterLink to="/"> Pemerintah <br> Provinsi Jawa Barat </RouterLink>
                </h2>
            </div>
        </div>
        <div id="menu_container">
            <div class="menu_item"><RouterLink to="/" class="set_low">Home</RouterLink></div>
            <div class="menu_item"><RouterLink class="set_low">Admin</RouterLink></div>
            <div class="menu_item"><RouterLink class="set_low">Document</RouterLink></div>
            <div class="menu_item"><RouterLink class="set_low">Source Code</RouterLink></div>
            <div class="menu_item">
                <RouterLink class="set_low">
                    Login
                    <img class="login-icon" src="../assets/user.png" alt="user_icon">
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
</script>

<style>
#header_container {
    display: flex;
    width: 100vw;
    padding: 10px 30px 0px 30px;
    flex-wrap: wrap;
}

.logo_container {
    display: flex;
    flex-direction: row;
}

.logo_image {
    width: 50px;
    height: 50px;
    margin: 10px;
}

.tittle_logo {

}

h2 {
  font-weight: bolder;
  font-family: Arial, Helvetica, sans-serif;
}

#menu_container {
    flex: 20;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.menu_item {
    display: flex;
    flex-direction: column;
    padding-bottom: 10px;
    margin: 0 25px;
    font-weight: bolder;
    font-size: 20px;
    font-family: Arial, Helvetica, sans-serif;
}

.set_low {
    margin-top: auto;
}

.login-icon {
    width: 15px;
    height: 15px;
    margin-top: 15px;
}
</style>