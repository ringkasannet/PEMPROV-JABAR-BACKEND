<template>
    <div class="outer-container">
        <div class="penjelasan">
            <h1 class="card_title">{{ bumdName }} <br /></h1>
            <vue-markdown v-if="showReadMore" :source="penjelasanAi" />
            <vue-markdown v-if="!showReadMore" :source="penjelasanAiShort" />
            <a v-if="!showReadMore && penjelasanAi" href="#" @click.prevent="toggleReadMore">Read More...</a>
            <a v-if="showReadMore" href="#" style="color: brown" @click.prevent="toggleReadMore">Close Read More</a>
            <div v-if="penjelasanAiShort.length < 1">
                <p class="blinking">processing...</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import VueMarkdown from 'vue-markdown-render';

interface BumdCandidateInterface {
    id: string;
    name: string;
    desc: string;
    perda: string;
    score: number;
}

const props = defineProps<{
    bumdId: string;
    bumdName: string;
    penjelasanAi: string;
    penjelasanAiShort: string;
    score: number;
    query?: string;
}>();

const emit = defineEmits(['gotScore']);

const showReadMore = ref(false);

function toggleReadMore() {
    showReadMore.value = !showReadMore.value;
}

onMounted(() => {
    console.log('mounted, with query:', props.query, 'bumd:', props.bumdName);
})

</script>

<style scoped>
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

.outer-container {
    border: 1px solid #4f8383;
    padding: 20px;
    margin-bottom: 5px;
}
</style>