<template>
  <div id="main_container">
    <div id="tittle_container" class="fadeIn">
      <div id="tittle">
        <h1 class="tittle">Pemanfaatan<span style="color: green;">Aset</span></h1>
        <h2 class="tittle">Peraturan dan Kebijakan Pemanfaatan Aset</h2>
      </div>
      <div id="tittle_logo">
        <img class="logo_img" src="../assets/sun.png" alt="Logo">
      </div>
    </div>
    <div id="ai_container" class="fadeIn">
      <div id="option_container">
        <div id="ai_model">
          Model: <v-select v-model="modelAI" :options="['GeminiAi', 'OpenAi']"></v-select>
        </div>
        <div id="jumlah_rekomendasi">
          Jumlah Rekomendasi: <v-select v-model="numDoc" :options="[3, 5, 7, 10]"></v-select>
        </div>
      </div>
      <div id="chat_app">
        <form @submit.prevent="getAnswer" id="form_container">
          <button id="send_button">
            Evaluasi Peraturan & <br> Pemanfaatan
          </button>
          <input id="input_message" type="text" v-model="query" placeholder="Peraturan dan pemanfaatan...">
        </form>
      </div>
    </div>
    <div v-if="loading">
      <img id="loading_container" src="../assets/work-in-progress.gif" alt="Loading...">
    </div>
    <div id="candidate_container">
      <TransitionGroup name="list" tag="ul" class="no-bullets">
        <div v-if="data.length !== 0">
          <li v-for="(item, index) in sortedData" :key="index" class="candidate-item">
            <ItemEvaluasiAset
              :asetName="item.asetName"
              :penjelasanAi="item.penjelasan"
              :penjelasanAiShort="item.penjelasanShort"
              :score="item.score"
            />
          </li>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import ItemEvaluasiAset from "../components/ItemEvaluasiAset.vue";

interface AsetData {
  id: string;
  asetName: string;
  penjelasan: string;
  penjelasanShort: string;
  score: number;
}

const numDoc = ref(5);
const query = ref('');
const data = ref<AsetData[]>([]);
const modelAI = ref('GeminiAI');
const loading = ref(false);

async function submitQuery() {
  console.log(`query: ${query.value}`);
  
  const url = `http://localhost:3000/asetQA/${query.value}/${modelAI.value}/${numDoc.value}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    if (!response.body) {
      throw new Error('Response body is null');
    }
    const reader = response.body.getReader();
    const readChunk = async () => {
      const { value, done } = await reader.read();
      if (done) {
        console.log('streaming done');
        return;
      }

      const chunkString = new TextDecoder().decode(value);
      const modifiedChunk = chunkString.replace(/}{/g, "},{");
      const validChunk = '[' + modifiedChunk + ']';
      const jsonChunk = JSON.parse(validChunk);

      jsonChunk.forEach((item: AsetData) => {
        const existingDoc = data.value.find(doc => doc.id === item.id);
        if (existingDoc) {
          existingDoc.penjelasan += item.penjelasan;
          existingDoc.penjelasanShort = createShortDescription(existingDoc.penjelasan);
          existingDoc.score = getScore(existingDoc.penjelasanShort);
        }
      });
      readChunk();
    };
    readChunk();
  } catch (error) {
    console.log("Error pas submitQuery:", error);
  }
}

async function getAnswer() {
  data.value = [];
  loading.value = true;
  if (query.value === '') {
    console.log('Query tidak boleh kosong');
    loading.value = false;
    return;
  }
  await getDocCandidate();
  loading.value = false;
  await submitQuery();
}

async function getDocCandidate() {
  const url = `http://localhost:3000/getAsetCandidate/${query.value}/${numDoc.value}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const arrayDoc = await res.json();
    arrayDoc.candidates.forEach((candidate: any) => {
      data.value.push({
        id: candidate.id,
        asetName: candidate.name,
        penjelasan: '',
        penjelasanShort: '',
        score: 0,
      });
    });
  } catch (error) {
    console.log("Error pas getDocCandidate:", error);
    loading.value = false;
  }
}

function createShortDescription(description: string): string {
  return description.length > 500 ? description.substring(0, 500) + '...' : description;
}

function getScore(description: string): number {
  const regexScore = /(\d+)%/;
  const match = description.match(regexScore);
  return match ? parseInt(match[1]) : 0;
}

const sortedData = computed(() => {
  // console.log('sebelum diurutkan:', data.value);
  const sorted = [...data.value].sort((a, b) => b.score - a.score);
  // console.log('sesudah diurutkan:', sorted);
  return sorted;
});
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
  align-items: center;
}

#tittle_container {
  display: flex;
  flex-direction: row;
  margin-top: 30px;
}
h1.tittle {
  font-family: Helvetica;
  font-weight: lighter;
  font-size: 4em;
  margin: 0;
  padding: 0;
  text-align: end;
}
h2.tittle {
  font-family: Helvetica;
  font-weight: lighter;
  font-size: 2em;
  margin: 0;
  padding: 0;
}

.logo_img {
  margin-top: 15px;
  width: 130px;
  margin-left: 40px;
  animation: rotate 1s linear;
}

#ai_container {
  margin-top: 30px;
  width: 1000px;
  display: flex;
  flex-direction: column;
}

#option_container {
  display: flex;
  flex-direction: row;
  justify-content: end;
}

#chat_app {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 1000px;
  height: 75px;
}

#form_container {
  display: flex;
}

#send_button {
  background-color: #4f8383;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 172.5px;
  height: 55px;
  margin: 2.5px;
}

#send_button:hover {
  background-color: #396060;
}

#input_message {
  width: 822.5px;
  height: 55px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  margin: 2.5px;
  padding-left: 10px;
}

#loading_container {
  width: 200px;
  margin-top: 50px;
}

#candidate_container {
  margin-top: 10px;
  width: 1000px;
  justify-content: center;
  display: block;
}

.no-bullets {
  list-style-type: none;
  padding-left: 0;
}

.candidate-item {
  margin-bottom: 10px;
}

.fadeIn {
  animation: fadeIn 1s ease-in-out;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
}
</style>