/* Mantou · penyimpanan data bersama (hanya front-end, disimpan di localStorage browser).
   Dipakai oleh catatan-transaksi.html dan laporan-keuangan.html. */
(function (g) {
  'use strict';
  var KEY = 'mantou.warung.v1';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MONL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  var PRODUCTS = [
    { id: 'p1', name: 'Indomie Mi Goreng 85 g',       barcode: '089686170707',  category: 'Mi instan', unit: 'bungkus', cost: 2800,  price: 3500,  stock: 12, min: 20 },
    { id: 'p2', name: 'AQUA Air Mineral 600 ml',       barcode: '8886008101053', category: 'Minuman',   unit: 'botol',   cost: 2500,  price: 3500,  stock: 18, min: 24 },
    { id: 'p3', name: 'Beras Ramos 5 kg',              barcode: '200000000003',  category: 'Sembako',   unit: 'kantong', cost: 62000, price: 69000, stock: 6, min: 8 },
    { id: 'p4', name: 'Minyakita 1 L',                 barcode: '8997212800011', category: 'Sembako',   unit: 'botol',   cost: 14500, price: 17000, stock: 16, min: 10 },
    { id: 'p5', name: 'Gulaku Gula Pasir 1 kg',        barcode: '8995176101016', category: 'Sembako',   unit: 'kantong', cost: 15500, price: 18000, stock: 22, min: 10 },
    { id: 'p6', name: 'Sariwangi Teh Asli 25 kantong', barcode: '8999999197019', category: 'Minuman',   unit: 'kotak',   cost: 6000,  price: 8000,  stock: 42, min: 15 },
    { id: 'p7', name: 'Roma Kelapa 300 g',             barcode: '8996001301011', category: 'Camilan',   unit: 'bungkus', cost: 8000,  price: 10000, stock: 36, min: 15 },
    { id: 'p8', name: 'Marjan Cocopandan 460 ml',      barcode: '8992802101019', category: 'Minuman',   unit: 'botol',   cost: 18000, price: 25000, stock: 20, min: 10 }
  ];
  var EXPENSES = [
    { category: 'Ongkos angkut',     desc: 'Ongkos angkut',        amount: 45000 },
    { category: 'Listrik & air',     desc: 'Token listrik',        amount: 100000 },
    { category: 'Kemasan & plastik', desc: 'Kantong plastik',      amount: 25000 },
    { category: 'Ongkos angkut',     desc: 'Ongkos angkut barang', amount: 40000 },
    { category: 'Perlengkapan',      desc: 'Alat tulis & nota',    amount: 18000 },
    { category: 'Upah pekerja',      desc: 'Upah harian penjaga',  amount: 60000 },
    { category: 'Lainnya',           desc: 'Iuran kebersihan',     amount: 15000 }
  ];
  var OWNER = 'Bu Ratna · Pemilik';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n, l) { n = String(n); l = l || 2; while (n.length < l) n = '0' + n; return n; }
  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- format ---------- */
  var fmt = {
    rupiah: function (n) {
      n = Math.round(Number(n) || 0);
      var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (n < 0 ? '–' : '') + 'Rp' + s;
    },
    time: function (ts) { var d = new Date(ts); return pad(d.getHours()) + '.' + pad(d.getMinutes()); },
    shortDate: function (ts) { var d = new Date(ts); return d.getDate() + ' ' + MON[d.getMonth()]; },
    dateTime: function (ts) { return fmt.shortDate(ts) + ' · ' + fmt.time(ts); },
    longDate: function (ts) { var d = new Date(ts); return d.getDate() + ' ' + MONL[d.getMonth()] + ' ' + d.getFullYear(); },
    fullDate: function (ts) { var d = new Date(ts); return DAYS[d.getDay()] + ', ' + fmt.longDate(ts); },
    dateInput: function (ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    isoLocal: function (ts) { return fmt.dateInput(ts) + 'T' + fmt.time(ts).replace('.', ':'); },
    parseDate: function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : NaN; },
    parseDT: function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : NaN; },
    monthName: function (i) { return MONL[i]; },
    monthShort: function (i) { return MON[i]; }
  };

  /* ---------- data awal ---------- */
  function buildSale(id, ts, lines, note) {
    var items = [], rev = 0, cogs = 0, units = 0;
    lines.forEach(function (l) {
      items.push({ pid: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price, cost: l.p.cost });
      rev += l.p.price * l.qty; cogs += l.p.cost * l.qty; units += l.qty;
    });
    return { id: id, type: 'sale', ts: ts, by: OWNER, note: note || '', items: items, revenue: rev, cogs: cogs, units: units };
  }

  function seed() {
    var rnd = rng(20260607), now = Date.now(), t0 = new Date();
    var prods = clone(PRODUCTS), sales = [], exps = [];
    for (var d = 6; d >= 0; d--) {
      var day = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - d).getTime();
      var n = 6 + Math.floor(rnd() * 6);
      for (var i = 0; i < n; i++) {
        var ts = day + (7 * 60 + Math.floor(rnd() * 810)) * 60000;
        var k = 1 + Math.floor(rnd() * 3), pool = prods.slice(), lines = [];
        while (k-- > 0 && pool.length) {
          var p = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
          lines.push({ p: p, qty: 1 + Math.floor(rnd() * (p.price > 15000 ? 2 : 3)) });
        }
        if (ts <= now - 300000) sales.push({ ts: ts, lines: lines });
      }
      var et = day + (8 * 60 + Math.floor(rnd() * 600)) * 60000, ex = EXPENSES[6 - d];
      if (et <= now - 300000) exps.push({ ts: et, ex: ex });
    }
    sales.sort(function (a, b) { return a.ts - b.ts; });
    exps.sort(function (a, b) { return a.ts - b.ts; });
    var tx = [];
    sales.forEach(function (s, i) { tx.push(buildSale('CT-' + pad(i + 1, 4), s.ts, s.lines, '')); });
    exps.forEach(function (e, i) {
      tx.push({ id: 'BK-' + pad(i + 1, 4), type: 'expense', ts: e.ts, by: OWNER, category: e.ex.category, desc: e.ex.desc, amount: e.ex.amount, note: '' });
    });
    prods.forEach(function (p) { p.upd = now; });
    return { v: 1, products: prods, tx: tx, moves: [], seq: { CT: sales.length, BK: exps.length, P: prods.length, ST: 0 } };
  }

  /* ---------- penyimpanan ---------- */
  var cache = null;
  function read() { try { var r = g.localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
  function save(s) { cache = s; try { g.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function get() {
    var s = read();
    if (s && s.tx && s.products) {
      // data lama (tanpa batas minimum stok) dilengkapi dari daftar produk bawaan
      var dirty = false;
      s.products.forEach(function (p) { if (typeof p.min !== 'number') { var d = find(PRODUCTS, p.id); p.min = d ? d.min : 10; dirty = true; } });
      s.products.forEach(function (p) { if (!p.upd) { p.upd = Date.now(); dirty = true; } });
      if (!s.moves) { s.moves = []; dirty = true; }
      if (!s.seq.ST || !s.seq.P) {
        s.seq.ST = s.seq.ST || s.moves.length;
        s.seq.P = s.seq.P || s.products.reduce(function (m, p) { return Math.max(m, parseInt(String(p.id).slice(1), 10) || 0); }, 0);
        dirty = true;
      }
      if (dirty) save(s);
      cache = s; return s;
    }
    if (cache) return cache;
    cache = seed(); save(cache); return cache;
  }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function fail(m) { return { ok: false, error: m }; }

  function addSale(inp) {
    var s = get(), lines = [], seen = {};
    if (!(inp.ts > 0)) return fail('Tanggal & waktu penjualan belum valid.');
    var raw = inp.items || [];
    for (var i = 0; i < raw.length; i++) {
      var p = find(s.products, raw[i].pid), qty = Number(raw[i].qty);
      if (!p) return fail('Produk belum dipilih.');
      if (seen[p.id]) return fail(p.name + ' dipilih lebih dari sekali.');
      if (!(qty >= 1) || qty !== Math.floor(qty)) return fail('Jumlah ' + p.name + ' minimal 1.');
      if (qty > p.stock) return fail('Stok ' + p.name + ' tidak cukup (tersedia ' + p.stock + ' ' + p.unit + ').');
      seen[p.id] = true; lines.push({ p: p, qty: qty });
    }
    if (!lines.length) return fail('Pilih minimal satu produk.');
    s.seq.CT += 1;
    var tx = buildSale('CT-' + pad(s.seq.CT, 4), inp.ts, lines, inp.note);
    lines.forEach(function (l) { l.p.stock -= l.qty; });
    s.tx.push(tx); save(s);
    return { ok: true, tx: tx };
  }

  function addExpense(inp) {
    var s = get(), amount = Number(inp.amount);
    if (!(inp.ts > 0)) return fail('Tanggal & waktu pengeluaran belum valid.');
    if (!inp.category) return fail('Pilih kategori pengeluaran.');
    if (!(amount >= 1)) return fail('Isi jumlah pengeluaran.');
    s.seq.BK += 1;
    var tx = { id: 'BK-' + pad(s.seq.BK, 4), type: 'expense', ts: inp.ts, by: OWNER, category: inp.category,
               desc: (inp.desc || '').trim() || inp.category, amount: Math.round(amount), note: inp.note || '' };
    s.tx.push(tx); save(s);
    return { ok: true, tx: tx };
  }

  function voidTx(id) {
    var s = get(), idx = -1;
    for (var i = 0; i < s.tx.length; i++) if (s.tx[i].id === id) idx = i;
    if (idx < 0) return fail('Catatan tidak ditemukan.');
    var tx = s.tx[idx];
    if (tx.type === 'sale') tx.items.forEach(function (it) { var p = find(s.products, it.pid); if (p) p.stock += it.qty; });
    s.tx.splice(idx, 1); save(s);
    return { ok: true };
  }


  /* ---------- produk & stok ---------- */
  function status(p) { return p.stock <= 0 ? 'habis' : p.stock < p.min ? 'rendah' : 'cukup'; }
  function int(v) { v = Number(v); return v >= 0 && v === Math.floor(v) ? v : NaN; }

  function cleanProduct(s, d, selfId) {
    var name = String(d.name || '').trim(), bc = String(d.barcode || '').replace(/\s/g, ''),
        cat = String(d.category || '').trim(), unit = String(d.unit || '').trim(),
        cost = int(d.cost), price = int(d.price), min = int(d.min);
    if (!name) return fail('Nama produk wajib diisi.');
    if (bc && !/^\d{6,}$/.test(bc)) return fail('Barcode hanya berisi angka, minimal 6 digit.');
    if (!cat) return fail('Kategori wajib diisi.');
    if (!unit) return fail('Satuan wajib diisi (misalnya bungkus, botol).');
    if (isNaN(cost)) return fail('Biaya perolehan harus berupa angka bulat, minimal 0.');
    if (!(price >= 1)) return fail('Harga jual harus diisi, minimal Rp1.');
    if (isNaN(min)) return fail('Batas minimum stok harus berupa angka bulat, minimal 0.');
    for (var i = 0; i < s.products.length; i++) {
      var q = s.products[i]; if (q.id === selfId) continue;
      if (q.name.toLowerCase() === name.toLowerCase()) return fail('Produk "' + q.name + '" sudah terdaftar.');
      if (bc && q.barcode && q.barcode.replace(/^0+/, '') === bc.replace(/^0+/, '')) return fail('Barcode ini sudah dipakai ' + q.name + '.');
    }
    return { ok: true, f: { name: name, barcode: bc, category: cat, unit: unit, cost: cost, price: price, min: min } };
  }
  function addMove(s, m) {
    s.seq.ST += 1; m.id = 'ST-' + pad(s.seq.ST, 4); m.by = OWNER; s.moves.push(m); return m;
  }

  function addProduct(inp) {
    var s = get(), c = cleanProduct(s, inp, null), st = int(inp.stock);
    if (!c.ok) return c;
    if (isNaN(st)) return fail('Stok awal harus berupa angka bulat, minimal 0.');
    s.seq.P += 1;
    var p = c.f; p.id = 'p' + s.seq.P; p.stock = st; p.upd = Date.now();
    s.products.push(p);
    if (st > 0) addMove(s, { type: 'in', pid: p.id, name: p.name, qty: st, before: 0, after: st, ts: Date.now(), note: 'Stok awal' });
    save(s); return { ok: true, product: p };
  }
  function updateProduct(id, inp) {
    var s = get(), p = find(s.products, id), c;
    if (!p) return fail('Produk tidak ditemukan.');
    c = cleanProduct(s, inp, id); if (!c.ok) return c;
    var oldPrice = p.price, priceChanged = p.price !== c.f.price || p.cost !== c.f.cost;
    for (var k in c.f) p[k] = c.f[k];
    if (p.promo && c.f.price !== oldPrice) delete p.promo;
    if (priceChanged) p.upd = Date.now();
    save(s); return { ok: true, product: p };
  }
  function removeProduct(id) {
    var s = get(), i;
    for (i = 0; i < s.products.length; i++) if (s.products[i].id === id) break;
    if (i === s.products.length) return fail('Produk tidak ditemukan.');
    s.products.splice(i, 1); save(s); return { ok: true };
  }
  function addStockIn(inp) {
    var s = get(), p = find(s.products, inp.pid), qty = Number(inp.qty), cost = inp.cost === '' || inp.cost == null ? null : int(inp.cost);
    if (!p) return fail('Pilih produk yang barangnya masuk.');
    if (!(inp.ts > 0)) return fail('Tanggal & waktu belum valid.');
    if (!(qty >= 1) || qty !== Math.floor(qty)) return fail('Jumlah barang masuk minimal 1.');
    if (cost !== null && isNaN(cost)) return fail('Biaya perolehan baru harus berupa angka bulat.');
    var before = p.stock; p.stock += qty;
    if (cost !== null && cost !== p.cost) { p.cost = cost; p.upd = Date.now(); }
    var m = addMove(s, { type: 'in', pid: p.id, name: p.name, qty: qty, before: before, after: p.stock, ts: inp.ts, note: inp.note || '' });
    save(s); return { ok: true, move: m, product: p };
  }
  function adjustStock(inp) {
    var s = get(), p = find(s.products, inp.pid), n = int(inp.counted);
    if (!p) return fail('Pilih produk yang stoknya disesuaikan.');
    if (!(inp.ts > 0)) return fail('Tanggal & waktu belum valid.');
    if (isNaN(n)) return fail('Isi jumlah stok fisik (angka bulat, minimal 0).');
    if (n === p.stock) return fail('Stok fisik sama dengan stok tercatat; tidak ada yang perlu disesuaikan.');
    if (!String(inp.note || '').trim()) return fail('Isi alasan penyesuaian (misalnya rusak, hilang, salah hitung).');
    var before = p.stock; p.stock = n;
    var m = addMove(s, { type: 'adj', pid: p.id, name: p.name, qty: n - before, before: before, after: n, ts: inp.ts, note: inp.note.trim() });
    save(s); return { ok: true, move: m, product: p };
  }
  function voidMove(id) {
    var s = get(), i, m, p;
    for (i = 0; i < s.moves.length; i++) if (s.moves[i].id === id) break;
    if (i === s.moves.length) return fail('Catatan stok tidak ditemukan.');
    m = s.moves[i]; p = find(s.products, m.pid);
    if (p) {
      if (p.stock - m.qty < 0) return fail('Tidak bisa dibatalkan: stok ' + p.name + ' akan menjadi negatif.');
      p.stock -= m.qty;
    }
    s.moves.splice(i, 1); save(s); return { ok: true };
  }
  function soldUnits(from, to) {
    var out = {};
    get().tx.forEach(function (t) {
      if (t.type !== 'sale' || t.ts < from || t.ts > to) return;
      t.items.forEach(function (it) { out[it.pid] = (out[it.pid] || 0) + it.qty; });
    });
    return out;
  }

  /* ---------- analisis (dipakai analisis-stok, rekomendasi-diskon, analisis-harga) ---------- */
  function range(p) {
    var n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate();
    var days = p === '14' ? 14 : p === '30' ? 30 : p === 'month' ? d : 7;
    var f = new Date(y, m, d - days + 1), from = f.getTime(), to = new Date(y, m, d + 1).getTime() - 1;
    var label = f.getMonth() === m ? f.getDate() + '–' + d + ' ' + MONL[m] + ' ' + y
      : f.getDate() + ' ' + MON[f.getMonth()] + ' – ' + d + ' ' + MON[m] + ' ' + y;
    return { key: p, from: from, to: to, days: days, label: label };
  }
  // cover = berapa hari stok cukup dengan laju jual periode itu; lambat = stok di atas minimum tapi cukup > coverDays hari
  function analyze(r, coverDays) {
    var sold = soldUnits(r.from, r.to), s = get(), DAY = 86400000, first = Infinity;
    s.tx.forEach(function (t) { if (t.type === 'sale' && t.ts < first) first = t.ts; });
    // hari efektif: tidak lebih lama dari riwayat penjualan yang ada, supaya laju jual tidak "encer"
    var eff = first === Infinity ? r.days : Math.max(1, Math.min(r.days, Math.round((fmt.parseDate(fmt.dateInput(r.to)) - fmt.parseDate(fmt.dateInput(Math.max(r.from, first)))) / DAY) + 1));
    var list = s.products.map(function (p) {
      var u = sold[p.id] || 0, rate = u / eff;
      return { p: p, sold: u, rate: rate, days: eff, cover: rate > 0 ? p.stock / rate : (p.stock > 0 ? Infinity : 0), move: 'normal' };
    });
    var fast = list.filter(function (x) { return x.sold > 0; }).sort(function (a, b) { return b.sold - a.sold; }).slice(0, 3);
    list.forEach(function (x) {
      if (x.p.stock > 0 && x.p.stock >= x.p.min && x.cover > coverDays) x.move = 'lambat';
      else if (fast.indexOf(x) > -1) x.move = 'cepat';
    });
    return list;
  }
  // usulan diskon ≈ 40% dari margin kotor (5–15%); 0 bila margin terlalu tipis
  function suggestDiscount(p) {
    var mg = p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0;
    if (mg < 8) return 0;
    return Math.max(5, Math.min(15, Math.round(mg * 0.4)));
  }
  function discounted(price, pct) { return Math.round(price * (1 - pct / 100) / 100) * 100; }
  function applyPrice(id, price, pct) {
    var s = get(), p = find(s.products, id); price = Math.round(Number(price));
    if (!p) return fail('Produk tidak ditemukan.');
    if (!(price >= 1)) return fail('Harga tidak valid.');
    if (pct) p.promo = { base: p.promo ? p.promo.base : p.price, pct: pct, ts: Date.now() }; else delete p.promo;
    p.price = price; p.upd = Date.now(); save(s); return { ok: true, product: p };
  }
  function revertPromo(id) {
    var s = get(), p = find(s.products, id);
    if (!p || !p.promo) return fail('Tidak ada diskon aktif pada produk ini.');
    p.price = p.promo.base; delete p.promo; p.upd = Date.now(); save(s); return { ok: true, product: p };
  }
  // biaya tambahan per unit yang disarankan dari pengeluaran angkut & kemasan 7 hari terakhir
  function extraCostHint() {
    var r = range('7'), s = get(), tot = 0, units = 0, k;
    s.tx.forEach(function (t) {
      if (t.ts < r.from || t.ts > r.to) return;
      if (t.type === 'expense' && /angkut|kemasan/i.test(t.category)) tot += t.amount;
      if (t.type === 'sale') units += t.units;
    });
    return { total: tot, units: units, perUnit: units ? Math.round(tot / units / 10) * 10 : 0 };
  }

  function reset() { cache = null; try { g.localStorage.removeItem(KEY); } catch (e) {} get(); }
  function clear() { var s = { v: 1, products: clone(PRODUCTS), tx: [], moves: [], seq: { CT: 0, BK: 0, P: PRODUCTS.length, ST: 0 } }; s.products.forEach(function (p) { p.upd = Date.now(); }); save(s); }

  function shortName(n) { return String(n).split(' ')[0]; }
  function summary(tx) {
    if (tx.type === 'expense') return tx.desc;
    var n = tx.items;
    if (n.length === 1) return n[0].name;
    if (n.length === 2) return shortName(n[0].name) + ' & ' + shortName(n[1].name);
    return shortName(n[0].name) + ', ' + shortName(n[1].name) + ' +' + (n.length - 2);
  }

  function onChange(cb) { g.addEventListener('storage', function (e) { if (e.key === KEY) cb(); }); }

  function setHeaderDate() {
    var label = fmt.fullDate(Date.now()), spans = document.querySelectorAll('header span');
    for (var i = 0; i < spans.length; i++) if (/Juni 2026/.test(spans[i].textContent) && spans[i].children.length === 0) spans[i].textContent = label;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setHeaderDate); else setHeaderDate();

  g.Mantou = { get: get, find: find, status: status, addProduct: addProduct, updateProduct: updateProduct, removeProduct: removeProduct,
               addStockIn: addStockIn, adjustStock: adjustStock, voidMove: voidMove, soldUnits: soldUnits, range: range, analyze: analyze, suggestDiscount: suggestDiscount, discounted: discounted, applyPrice: applyPrice, revertPromo: revertPromo, extraCostHint: extraCostHint, addSale: addSale, addExpense: addExpense, voidTx: voidTx, reset: reset, clear: clear,
               summary: summary, shortName: shortName, onChange: onChange, fmt: fmt };
})(window);
