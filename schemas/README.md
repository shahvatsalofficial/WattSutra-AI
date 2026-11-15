# JSON Schemas

Draft 2020-12 schemas for the three artifact types WattSutra writes:

- `wattsutra.run.v1.schema.json` — measured run (energy, carbon and cost are `null` by schema)
- `wattsutra.comparison.v1.schema.json` — comparison with gates (`energy`, `carbon`, `cost` gates are `NOT_RUN`)
- `wattsutra.estimate.v1.schema.json` — explicit-inputs-only estimate

`tests/schema.test.mjs` validates real generated artifacts against these files with a small built-in checker (type, required, properties, enum, const, pattern, minimum, maximum, items, minItems). The runtime check in `packages/core/engine.mjs` (`validateRunShape`) is stricter: it also recomputes every statistic from the raw samples.
