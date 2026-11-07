# Hotfix PR

A PR that fixes a released defect outside any plan.

| Field | Hotfix PR |
| --- | --- |
| Who opens it | The human, or an agent the human asks |
| Branch | From the default branch. If the default branch holds unreleased work that can't ship, from the released tag instead |
| What it may touch | Only the fix and its test |
| Review | The human |
| Verification evidence | A verification run showing the defect gone, on the surface where it appeared |
| Merge | The human, who then tags the release from the merged branch |

A fix branched from a released tag lands on the default branch too, by a second PR on the same day.
