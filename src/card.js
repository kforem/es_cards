const LIMIT_ASSIGNED = 'LIMIT_ASSIGNED';
const CARD_WITHDRAWN = 'CARD_WITHDRAWN';
const CARD_REPAID = 'CARD_REPAID';

function eventTracker(apply) {
    let events = [];

    return {
        applyWithRecord(event) {
            events.push(event);
            return apply(event);
        },
        pendingEvents() {
            return events;
        },
        flushEvents() {
            events = [];
        }
    };
}

module.exports = function cardModule(now) {
    function recreateFrom(uuid, events) {
        return events.reduce((card, event) => {
            card.apply(event);
            return card;
        }, card(uuid));
    }

    function card(id) {

        let limit;
        let used = 0;
        let events = [];
        let {applyWithRecord, ...tracker} = eventTracker(apply);

        // invariant
        function limitAlreadyAssigned() {
            return limit != null;
        }

        function notEnoughMoney(amount) {
            return amount > availableLimit();
        }

        function availableLimit() {
            return limit - used;
        }

        function apply(event) {
            if (event.type === LIMIT_ASSIGNED) {
                limit = event.amount;
            }
            if (event.type === CARD_WITHDRAWN) {
                used += event.amount;
            }
            if (event.type === CARD_REPAID) {
                used -= event.amount;
            }
        }

        return {
            ...tracker,
            apply,
            assignLimit(amount) {
                if(limitAlreadyAssigned()) {
                    throw new Error('Cannot assign limit for the second time');
                }
                const event = {type: LIMIT_ASSIGNED, amount, card_id: id, date: now().toJSON()};
                applyWithRecord(event);
            },
            availableLimit,
            withdraw(amount) {
                if(!limitAlreadyAssigned()) {
                    throw new Error('No limit assigned');
                }
                if (notEnoughMoney(amount)) {
                    throw new Error('Not enough money');
                }
                const event = {type: CARD_WITHDRAWN, amount, card_id: id, date: now().toJSON()};
                applyWithRecord(event);
            },
            repay(amount) {
                const event = {type: CARD_REPAID, amount, card_id: id, date: now().toJSON()};
                applyWithRecord(event);
            },
            uuid() {
                return id;
            }
        };
    }
    return {card, recreateFrom};
};