export default {
    methods: {
        scrollToInvalid() {
            let id = this.$validator.errors.items[0].id;
            let field = this.$validator.fields.find({id});
            let offset = $(field.el).offset();

            //scroll up to top of page
            $(window).scrollTop(Math.max(offset.top - 30, 0));

            this.$toasted.show('You have invalid fields.<br>Please fix all the errors', {
                duration: 10000,
                type: 'error',
                singleton: true,
            });
        }
    }
}