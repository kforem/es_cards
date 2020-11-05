module.exports = function mongoRepository(recreateFrom, es) {
    return {
        async save(card) {
            return new Promise(function (resolve, reject) {
                es.getEventStream(card.uuid(), function (err, stream) {
                    // in future we can build new business scenarios from those events
                    stream.addEvents(card.pendingEvents());

                    stream.commit(function (err, stream) {
                        if (err) {
                            reject(err);
                        } else {
                            card.flushEvents();
                            resolve(stream.eventsToDispatch); // this is an array containing all added events in this commit.
                        }

                    });
                });
            });
        },
        async load(uuid) {
            return new Promise(function (resolve, reject) {
                es.getEventStream(uuid, function (err, stream) {
                    if (err) {
                        reject(err);
                    } else {
                        const history = stream.events.map(it => it.payload); // the original event will be in events[i].payload

                        return resolve(recreateFrom(uuid, history || []));
                    }
                });
            });
        }
    };
};