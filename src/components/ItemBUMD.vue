<template>
    <div>
        <div class="header_spanner margin_bawah10">
            <div >
                <img id="logo_BUMD" :src="logo">
            </div>
            <div class="margin_kiri20">
                <h1>{{ nama }}</h1>
            </div>
        </div>
        <div v-if="showDesc">
            <vue-markdown :source="desc" />
        </div>
        <div v-else>
            <vue-markdown :source="descPendek" />
        </div>
        <a href="#" @click="showDesc = !showDesc">{{ showDesc ? 'Show Less' : 'Show More' }}</a>
    </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import VueMarkdown from 'vue-markdown-render'

const props = defineProps({
    nama: String,
    desc: String,
    logo: String
})

const descPendek = ref(props.desc.length > 400 ? props.desc.substring(0, 400) + '...' : props.desc)
const showDesc = ref(false)

</script>

<style scoped>
#logo_BUMD{
    max-width:50px;
}
.header_spanner{
    display: flex;
    flex-direction: row;
}
.margin_kiri20{
    margin-left: 20px;
}
.margin_bawah10{
    margin-bottom: 10px;
}
</style>