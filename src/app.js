'use strict'
const Prometheus = require('prometheus-client-js')
const debug = {
    metric: require('debug')('phpfpm:metric'),
    http: require('debug')('phpfpm:http')
}
const Request = require('request')

module.exports = class phpfpm {
    constructor() {
        this.metrics = {}
    }

    start(port) {
        this.listen(port)
        this.poll()
    }

    listen(port) {
        this.client = new Prometheus({ port: port })
        debug.metric('http server listening on %s', port)
        this.client.createServer(true)
    }

    poll() {
        this.requestFpmStatus((err, data) => {
            if (err) {
                setTimeout(this.poll.bind(this), 1000)
                return
            }

            let metrics = [
                {
                    help: 'The number of request accepted by the pool;',
                    namespace: 'phpfpm',
                    name: 'accepted conn'
                },
                {
                    help: 'The number of request in the queue of pending connections',
                    namespace: 'phpfpm',
                    name: 'listen queue',
                    value: data['listen queue']
                },
                {
                    help: 'the maximum number of requests in the queue of pending connections since FPM has started',
                    namespace: 'phpfpm',
                    name: 'max listen queue',
                    value: data['max listen queue']
                },
                {
                    help: 'The number of idle processes;',
                    namespace: 'phpfpm',
                    name: 'idle processes',
                    value: data['idle processes']
                },
                {
                    help: 'The number of active processes;',
                    namespace: 'phpfpm',
                    name: 'active processes',
                    value: data['active processes']
                },
                {
                    help: 'Number of times, the process limit has been reached, when pm tries to start more children',
                    namespace: 'phpfpm',
                    name: 'max children reached',
                    value: data['max children reached']
                }
            ]

            metrics.forEach(metric => {
                if (undefined === data[metric.name]) {
                    return
                }

                let safeMetricName = metric.name.replace(/\s/g, '_');
                debug.metric('update metric gauge %s', safeMetricName)

                this.upsertMetric('gauge', {
                    help: metric.help,
                    namespace: metric.namespace,
                    name: safeMetricName
                })
                this.metrics[safeMetricName].set({}, data[metric.name])
            })

            setTimeout(this.poll.bind(this), 1000)
        })
    }

    upsertMetric(type, data) {
        if (this.metrics[data.name]) {
            return
        }

        debug.metric('create metric %s %s', type, data.name)
        this.metrics[data.name] = this.client.createGauge(data)
    }

    requestFpmStatus(callback) {
        Request({
            uri: 'http://localhost/status?json',
        }, function(err, response, body) {
            if (err) {
                debug.http('got error response: %s', err.toString())
                return callback(err)
            }

            debug.http('got response for %s with code %s', response.statusCode)

            var data;
            try {
                data = JSON.parse(body)
            } catch(e) {
                debug.http('Failed to JSON decode response body')
                var error = new Error('json decode')
                error.response = response
                error.body = body
                return callback(error)
            }

            return callback(null, data)
        })
    }
}
