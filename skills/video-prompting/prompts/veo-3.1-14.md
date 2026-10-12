# VEO 3.1 — 14-component prompt structure (Ywon prompt_guidance template)

1. subject — primary subject + attributes (protected entities verbatim)
2. action — what subject does, verb-led
3. scene — environment / set
4. style — one of: clean-professional | premium-minimalist | flat-motion-graphics | minimalist-diagram
5. camera — shot type (wide/medium/close) + angle + honest movement (pan/zoom/push_in only; orbit forbidden without geometry)
6. lighting — key/fill, time of day
7. composition — framing, rule-of-thirds, safe area
8. motion — action + camera motion combined (duration = target_duration_sec)
9. mood — tone word
10. detail — textures, props, small specifics
11. constraints — aspect {{aspect}}, duration {{target_duration_sec}}s, language {{language}}
12. negative — what to avoid (from negative_prompts)
13. fidelity_note — "prompt_guidance: approximate, not exact_3d"
14. brief_ref — hash of brief for manifest traceability

Render: fill slots from brief; keep protected_entities verbatim; cap at model token limit.
