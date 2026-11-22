# Recording a control review

The register starts empty. No review has been performed by the application or its developer. A qualified compliance reviewer must verify the official source, its current version, the summary, applicability for each scenario, and any internal policy mapping before recording an attestation. The application does not authenticate reviewers or establish that a review is valid; use this local prototype only with synthetic case data.

To record a review, open the regulatory library and copy the reference ID and fingerprint shown under that reference. Edit `control-reviews.json` in the project folder as a JSON array. Each entry has this shape, with the placeholders replaced by actual reviewed values:

```json
[
  {
    "id": "REFERENCE-ID",
    "fingerprint": "COPY-THE-DISPLAYED-FINGERPRINT",
    "reviewer": "REVIEWER-NAME",
    "reviewedOn": "YYYY-MM-DD",
    "expiresOn": "YYYY-MM-DD",
    "scenarios": ["rapid_movement"]
  }
]
```

The available scenario keys are `rapid_movement`, `wealth_gap`, `linked_ownership`, and `documented_sale`. Only scenarios associated with that reference in the library can be enabled. Use one entry per reference, with all reviewed scenarios listed together. Dates are inclusive, interpreted in UTC, and must be real ISO calendar dates. Revoke a review by removing its entry. The application reads the register on each analysis request; no restart is needed. Invalid or unreadable registers and duplicate IDs disable all reviewed references. An expired or future review, changed reference fingerprint, or nonmatching scenario excludes that reference.

The fingerprint covers the bundled reference, source link and bundled source version. It does **not** detect changes on the MAS website. Reviewers must independently monitor the official source and remove or update a stale attestation. A new source version or change to the bundled reference invalidates its previous fingerprint. The app validates cited IDs, not whether a citation supports the model's explanation. A reviewer must still assess each finding and its applicability.

Live requests include eligible reference text, URLs and review dates; reviewer names remain local. Saved input snapshots also retain the matching local attestation for audit. Those files and the SQLite database are editable and are not tamper-proof; the demo role selector is not authentication. Protect them appropriately and do not use the prototype as a compliance control.
