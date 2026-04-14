/**
 * In-memory mock of the Supabase client for testing.
 *
 * Instead of hitting a real database, this stores rows in plain arrays.
 * When the module calls supabase.from("daily_entries").update(...),
 * this mock intercepts the call and modifies the in-memory data.
 *
 * This lets us:
 * - Set up specific test scenarios (e.g., "3 successes, remove the middle one")
 * - Assert on the resulting state (e.g., "remaining are numbered 1 and 2")
 * - Run tests instantly with no network or database
 */

type Row = Record<string, unknown>;

interface TableStore {
  rows: Row[];
}

/**
 * Create a mock Supabase client backed by in-memory tables.
 * Pass initial data like: { daily_entries: [{ id: "1", status: "success", ... }] }
 */
export function createMockSupabase(initialData: Record<string, Row[]> = {}) {
  const tables: Record<string, TableStore> = {};

  // Initialize tables with provided data
  for (const [name, rows] of Object.entries(initialData)) {
    tables[name] = { rows: rows.map((r) => ({ ...r })) };
  }

  function getTable(name: string): TableStore {
    if (!tables[name]) tables[name] = { rows: [] };
    return tables[name];
  }

  /** Helper to read the current state of a table (for assertions in tests) */
  function getRows(tableName: string): Row[] {
    return getTable(tableName).rows;
  }

  /**
   * Build a chainable query builder that mimics Supabase's API.
   * Supports: select, insert, update, upsert, delete, eq, neq, in, lte,
   * order, limit, single, maybeSingle
   */
  function from(tableName: string) {
    const table = getTable(tableName);
    let filters: ((row: Row) => boolean)[] = [];
    let orderBy: { column: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;

    function applyFilters(rows: Row[]): Row[] {
      let result = rows;
      for (const f of filters) {
        result = result.filter(f);
      }
      if (orderBy) {
        const { column, ascending } = orderBy;
        result = [...result].sort((a, b) => {
          const va = String(a[column] ?? "");
          const vb = String(b[column] ?? "");
          return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
        });
      }
      if (limitCount !== null) {
        result = result.slice(0, limitCount);
      }
      return result;
    }

    const builder = {
      // Filters
      eq(col: string, val: unknown) {
        filters.push((row) => row[col] === val);
        return builder;
      },
      neq(col: string, val: unknown) {
        filters.push((row) => row[col] !== val);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        filters.push((row) => vals.includes(row[col]));
        return builder;
      },
      lte(col: string, val: unknown) {
        filters.push((row) => String(row[col] ?? "") <= String(val));
        return builder;
      },

      // Modifiers
      order(col: string, opts?: { ascending?: boolean }) {
        orderBy = { column: col, ascending: opts?.ascending ?? true };
        return builder;
      },
      limit(n: number) {
        limitCount = n;
        return builder;
      },

      // Terminal operations
      select(_cols?: string, _opts?: Record<string, unknown>) {
        // Return a chainable query that resolves to filtered data.
        // Key: eq/neq/order etc must return THIS object (not builder)
        // so the then() method stays reachable in the chain.
        const selectResult: Record<string, unknown> = {
          eq(col: string, val: unknown) {
            filters.push((row) => row[col] === val);
            return selectResult;
          },
          neq(col: string, val: unknown) {
            filters.push((row) => row[col] !== val);
            return selectResult;
          },
          in(col: string, vals: unknown[]) {
            filters.push((row) => vals.includes(row[col]));
            return selectResult;
          },
          lte(col: string, val: unknown) {
            filters.push((row) => String(row[col] ?? "") <= String(val));
            return selectResult;
          },
          order(col: string, opts?: { ascending?: boolean }) {
            orderBy = { column: col, ascending: opts?.ascending ?? true };
            return selectResult;
          },
          limit(n: number) {
            limitCount = n;
            return selectResult;
          },
          single() {
            const rows = applyFilters(table.rows);
            return Promise.resolve({
              data: rows[0] ?? null,
              error: rows.length === 0 ? { code: "PGRST116", message: "not found" } : null,
            });
          },
          maybeSingle() {
            const rows = applyFilters(table.rows);
            return Promise.resolve({ data: rows[0] ?? null, error: null });
          },
          then(resolve: (val: { data: Row[]; error: null; count?: number }) => void) {
            const rows = applyFilters(table.rows);
            const countOpt = _opts && "count" in _opts;
            resolve({
              data: rows,
              error: null,
              ...(countOpt ? { count: rows.length } : {}),
            });
          },
        };
        return selectResult;
      },

      insert(data: Row | Row[]) {
        const rows = Array.isArray(data) ? data : [data];
        for (const row of rows) {
          const newRow = {
            id: row.id ?? `mock-${Math.random().toString(36).slice(2, 9)}`,
            ...row,
            created_at: row.created_at ?? new Date().toISOString(),
          };
          table.rows.push(newRow);
        }
        return Promise.resolve({ data: null, error: null });
      },

      update(data: Partial<Row>) {
        // Returns a builder that applies the update when filters resolve
        const updateBuilder = {
          eq(col: string, val: unknown) {
            filters.push((row) => row[col] === val);
            return updateBuilder;
          },
          neq(col: string, val: unknown) {
            filters.push((row) => row[col] !== val);
            return updateBuilder;
          },
          in(col: string, vals: unknown[]) {
            filters.push((row) => vals.includes(row[col]));
            return updateBuilder;
          },
          then(resolve: (val: { data: null; error: null }) => void) {
            for (const row of table.rows) {
              if (filters.every((f) => f(row))) {
                Object.assign(row, data);
              }
            }
            resolve({ data: null, error: null });
          },
        };
        return updateBuilder;
      },

      upsert(data: Row, opts?: { onConflict?: string }) {
        const conflictCols = opts?.onConflict?.split(",").map((c) => c.trim()) ?? ["id"];
        const existing = table.rows.find((row) =>
          conflictCols.every((col) => row[col] === data[col])
        );
        if (existing) {
          Object.assign(existing, data);
        } else {
          const newRow = {
            id: data.id ?? `mock-${Math.random().toString(36).slice(2, 9)}`,
            ...data,
            created_at: data.created_at ?? new Date().toISOString(),
          };
          table.rows.push(newRow);
        }
        return Promise.resolve({ data: null, error: null });
      },

      delete() {
        const deleteBuilder = {
          eq(col: string, val: unknown) {
            filters.push((row) => row[col] === val);
            return deleteBuilder;
          },
          then(resolve: (val: { data: null; error: null }) => void) {
            table.rows = table.rows.filter((row) => !filters.every((f) => f(row)));
            resolve({ data: null, error: null });
          },
        };
        return deleteBuilder;
      },
    };

    return builder;
  }

  return {
    from,
    getRows,
  };
}

/** Type that makes the mock compatible with TypedSupabaseClient */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockSupabase = ReturnType<typeof createMockSupabase>;
