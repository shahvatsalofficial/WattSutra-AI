# Workflows

1. **Baseline capture:** choose bounded workload and functional unit → record environment → warm up → measure repeated executions → verify functional correctness → sign/report local hash.
2. **Fair comparison:** verify both reports and workload parity → classify confounders → compare mean, median, p95, variance → never infer energy savings from timing alone.
3. **Assumptions-based estimate:** list missing direct measures → import explicitly sourced watt, energy, carbon factor, price, embodied scope and unit → produce only labeled modeled values → document limits.
4. **Optimization experiment:** identify a candidate change → control input and quality → repeat benchmark on same device → compare variance and identify what remains not established.
5. **Release gate:** fail on test regression or invalid evidence, require review for missing power or fairness evidence; do not call an unmeasured experiment a sustainability win.
6. **Cross-IDE handoff:** install project-local skills → invoke existing authenticated IDE agent with relevant skill → run CLI locally if authorized → carry only derived sanitized artifacts.
7. **Server:** offline reports only → optional localhost token API; future hosted architecture requires TLS, RBAC and tenant-scoped objects.
