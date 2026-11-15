# Measurement truth and carbon policy

**No CPU-to-energy inference.** The CLI records CPU time in milliseconds but does not infer watts or kWh from it. RSS samples are process-wide memory footprint, not memory allocated by a particular function. The example power assumption file is purely illustrative.

Measured values require declared sensor/device, time period, calibration/accuracy information, observed unit and workload attribution. A number in an `averagePowerW` assumption is a modeled value even if the source was a historical meter average, because energy attributed to the benchmark is not directly observed.

SCI concept: `((E × I) + M) / R`, with E in kWh, I in gCO₂e/kWh, M embodied gCO₂e, R meaningful functional units. This repo permits a *SCI-like modeled example* only when users provide E (or its model), I, M and R. It never asserts standards conformance or ISO certification. All reporting must document boundary, allocation, regional/temporal intensity provenance, embodied methodology and functional units for actual SCI work.

Uncertainty: instrument resolution, energy attribution, sampled vs cumulative counters, power accounting boundaries, utility rate and carbon factor time/location. Do not translate short synthetic runs into annualized savings without an explicitly justified scaling model.

Sources:
- https://greensoftware.foundation/standards/sci/
- https://docs.codecarbon.io/latest/explanation/accuracy/
- https://opentelemetry.io/docs/specs/semconv/system/process-metrics/
