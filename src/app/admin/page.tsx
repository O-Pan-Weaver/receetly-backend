// src/app/admin/page.tsx
import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface Merchant {
  id: string;
  name: string;
  contact_email: string | null;
}

interface Shop {
  id: string;
  name: string;
  merchant_id: string;
}

interface Terminal {
  id: string;
  name: string;
  shop_id: string;
  public_id: string;
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // 1. Load current data
  const merchantsResult = await sql`
    SELECT id, name, contact_email
    FROM merchants
    ORDER BY created_at DESC
  `;
  const merchants = merchantsResult as Merchant[];

  const shopsResult = await sql`
    SELECT id, name, merchant_id
    FROM shops
    ORDER BY created_at DESC
  `;
  const shops = shopsResult as Shop[];

  const terminalsResult = await sql`
    SELECT id, name, shop_id, public_id
    FROM terminals
    ORDER BY created_at DESC
  `;
  const terminals = terminalsResult as Terminal[];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // 2. Server actions

  async function createMerchant(formData: FormData) {
    'use server';

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim() || null;

    if (!name) return;

    await sql`
      INSERT INTO merchants (name, contact_email)
      VALUES (${name}, ${email})
    `;

    revalidatePath('/admin');
  }

  async function createShop(formData: FormData) {
    'use server';

    const name = String(formData.get('name') || '').trim();
    const merchantId = String(formData.get('merchantId') || '').trim();

    if (!name || !merchantId) return;

    await sql`
      INSERT INTO shops (name, merchant_id)
      VALUES (${name}, ${merchantId})
    `;

    revalidatePath('/admin');
  }

  async function createTerminal(formData: FormData) {
    'use server';

    const name = String(formData.get('name') || '').trim();
    const shopId = String(formData.get('shopId') || '').trim();
    const publicId = String(formData.get('publicId') || '').trim();

    if (!name || !shopId || !publicId) return;

    await sql`
      INSERT INTO terminals (name, shop_id, public_id)
      VALUES (${name}, ${shopId}, ${publicId})
    `;

    revalidatePath('/admin');
  }

  // 3. Render page
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Receetly Admin
          </h1>
          <p className="text-sm text-slate-500">
            Create merchants, shops, and terminals. Use the terminal URLs to
            generate QR codes for each terminal.
          </p>
        </header>

        {/* Create Merchant */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Create Merchant
          </h2>
          <form action={createMerchant} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Merchant name
                </label>
                <input
                  name="name"
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Joe&apos;s Convenience"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Contact email (optional)
                </label>
                <input
                  name="email"
                  type="email"
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder="owner@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Save merchant
            </button>
          </form>

          {merchants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Existing merchants
              </h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {merchants.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium">{m.name}</span>
                    {m.contact_email && (
                      <span className="text-slate-500">
                        {' '}
                        – {m.contact_email}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Create Shop */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Create Shop / Store
          </h2>
          {merchants.length === 0 ? (
            <p className="text-sm text-slate-500">
              Create a merchant first before adding shops.
            </p>
          ) : (
            <form action={createShop} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Shop name
                  </label>
                  <input
                    name="name"
                    className="border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Joe&apos;s CBD Store"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Merchant
                  </label>
                  <select
                    name="merchantId"
                    className="border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select merchant…</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Save shop
              </button>
            </form>
          )}

          {shops.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Existing shops
              </h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {shops.map((s) => {
                  const merchant = merchants.find(
                    (m) => m.id === s.merchant_id,
                  );
                  return (
                    <li key={s.id}>
                      <span className="font-medium">{s.name}</span>
                      {merchant && (
                        <span className="text-slate-500">
                          {' '}
                          – {merchant.name}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Create Terminal */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Create Terminal
          </h2>
          {shops.length === 0 ? (
            <p className="text-sm text-slate-500">
              Create a shop first before adding terminals.
            </p>
          ) : (
            <form action={createTerminal} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Terminal name
                  </label>
                  <input
                    name="name"
                    className="border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Till 1"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Shop
                  </label>
                  <select
                    name="shopId"
                    className="border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select shop…</option>
                    {shops.map((s) => {
                      const merchant = merchants.find(
                        (m) => m.id === s.merchant_id,
                      );
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} {merchant ? `(${merchant.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Public ID (for QR)
                  </label>
                  <input
                    name="publicId"
                    className="border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="e.g. JOE-CBD-1"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    This must be unique. It will appear in the QR URL.
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Save terminal
              </button>
            </form>
          )}

          {terminals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Terminals &amp; QR URLs
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-3 py-2">Terminal</th>
                      <th className="text-left px-3 py-2">Shop</th>
                      <th className="text-left px-3 py-2">Merchant</th>
                      <th className="text-left px-3 py-2">Public ID</th>
                      <th className="text-left px-3 py-2">QR URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terminals.map((t) => {
                      const shop = shops.find((s) => s.id === t.shop_id);
                      const merchant = shop
                        ? merchants.find((m) => m.id === shop.merchant_id)
                        : null;
                      const qrUrl = `${baseUrl.replace(/\/$/, '')}/w/${
                        t.public_id
                      }`;
                      return (
                        <tr key={t.id} className="border-t border-slate-200">
                          <td className="px-3 py-2">{t.name}</td>
                          <td className="px-3 py-2">{shop?.name ?? '-'}</td>
                          <td className="px-3 py-2">
                            {merchant?.name ?? '-'}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {t.public_id}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-[11px] break-all">
                                {qrUrl}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Use this URL in a QR generator for the
                                terminal.
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tip: Paste each QR URL into Canva or any QR generator to create
                printable stickers for each terminal.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
