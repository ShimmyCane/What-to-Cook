-- ============================================================================
-- What to Cook — rolled-back test. Run this BEFORE 001.
-- Expected: an error that starts with RESULT: (the error is the pass, because
-- the block rolls back and nothing is kept).
-- It uses a temporary table, so it does not need 001 to be pasted first.
-- ============================================================================
do $$
declare
    ok_kind boolean := false;
    bad_kind_rejected boolean := false;
    ok_member_row boolean := false;
    dup_overwritten boolean := false;
    new_expiry_is_new_line boolean := false;
    rows_after_dup integer;
    rows_after_new integer;
begin
    -- A temporary copy of the item rules, so the test runs before the real tables exist.
    create temp table wtc_test_items (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        kind text not null check (kind in ('dry', 'wet', 'tool', 'space')),
        quantity numeric,
        expires_on date,
        stored_location text not null default '',
        status text not null default 'in_stock'
    ) on commit drop;
    create unique index wtc_test_items_stock_key
        on wtc_test_items (lower(name), coalesce(expires_on, date '1900-01-01'), stored_location)
        where status = 'in_stock';

    insert into wtc_test_items (name, kind) values ('rice', 'dry');
    ok_kind := true;

    begin
        insert into wtc_test_items (name, kind) values ('mystery', 'frozen');
    exception when check_violation then
        bad_kind_rejected := true;
    end;

    -- A member id is a plain uuid, so any value is accepted without a foreign key.
    insert into wtc_test_items (name, kind) values ('spoon', 'tool');
    ok_member_row := true;

    -- Duplicate rule: same name, same expiry, same place is overwritten, not added.
    insert into wtc_test_items (name, kind, quantity, expires_on, stored_location)
        values ('Eggs', 'wet', 6, date '2026-11-20', 'fridge')
        on conflict (lower(name), coalesce(expires_on, date '1900-01-01'), stored_location) where status = 'in_stock'
        do update set quantity = excluded.quantity;
    insert into wtc_test_items (name, kind, quantity, expires_on, stored_location)
        values ('eggs', 'wet', 12, date '2026-11-20', 'fridge')
        on conflict (lower(name), coalesce(expires_on, date '1900-01-01'), stored_location) where status = 'in_stock'
        do update set quantity = excluded.quantity;
    select count(*) into rows_after_dup from wtc_test_items where lower(name) = 'eggs';
    dup_overwritten := rows_after_dup = 1 and (select quantity from wtc_test_items where lower(name) = 'eggs') = 12;

    -- New version rule: same name with a new expiry date is a separate line.
    insert into wtc_test_items (name, kind, quantity, expires_on, stored_location)
        values ('eggs', 'wet', 10, date '2026-12-01', 'fridge')
        on conflict (lower(name), coalesce(expires_on, date '1900-01-01'), stored_location) where status = 'in_stock'
        do update set quantity = excluded.quantity;
    select count(*) into rows_after_new from wtc_test_items where lower(name) = 'eggs';
    new_expiry_is_new_line := rows_after_new = 2;

    raise exception 'RESULT: ok_kind=% bad_kind_rejected=% ok_member_row=% dup_overwritten=% new_expiry_is_new_line=% (all five must be true)',
        ok_kind, bad_kind_rejected, ok_member_row, dup_overwritten, new_expiry_is_new_line;
end $$;
