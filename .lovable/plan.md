
Build a polished frontend-only FlowDesk product shell based on the uploaded spec, adapted to this React + Tailwind project with realistic demo data and a strong “backend-ready” structure.

1. Replace the placeholder home page with a full app shell
- Create a dark left sidebar + light content workspace matching the spec’s structure.
- Add collapsible desktop/mobile navigation with a visible trigger and bottom utility area for notifications, settings, and user profile.
- Add route-based page navigation instead of a single-page placeholder.

2. Add the main role-aware navigation and page structure
- Implement routes/pages for:
  - Today’s Tasks
  - Weekly Tasks
  - Total Tasks
  - M.O.M / Meetings
  - Approvals
  - Performance Analytics
  - User Management
  - Settings
- Use a demo role switcher so Employee, Manager, and Admin views can be previewed instantly.
- Hide or relabel restricted pages/actions depending on selected role, while keeping the demo easy to explore.

3. Establish the design system from the HTML spec
- Translate the uploaded palette, spacing, typography tone, borders, and surface hierarchy into the project’s theme tokens.
- Keep the “structured, calm, high-density” workplace feel, but refine it into a cleaner product UI rather than a literal HTML clone.
- Standardize shared UI patterns: metric cards, badges, pills, section headers, filters, drawers, panels, and empty states.

4. Build shared task-management components first
- Create reusable task row/card components for consistent behavior across Today, Weekly, and Total views.
- Add shared status, priority, emergency, project, date, avatar, and review chips.
- Add reusable page headers, progress bars, summary cards, filter controls, and right-side detail drawers.

5. Implement Today’s Tasks as the primary daily work surface
- Build the fixed section order:
  - Emergency
  - In Progress
  - To Do
  - Completed
- Add progress summary cards, primary CTA, and “Pull from Weekly.”
- Support frontend demo interactions like checking complete, opening task detail, removing from today, and showing review/sign-off states.

6. Implement Weekly Tasks as the planning surface
- Add weekly header, summary row, progress bar, and current-week framing.
- Organize tasks into the specified weekly sections including carried-over items.
- Support inline weekly priority editing and “Pull to Today” behavior in demo mode.
- Add a modal/panel for pulling tasks from Total Tasks into the weekly plan.

7. Implement Total Tasks as the master backlog
- Build the default week-grouped view with expand/collapse behavior and summary stats.
- Add view controls for week/project/list modes, even if week view is the richest first-pass.
- Include search/filter UI and overdue / revise-date affordances in the interface.
- Add a pull-task drawer for assigned tasks and backend-ready placeholders where real data workflows will connect later.

8. Implement the M.O.M / Meetings experience
- Create a Meetings page with Calendar/List toggle and a polished list-first experience for the initial version.
- Add meeting cards, meeting detail drawer, MOM submission tab, AI Draft tab, and linked task tab.
- Show the AI-extracted task review experience visually with confidence states, approval actions, and bulk actions using demo data.
- Keep calendar sync and AI processing as clearly labeled future-connected states, not fake live integrations.

9. Implement manager/admin work areas
- Approvals page:
  - Task completions
  - MOM reviews
  - Deletion requests
  - Queries
- Performance Analytics page:
  - KPI cards
  - Workload / completion / overdue / blocked-time visual sections using demo charts
- User Management page:
  - Search, filters, user table, invite flow UI, and user detail drawer

10. Add global UX pieces
- Notifications panel from the shell with tabs and notification item styles from the spec.
- Command palette entry point/UI for quick navigation and actions.
- Settings page with grouped preferences and system placeholders.
- Empty, loading, and error states so the app feels complete even before backend integration.

11. Prepare the frontend for future backend connection
- Organize demo data and UI state around clear entities like users, roles, tasks, meetings, approvals, and notifications.
- Make role behavior and state transitions feel realistic so wiring to auth/database later is straightforward.
- Leave clear placeholders for future auth, permissions, notifications, calendar sync, and AI extraction without implementing backend logic in this pass.

12. Responsive and polish pass
- Ensure the shell and key pages work well at the current tablet-ish viewport and on desktop/mobile.
- Preserve dense information layout without feeling cramped.
- Finish with cohesive hover states, section hierarchy, drawer behavior, and demo data consistency across all pages.
