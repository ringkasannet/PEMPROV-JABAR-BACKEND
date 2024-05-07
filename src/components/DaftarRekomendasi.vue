<template>
  <div id="main_container" class="horizontal_container">
    <div id="button_container">
      <button v-for="(item, index) in items" :key="index" @click="toggleDesc(index)">
        {{ item.name }}
      </button>
    </div>
    <div id="desc_container">
      <vue-markdown v-if="showDescIndex !== null" :source="items[showDescIndex].desc" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import VueMarkdown from 'vue-markdown-render';

const items = ref([]);
const showDescIndex = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('https://high-ace-421114.et.r.appspot.com/getAllBUMD');
    items.value = await response.json();
    console.log('Berhasil:', items.value);
  }
  catch (error) {
    console.error('Gagal:', error);
  }
});

const toggleDesc = (index) => {
  if (showDescIndex.value === index) {
    showDescIndex.value = null;
  } else {
    showDescIndex.value = index;
  }
};
</script>

<style scoped>
#main_container {
  background-color: #313131;
  padding: 20px;
  margin: 20px 0;
}

.horizontal_container {
  display: flex;
  flex-direction: row;
}

#button_container {
  /* background: red; */
  margin-right: 20px;
}

#button_container button {
  display: block;
  /* margin: 10px; */
  height: auto;
  width: 500px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box ;
  background-color: #313131;
  color: #fff;
  border: none;
  cursor: pointer;
}

#button_container button:hover {
  background-color: #707070;
}

#desc_container {
  width: 100%;
}
</style>

<!-- <template>
  <div id="main_container">
    <div v-for="(item, index) in items" :key="index">
      <ItemBUMD :nama="item.name" :desc="item.desc" :logo="item.logo"/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ItemBUMD from './ItemBUMD.vue';

const items = ref([]);

onMounted(async () => {
  try {
    const response = await fetch('https://high-ace-421114.et.r.appspot.com/getAllBUMD');
    const data = await response.json();
    items.value = data;
    console.log('Berhasil:', data);
  } catch (error) {
    console.error('Gagal:', error);
  }
});
</script>

<style scoped>
#main_container {
  background-color: #313131;
  padding: 20px;
  margin: 20px 0;
}
</style> -->