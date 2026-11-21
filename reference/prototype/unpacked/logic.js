class Component extends DCLogic {
  static DATA = /* see data.json */ {};
  constructor(props) {
    super(props);
    const D = Component.DATA;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("fixit:saved") || "[]"); } catch (e) {}
    const route = this.parse();
    this.state = {
      route, hq: "", hloc: "",
      dq: "", dloc: "", cats: [], minRating: 0, verifiedOnly: false, maxPrice: 100, sort: "rating",
      discKey: "", lastResults: "#/discover?q=&loc=",
      saved, tipOpen: false, modal: null,
      statuses: Object.fromEntries(D.sampleRequests.map(r => [r.id, r.status])), filter: "All", toast: "", last: null, flash: null
    };
    if (route.page === "discover") Object.assign(this.state, this.discoverFromRoute(route), { discKey: route.key, lastResults: "#" + route.key });
  }
  componentDidMount() {
    if (!location.hash) history.replaceState(null, "", "#/home");
    try { history.scrollRestoration = "manual"; } catch (e) {}
    this.onHash = () => {
      const r = this.parse();
      const st = { route: r, tipOpen: false, modal: null };
      if (r.page === "discover") {
        if (r.key !== this.state.discKey) Object.assign(st, this.discoverFromRoute(r));
        st.discKey = r.key; st.lastResults = "#" + r.key;
      }
      this.setState(st, () => this.scrollForRoute(r));
    };
    this.onKey = e => { if (e.key === "Escape" && this.state.modal) this.setState({ modal: null }); };
    window.addEventListener("hashchange", this.onHash);
    window.addEventListener("keydown", this.onKey);
    this.scrollForRoute(this.state.route);
  }
  componentWillUnmount() {
    window.removeEventListener("hashchange", this.onHash);
    window.removeEventListener("keydown", this.onKey);
    clearTimeout(this.t); clearTimeout(this.f);
  }
  scrollForRoute(r) {
    if (r.page === "home" && r.arg === "how") {
      setTimeout(() => { const el = document.getElementById("how-it-works"); window.scrollTo(0, el ? el.getBoundingClientRect().top + window.scrollY - 80 : 0); }, 30);
    } else { window.scrollTo(0, 0); requestAnimationFrame(() => window.scrollTo(0, 0)); }
  }
  parse() {
    const h = (location.hash || "#/home").slice(1);
    const [path, qs] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const page = ["home", "discover", "provider", "dashboard"].includes(parts[0]) ? parts[0] : "home";
    return { page, arg: parts[1] || "", params: new URLSearchParams(qs || ""), key: h };
  }
  matchCat(q) {
    q = (q || "").trim().toLowerCase(); if (!q) return null;
    return Component.DATA.categories.find(c => c.name.toLowerCase() === q || c.id === q || (c.name.toLowerCase().startsWith(q) && q.length >= 4)) || null;
  }
  discoverFromRoute(r) {
    const D = Component.DATA, p = r.params;
    const has = p.has("q") || p.has("loc") || p.has("cat");
    let dq = has ? (p.get("q") || "") : "Plumbing";
    const dloc = has ? (p.get("loc") || "") : "austin";
    let cats = [];
    if (p.has("cat")) {
      cats = (p.get("cat") || "").split(",").filter(id => D.categories.some(c => c.id === id));
      if (!dq && cats.length === 1) dq = D.categories.find(c => c.id === cats[0]).name;
    } else { const m = this.matchCat(dq); if (m) cats = [m.id]; }
    return { dq, dloc, cats, minRating: 0, verifiedOnly: false, maxPrice: 100 };
  }
  syncHash() {
    const s = this.state;
    const key = "/discover?" + new URLSearchParams({ q: s.dq, loc: s.dloc, cat: s.cats.join(",") }).toString();
    history.replaceState(null, "", "#" + key);
    this.setState({ discKey: key, lastResults: "#" + key });
  }
  openModal(title, body) { this.setState({ modal: { title, body } }); }
  setStatus(r, status) {
    clearTimeout(this.t); clearTimeout(this.f);
    this.setState(st => ({ statuses: { ...st.statuses, [r.id]: status }, last: { id: r.id, prev: st.statuses[r.id] }, flash: r.id,
      toast: (status === "Accepted" ? "Accepted " : "Declined ") + r.customer.split(" ")[0] + "'s request" }));
    this.t = setTimeout(() => this.setState({ toast: "", last: null }), 4000);
    this.f = setTimeout(() => this.setState({ flash: null }), 900);
  }
  renderVals() {
    const D = Component.DATA, s = this.state, page = s.route.page;
    const icons = { plumbing: "plumbing", electrical: "electrical_services", cleaning: "cleaning_services", gardening: "yard", painting: "format_paint", carpentry: "carpenter", handyman: "handyman", appliance: "local_laundry_service" };
    const cat = Object.fromEntries(D.categories.map(c => [c.id, c.name]));
    const locN = Object.fromEntries(D.locations.map(l => [l.id, l.name]));
    const decorate = p => ({ ...p, catName: cat[p.category], locName: locN[p.location], icon: icons[p.category], ratingStr: p.rating.toFixed(1), starPct: (p.rating / 5 * 100) + "%", priceLabel: "$" + p.startingPrice + "/" + p.priceUnit, href: "#/provider/" + p.id });
    const common = {
      isCustomer: page !== "dashboard", isHome: page === "home", isDiscover: page === "discover", isProfile: page === "provider", isDashboard: page === "dashboard",
      navHomeColor: page === "home" ? "#1E4FA3" : "#545B68", navHomeLine: page === "home" ? "inset 0 -2px 0 #1E4FA3" : "none",
      navFindColor: page === "discover" || page === "provider" ? "#1E4FA3" : "#545B68", navFindLine: page === "discover" || page === "provider" ? "inset 0 -2px 0 #1E4FA3" : "none",
      modalOpen: !!s.modal, modalTitle: s.modal ? s.modal.title : "", modalBody: s.modal ? s.modal.body : "",
      closeModal: () => this.setState({ modal: null }),
      soon: e => {
        e.preventDefault();
        const el = e.currentTarget;
        const label = (el.dataset && el.dataset.soon) || (el.innerText || "This feature").trim().split("\n")[0];
        this.openModal(label + " – coming in the next milestone", "This part of Fixit isn't built yet in this prototype.");
      }
    };

    if (page === "home") {
      return {
        ...common, query: s.hq, loc: s.hloc,
        onQuery: e => this.setState({ hq: e.target.value }),
        onLoc: e => this.setState({ hloc: e.target.value }),
        onSearch: e => { e.preventDefault(); location.hash = "#/discover?" + new URLSearchParams({ q: s.hq.trim(), loc: s.hloc }).toString(); },
        quick: ["Plumbing", "Cleaning", "Electrical", "Handyman"].map(label => ({ label, pick: () => this.setState({ hq: label }) })),
        categories: D.categories.map(c => ({ ...c, icon: icons[c.id], href: "#/discover?q=&loc=&cat=" + c.id })),
        featured: ["p01", "p03", "p07", "p04"].map(id => decorate(D.providers.find(p => p.id === id)))
      };
    }

    if (page === "discover") {
      const dist = { austin: { austin: 0, "round-rock": 19, "cedar-park": 18, pflugerville: 15 }, "round-rock": { austin: 19, "round-rock": 0, "cedar-park": 12, pflugerville: 9 }, "cedar-park": { austin: 18, "round-rock": 12, "cedar-park": 0, pflugerville: 18 }, pflugerville: { austin: 15, "round-rock": 9, "cedar-park": 18, pflugerville: 0 } };
      const ref = s.dloc || "austin";
      const text = this.matchCat(s.dq) ? "" : s.dq.trim().toLowerCase();
      const passText = p => !text || p.name.toLowerCase().includes(text) || cat[p.category].toLowerCase().includes(text) || p.services.some(x => x.toLowerCase().includes(text));
      const passOther = p => (!s.dloc || p.location === s.dloc) && p.rating >= s.minRating && (!s.verifiedOnly || p.verified) && (s.maxPrice >= 100 || p.startingPrice <= s.maxPrice) && passText(p);
      const passCat = p => !s.cats.length || s.cats.includes(p.category);
      const results = D.providers.filter(p => passOther(p) && passCat(p)).map(p => {
        const mi = dist[ref][p.location] + 1 + (parseInt(p.id.slice(1)) * 1.7) % 4;
        return { ...decorate(p), price: "$" + p.startingPrice, unit: "/" + p.priceUnit, mi, distLabel: mi.toFixed(1) + " mi away" };
      });
      const sorters = { rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount, reviews: (a, b) => b.reviewCount - a.reviewCount, nearest: (a, b) => a.mi - b.mi };
      results.sort(sorters[s.sort]);
      const n = results.length;
      const catLabel = s.cats.length === 1 ? cat[s.cats[0]] : s.cats.length > 1 ? s.cats.length + " categories" : (text ? "“" + s.dq.trim() + "”" : "all services");
      return {
        ...common, query: s.dq, loc: s.dloc, sort: s.sort, maxPrice: s.maxPrice,
        onQuery: e => this.setState({ dq: e.target.value }),
        onSort: e => this.setState({ sort: e.target.value }),
        onPrice: e => this.setState({ maxPrice: +e.target.value }),
        onLoc: e => this.setState({ dloc: e.target.value }, () => this.syncHash()),
        toggleVerified: () => this.setState({ verifiedOnly: !s.verifiedOnly }),
        toggleBg: s.verifiedOnly ? "#1F8A4C" : "#D3D8E0", knobLeft: s.verifiedOnly ? "21px" : "3px",
        priceLabel: s.maxPrice >= 100 ? "Any price" : "Up to $" + s.maxPrice,
        clearAll: () => this.setState({ cats: [], dloc: "", minRating: 0, verifiedOnly: false, maxPrice: 100, dq: "" }, () => this.syncHash()),
        ratingOptions: [[0, "Any"], [3.5, "3.5+"], [4, "4.0+"], [4.5, "4.5+"]].map(([v, label]) => {
          const k = Math.floor(v) || 0;
          return { label, stars: "★".repeat(k), empty: k ? "★".repeat(5 - k) : "★★★★★", bg: s.minRating === v ? "#EAF0FA" : "#fff", border: s.minRating === v ? "#1E4FA3" : "#E3E6EB", pick: () => this.setState({ minRating: v }) };
        }),
        catOptions: D.categories.map(c => {
          const on = s.cats.includes(c.id);
          return { ...c, count: D.providers.filter(p => p.category === c.id && passOther(p)).length, boxBg: on ? "#1E4FA3" : "#fff", boxBorder: on ? "#1E4FA3" : "#C5CBD5", mark: on ? "✓" : "",
            toggle: () => this.setState(st => ({ cats: on ? st.cats.filter(x => x !== c.id) : [...st.cats, c.id], dq: this.matchCat(st.dq) ? "" : st.dq }), () => this.syncHash()) };
        }),
        results, isEmpty: n === 0,
        countLabel: n + (n === 1 ? " provider found" : " providers found"),
        contextLabel: "Showing " + catLabel + " in " + (s.dloc ? locN[s.dloc] + ", TX" : "all locations"),
        onSearch: e => { e.preventDefault(); const m = this.matchCat(s.dq); this.setState({ cats: m ? [m.id] : [] }, () => this.syncHash()); }
      };
    }

    if (page === "provider") {
      const raw = D.providers.find(x => x.id === s.route.arg);
      const isSaved = raw && s.saved.includes(raw.id);
      const base = {
        ...common, backHref: s.lastResults, tipOpen: s.tipOpen,
        showTip: () => this.setState({ tipOpen: true }), hideTip: () => this.setState({ tipOpen: false }),
        toReviews: e => { e.preventDefault(); const el = document.getElementById("reviews"); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" }); },
        onRequest: () => this.openModal("Service request form – coming in the next milestone", "You'll be able to send " + (raw ? raw.name : "this provider") + " a request with your job details, date and address."),
        saveLabel: isSaved ? "Saved" : "Save", saveFill: isSaved ? 1 : 0, saveBg: isSaved ? "#EAF0FA" : "#fff", saveBorder: isSaved ? "#1E4FA3" : "#C9D6EE",
        toggleSave: () => {
          if (!raw) return;
          const saved = isSaved ? s.saved.filter(x => x !== raw.id) : [...s.saved, raw.id];
          try { localStorage.setItem("fixit:saved", JSON.stringify(saved)); } catch (e) {}
          this.setState({ saved });
        }
      };
      if (!raw) return { ...base, p: {}, notFound: true };
      const unit = "/" + raw.priceUnit;
      const fmt = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return {
        ...base,
        p: { ...decorate(raw), price: "$" + raw.startingPrice, unit, notVerified: !raw.verified },
        services: raw.services.map((name, i) => { const v = raw.servicePrices[i]; return { name, price: "$" + v.toLocaleString("en-US") + (v >= 300 ? "" : unit) }; }),
        areas: raw.serviceAreas.map((id, i) => ({ name: locN[id], note: i === 0 ? "Based here" : "" })),
        reviews: raw.reviews.map(r => ({ ...r, initials: r.author.split(/\s+/).map(w => w[0]).join(""), stars: "★".repeat(r.rating), empty: "★".repeat(5 - r.rating), dateLabel: fmt(r.date) }))
      };
    }

    // dashboard
    const p = D.providers.find(x => x.id === "p01");
    const all = D.sampleRequests.map(r => ({ ...r, status: s.statuses[r.id] }));
    const count = st => all.filter(r => r.status === st).length;
    const pending = count("Pending");
    const pill = { Pending: ["#FDF0E6", "#A44E12", "#F2843A"], Accepted: ["#EAF0FA", "#1E4FA3", "#1E4FA3"], Completed: ["#E7F5EC", "#1F8A4C", "#1F8A4C"], Declined: ["#FBECEC", "#B23A3A", "#D64545"] };
    const navDefs = [["Dashboard", "space_dashboard"], ["Requests", "inbox"], ["My Services", "home_repair_service"], ["Profile", "person"], ["Reviews", "star"], ["Settings", "settings"]];
    const rows = all.filter(r => s.filter === "All" || r.status === s.filter).map(r => {
      const [pillBg, pillColor, pillDot] = pill[r.status];
      return { ...r, pillBg, pillColor, pillDot, isPending: r.status === "Pending",
        initials: r.customer.split(" ").map(w => w[0]).join(""), areaName: locN[r.area],
        dateLabel: new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        rowBg: s.flash === r.id ? "#F3F7FD" : "#fff",
        accept: () => this.setStatus(r, "Accepted"), decline: () => this.setStatus(r, "Declined") };
    });
    const unit = "/" + p.priceUnit;
    const checks = [["Business details", true], ["Services & prices", true], ["Service area", true], ["ID & licence verified", p.verified], ["Profile photo", !!p.photo]];
    const done = checks.filter(c => c[1]).length;
    return {
      ...common, p, firstName: p.owner.split(" ")[0], profileHref: "#/provider/" + p.id,
      toast: s.toast,
      undo: () => { if (s.last) this.setState(st => ({ statuses: { ...st.statuses, [s.last.id]: s.last.prev }, toast: "", last: null })); },
      nav: navDefs.map(([label, icon], i) => ({ label, icon, color: i === 0 ? "#1E4FA3" : "#545B68", bg: i === 0 ? "#EAF0FA" : "transparent", badge: label === "Requests" && pending ? String(pending) : "",
        go: e => { e.preventDefault(); if (i > 0) this.openModal(label + " – coming in the next milestone", "This part of the provider dashboard isn't built yet in this prototype."); } })),
      greetingSub: pending ? "You have " + pending + " new request" + (pending === 1 ? "" : "s") + " waiting for a reply." : "You're all caught up.",
      stats: [
        { label: "New requests", value: String(pending), sub: "awaiting reply", icon: "inbox", tint: "#FDF0E6", color: "#A44E12" },
        { label: "Accepted", value: String(count("Accepted")), sub: "upcoming jobs", icon: "event_available", tint: "#EAF0FA", color: "#1E4FA3" },
        { label: "Completed this month", value: String(all.filter(r => r.status === "Completed" && r.date.startsWith("2026-10")).length), sub: "in October", icon: "task_alt", tint: "#E7F5EC", color: "#1F8A4C" },
        { label: "Average rating", value: p.rating.toFixed(1), sub: "★ " + p.reviewCount + " reviews", icon: "star", tint: "#FDF0E6", color: "#A44E12" }
      ],
      tabs: ["All", "Pending", "Accepted", "Completed", "Declined"].map(t => {
        const on = s.filter === t;
        return { label: t, count: t === "All" ? all.length : count(t), bg: on ? "#fff" : "transparent", color: on ? "#1A1D24" : "#545B68", shadow: on ? "0 1px 3px rgba(20,24,36,.1)" : "none", pick: () => this.setState({ filter: t }) };
      }),
      rows, noRows: rows.length === 0,
      services: p.services.map((name, i) => { const v = p.servicePrices[i]; return { name, price: "from $" + v.toLocaleString("en-US") + (v >= 300 ? "" : unit) }; }),
      completePct: Math.round(done / checks.length * 100) + "%",
      checklist: checks.map(([label, ok]) => ({ label, todo: !ok, icon: ok ? "check_circle" : "radio_button_unchecked", iconColor: ok ? "#1F8A4C" : "#C5CBD5", color: ok ? "#545B68" : "#1A1D24" }))
    };
  }
}
