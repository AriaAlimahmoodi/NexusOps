# Phase 17 Persian chat and dynamic dataset intake

Launch the interface on the computer running NexusOps and open http://127.0.0.1:8017. The application uses the existing Elasticsearch settings and opens on the Persian chat page. Leaving the dataset ID blank uses the existing evidence service. Entering a published ID switches the question to that dataset. The existing Phase 16 FPGA alias is the source for the published-evidence question.

```powershell
& $python -m scripts.run_persian_ui --env-file (Join-Path $repo '.env')
```

The intake tab accepts UTF-8 CSV, a JSON array of objects, or a JSON response from an approved HTTPS endpoint. For a wrapped array, enter the dotted path such as `data.items`. API intake uses a single public GET without credentials or redirects. Set `NEXUSOPS_INGEST_API_HOSTS` in the existing environment to the comma-separated domains trusted by the operator. This enables introduction of new API URLs on those hosts from the running interface. Intake limits are 2 MiB, 10,000 rows and 128 source columns.

The interface shows the row count and sample before field mapping. Select a skill column and optionally a related course column. Review displays the normalized sample and validates every row. Publication requires confirmation of that exact review. A new dataset ID creates one Elasticsearch document atomically in `nexusops_real_dynamic_datasets_v1`. Reuse a new ID for a revised dataset. The publishing account requires index creation and document creation there. Chat requires document read access on that index and the Phase 16 alias. The interface binds to loopback and is intended for the local operator.

## Main-environment acceptance

1. Open chat with the dataset ID blank. Ask «با شواهد منتشرشده FPGA مهارت پرتقاضا، درس مرتبط و پیشنهاد بازنگری را نشان بده». Verify VHDL in 87 of 120 postings and the Johns Hopkins course. This assumes the Phase 16 alias is available on the configured Elasticsearch instance.
2. With the same server running, open the intake tab. Load a CSV or JSON with skill and optional course information, or supply an approved API URL. Check the sample, enter a unique dataset ID and title, select columns, review, confirm and publish.
3. The UI returns to chat with that ID selected. Ask «پرتکرارترین مهارت این دیتاست چیست؟» and verify the count and related courses against the intake data. The response includes the source row positions. «این دیتاست چند ردیف دارد؟» is also supported. Questions outside this analysis scope return an evidence limitation.

A small acceptance source can be transcribed from the previously reviewed course publications. In UTF-8 CSV, use `skill,course` as the header, followed by `VHDL,Georgia Tech ECE 2031`, `VHDL,Johns Hopkins 525.677.81`, and `Verilog,Boston University ENG EC 551`, each on its own line. The expected result is VHDL in two of three source rows. In uploaded course data this metric is row frequency.

## Predeployment verification

The automated suite covers existing chat and the complete receive, review, approve, publish and query lifecycle in one app instance for CSV, JSON and API input. The JavaScript interface also completed both acceptance scenarios over a running local HTTP server with a DOM test runner and a simulated Elasticsearch client. Main-environment acceptance is recorded below.

## Main-environment results

The operator supplied the response from the Persian UI after publishing `fpga-courses-p17`. The UI selected the fresh ID and returned VHDL in two of three rows, with Georgia Tech ECE 2031 and Johns Hopkins 525.677.81 as the mapped courses. This matches the expected uploaded-dataset response. The operator also supplied the live response with the existing FPGA evidence selected. The UI returned VHDL in 87 of 120 postings and Johns Hopkins 525.677.81, plus the expected Verilog count, related course and recommendation. Both original main-environment chat scenarios passed.

### Additional live API acceptance

Use the pinned [JSON source](https://raw.githubusercontent.com/AriaAlimahmoodi/NexusOps/f9129e5897d5076365a1b8c2b279d6ee3de78ec3/tests/fixtures/phase17-fpga-courses-api.json) with `raw.githubusercontent.com` in the API host allowlist and `items` as the records path. Review the `skill` and `course` fields and publish under a fresh ID such as `fpga-api-p17`. In the same process, ask which skill is most frequent. The expected answer is VHDL in two out of three rows with both mapped course titles. The operator supplied the successful live UI result after publishing `fpga-api-p17`. Chat selected the new dataset and returned VHDL in two of three rows, with Georgia Tech ECE 2031 and Johns Hopkins 525.677.81. This matched the pinned API source and confirmed the intake, mapping review, publication and chat flow in the main environment.


Phase 17 is closed. The main environment passed both original chat scenarios and the additional live API intake scenario. [Implementation CI](https://github.com/AriaAlimahmoodi/NexusOps/actions/runs/44999760332).
