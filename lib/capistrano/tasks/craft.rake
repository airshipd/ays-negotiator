namespace :craft do
  task :set_permissions do
    on roles(:app) do
      # run scripts located in root of remote project, make sure deploy user has write access to /var/www
      execute "cd #{deploy_to} && chgrp -R web . && chmod -R 774 . && chmod -R g+s . && mkdir craft/app/vendor/mpdf/mpdf/tmp/ttfontdata --mode=0777"
      # p deploy_to
    end
  end
end
