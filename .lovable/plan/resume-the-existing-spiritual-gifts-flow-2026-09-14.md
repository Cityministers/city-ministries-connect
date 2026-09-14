# Resume the existing spiritual gifts flow

## Goal
After users choose their spiritual gifts and press **Next**, continue into the next part of the previously built walkthrough instead of restarting the Spiritual Gift Test.

## Changes
- Update the gift-selection **Next** action to open the existing walkthrough at **“Which feels more like you?”**, the step immediately after **Spiritual gifts**.
- Let the walkthrough accept a requested starting step while keeping its current default start unchanged for visitors who open the test normally.
- Continue loading the saved gift choices so they remain part of the user's answers throughout the existing flow.
- Keep the intro, invite page, gift buttons, and all later walkthrough pages unchanged.

## Verification
- Select gifts, press **Next**, and confirm the next screen is **“Which feels more like you?”** rather than the beginning of the Spiritual Gift Test.
- Confirm the selected gifts remain saved.
- Confirm opening the Spiritual Gift Test directly still begins at its normal first page.
- Check the phone-sized flow and confirm the project builds cleanly.

## Technical details
Use a validated route search value for the walkthrough's starting step. `/gifts/list` will navigate to `/shape` with the existing `gifts-lean` step identifier; `/shape` will resolve that identifier against the existing `steps` list and safely fall back to step zero when it is absent or invalid.
