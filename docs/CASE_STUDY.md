# TeamSpace — Product & Engineering Case Study

**Project:** TeamSpace  
**Category:** Full-stack collaborative project management  
**Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL, Vercel  
**Live demo:** https://teamspace-teal.vercel.app  
**Code:** https://github.com/sewararashidi-byte/teamspace

---

## The challenge

When work is spread across multiple projects, a task list does not always explain what matters most, how projects relate, or which milestones are approaching. Team collaboration adds another challenge: sharing enough information to keep work moving without granting everyone the same permissions.

I wanted TeamSpace to be useful for an individual planning their work and flexible enough to support multiple people contributing to a project.

## Product direction

Instead of building a conventional dashboard filled with repeating statistic cards, I designed the experience around distinct modes of thinking about work:

- **Focus** answers *What needs attention now?*
- **Map** answers *How do my projects fit together?*
- **Flow** answers *What is moving forward?*
- **Plan** answers *Which checkpoints are ahead?*
- **Team, Shared, and Collaborate** answer *How do we work together?*

The visual language—warm ivory surfaces, forest-green accents, spacious typography, and restrained motion—supports a more editorial, less cluttered workspace.

## Engineering approach

### Persistent application state

The frontend uses Next.js, React, and TypeScript. Supabase provides authentication and access to PostgreSQL, where projects, tasks, deadlines, labels, milestones, and collaboration records persist across sessions and page refreshes.

### Features built in stages

The application evolved from authentication and basic task CRUD to project organization, advanced task details, milestone timelines, invitations, shared-project viewing, and collaborative task workflows. Each stage was tested before the next one, reducing the risk of breaking existing work.

### Permissions designed for collaboration

Sharing a project introduced an access-control problem that the interface alone could not solve. TeamSpace uses project ownership, invitation-based memberships, viewer/editor roles, Row Level Security, and database-side guards.

Owners control their project and memberships. Editors can make specified task updates. Viewers can read shared work and participate in permitted discussions without editing core task details. Notification records are visible to their recipients.

## Challenges and solutions

| Challenge | Response |
|:--|:--|
| Keeping task and project data intact as features expanded | Applied additive SQL changes and tested existing records after migrations. |
| Preventing unauthorized cross-project access | Used RLS and database checks, then manually tested with separate accounts. |
| Handling Next.js 16 prerendering restrictions | Moved unstable date calculations out of problematic render paths. |
| React hook and state-management lint issues | Revised effect-driven state updates and null-safe task selection. |
| Moving from local development to production | Configured Vercel environment variables and production Supabase authentication redirects. |

## Validation and outcome

TeamSpace is live at [teamspace-teal.vercel.app](https://teamspace-teal.vercel.app).

The project completed ESLint, TypeScript, and Next.js production build checks. Production workflows were manually verified for sign-in, persistent projects, planning views, team invitations, roles, comments, and shared-project access. These checks support the application's readiness as a portfolio project, but are not a substitute for an automated regression suite or independent security audit.

## What I learned

This project reinforced that frontend usability, database design, and authorization must develop together. The most important decisions were not visual polish alone: they involved making multiple interfaces share reliable data, maintaining compatibility through migrations, and ensuring collaboration permissions were enforced beyond the UI.

## Opportunities to extend the product

Automated authorization tests, stronger accessibility coverage, real-time subscriptions, and attachment support would be valuable next improvements. They remain outside the scope of the deployed release.

---

**Sewara Rashidi** · [GitHub](https://github.com/sewararashidi-byte) · [LinkedIn](https://www.linkedin.com/in/sewara-rashidi-409070383)
