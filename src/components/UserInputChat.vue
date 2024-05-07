<template>
  <div>

    <div class="chat-app">
      <form @submit.prevent="sendMessage" class="form-container">
        <button class="button-ask" type="submit">
          Tanyakan Kebutuhan <br />
          Penugasan Disini
        </button>
        <input type="text" v-model="message" placeholder="Tulis disini..." />
      </form>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
    <div id="answer">
      <div class="answer-font" v-for="(result, index) in jawaban" :key="index">
        {{ result?.name }} <br />
        <!-- {{ result._id }} <br /> -->
        Skor: <span>{{ result?.score }}</span>
        <div class="penjelasan">
          <vue-markdown :source="result?.desc"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import VueMarkdown from "vue-markdown-render";

const message = ref("");
const error = ref("");
const submittedMessage = ref("");
const jawaban = ref([]);
const streamingText = ref([]);

// const sendMessage = async () => {
//   if (message.value.trim() !== '') {
//     submittedMessage.value = message.value;
//     message.value = '';
//     error.value = '';
//     console.log('query:', submittedMessage.value);

//     const query = await fetch('http://localhost:3000/askQuestion/' + submittedMessage.value)
//     jawaban.value = await query.json();
//     startStreaming();
//   } else {
//     error.value = 'Input tidak boleh kosong';
//   }
// };

const sendMessage = async () => {
  console.log("in sendMessage");
  jawaban.value={}
  if (message.value != "") {
    message.value;
    console.log("query:", message.value);

    const query = await fetch('http://localhost:3000/askQuestion/' + message.value)
    // const query = await fetch("http://localhost:3000/askDummy/");
    console.log("query:", query);
    const answers = await query.json();
    console.log("answers:", answers);
    // score: answer.penjelasan.match(/\*\* Skor \*\*:(.+?)\*\*/)[1]

    const convertedAnswers = answers.map((answer) => {
      const regexScore = /(\d+)%/;
      const cobaExtractScore = answer.penjelasan.match(regexScore);
      // console.log("scoreExtracted:", cobaExtractScore);
      let scoreExtracted;
      if (cobaExtractScore) {
        scoreExtracted = cobaExtractScore[1];
      } else {
        scoreExtracted = "Not Found";
      }

      const regexPenjelasan = /D\.\s*Penjelasan:\s*(.*)/i;
      const cobaExtractPenjelasan = answer.penjelasan.match(regexPenjelasan);
      console.log("Penjelasan Extracted:", cobaExtractPenjelasan);
      let penjelasanExtracted;
      if (cobaExtractPenjelasan) {
        penjelasanExtracted = cobaExtractPenjelasan[1];
        console.log("Penjelasan Extracted:", cobaExtractPenjelasan[1]);

      } else {
        penjelasanExtracted = "Not Found";
      }
      // const searchStringPenjelasan = "D. Penjelasan: ";
      // console.log('answer.penjelasan:', answer.penjelasan)
      // const indexPenjelasan = answer.penjelasan.indexOf(searchStringPenjelasan);
      // console.log('indexPenjelasan:', indexPenjelasan)
      // let penjelasanText
      // if (indexPenjelasan !== -1) {
      //    penjelasanText = text.substring(index + searchString.length); // Extract from after "D. Penjelasan: "
      // } else {
      //   console.log('"D. Penjelasan: " not found in the text.');
      // }
      const scoreNum=parseInt(scoreExtracted);

      return {
        name: answer.name,
        _id: answer._id,
        score: `${scoreExtracted}%`,
        desc: answer.penjelasan,
        scoreNum: scoreNum?scoreNum:0,
      };
    });
    const sortedAnswers = convertedAnswers.sort((a, b) => b.scoreNum - a.scoreNum);

    jawaban.value = sortedAnswers;
    // startStreaming();
  } else {
    error.value = "Input tidak boleh kosong";
  }
};


// const startStreaming = () => {
//   jawaban.value.forEach((result, index) => {
//     const words = result.penjelasan.split(' ');
//     let currentText = '';
//     words.forEach((word, wordIndex) => {
//       setTimeout(() => {
//         currentText += word + ' ';
//         streamingText.value[index] = currentText;
//       }, wordIndex * 65);
//     });
//   });
// };

const startStreaming = () => {
  jawaban.value.forEach((result, index) => {
    const words = result.penjelasan.split(" ");
    let currentText = "";
    words.forEach((word, wordIndex) => {
      setTimeout(() => {
        currentText += word + " ";
        streamingText.value[index] = currentText
          .replace(/\*\* Skor \*\*:.+?\*\* Penjelasan \*\*:/, "")
          .replace(/\*\*[\w\s]+?\*\*/, "");
      }, wordIndex * 65);
    });
  });
};
</script>

<style scoped>
.chat-app {
  width: 100%;
  margin: 0 auto;
  position: relative;
}

.form-container {
  display: flex;
  align-items: center;
  position: relative;
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
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0 20px;
  border-radius: 5px;
  cursor: pointer;
  width: auto;
}

.button-ask:hover {
  background-color: #0056b3;
}

.error-message {
  margin-top: 20px;
  margin-left: 250px;
  background: red;
  text-align: center;
  font-size: larger;
  color: white;
  position: relative;
  bottom: -20px;
  width: 500px;
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
  padding: 20px;
}

.penjelasan {
  font-size: 18px;
  margin-top: 10px;
  border: 1px solid grey;
  border-radius: 5px;
  padding: 15px;
  background: rgb(39, 39, 46);
}
</style>