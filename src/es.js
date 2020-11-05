function initStore(config = {
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    dbName: 'card_eventstore_payu',
    eventsCollectionName: 'events',
    snapshotsCollectionName: 'snapshots',
    transactionsCollectionName: 'transactions',
    timeout: 10000,
    options: {
        useNewUrlParser: true
    }
}) {
    const es = require('eventstore')(config);

    es.close = function() {
        return es.store.disconnect();
    };

    return new Promise(function(resolve, reject) {
        es.init(function (err) {
            if(err) reject(err);
            resolve(es);
        });
    });
}

module.exports = initStore;