(() => {
  "use strict";
  const tokenKey = "financeBuddyToken";
  const $ = (selector) => document.querySelector(selector);
  const dollars = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
  const show = (message) => window.alert(message);
  const request = async (url, options = {}) => {
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  };
  const roleFromTabs = (parentId, childId) => $(childId)?.classList.contains("active") ? "child" : "parent";
  const gotoAccount = (role, redirectTo) => window.location.assign(redirectTo || (role === "child" ? "/kids" : "/dashboard"));
  const goHome = () => window.location.assign("/");
  const signOut = () => { localStorage.removeItem(tokenKey); goHome(); };
  const makeInteractive = (element, action, label) => {
    if (!element) return;
    element.setAttribute("role", "link");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", label);
    element.style.cursor = "pointer";
    element.addEventListener("click", action);
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action(event); }
    });
  };

  const login = $("#loginForm");
  if (login) {
    makeInteractive($(".logo"), goHome, "Return to FinanceBuddy home");
    document.addEventListener("submit", async (event) => {
      if (event.target !== login) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      try {
        const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("#email").value, password: $("#password").value, role: roleFromTabs("#tabEmployee", "#tabManager") }) });
        localStorage.setItem(tokenKey, data.token); gotoAccount(data.user.role, data.redirectTo);
      } catch (error) { show(error.message); }
    }, true);
    $(".signup a")?.addEventListener("click", event => { event.preventDefault(); window.location.assign("/register"); });
    $(".forgot-link")?.addEventListener("click", event => { event.preventDefault(); show("For this local prototype, create a new account if you no longer have your password."); });
  }

  const register = $("#registerForm");
  if (register) {
    makeInteractive($(".logo"), goHome, "Return to FinanceBuddy home");
    document.addEventListener("submit", async (event) => {
      if (event.target !== register) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if ($("#password").value !== $("#confirmPassword").value) return show("Passwords do not match.");
      try {
        const data = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ fullName: $("#fullName").value, email: $("#email").value, password: $("#password").value, role: roleFromTabs("#tabParent", "#tabChild") }) });
        localStorage.setItem(tokenKey, data.token); gotoAccount(data.user.role, data.redirectTo);
      } catch (error) { show(error.message); }
    }, true);
    $(".signup a")?.addEventListener("click", event => { event.preventDefault(); window.location.assign("/login"); });
  }

  if (["/", "/lending", "/lending.html"].includes(location.pathname)) {
    document.querySelectorAll("a").forEach(link => {
      const label = link.textContent.trim();
      if (label === "Sign In") link.addEventListener("click", event => { event.preventDefault(); window.location.assign("/login"); });
      if (["Get Started Free", "Open Parent Account"].includes(label)) link.addEventListener("click", event => { event.preventDefault(); window.location.assign("/register"); });
      if (label === "Watch Demo Video") link.addEventListener("click", event => { event.preventDefault(); show("Create an account to start the FinanceBuddy guided demo."); });
      if (["Features", "AI Co-Pilot", "Security First", "Family Pricing"].includes(label)) link.addEventListener("click", event => { event.preventDefault(); show(`${label}: FinanceBuddy helps families manage spending, goals, and protected emergency funds.`); });
    });
    document.querySelectorAll(".cursor-pointer").forEach(card => card.addEventListener("click", () => window.location.assign("/register")));
  }

  if (["/dashboard", "/dashboard.html"].includes(location.pathname)) {
    request("/api/dashboard").then((data) => {
      const { user, balances, pendingApproval, goal } = data;
      if (user.role === "child") return window.location.replace("/kids");
      const name = $(".profile .name"); if (name) name.textContent = user.fullName;
      const role = $(".profile .role"); if (role) role.textContent = user.role === "parent" ? "Parent Account" : "Child Account";
      const childName = $(".child-id .name"); if (childName) childName.textContent = user.fullName;
      const childMeta = $(".child-id .meta"); if (childMeta) childMeta.textContent = user.role === "parent" ? "Family Wallet · Active Plan" : "Child Wallet · Active Plan";
      const total = $(".balance-block .amount"); if (total) total.textContent = dollars(balances.total);
      const goalText = $(".goal-row span:last-child"); if (goalText) goalText.textContent = `${dollars(goal.current)} / ${dollars(goal.target)}`;
      const fill = $(".goal-bar .fill"); if (fill) fill.style.width = `${Math.min(100, Math.round(goal.current / goal.target * 100))}%`;
      const requestText = $(".side-card p");
      if (requestText && pendingApproval) requestText.textContent = `A child requested ${dollars(pendingApproval.amount)} for ${pendingApproval.reason}.`;
      if (requestText && !pendingApproval) requestText.textContent = user.role === "child" ? "Need emergency or savings money? Submit a request for your parent to review." : "No approval requests are waiting right now.";
    }).catch(() => { localStorage.removeItem(tokenKey); window.location.replace("/login"); });

    makeInteractive($(".brand"), goHome, "Return to FinanceBuddy home");
    makeInteractive($(".profile"), signOut, "Sign out and return to the FinanceBuddy home page");

    $(".fund-btn")?.addEventListener("click", async () => {
      const amount = window.prompt("Amount to add to the family wallet (USD):"); if (amount === null) return;
      try { const data = await request("/api/funds", { method: "POST", body: JSON.stringify({ amount, note: "Parent wallet funding" }) }); show(data.message); location.reload(); } catch (error) { show(error.message); }
    });
    $(".review-btn")?.addEventListener("click", async () => {
      try {
        const dashboard = await request("/api/dashboard");
        if (dashboard.user.role === "child") {
          const amount = window.prompt("How much do you need (USD)?"); if (amount === null) return;
          const reason = window.prompt("What is the money for?"); if (reason === null) return;
          const data = await request("/api/approvals", { method: "POST", body: JSON.stringify({ amount, reason }) }); show(data.message); location.reload(); return;
        }
        if (!dashboard.pendingApproval) return show("There are no pending requests to review.");
        const approved = window.confirm(`Approve ${dollars(dashboard.pendingApproval.amount)} for ${dashboard.pendingApproval.reason}? Choose Cancel to reject.`);
        const data = await request(`/api/approvals/${dashboard.pendingApproval.id}/review`, { method: "POST", body: JSON.stringify({ decision: approved ? "approved" : "rejected" }) }); show(data.message); location.reload();
      } catch (error) { show(error.message); }
    });
    document.addEventListener("click", event => {
      const overviewLink = event.target.closest(".nav-links a");
      if (overviewLink?.textContent.trim() === "Overview") {
        event.preventDefault(); event.stopImmediatePropagation(); window.location.assign("/dashboard");
      }
    }, true);
    document.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", event => { event.preventDefault(); show(`${link.textContent.trim()} is available from the live account data on this overview.`); }));
    $(".allocation-label a")?.addEventListener("click", event => { event.preventDefault(); show("The default plan is 50% everyday spending, 20% emergency fund, and 30% smart savings."); });
  }

  if (["/kids", "/kids.html"].includes(location.pathname)) {
    request("/api/dashboard").then((data) => {
      const { user, balances, goal } = data;
      if (user.role !== "child") return window.location.replace("/dashboard");
      const profileName = $("header .text-sm.font-semibold"); if (profileName) profileName.textContent = user.fullName;
      const greeting = $("h1"); if (greeting) greeting.textContent = `Hey ${user.fullName.split(" ")[0]}, welcome to your wallet!`;
      const amounts = document.querySelectorAll(".text-3xl.font-extrabold");
      if (amounts[0]) amounts[0].textContent = dollars(balances.everyday);
      if (amounts[1]) amounts[1].textContent = dollars(balances.savings);
      if (amounts[2]) amounts[2].textContent = dollars(balances.emergency);
      const raised = Array.from(document.querySelectorAll(".text-xs.text-gray-400")).find(element => element.textContent.includes("Raised:"));
      if (raised) raised.textContent = `Raised: ${dollars(goal.current)}`;
      const progress = $(".bg-emerald-400.h-full"); if (progress) progress.style.width = `${Math.min(100, Math.round(goal.current / goal.target * 100))}%`;
    }).catch(() => { localStorage.removeItem(tokenKey); window.location.replace("/login"); });
    makeInteractive($("header > div:first-child"), goHome, "Return to FinanceBuddy home");
    makeInteractive($("header .flex.items-center.gap-3:last-child"), signOut, "Sign out and return to the FinanceBuddy home page");
    document.addEventListener("click", event => {
      const walletLink = event.target.closest("nav a");
      if (walletLink?.textContent.trim() === "Wallet") {
        event.preventDefault(); event.stopImmediatePropagation(); window.location.assign("/kids");
      }
    }, true);
    const requestRelease = Array.from(document.querySelectorAll("button")).find(button => button.textContent.includes("Request Savings Release"));
    requestRelease?.addEventListener("click", async () => {
      const amount = window.prompt("How much do you need from savings (USD)?"); if (amount === null) return;
      const reason = window.prompt("What is the money for?"); if (reason === null) return;
      try { const data = await request("/api/approvals", { method: "POST", body: JSON.stringify({ amount, reason }) }); show(data.message); } catch (error) { show(error.message); }
    });
    const startChat = Array.from(document.querySelectorAll("button")).find(button => button.textContent.includes("Start Chat"));
    startChat?.addEventListener("click", () => show("AI Buddy: Keep adding to your savings goal—you are building a great money habit!"));
    document.querySelectorAll("nav a").forEach(link => link.addEventListener("click", event => { event.preventDefault(); show(`${link.textContent.trim()} is ready to use from your wallet dashboard.`); }));
  }
})();
