<template>
    <div class="main_container">
      <div class="flex_row padding20 flex_end max_width centered_div top_banner">
        <div>
          <h1 class="main_tittle">Matching <span class="green_color">BUMD </span></h1>
          <h2 class="main_tittle text_right">Pemetaan kesesuaian penugasan BUMD</h2>
        </div>
        <Transition name="rotate" appear>
          <img class="card_image" src="../assets/infographic.png" alt="" />
        </Transition>
      </div>
      <Transition name="fade" appear>
        <div class="chat_container">     

            <div class="chat-app">
              
                <div class="admin_container">
                <div class="admin_item" style="display: flex; justify-content: flex-end">
                <div style="padding-top: 5px">Model:</div>
                <v-select v-model="aiModel" style="width: 200px; margin-left:5px" :options="['OpenAi', 'GeminiAi']"></v-select>
              </div>
              <div style="display: flex; justify-content: flex-end">
                <div style="padding-top: 5px;margin-left:5px;">Jumlah Rekomendasi:</div>
                <v-select v-model="jumlahRekomendasi" style="width: 100px;margin-left:5px;" :options="[1, 2, 3, 4, 5]"></v-select>
              </div>
            </div>
  
            <form @submit.prevent="processQuerry" class="form-container">
              <button class="button-ask margin_right" type="submit">
                Evaluasi Kesesuaian <br/> Penugasan
              </button>
              <input type="text" v-model="message" placeholder="Kebutuhan penugasan..." />
            </form>
          </div>

            <div v-if="loading" class="loading-container">
             <img class="loading_image" src="../assets/work-in-progress.gif" />
            </div>
  
          <div class="candidate_container" style="display: flex; flex-direction: column; margin-top: 20px">
            <TransitionGroup name="list" tag="ul" style="display:block;padding:0 20px">
              <li v-for="(candidate, index) in bumdCandidate" :key="index" style="list-style-type:none;">
                <Transition name="fade" appear>
                  <itemRekomendasiBUMD :bumdId="candidate.bumd.id"
                                       :bumdName="candidate.bumd.name"
                                       :penjelasanAi="candidate.penjelasanAi"
                                       :penjelasanAiShort="candidate.penjelasanAiShort"
                                       :score=candidate.score :query="message" />
                </Transition>
              </li>
            </TransitionGroup>
          </div>

        </div>
      </Transition>

      <div v-if="error" class="error-message">Pertanyaan Harus di Isi</div>
    </div>
</template>
  
<script setup lang="ts">
  import { reactive, ref } from "vue";
  import vSelect from "vue-select";
  import "vue-select/dist/vue-select.css";
  import itemRekomendasiBUMD from "../components/ItemRekomendasiBUMD.vue";
  
  function urutkanBumd() {
    console.log('urutkanBumd, sebelum diurutkan:')
    bumdCandidate.forEach(bumd=>{
      console.log("1",bumd.bumd.name,bumd.score)
    })
    console.log('urutkanBumd, setelah diurutkan:')
    bumdCandidate.sort((a, b) => b.score - a.score);
    bumdCandidate.forEach(bumd=>{
      console.log("1",bumd.bumd.name,bumd.score)
    })
  }
  
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
    private scoreSent=false;
  
    constructor(bumd: bumdInterface, query: string) {
      this.bumd = bumd;
      this.query = query;
    }
  
    rubahNama() {
      this.bumd.name = "BUMD nama dirubah";
    }
  
    abortFetch() {
      console.log("Aborting fetch for", this.bumd.name);
      this.controller.abort();
    }
  
    getScore():number {
      if (this.scoreSent) return NaN
      const regexScore = /(\d+)%/;
      const cobaExtractScore = this.penjelasanAiShort.match(regexScore);
      let scoreExtracted;
      if (cobaExtractScore) {
        console.log("Get scoreExtracted:", cobaExtractScore[1], "id:", this.bumd.name, "to number:",Number(cobaExtractScore[1]));
        console.log(this.penjelasanAiShort);
        this.score=Number(cobaExtractScore[1])
        this.scoreSent=true;
        return Number(cobaExtractScore[1]);
      } else {
        return NaN;
      }
    }
    addPenjelasanAi(text: string) {
      this.penjelasanAi += text;
      let score=this.getScore();
      if (score){
        console.log("Get scoreExtracted:", score);
  
        this.score = score;
        urutkanBumd();
      }
    }
  
    addPenjelasanAiShort(text: string) {
      this.penjelasanAiShort += text;
    }
  
    async evaluasiBUMD() {
      console.log("about to evaluate bumd:", this.bumd.id, this.query);
      try {
        const url = `https://ringkasan.net/evaluasiBUMD/${this.bumd.id}/${this.query}/${aiModel.value}`;
        console.log("fetching data from:", url);
        let buffer = "";
        const evaluationQuery = fetch(url, { signal: this.signal })
          .then((response) => {
            console.log("response:", response);
            loading.value = false;
            if (!response.body) {
              console.error("No response body");
              this.penjelasanAi = "No response body";
              this.penjelasanAiShort = "No response body";
            } else {
              const reader = response.body.getReader();
              const decoder = new TextDecoder(); // Assuming text data
  
              const readChunk = async () => {
                const { value, done } = await reader.read();
                if (done) {
                  return;
                }
                const chunkString = decoder.decode(value);
                buffer += chunkString;
                this.addPenjelasanAi(chunkString);
                if (this.penjelasanAiShort.length < 700) {
                  this.addPenjelasanAiShort(chunkString);
                } else {
                  this.showReadMore = true;
                }  
                readChunk();
              };
              readChunk();
            }
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
      } catch (err) {
        console.log("error:", err);
        loading.value = false;
        throw new Error(JSON.stringify(err));
      }
    }
  }
  
  const message = ref("");
  const error = ref("");
  const loading = ref(false);
  const aiModel = ref("GeminiAi");
  const bumdCandidate = reactive<Bumd[]>([]);
  const jumlahRekomendasi = ref(3);
  
  async function processQuerry() {
    loading.value = true;
    if (!message.value) {
      console.log("query is empty, returning:");
    }
    console.log("query: ", message.value, "aiModel:", aiModel.value);
    try {
      if (bumdCandidate.length > 0) {
        bumdCandidate.map((item) => {
          item.abortFetch();
        });
        bumdCandidate.splice(0, bumdCandidate.length);
      }
      const res = await getBUMDCandidate();
      res.map((bumd: bumdInterface) => {
        bumdCandidate.push(new Bumd(bumd, message.value));
      });
      bumdCandidate.map((item) => {
        item.evaluasiBUMD();
      });
    } catch (err) {
      console.log("error:", err);
      error.value = JSON.stringify(err);
      loading.value = false;
    }
    loading.value = false;
  }
  async function getBUMDCandidate(): Promise<bumdInterface[]> {
    console.log("in getBUMDCandidate");
    error.value = "";
  
    if (!jumlahRekomendasi.value) {
      jumlahRekomendasi.value = 3;
    }  
    const url = "https://ringkasan.net/getBUMDCandidate/" + message.value + "/" + Number(jumlahRekomendasi.value);
    try {
      console.log("fetching url:", url);
      const query = await fetch(url);
      console.log("query:", query);
      if (query.status != 200) {
        error.value = `Error:  ${query.status}`;
        loading.value = false;
        throw new Error(String(query.status));
      }
  
      const candidate = await query.json();
  
      if (!candidate?.bumdCandidate) {
        console.log("Error no answer is given");
        throw new Error("Error no answer is given");
      }
  
      loading.value = false;
      return candidate.bumdCandidate.map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          desc: item.desc,
          perda: item.perda,
          score: 0,
        };
      });
    } catch (err) {
      console.log("error:", err);
      error.value = JSON.stringify(err);
      console.log(error.value);
      loading.value = false;
  
      throw new Error(JSON.stringify(err));
    }
  }
</script>
  
  <style scoped>
  .main_container{
    background-image: url("../assets/19449741.jpg");
    background-repeat: repeat-x;
    background-size: cover;
    background-position: top;
    min-height: 100vh;
    width: 100vw;
  }
  .chat-app {
    width: 100%;
    margin: 0 auto;
    position: relative;
  }
  
  .form-container {
    display: flex;
    align-items: center;
    position: relative;
    margin: 0 20px;
  }
  
  input[type="text"],
  button {
    height: 50px;
    padding: 10px;
    margin-top: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
  }
  
  input[type="text"] {
    flex: 1;
  }
  
  .button-ask {
    background-color: #4f8383;
    color: #fff;
    border: none;
    padding: 0 20px;
    border-radius: 5px;
    cursor: pointer;
    width: auto;
  }
  
  .button-ask:hover {
    background-color: #396060;
  }
  
  .error-message {
    margin-top: 10px;
    text-align: center;
    font-size: larger;
    color: red;
    width: auto;
  }
  
  .submitted-message {
    position: absolute;
    bottom: -30px;
    left: 0;
    width: 100%;
    text-align: center;
    color: #007bff;
  }
  
  #answer {
    margin-top: 50px;
  }
  
  .answer-font {
    font-size: 20px;
    font-weight: normal;
    margin-bottom: 25px;
    border: 1px solid white;
    border-radius: 15px;
    /* padding: 20px; */
  }
  
  .penjelasan {
    font-size: 18px;
    margin-top: 10px;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 15px;
  }
  
  .rotate-enter-active,
  .rotate-leave-active {
    transition: transform 2s ease-in-out;
  }
  
  .rotate-enter-from,
  .rotate-leave-to {
    transform: rotate(0deg);
  }
  
  .rotate-enter-to,
  .rotate-leave-from {
    transform: rotate(360deg);
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 2s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  h1.main_tittle {
    font-family: Helvetica;
    font-weight: lighter;
    font-size: 4em;
    margin: 0;
    padding: 0;
    text-align: right;
  }
  h2.main_tittle {
    font-family: Helvetica;
    font-weight: normal;
    font-size: 2em;
    margin: 0;
    padding: 0;
  }
  
  h1.card_title {
    color: rgb(0, 0, 79);
  }
  .flex_column {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .flex_row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .flex_end {
    display: flex;
    justify-content: flex-end;
  }
  .card_image {
    width: 150px;
    margin-left: 40px;
  }
  .padding20 {
    padding: 40px;
  }
  .text_right {
    text-align: right;
  }
  .chat_container {
    margin: 50px;
    max-width: 860px;
    margin: 0 auto;
  }
  .max_width {
    max-width: 860px;
  }
  .centered_div {
    margin: 0 auto;
  }
  .top_banner {
    justify-content: center;
  }
  .margin_right {
    margin-right: 5px;
  }
  .loader {
    margin-top: 200px;
    margin-left: 450px;
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    margin: 0 auto;
    width: 100px;
  }
  .loading_image {
    margin-top: 50px;
    width: 200px;
  }
  
  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  
  p.blinking {
    animation: blink 1s infinite;
    color: #4f8383;
  }
  .admin_container {
    display: flex;
    flex-direction: row;
    justify-content: end;
    margin-right: 20px;
  }

  .list-enter-active,
  .list-leave-active,
  .list-move{
    transition: all 0.5s ease;
  }
  
  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  .list-leave-active {
    position: absolute;
  }
  
  @media (max-width: 600px) {
    h1.main_tittle {
      font-family: Helvetica;
      font-weight: lighter;
      font-size: 2em;
      margin: 0;
      padding: 0;
      text-align: right;
    }
    h2.main_tittle {
      font-family: Helvetica;
      font-weight: normal;
      font-size: 1em;
      margin: 0;
      padding: 0;
    }
  
    h1.card_title {
      color: rgb(0, 0, 79);
    }
    .card_image {
      width: 100px;
      margin-left: 40px;
    }
    .admin_container {
      display: flex;
      flex-direction: column;
    }
    .admin_item {
      margin-bottom: 5px;
    }
  }
  </style>