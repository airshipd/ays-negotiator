<template>

    <div class="input-group">
        <label>{{label}}</label>

        <div class="group-wrapper row">
            <div class="group-divider col" v-for="(item, index) in options" :key="item.value">
                <input type="radio" ref="input" v-bind:value="item.value" v-on:click="updateValue($event.target.value)" :name="name" :id="index+'-label-'+name"
                    :checked="getChecked(item)" v-validate="validationRules || {required: false}">
                <label :for="index+'-label-'+name">{{item.label}}</label>
            </div>
        </div>

        <span v-show="errors.has(name)" class="help is-danger" v-if="name">{{ errors.first(name) }}</span>
    </div>

</template>

<script>
    export default {
        name: 'input-n-2-ChoiceGroup',
        inject: ['$validator'],
        props: ['label', 'options', 'value', 'name', 'validationRules'],
        mounted() {

        },
        data() {
            return {}
        },
        methods: {
            updateValue: function (value) {
                this.$emit('input', value)
            },
            uniqueID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            getChecked(item) {
                return item.default == 1 && !this.value || this.value === item.value;
            }
        },
        computed: {},
    }
</script>
