# AYS APP


### use composer and phpdotenv to manage environment variables

1) cd to project root

2) install all php dependencies with  `composer install`

3) create file `.env`, fill in relevant environment variables.

4) start server


### use capistrano to deploy

1) cd to project root

2) install all ruby dependencies with `bundle install`

3) configure `config/deploy.rb` with the proper git repo and application name

4) configure each environment by modifying the corresponding file under `config/deploy/`

5) to deploy, make sure all changes are pushed to the corresponding remote branch, then run `bundle exec cap [environment] deploy`
