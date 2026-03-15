export function getPrdCommand(): string {
  return `# /fishi-prd — Product Requirements Document

Create, view, or manage PRDs for the project.

## Usage

\`\`\`
/fishi-prd                    # Create a new PRD (starts brainstorming if no design exists)
/fishi-prd list               # List all PRDs
/fishi-prd view <name>        # View a specific PRD
/fishi-prd approve <name>     # Approve a PRD and proceed to architecture
\`\`\`

## Instructions

### /fishi-prd (create new)
1. Check if there's an approved design from brainstorming in \`docs/product/\` or \`.fishi/plans/\`
2. If NO design exists:
   - Inform the user: "No approved design found. Let's brainstorm first."
   - Invoke the **brainstorming** skill to explore the idea
   - Once design is approved, continue to PRD creation
3. If design EXISTS:
   - Invoke the **prd-creation** skill
   - Walk through each PRD section with the user
   - Save to \`.fishi/plans/prd/YYYY-MM-DD-<topic>-prd.md\`
4. Present the PRD for gate approval

### /fishi-prd list
- Scan \`.fishi/plans/prd/\` for all PRD files
- Display: name, date, status (draft/approved/superseded)

### /fishi-prd view <name>
- Read and display the specified PRD

### /fishi-prd approve <name>
- Mark the PRD as approved in its frontmatter
- Update \`.fishi/state/project.yaml\` to advance to architecture phase
- Notify: "PRD approved. Ready for architecture design. Use /fishi-gate approve to proceed."

## Flow
\`\`\`
User request → Brainstorming → PRD → Architecture → Sprint Plan → Development
                                 ↑
                            You are here
\`\`\`

This is a mandatory step. Do NOT skip PRD creation for any project regardless of simplicity.
A simple project gets a simple PRD (maybe 1 page), but it still gets one.
`;
}
