<template>
    <div class="floating-window">
        <p>This is pretty {{ fire }}</p>
    </div>
</template>

<script>

module.exports = {
    data: function() {
        return {
            fire: "AAAAAAAAAAAAAAAAA",
        }
    },
    methods: {
        helloworld() {
            return "WEEEEEEEEEEEEEEE";
        }
    },
    components: {}
}

</script>

<style>
    div {
        width: 50%;
        height: 50%;
        border: 2px solid black;
    }
</style>