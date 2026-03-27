# Invite-Only Registration Requirements

## Overview
Gate `/register` behind a valid invite token. Only users with a valid invite link can create accounts.

## Requirements

### REQ 1: Token Validation
- REQ 1.1: Valid token returns invite data (email, role, propertyId, expiresAt)
- REQ 1.2: Unknown token returns InviteNotFoundError
- REQ 1.3: Expired token returns InviteExpiredError
- REQ 1.4: Already-used token returns InviteAlreadyUsedError

### REQ 2: Invite Creation
- REQ 2.1: Owner can create invite with email, role, and optional propertyId
- REQ 2.2: expiresAt is set to now + expiresInDays * 24h
- REQ 2.3: A UUID token is generated for each invite

### REQ 3: Token Redemption
- REQ 3.1: Redeeming a token marks it as used and returns invite data

### REQ 4: Invite Listing
- REQ 4.1: Owner can list all invites they created

### REQ 5: Invite Revocation
- REQ 5.1: Owner can revoke a pending invite they created
- REQ 5.2: Cannot revoke an invite created by another owner (ForbiddenError)
- REQ 5.3: Cannot revoke an already-used invite

## Definition of Done
- [ ] InviteService passes all unit tests
- [ ] API routes (create, list, validate, redeem, revoke) work correctly
- [ ] `/register` page requires a valid invite token
- [ ] Seed script creates the first owner without an invite
- [ ] i18n keys added for en + id
