# Portable source test scope

All 152 current test files are published byte-identical to the workspace. The runner loads 150 files and excludes 19 exact named callbacks; two whole-file exclusions omit 13 more callbacks. The 32 omissions depend on private APK evidence or historical preimages. The complete workspace suite passed 2,553 tests; the portable suite is narrower.

Twenty-two existing test files were explicitly migrated for the Tanya catalog delta. No callbacks or assertions were removed. Four exclusion titles were updated to their current exact declarations. The runner checks every inventory entry before execution. No private evidence or replacement baseline is fabricated.

The authoritative [JSON scope](PORTABLE-TEST-SCOPE.json) lists every omitted callback, reason and unavailable dependency. Run `node webapp/tests/run-portable.mjs` using Node 24. The execution result is recorded in [validation](VALIDATION.json); excluded callbacks are not reported as passing.

This command tests synthetic transports and implementation behavior, without provider requests, real accounts, hardware permissions or production submissions.
