<template>
  <div id="main_container">
    <div id="tittle_container" class="fadeIn">
      <div id="tittle">
        <h1 class="tittle">Matching<span style="color: green;">BUMD</span></h1>
        <h2 class="tittle">Pemetaan kesesuaian penugasan BUMD</h2>
      </div>
      <div id="tittle_logo">
        <img class="logo_img" src="../assets/infographic.png" alt="Logo">
      </div>
    </div>
    <div id="ai_container" class="fadeIn">
      <div id="option_container">
        <div id="ai_model">
          Model: <v-select v-model="aiModel" :options="['GeminiAi', 'OpenAi']"></v-select>
        </div>
        <div id="jumlah_rekomendasi">
          Jumlah Rekomendasi: <v-select v-model="jumlahRekomendasi" :options="[1, 2, 3, 4, 5]"></v-select>
        </div>
      </div>
      <div id="chat_app">
        <form @submit.prevent="processQuerry" id="form_container">
          <button id="send_button">
            Evaluasi Kesesuaian <br> Penugasan
          </button>
          <input id="input_message" type="text" v-model="message" placeholder="Kebutuhan Penugasan...">
        </form>
      </div>
    </div>
    <div v-if="loading">
      <img id="loading_container" src="../assets/work-in-progress.gif" alt="Loading...">
    </div>
    <div id="candidate_container">
      <TransitionGroup name="list" tag="ul" class="no-bullets">
        <li v-for="(candidate, index) in bumdCandidate" :key="index" class="candidate-item">
          <Transition name="fade" appear>
            <itemRekomendasiBUMD :bumdId="candidate.bumd.id"
                                 :bumdName="candidate.bumd.name"
                                 :penjelasanAi="candidate.penjelasanAi"
                                 :penjelasanAiShort="candidate.penjelasanAiShort"
                                 :score="candidate.score"
                                 :query="message"/>
          </Transition>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import itemRekomendasiBUMD from "../components/ItemRekomendasiBUMD.vue";

const aiModel = ref('GeminiAi');
const jumlahRekomendasi = ref(3);
const message = ref("");
const loading = ref(false);
const bumdCandidate = reactive<Bumd[]>([]);

interface bumdInterface {
  id: string;
  name: string;
  desc: string;
  perda: string;
  score: number;
}

class Bumd {
  public bumd: bumdInterface;
  public query: string;
  public penjelasanAi: string = "";
  public penjelasanAiShort: string = "";
  public score: number = NaN;
  private controller = new AbortController();
  private signal = this.controller.signal;
  private showReadMore = false;
  private scoreSent = false;

  constructor(bumd: bumdInterface, query: string) {
    this.bumd = bumd;
    this.query = query;
  }

  addPenjelasanAi(text: string) {
    this.penjelasanAi += text;
    const score = this.getScore();
    if (score) {
      this.score = score;
      urutkanBumd();
    }
  }

  addPenjelasanAiShort(text: string) {
    this.penjelasanAiShort += text;
  }

  getScore(): number {
    if (this.scoreSent) return NaN;
    const regexScore = /(\d+)%/;
    const cobaExtractScore = this.penjelasanAiShort.match(regexScore);
    if (cobaExtractScore) {
      this.score = Number(cobaExtractScore[1]);
      this.scoreSent = true;
      return this.score;
    }
    return NaN;
  }

  abortFetch() {
    this.controller.abort();
  }

  async evaluasiBUMD() {
    try {
      const url = `https://ringkasan.net/evaluasiBUMD/${this.bumd.id}/${this.query}/${aiModel.value}`;
      let buffer = "";
      const response = await fetch(url, { signal: this.signal });

      if (!response.body) {
        this.penjelasanAi = "No response body";
        this.penjelasanAiShort = "No response body";
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const readChunk = async () => {
        const { value, done } = await reader.read();
        if (done) return;

        const chunkString = decoder.decode(value);
        buffer += chunkString;

        this.addPenjelasanAi(chunkString);
        if (this.penjelasanAiShort.length < 700) {
          this.addPenjelasanAiShort(chunkString);
        } else {
          this.showReadMore = true;
        }

        await readChunk();
      };

      await readChunk();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
}

async function processQuerry() {
  loading.value = true;
  if (!message.value) {
    console.log("Query is empty, returning:");
    loading.value = false;
    return;
  }
  try {
    if (bumdCandidate.length > 0) {
      bumdCandidate.forEach(item => item.abortFetch());
      bumdCandidate.splice(0, bumdCandidate.length);
    }
    const res = await getBUMDCandidate();
    res.forEach((bumd: bumdInterface) => {
      bumdCandidate.push(new Bumd(bumd, message.value));
    });

    bumdCandidate.forEach(item => item.evaluasiBUMD());
  } catch (err) {
    console.log("Error:", err);
  }
  loading.value = false;
}

async function getBUMDCandidate(): Promise<bumdInterface[]> {
  try {
    const url = `https://ringkasan.net/getBUMDCandidate/${message.value}/${jumlahRekomendasi.value}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.bumdCandidate) {
      throw new Error("No candidates found");
    }
    return data.bumdCandidate.map((item: any) => ({
      id: item.id,
      name: item.name,
      desc: item.desc,
      perda: item.perda,
      score: 0
    }));
  } catch (err) {
    console.error("Error fetching BUMD candidates:", err);
    throw err;
  }
}

function urutkanBumd() {
  console.log('urutkanBumd, sebelum diurutkan:')
  bumdCandidate.forEach(bumd => {
    console.log("1", bumd.bumd.name, bumd.score)
  })
  console.log('urutkanBumd, setelah diurutkan:')
  bumdCandidate.sort((a, b) => b.score - a.score);
  bumdCandidate.forEach(bumd => {
    console.log("1", bumd.bumd.name, bumd.score)
  })
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
