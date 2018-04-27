<template>

    <div class="input-field">
        <input type="range" class="input-range" :id="uniqueID" ref="input" :value="value" :name="name" :min="min" :max="max" :step="step"
            @input="updateValue($event.target.value)" v-validate="validationRules" :disabled="disabled">
        <label :for="uniqueID">{{label}}</label>
        <span v-show="errors.has(name)" class="help is-danger" v-if="name">{{ errors.first(name) }}</span>
    </div>

</template>

<script>
    export default {
        name: 'input-n-10-range',
        inject: ['$validator'],
        props: {
            name: {
                type: String
            },
            label: {
                type: String
            },
            value: {
                type: String
            },
            disabled: {
                type: Boolean
            },
            validationRules: {
                type: Object,
                default () {
                    return {
                        required: false
                    }
                }
            },
            min: {
                type: Number,
                required: true,
            },
            max: {
                type: Number,
                required: true,
            },
            step: {
                type: Number,
                default: 1,
            },
        },
        mounted() {},
        data() {
            return {}
        },
        methods: {
            updateValue: function (value) {
                this.$emit('input', value)
            },

        },
        computed: {
            uniqueID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        },
    }
</script>
