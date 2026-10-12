# Ywon — single local launch entry / REVIEW

User supplied the START-ASR message "ASR is not configured" after the path repair.
Read-only inspection confirms that the repaired active package has private setup
options but no local-asr-config/asr-config.json; E:/Ywon-ASR does not exist.
Therefore the corrected installation has not produced a runtime. This message
alone is not another Vosk/Python installation error. It does not identify which
of the several START-ASR copies was clicked.

Added root Ywon.cmd pointing explicitly to the previously repaired active folder:
outputs/companion-windows-asr-2026-10-05/Ywon-Companion-Windows-0.0.4/Ywon-Companion.
When config is absent it calls the existing SETUP-ASR with its Y/N choice; it
starts START-ASR only when setup succeeds and config actually exists. Cancellation,
failure or missing folder stops without retry. No implicit mic/paid permission.
--check delegates to read-only setup preflight and never invokes installation.

Source-tree validate/status/next completed, state remains P0/not_started/Q-001.
Read-only root-launcher check records the intended E:/Ywon-ASR destination and
verified cached model; actual installation/ASR/microphone remain NOT_RUN. The
earlier automatic approval service503 remains an unremedied execution limitation;
no new full installation request or bypass was attempted in this guidance turn.

No new archive/folder version was created. User can launch the single Ywon.cmd
beside the project README, approve installation with Y, wait for SETUP COMPLETE,
then use the printed local browser URL. Registry/grants/budget and runtime code
are unchanged. TR-05/TR-06/TR-10 and owner acceptance remain open requirements.
