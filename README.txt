CORE THEORY — V3 COMPLETE

INSTALL ORDER
1. In Supabase SQL Editor, run CORE_THEORY_V3_DATABASE.sql once.
2. Only after it succeeds, upload the website files to GitHub main.
3. Vercel will redeploy automatically.

INCLUDED
- Owner / Instructor / Client roles
- Client self-signup is always Client; instructor accounts are invite-only
- Client signup requires full name, email, phone and password
- Pilates and Megacore weekly schedules with aligned time rows
- Multiple simultaneous classes
- Customizable Beginner / Intermediate / Advanced / Open Level colors
- Bookings, attendance, check-in and session deduction
- Waitlist-ready booking status and studio booking/cancellation rules
- Recurring classes, private-class metadata, location and substitutions foundation
- Client packages, package scope, package freeze fields and purchase requests
- Client history, internal notes and birthday fields foundation
- Announcements and promo codes
- Owner operations page, exports/backups and audit-log foundation
- Instructor payroll fields and availability foundation
- Owner-created custom menu sections
- Booking confirmation + night-before notification queue
- Configurable reminder time, sender name/email and WhatsApp Business number
- PWA/service worker foundation for Add to Home Screen

IMPORTANT
Email and WhatsApp messages are queued but require external delivery providers before messages can actually be sent. Online package orders are recorded, but actual card charging requires a payment provider. Native App Store/Google Play packaging is a later deployment step; the included PWA can be installed from a browser once configured/deployed.


V3 MEMBERSHIP EDIT UPDATE
- Memberships now have Edit and Delete actions.
- Edit preserves the existing membership record and lets the owner change name, sessions, price, validity, and Pilates/Megacore/Both scope.

OWNER INSTRUCTOR INVITES
V3 includes Team > Invite Instructor, Resend Invite, and Deactivate/Reactivate Login.
For security, Auth admin actions run in the included Supabase Edge Function at:
supabase/functions/staff-admin/index.ts
The service-role key must never be placed in app.js or any browser file.
Deploy this function in Supabase before using the website Invite Instructor button.
