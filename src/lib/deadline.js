// src/lib/deadlines.js

export const deadlines = {
    groupStage: {
        predictionLock: new Date('2026-06-11T18:30:00Z'),
        roundComplete:  new Date('2026-06-28T05:00:00Z'),
    },
    ro32: {
        predictionLock: new Date('2026-06-28T18:00:00Z'),
        roundComplete:  new Date('2026-07-04T08:00:00Z'),
    },
    ro16: {
        predictionLock: new Date('2026-07-04T16:00:00Z'),
        roundComplete:  new Date('2026-07-07T08:00:00Z'),
    },
    quarterFinals: {
        predictionLock: new Date('2026-07-09T17:00:00Z'),
        roundComplete:  new Date('2026-07-12T08:00:00Z'),
    },
    semiFinals: {
        predictionLock: new Date('2026-07-14T17:00:00Z'),
        roundComplete: new Date('2026-07-15T23:00:00Z'),
    },
    final: {
        predictionLock: new Date('2026-07-18T17:00:00Z'),
        roundComplete:  new Date('2026-07-19T22:00:00Z'),
    }
}