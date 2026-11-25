# FAQ and glossary

Short answers first, then the words used throughout the documentation.

## Frequently asked questions

### Does WattSutra measure my power use?

No. Version 0.2 reads no hardware sensor. You can import a reading from your own meter, and it is labelled as imported.

### Why will it not turn CPU time into watts?

CPU time says how long a processor worked for this process. Power depends on the chip, frequency, voltage, other cores, memory, cooling and power supply. A single conversion factor would be a guess dressed as a measurement.

### Can I benchmark my own application?

Not yet. The built-in workload is a fixed prime-sum job with two algorithms. Running arbitrary code needs a sandbox, which is on the roadmap.

### What does REVIEW_REQUIRED mean?

The evidence is not enough to pass or fail: different machine, fewer than 5 samples, or an interval that includes "no change". A person decides.

### Is the self-audit a certificate?

No. It is the tool testing itself in a way you can rerun. It is not a third-party certification.

### Is anything sent over the network?

No. There is no network client and no telemetry. `npx` itself downloads the package from npm.

### Does it need an API key?

No.

### Can I use it commercially?

Yes, under Apache-2.0. Keep the licence and notice files. Read the [legal page](06-security-privacy-legal.md) before making public environmental claims.

## Glossary

| Term | Plain meaning |
| --- | --- |
| Baseline | The run you compare against |
| Candidate | The new run you are judging |
| Functional unit | The one piece of work being measured, here one complete prime-sum job |
| Wall time | Elapsed clock time |
| CPU time | Processor time used by this process; not energy |
| RSS | Memory held by the whole process at a moment |
| Sample | One timed repeat of the workload |
| Median | The middle sample; resists one unusually slow repeat |
| CV | Spread divided by the mean; higher means noisier |
| p95 | Value below which about 95% of samples fall; weak with few samples |
| Bootstrap interval | Range found by resampling the samples many times; not a significance test |
| Gate | A verdict: PASS, FAIL, REVIEW_REQUIRED or NOT_RUN |
| Integrity hash | Fingerprint that changes if the file changes; not a signature |
| Measured | Observed directly by this process |
| Imported | Supplied by you from a named meter |
| Modeled | Calculated from your assumptions |
| SCI | Green Software Foundation method for carbon per unit of work; WattSutra does not claim conformance |
| gCO2e | Grams of carbon dioxide equivalent |
| kWh | Unit of electrical energy |
