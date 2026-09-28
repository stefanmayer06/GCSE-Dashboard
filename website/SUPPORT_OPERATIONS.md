# Support form operations

The public `/support.html` form posts to `/api/support`. It accepts a topic, a
message and an optional reply email. Privacy requests require an email so the
operator can respond. The public API has a honeypot and a short in-process rate
limit. Requests contain no account ID and are not exposed by any client route.

Mayer Digital is the confirmed service operator. The support form is the public
contact route for both support and privacy requests.

Production requests are stored in `public.support_requests` with RLS enabled and
no client policies. Apply the pending Supabase migrations, including
`20260923000000_support_requests.sql`, before deploying the server and page.
Run `npx supabase test db` against the current local schema first. Local JSON development stores them in
`${DATA_DIR}/support-requests.json`.

The operator must review the inbox every working day and handle privacy or safety
messages promptly. From `website/`, use the production storage environment and
run `npm run support:list`. Keep the output private: it may contain a reply email
or sensitive text submitted against the form's guidance. Do not paste requests
into public issues or logs. Set up a monitored operator routine before inviting
beta users; the form itself does not send an email notification.

Run `npm run support:prune` at least monthly. It removes messages older than
180 days; successful new submissions also trigger a best-effort prune. Verify
the production scheduler or operating routine during release checks. If a
request needs to be kept longer for an active issue or legal reason, handle that
under the final privacy policy rather than silently changing this retention rule.

The response procedure and UK children's-data review still require the release
owner's sign-off before a paid or broad public launch.
