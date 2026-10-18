# Constitution: rules this portfolio never breaks

These rules apply to every spec, every plan and every change. If a change breaks one, the change is wrong.

1. **Only true, provable claims.** Every award, rank, number or role on the site has a proof link
   (certificate, leaderboard, official page) or a code link. No proof → it does not go on the site.
   Team work always says "team of N" and what Hamza himself did.
2. **Only finished, checked work is published.** A project appears only after it has been reviewed,
   improved where needed, and approved by Hamza (`reviewed_by_hamza` date).
3. **Content is data, not code.** Adding, changing or removing anything means editing one small
   text file in `content/` and pushing. Never edit page code to add content.
4. **Git is the master copy.** The files in this repo are the truth. The database is a copy for live
   features and can always be rebuilt from the files.
5. **The site never breaks because a helper is down.** Pages are built from checked files. If the
   database or any outside service is down, every page still works.
6. **A bad file never reaches the live site.** The checker refuses it and the old site stays live.
7. **Real images only.** Images must carry information (Hamza's photo, project screenshots, diagrams,
   result charts, lecture thumbnails, certificates). No stock photos, no AI-made decoration.
   Every image has a short description (alt text).
8. **Privacy first.** No date of birth, ID numbers, home address, phone number or secret keys anywhere.
   Every proof file is checked for private details before it is added.
9. **Free to run.** Vercel Hobby, Neon free tier, GitHub free. Any paid item needs Hamza's approval.
10. **Simple English** in all text written for Hamza (specs, plans, messages). Site text is clear,
    calm and professional; no hype, no vanity numbers (views, followers).
11. **Spec first.** Every new feature: spec → clarify → plan → build in small steps → check against
    the spec. If the build shows the spec was silent, update the spec first.
