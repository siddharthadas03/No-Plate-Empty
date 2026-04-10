# Postman Run Order

Import these two files in Postman:
- `NoPlateEmpty-Backend.postman_collection.json`
- `NoPlateEmpty-Local.postman_environment.json`

Then run requests in this exact order:
1. `01 Auth > Register SUPER_ADMIN`
2. `01 Auth > Login SUPER_ADMIN`
3. `01 Auth > Register DONOR`
4. `01 Auth > Register NGO`
5. `02 Admin > Approve DONOR`
6. `02 Admin > Approve NGO`
7. `01 Auth > Login DONOR`
8. `01 Auth > Login NGO`
9. Run all requests under `03 Category`
10. Run all requests under `04 Doner`
11. Run all requests under `05 Food`
12. Run all requests under `06 Orders`

Notes:
- Protected APIs need Bearer token. Collection already uses env variables.
- `Delete Food` endpoint is `PUT /api/v1/food/delete/:id` in this backend.
- Order status transitions:
  - `pending -> accepted/rejected`
  - `accepted -> completed`
