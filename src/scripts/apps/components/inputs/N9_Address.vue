<template>

    <div class="input-field">
        <gmap-autocomplete class="input-text" :id="uniqueID" :componentRestrictions="{country: 'AU'}" :value="value" :name="name"
            v-validate="{required:true}" :disabled="disabled" @place_changed="updateAddress" ref="address" @input.native="updateAddress" />

        <label :for="uniqueID">{{label}}</label>
        <span v-show="errors.has(name)" class="help is-danger">{{ errors.first(name) }}</span>
    </div>

</template>

<script>
    export default {
        name: 'input-n-1-text',
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
                type: Boolean,
                default: false
            },
            validationRules: {
                type: Object,
                default() {
                    return {
                        required: false
                    }
                }
            }
        },
        mounted() {
        },
        data() {
            return {}
        },
        methods: {
            updateAddress: function () {
                this.$emit('input', this.$refs.address.$refs.input.value)
            }
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
