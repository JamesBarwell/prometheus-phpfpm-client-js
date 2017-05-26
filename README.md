Expose PHP-FPM metrics to Prometheus
------

This project is no longer supported. Please use [phpfpm_exporter](https://github.com/JamesBarwell/phpfpm_exporter) instead.

## How to use

### PHP-FPM set up

Ensure that your [PHP-FPM is configured to show a status page](https://easyengine.io/tutorials/php/fpm-status-page/).


### Run the exporter

```
node index.js [listen-port] [php-fpm-host]
```
