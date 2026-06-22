// src/lib/deadlines.js

export const deadlines = {
    groupStage: {
        predictionLock: new Date('2026-06-11T18:30:00Z'),
        roundComplete:  new Date('2026-06-25T21:00:00Z'),
    },
    ro32: {
        predictionLock: new Date('2026-06-29T16:00:00Z'),
        roundComplete:  new Date('2026-07-02T21:00:00Z'),
    },
    ro16: {
        predictionLock: new Date('2026-07-04T14:00:00Z'),
        roundComplete:  new Date('2026-07-07T21:00:00Z'),
    },
    quarterFinals: {
        predictionLock: new Date('2026-07-09T14:00:00Z'),
        roundComplete:  new Date('2026-07-10T21:00:00Z'),
    },
    semiFinals: {
        predictionLock: new Date('2026-07-13T17:00:00Z'),
        roundComplete: new Date('2026-07-15T21:00:00Z'),
    },
    final: {
        predictionLock: new Date('2026-07-19T17:00:00Z'),
        roundComplete:  new Date('2026-07-19T21:00:00Z'),
    }
}