# Profile Creator

Vendored from `marosa_web/profile-creator.html` and its local assets. The public
React route `/tool` embeds this document to isolate the standalone engine and
dark studio styles from the application's React/MUI styles.

Integration changes: remove the legacy website navigation, marketing extension
script, and hostname redirect; move the sticky app bar to the top. Marosa's
public header supplies navigation. All profile generation, validation, chart,
and export scripts are preserved.

The document's CSP pins inline scripts with SHA-256 hashes. If editing a script,
recalculate its hash using LF-normalized script contents. Query parameters are
forwarded by `/tool`; open `/tool?selftest=1` to run the bundled self-tests.
