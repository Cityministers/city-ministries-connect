# Close a met need with personal thank-you messages

## Experience
- On each need the poster owns, add a **Need met** action. It opens a confirmation sheet showing the people who messaged about that need, so the poster can choose who completed it. The poster can also close the need without naming a helper if help came from elsewhere.
- Provide an editable, ready-made thank-you for the selected helper and separate editable quick replies for other people who offered to help. Make each reply optional, show exactly who will receive it, and send only when the poster confirms. Do not auto-send or imply that every offer completed the need.
- After confirmation, mark the need **Need met**, keep its history and conversations available to the poster, and remove it from open-needs lists and maps. Show a clear closed state in the poster’s My Posts area; prevent new offers to a closed need while allowing existing conversations to continue. Support reopening if it was closed by mistake.

## Technical details
- Use the existing post-linked conversations and message notifications for the thank-you notes; only people in conversations about that exact need are selectable. Deduplicate each person and reject any mismatched conversation or recipient on the server.
- Add an owner-controlled closure state and completion timestamp to needs, with allowed status transitions and database checks. Perform confirmation and selected sends through an authenticated server action that verifies ownership and conversation membership. Make retries safe against duplicate thank-you sends and do not close the need if the requested message delivery fails.
- Update need reads, map/list and My Posts presentation to distinguish active from met needs. Preserve existing conversation history and enforce the same active-only restriction when starting a conversation server-side.
- Verify the full flow with a real signed-in need and a linked helper conversation: quick-message selection/editing, confirmation, inbox receipt, disappearance from open maps, closed label, and reopening. Check phone-sized layout and that an unrelated member cannot close the need or receive its thank-you.
