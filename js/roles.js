import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, getDocs, query, where, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Who can open which page
export const ACCESS = {
  admin: ["dashboard", "products", "import", "stock", "sales", "customers", "suppliers", "cash", "expenses", "money", "reports", "staff"],
  inventory: ["dashboard", "products", "import", "stock", "suppliers"],
  cashier: ["dashboard", "stock", "sales", "customers"]
};

// The sidebar menu. Add a new page here and it appears on every page automatically.
export const NAV = [
  { page: "dashboard", icon: "📊", label: "Dashboard" },
  { page: "products",  icon: "📦", label: "Products" },
  { page: "import",    icon: "📥", label: "Import" },
  { page: "stock",     icon: "🔄", label: "Stock" },
  { page: "sales",     icon: "🛒", label: "Sales" },
  { page: "customers", icon: "🧑‍🤝‍🧑", label: "Customers" },
  { page: "suppliers", icon: "🚚", label: "Suppliers" },
  { page: "cash",      icon: "💰", label: "Cash & Bank" },
  { page: "expenses",  icon: "📉", label: "Expenses" },
  { page: "money",     icon: "🧾", label: "Money" },
  { page: "reports",   icon: "📑", label: "Reports" },
  { page: "staff",     icon: "👤", label: "Staff" }
];

export const ROLE_LABEL = {
  admin: "Admin",
  inventory: "Inventory Manager",
  cashier: "Cashier"
};

const home = (page) => (page === "index" ? "index.html" : "../index.html");

export function guard(page) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = home(page);
        return;
      }
      const ref = doc(db, "users", user.uid);
      let snap = await getDoc(ref);
      if (!snap.exists()) {
        const admins = await getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1)));
        if (!admins.empty) {
          await signOut(auth);
          alert("This login has no role. Ask the admin.");
          window.location.href = home(page);
          return;
        }
        await setDoc(ref, {
          email: user.email,
          name: "Admin",
          role: "admin",
          active: true,
          createdAt: serverTimestamp()
        });
        snap = await getDoc(ref);
      }
      const profile = { id: snap.id, ...snap.data() };
      if (profile.active === false) {
        await signOut(auth);
        alert("This account is disabled.");
        window.location.href = home(page);
        return;
      }
      const allowed = ACCESS[profile.role] || [];
      if (!allowed.includes(page)) {
        window.location.href = "dashboard.html";
        return;
      }
      applyChrome(profile, page);
      resolve({ user, profile });
    });
  });
}

function showNetBanner() {
  let bar = document.getElementById("netBanner");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "netBanner";
    bar.style.cssText = "display:none; margin:0; padding:12px 18px; font-size:14px; font-weight:600;";
    const main = document.querySelector(".main-content");
    if (main) main.prepend(bar);

    const paint = () => {
      if (navigator.onLine) {
        bar.style.display = "none";
        return;
      }
      bar.style.display = "block";
      bar.style.background = "#fff4e5";
      bar.style.color = "#9a5b00";
      bar.textContent = "You are offline. Keep working in this same browser. Sales and stock will upload when the internet is back.";
    };

    window.addEventListener("online", () => {
      bar.style.display = "block";
      bar.style.background = "#e8f6ee";
      bar.style.color = "#1e7a46";
      bar.textContent = "Back online. Saved work is syncing.";
      setTimeout(paint, 4000);
    });
    window.addEventListener("offline", paint);
    paint();
  }
}

// Builds the sidebar menu from NAV, showing only the pages this role may open.
function buildSidebar(allowed, currentPage) {
  const nav = document.querySelector(".sidebar-nav");
  if (!nav) return;
  nav.innerHTML = "";
  NAV.filter((item) => allowed.includes(item.page)).forEach((item) => {
    const link = document.createElement("a");
    link.href = item.page + ".html";
    link.dataset.page = item.page;
    link.className = "nav-item" + (item.page === currentPage ? " active" : "");
    const icon = document.createElement("span");
    icon.textContent = item.icon;
    link.appendChild(icon);
    link.appendChild(document.createTextNode(" " + item.label));
    nav.appendChild(link);
  });
}

function applyChrome(profile, page) {
  showNetBanner();
  const allowed = ACCESS[profile.role] || [];
  buildSidebar(allowed, page);
  document.querySelectorAll("[data-roles]").forEach((el) => {
    const roles = el.dataset.roles.split(",").map((r) => r.trim());
    if (!roles.includes(profile.role)) el.remove();
  });
  const welcome = document.getElementById("welcomeRole");
  if (welcome) welcome.textContent = "Welcome, " + (ROLE_LABEL[profile.role] || "User");
  const email = document.getElementById("userEmail");
  if (email && auth.currentUser) email.textContent = auth.currentUser.email;
}