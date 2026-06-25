# Game Design

## Fantasy and loop

The player is the founder of a fictional music company. Each week they allocate scarce cash and attention across artist development, recording, releases, promotion, and roster health.

The MVP loop is: scout → sign → record → release → promote → resolve week → inspect chart and finance → repeat.

## Simulation model

The deterministic RNG and saveable state are independent of Phaser. A release score combines master quality, artist appeal, current buzz, active campaign spend, release-age decay, and bounded volatility. The score drives streams, radio spins, revenue, fan growth, artist buzz, and chart ranking. AI labels create competing chart entries from the same deterministic random stream.

Recurring roster costs create pressure even when no campaign is active. Studio work raises fatigue. Weekly rest lowers fatigue and can recover morale.

## Progression

Progression is measured through cash, fans, reputation, chart peaks, catalog activity, valuation, awards, tours, staff, and achievements. Trend cycles affect matching genres. Staff improve specific operating areas while increasing weekly overhead. Tours create ticket revenue, fatigue, and fan growth. Event choices trade cash, reputation, morale, and buzz.

Ten challenge starts provide scenario-specific budgets, roster conditions, event pressure, and progress targets. Challenge scores can be published only from authenticated cloud saves.

## Failure and recovery

Negative cash is allowed so the player receives a recovery window instead of an abrupt early-game loss. Future balance should add creditor events, emergency financing, roster renegotiation, and a clear insolvency endpoint.
