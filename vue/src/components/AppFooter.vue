
<template>
    <section>
        <div class="app_width">
            <footer>
                <div class="status">
                    <SemanticYellow v-if="status == 'loading'" />
                    <SemanticGreen v-else-if="status == 'good'" />
                    <SemanticRed v-else />
                    <p>Relayer Status</p>
                </div>
                <a href="http://github.com/devarogundade/tunnel" target="_blank" rel="noopener noreferrer">
                    GitHub
                    <ArrowRightIcon style="rotate: -45deg;" />
                </a>
            </footer>
        </div>
    </section>
</template>

<script setup>
import SemanticRed from './icons/SemanticRed.vue';
import SemanticGreen from './icons/SemanticGreen.vue';
import SemanticYellow from './icons/SemanticYellow.vue';
import ArrowRightIcon from './icons/ArrowRightIcon.vue';
</script>

<script>
export default {
    data() {
        return {
            status: 'loading'
        }
    },
    async mounted() {
        try {
            const response = await fetch('http://127.0.0.1:5050/', {
                method: "GET",
            })

            const data = await response.json();

            this.status = data.status
        } catch (error) {
            this.status = 'bad'
        }
    }
}
</script>

<style scoped>
section {
    border-top: 2px var(--bg-lighter) solid;
    margin-top: 80px;
}

.status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status p {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-normal);
}

footer {
    padding: 30px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

footer a {
    color: var(--text-normal);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    text-align: center;
    font-weight: 500;
    gap: 8px;
}
</style>