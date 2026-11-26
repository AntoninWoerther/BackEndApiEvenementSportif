import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IsNull } from 'typeorm';
import { eventEmitter } from '../src/core/bus/event.emiter.ts';
import { db } from '../src/core/dataBase.config.ts';
import { makeSendEvenementRemindersUseCase } from '../src/profile/evenement/app/usecases/send-evenement-reminders.usecase.ts';
import { EVENEMENT_EVENTS } from '../src/profile/evenement/domain/events/evenement.events.ts';
import { registerEvenementReminderEmailListener } from '../src/profile/evenement/infra/mailer/evenement-reminder-email.listener.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { typeormEvenementReminderGateway } from '../src/profile/evenement/infra/persistance/repositories/typeorm-evenement-reminder.gateway.ts';
import { UserEntity } from '../src/profile/user/infra/persistance/entities/user.entity.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';

function setup(t) {
    const event = {
        id: 10, date: '2029-06-03', cancelledAt: null, creatorId: 1,
        location: 'Gymnase', description: 'Match amical'
    };
    const reservations = [{ id: 1, email: 'alex@example.test', reminderSentForDate: null }];
    const update = t.mock.fn(async (where, changes) => {
        for (const row of reservations) {
            if (where.id.value.includes(row.id)) Object.assign(row, changes);
        }
    });
    const repository = {
        createQueryBuilder() {
            let dueDate;
            return {
                innerJoin() { return this; },
                select() { return this; },
                addSelect() { return this; },
                where(_condition, params) {
                    assert.equal(params.evenementId, event.id);
                    return this;
                },
                andWhere(condition, params) {
                    assert.match(condition, /reminderSentForDate IS NULL OR reservation.reminderSentForDate <> :date/);
                    dueDate = params.date;
                    return this;
                },
                setLock(mode) {
                    assert.equal(mode, 'pessimistic_write');
                    return this;
                },
                async getRawMany() {
                    return reservations.filter(row => row.reminderSentForDate !== dueDate);
                }
            };
        },
        update
    };
    const repositories = new Map([
        [EvenementEntity, {
            async findOne({ where, lock }) {
                assert.deepEqual(lock, { mode: 'pessimistic_write' });
                assert.deepEqual(where.cancelledAt, IsNull());
                return event.id === where.id && event.date === where.date && event.cancelledAt === null ? event : null;
            }
        }],
        [ReservationEntity, repository],
        [UserEntity, { async findOne() { return { name: 'Martin', firstname: 'Camille' }; } }]
    ]);
    t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        return run({ getRepository: entity => repositories.get(entity) });
    });

    const log = t.mock.method(console, 'log', () => {});
    registerEvenementReminderEmailListener();
    const listener = eventEmitter.listeners(EVENEMENT_EVENTS.REMINDER_DUE).at(-1);
    t.after(() => eventEmitter.off(EVENEMENT_EVENTS.REMINDER_DUE, listener));

    const findDueEventIds = t.mock.fn(async () => [event.id]);
    const remind = makeSendEvenementRemindersUseCase({ ...typeormEvenementReminderGateway, findDueEventIds });
    return { event, reservations, update, log, findDueEventIds, remind };
}

test('le rappel de la veille contient les informations de l’événement et couvre les inscriptions tardives', async t => {
    const { reservations, log, findDueEventIds, remind } = setup(t);
    const dayBeforeInParis = new Date('2029-06-01T22:00:00Z');
    await remind(dayBeforeInParis);
    assert.deepEqual(findDueEventIds.mock.calls[0].arguments, ['2029-06-03']);
    assert.equal(reservations[0].reminderSentForDate, '2029-06-03');
    assert.match(log.mock.calls[0].arguments[0], /alex@example\.test.*Date : 2029-06-03.*Lieu : Gymnase.*Description : Match amical.*Organisateur : Camille Martin/);

    await remind(dayBeforeInParis);
    assert.equal(log.mock.callCount(), 1);
    reservations.push({ id: 2, email: 'morgan@example.test', reminderSentForDate: null });
    await remind(dayBeforeInParis);
    assert.equal(log.mock.callCount(), 2);
    assert.match(log.mock.calls[1].arguments[0], /morgan@example\.test/);
});

test('un report suit la nouvelle date et une annulation empêche le rappel', async t => {
    const { event, reservations, log, update, remind } = setup(t);
    reservations[0].reminderSentForDate = '2029-06-03';
    event.date = '2029-06-06';

    await remind(new Date('2029-06-02T12:00:00Z'));
    assert.equal(update.mock.callCount(), 0);

    await remind(new Date('2029-06-05T12:00:00Z'));
    assert.equal(reservations[0].reminderSentForDate, '2029-06-06');
    assert.match(log.mock.calls[0].arguments[0], /Date : 2029-06-06/);

    event.cancelledAt = new Date('2029-06-05T13:00:00Z');
    reservations.push({ id: 2, email: 'morgan@example.test', reminderSentForDate: null });
    await remind(new Date('2029-06-05T14:00:00Z'));
    assert.equal(log.mock.callCount(), 1);
    assert.equal(update.mock.callCount(), 1);
});
