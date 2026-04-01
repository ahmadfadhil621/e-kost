# RT-6 — Tasks

## Layer 1: Domain
- [ ] Add `totalPages?: number` to `PaymentWithCount` interface
- [ ] Update `IPaymentRepository.findByTenant` signature to accept optional pagination options

## Layer 2: Repository
- [ ] Update `PrismaPaymentRepository.findByTenant` to support `limit` + `page` options
- [ ] Update `StubPaymentRepository.findByTenant` accordingly

## Layer 3: Service
- [ ] Update `PaymentService.listTenantPayments` to accept + forward pagination options

## Layer 4: API
- [ ] Parse `?limit` and `?page` from query string in tenant payments GET handler
- [ ] Pass through to service; include `totalPages` in response when `limit` present

## Layer 5: UI
- [ ] `PaymentList`: move delete button to 3-dot DropdownMenu
- [ ] `TenantPaymentSection`: add `propertyId` prop, show "View all" link when `count > 3`
- [ ] Tenant detail page: pass `propertyId` to `TenantPaymentSection`, use `?limit=3` param
- [ ] New Full History page with pagination controls

## Layer 6: i18n
- [ ] Add new keys to `locales/en.json`
- [ ] Add new keys to `locales/id.json`
