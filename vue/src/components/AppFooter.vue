
<template>
    <section>
        <div class="app_width">
            <footer>
                <a href="http://github.com/devarogundade/tunnel" target="_blank" rel="noopener noreferrer">
                    GitHub
                    <ArrowRightIcon style="rotate: -45deg;" />
                </a>
            </footer>
        </div>
    </section>
</template>

<script setup>
import ArrowRightIcon from './icons/ArrowRightIcon.vue';
</script>

<style scoped>
section {
    border-top: 2px var(--bg-lighter) solid;
}

footer {
    padding: 30px 0;
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