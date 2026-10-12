# Seedance 2.5 — 8-component prompt structure (Ywon prompt_guidance)

1. concept — one-line concept from brief
2. subject_action — subject + verb
3. environment — scene context
4. visual_style — playbook style
5. camera_motion — honest 2D only (pan/zoom/push_in/shake); no orbit
6. lighting_mood — lighting + mood
7. constraints — aspect {{aspect}}, {{target_duration_sec}}s, {{language}}
8. fidelity — "prompt_guidance approximate"

Rule: if protected_entities present, quote them verbatim in subject_action.
