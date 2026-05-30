---
Task ID: 1
Agent: Main Agent
Task: Create maikasuwa-seller repo with full seller portal, update admin approval API with default password + email

Work Log:
- Examined existing admin repo (maikasuwa-admin) for seller data model, approval flow, and auth structure
- Updated admin approve-seller API to generate a 12-char default password, create Supabase auth user, and send credentials via email
- Removed seller pages and APIs from admin repo (moved to dedicated seller portal)
- Created new GitHub repo: celebrity01/maikasuwa-seller
- Built complete Next.js seller portal with:
  - Login page (email as username + password from approval email)
  - Dashboard with stats (total products, active, paused/sold, total views)
  - Products list with search, filter by status, toggle active/paused, delete
  - Add product form with category/subcategory, image upload to Supabase Storage, specs, negotiable pricing
  - Settings page for password change (auto-redirects if using default password)
- Night market theme with green accent (seller-specific)
- Clean builds verified for both maikasuwa-admin and maikasuwa-seller
- Pushed both repos to GitHub

Stage Summary:
- New repo: https://github.com/celebrity01/maikasuwa-seller
- Updated repo: https://github.com/celebrity01/maikasuwa-admin
- Seller portal features: login, dashboard, product CRUD, image upload, password change
- Admin approval now generates default password and emails it to seller
- Seller email = username, default password sent via Resend email
