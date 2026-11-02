/* Mantou · penyimpanan data bersama (hanya front-end, disimpan di localStorage browser).
   Dipakai oleh catatan-transaksi.html dan laporan-keuangan.html. */
(function (g) {
  'use strict';
  var KEY = 'mantou.warung.v1';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MONL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  var PRODUCTS = [
    { id: 'p1', name: 'Indomie Mi Goreng 85 g',       barcode: '089686170707',  category: 'Mi instan', unit: 'bungkus', cost: 2800,  price: 3500,  stock: 12 },
    { id: 'p2', name: 'AQUA Air Mineral 600 ml',       barcode: '8886008101053', category: 'Minuman',   unit: 'botol',   cost: 2500,  price: 3500,  stock: 18 },
    { id: 'p3', name: 'Beras Ramos 5 kg',              barcode: '200000000003',  category: 'Sembako',   unit: 'kantong', cost: 62000, price: 69000, stock: 6 },
    { id: 'p4', name: 'Minyakita 1 L',                 barcode: '8997212800011', category: 'Sembako',   unit: 'botol',   cost: 14500, price: 17000, stock: 16 },
    { id: 'p5', name: 'Gulaku Gula Pasir 1 kg',        barcode: '8995176101016', category: 'Sembako',   unit: 'kantong', cost: 15500, price: 18000, stock: 22 },
    { id: 'p6', name: 'Sariwangi Teh Asli 25 kantong', barcode: '8999999197019', category: 'Minuman',   unit: 'kotak',   cost: 6000,  price: 8000,  stock: 42 },
    { id: 'p7', name: 'Roma Kelapa 300 g',             barcode: '8996001301011', category: 'Camilan',   unit: 'bungkus', cost: 8000,  price: 10000, stock: 36 },
    { id: 'p8', name: 'Marjan Cocopandan 460 ml',      barcode: '8992802101019', category: 'Minuman',   unit: 'botol',   cost: 18000, price: 25000, stock: 20 }
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
    return { v: 1, products: prods, tx: tx, seq: { CT: sales.length, BK: exps.length } };
  }

  /* ---------- penyimpanan ---------- */
  var cache = null;
  function read() { try { var r = g.localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
  function save(s) { cache = s; try { g.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function get() {
    var s = read();
    if (s && s.tx && s.products) { cache = s; return s; }
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

  function reset() { cache = null; try { g.localStorage.removeItem(KEY); } catch (e) {} get(); }
  function clear() { var s = { v: 1, products: clone(PRODUCTS), tx: [], seq: { CT: 0, BK: 0 } }; save(s); }

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

  g.Mantou = { get: get, find: find, addSale: addSale, addExpense: addExpense, voidTx: voidTx, reset: reset, clear: clear,
               summary: summary, shortName: shortName, onChange: onChange, fmt: fmt };
})(window);
