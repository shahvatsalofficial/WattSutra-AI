# Real-world scenarios

Seven situations that happen in real teams, what to run, and what the tool says. The terminal blocks on the documentation site are real CLI output, captured by `npm run docs:scenarios` and stored in [`evidence/scenarios.json`](evidence/scenarios.json). People and projects are illustrative. Where a case is simulated (an edited file, a different machine), the terminal says so.

## 1. "My pull request is 4x faster, so it is greener"

**Who:** a developer opening a performance pull request.
**The trap:** a speed result gets repeated in the release notes as an energy saving.

<!-- term:s1 -->

**What it tells you:** the speed claim passes, with an interval, for this machine and workload. Energy, carbon and cost are `NOT_RUN`.

**Safe sentence:** "Median run time improved on our test machine; energy was not measured."

**Unsafe sentence:** "This change cuts energy use."

## 2. The faster version returns a wrong answer

**Who:** a reviewer looking at an impressive benchmark.
**The trap:** a shortcut skips work and nobody compares the results.

<!-- term:s2 -->

**What it tells you:** quality differs, so the latency gate is `FAIL` and the command exits 1. Speed does not matter when the answer is wrong.

**Do next:** fix correctness, then benchmark again.

## 3. The baseline came from another machine

**Who:** a CI owner comparing a laptop baseline with a shared runner.
**The trap:** hardware differences look like code improvements.

<!-- term:s3 -->

**What it tells you:** `REVIEW_REQUIRED`. The comparison is exploratory only.

**Do next:** record the baseline on the same runner type as the candidate.

## 4. Someone "tidies" a number in the report

**Who:** an auditor receiving benchmark files by email.
**The trap:** a figure is edited by hand, with or without recomputing the hash.

<!-- term:s4 -->

**What it tells you:** both edits fail. The second is caught because every statistic is recomputed from the raw samples.

**Limit:** someone who regenerates consistent samples and the hash is not detected. That needs signatures, which are on the roadmap.

## 5. Sustainability asks for the carbon number

**Who:** an engineering lead filling in a sustainability report.
**The trap:** a default grid intensity or wattage appears from nowhere.

<!-- term:s5 -->

**What it tells you:** with no inputs everything is unknown. With your inputs the figures are labelled `modeled`. The 65 W and 380 gCO2e/kWh above are illustrations, not facts about your system.

**Do next:** write down where each input came from, its region and date.

## 6. The lab has a real power meter

**Who:** a team with a metered plug or bench meter.
**The trap:** the reading is presented as if the tool measured it.

<!-- term:s6 -->

**What it tells you:** the value is recorded as an imported observation with its source, and attribution stays unverified.

**Do next:** record the boundary (whole machine or component) and the time window.

## 7. An AI assistant should follow the same rules

**Who:** a developer using an AI coding assistant.
**The trap:** the assistant confidently converts CPU seconds into carbon.

<!-- term:s7 -->

**What it tells you:** the dry run shows what would be copied before anything is written. The installed skill files tell the assistant to keep evidence kinds apart. A host may or may not load them; activation is not verified by this project.

## Which scenario is yours?

| You want to | Run | Watch for |
| --- | --- | --- |
| Block slow or wrong changes in CI | `compare` | exit code 1 |
| Share a result | `report --format html` | "not measured" fields |
| Check a file you received | `verify` | `FAIL` lines |
| Model energy, carbon or cost | `estimate` | `modeled` labels |
| Prove the tool behaves | `audit` | verdict and not-run checks |
