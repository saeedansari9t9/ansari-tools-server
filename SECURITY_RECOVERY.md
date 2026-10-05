# Security recovery checklist

The MongoDB URI previously committed to this repository must be treated as permanently compromised. Removing it from the current files does not invalidate copies in Git history, forks, caches, logs, or previous deployments.

## Do these live actions in order

1. In MongoDB Atlas, create a new application database user with only the permissions this app needs. Update the server deployment's `MONGODB_URI` (and remove the old duplicate `MONGO_URI` variable), verify the new deployment, and then delete the exposed database user. Restrict Atlas Network Access to trusted server egress wherever the hosting setup permits it.
2. Generate a new `JWT_SECRET` (the command is documented in `.env.example`), set it only in the server deployment, and redeploy. This immediately invalidates every old website-admin and dashboard token.
3. Generate and set a new `DATA_ENCRYPTION_KEY` using the command in `.env.example`. Back it up in a password manager: encrypted tool data cannot be recovered if this key is lost.
4. Set `ADMIN_OWNER_EMAILS` in the server deployment to the trusted owner account email(s). Admin-account creation, deletion, and other owner-only actions fail closed until this is set.
5. Using the new MongoDB credential and encryption key locally, encrypt existing tool cookies/passwords, then reset the trusted website admin:

   ```powershell
   npm run security:encrypt-data
   npm run admin:reset-password -- owner@example.com
   ```

   The command generates a temporary password and increments `tokenVersion`, revoking every prior admin session. Change that password immediately after login.
6. Review the `admins` collection for unknown accounts and the `users` collection for unexpected `role: "admin"` values. Preserve an export/audit copy before deleting suspicious records.
7. Rotate any third-party passwords, cookies, or tokens stored in MongoDB (including tool credentials). Encryption protects future database-only exposure; it cannot undo this incident.
8. Review MongoDB Atlas access logs, hosting logs, GitHub security alerts, and admin/user login logs for the incident window.
9. Make the repository private while cleanup is in progress. Coordinate a Git-history rewrite and force-push with every collaborator, but do this only after rotation: history rewriting cannot make an already copied secret safe.

Never put secrets in a Vite/client environment variable. `VITE_*` values are shipped to every browser. MongoDB, JWT, email, Cloudinary secret, and owner configuration belong only in the server deployment environment.
