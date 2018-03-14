<template>

    <div class="input-field">
        <select class="input-select" :id="uniqueID" ref="input" v-bind:value="value" v-on:input="updateValue($event.target.value)"
            :name="name" v-validate="validationRules || {required: false}">
            <option :value="null" style="display: none;"></option>
            <option v-for="option in options" :key="option.value" :selected="value === option.value">{{option.value}}</option>
        </select>
        <label :for="uniqueID">{{label}}</label>
        <span v-show="errors.has(name)" class="help is-danger" v-if="name">{{ errors.first(name) }}</span>
    </div>

</template>

<script>
    export default {
        name: 'input-n-5-select',
        inject: ['$validator'],
        props: ['name', 'label', 'value', 'options', 'validationRules'],
        mounted() {
        },
        data() {
            return {}
        },
        methods: {
            updateValue: function (value) {
                this.$emit('input', value)
            }
        },
        computed: {
            uniqueID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        },
    }
</script>
