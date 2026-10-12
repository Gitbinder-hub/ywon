# B-049 — linked-project evidence links in Studio / REVIEW

The verified-result card now includes two relative same-origin anchors after attachment: open the B-048 JSON in a new tab and download the same JSON with `?download=1`. Paths use only the server-issued project ID through `encodeURIComponent`; no user path, run path or media filename is accepted.

Both anchors are hidden and have their `href` removed whenever no immutable project reference exists. They become visible only through `syncVerifiedReference` after the server-returned linked project is current. Creating a new project hides them again. This does not add playback, MP4 download, generation, execution or publication controls.

Six focused Studio DOM tests PASS, including hidden-before-link and exact evidence URLs after attachment; JS syntax PASS. Visual inspection of the linked state at 1440px and 390px passes with no overlap, clipping, console errors or horizontal overflow. Link targets meet the 44px minimum and wrap cleanly on mobile. The broader historical 185-test suite was not rerun in this partial checkout.

This closes the useful local-preview evidence path. Next work should stop extending local filesystem media access and design the production boundary: authenticated identity/tenancy, private object storage, signed/expiring delivery, malware/content scanning, retention/deletion and audit-backed publication approval.
