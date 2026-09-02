# Evidence index

Every screenshot, what it proves, and where the fuller writeup lives. See
`REQUIREMENTS_AUDIT.md` for the requirement-by-requirement narrative.

| Requirement | Screenshot | Route | Role | Result |
|---|---|---|---|---|
| REQ-001 Asset Dashboard | `02_CUSTOMER/REQ-001_customer-discover-grid.png` | `/customer` | Customer | PASS |
| REQ-001 Asset Dashboard | `02_CUSTOMER/REQ-001_equipment-detail-live-status.png` | `/customer/equipment/:id` | Customer | PASS |
| REQ-001 Asset Dashboard | `03_DEALER/REQ-001_dealer-asset-dashboard.png` | `/dealer/assets` | Dealer | PASS |
| REQ-001 Asset Dashboard | `04_ADMIN/REQ-001_admin-fleet-overview.png` | `/admin/fleet` | Admin | PASS |
| REQ-002 Check-out | `05_ASSET_LIFECYCLE/REQ-002_customer-checkout-success.png` | `/customer/equipment/:id` | Customer | PASS |
| REQ-002 Check-out | `05_ASSET_LIFECYCLE/REQ-002_dealer-checkout-modal.png` | `/dealer/assets` | Dealer | PASS |
| REQ-002 Check-out | `05_ASSET_LIFECYCLE/REQ-002_dealer-checkout-result.png` | `/dealer/assets` | Dealer | PASS |
| REQ-002 My Rentals | `02_CUSTOMER/REQ-002_my-rentals-active.png` | `/customer/rentals` | Customer | PASS |
| REQ-003 Check-in | `05_ASSET_LIFECYCLE/REQ-003_customer-checkin-success.png` | `/customer/rentals` | Customer | PASS |
| REQ-004 Usage Logging | `06_USAGE_LOGGING/REQ-004_usage-log-form.png` | `/dealer/assets` | Dealer | PASS |
| REQ-004 Usage Logging | `06_USAGE_LOGGING/REQ-004_usage-runtime-idle-fuel.png` | `/dealer/assets` | Dealer | PASS |
| REQ-006 Alerts (overdue) | `03_DEALER/REQ-011_dealer-control-tower-live-status.png` | `/dealer` | Dealer | PASS |
| REQ-007 Anomalies | `08_ANOMALIES/REQ-007_admin-anomalies-list.png` | `/admin/anomalies` | Admin | PASS |
| REQ-009 Forecasting | `09_FORECASTS/REQ-009_admin-forecasts.png` | `/admin/forecasts` | Admin | PASS |
| REQ-009 Forecasting | `09_FORECASTS/REQ-009_dealer-forecast-panel.png` | `/dealer` | Dealer | PASS |
| REQ-010 Recommendations | `10_RECOMMENDATIONS/REQ-010_dealer-action-queue-item-actioned.png` | `/dealer` | Dealer | PASS |
| REQ-010 Recommendations | `10_RECOMMENDATIONS/REQ-010_admin-recommendation-dismissed.png` | `/admin` | Admin | PASS |
| REQ-011 Control Tower live status | `04_ADMIN/REQ-011_admin-control-tower.png` | `/admin` | Admin | PASS |
| REQ-012 Utilization | `04_ADMIN/REQ-012_admin-utilization.png` | `/admin/utilization` | Admin | PASS |
| REQ-013 Action Queue | `10_RECOMMENDATIONS/REQ-013_dealer-action-queue.png` | `/dealer` | Dealer | PASS |
| REQ-021 Role selection/persistence | `01_LANDING/REQ-021_entry-landing-desktop.png` | `/` | (none) | PASS |
| REQ-021 Role selection/persistence | `01_LANDING/REQ-021_signed-in-no-role-yet.png` | `/` | New user | PASS |
| REQ-021 Role selection/persistence | `01_LANDING/REQ-021_role-selected-redirect.png` | `/` → `/dealer` | New user | PASS |
| REQ-021 Switch role | `04_ADMIN/REQ-021_switch-role-page.png` | `/switch-role` | Admin | PASS |
| REQ-022 Capacity optimization | `11_CAPACITY/REQ-022_admin-capacity.png` | `/admin/capacity` | Admin | PASS |
| REQ-022 Capacity optimization | `11_CAPACITY/REQ-022_customer-equipment-fit-hint.png` | `/customer/equipment/:id` | Customer | PASS |
| Error state | `13_ERROR_STATES/REQ-001_customer-equipment-not-found.png` | `/customer/equipment/<bad-id>` | Customer | PASS |
| Mobile — landing | `12_MOBILE/REQ-021_entry-landing-mobile.png` | `/` | (none) | PASS |
| Mobile — customer | `12_MOBILE/customer-discover-mobile.png` | `/customer` | Customer | PASS |
| Mobile — dealer control tower | `12_MOBILE/dealer-control-tower-mobile.png` | `/dealer` | Dealer | PASS (see `REMAINING_ISSUES.md` re: length) |
| Mobile — dealer assets | `12_MOBILE/dealer-asset-dashboard-mobile.png` | `/dealer/assets` | Dealer | PASS |
| Mobile — admin control tower | `12_MOBILE/admin-control-tower-mobile.png` | `/admin` | Admin | PASS |

Non-requirement-tagged screenshots (extra evidence, not double-counted above):
`entry-landing-mobile.png`, `my-rentals-after-return.png`.

**Correction:** the Discover page's type filter is implemented as button
"chips" ("All types" / "Excavator" / "Bulldozer" / etc. — see
`client/src/pages/customer/Discover.jsx`), not a `<select>`/combobox. The
verification script only probed for `<select>`/`role=combobox`, so it
correctly found none and skipped that specific interaction — the filter
itself is real and visible in `REQ-001_customer-discover-grid.png`, just not
separately screenshotted mid-click. Not a gap in the app, a gap in this
pass's script coverage.

Backend-only evidence (no screenshot, API/DB level):
`tests/browser/dup-checkout-response.json` (REQ-018, duplicate checkout
rejection, `409`).
