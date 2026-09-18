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
  const gotoDashboard = () => window.location.assign("/dashboard");

  const login = $("#loginForm");
  if (login) {
    document.addEventListener("submit", async (event) => {
      if (event.target !== login) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      try {
        const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("#email").value, password: $("#password").value, role: roleFromTabs("#tabEmployee", "#tabManager") }) });
        localStorage.setItem(tokenKey, data.token); gotoDashboard();
      } catch (error) { show(error.message); }
    }, true);
    $(".signup a")?.addEventListener("click", event => { event.preventDefault(); window.location.assign("/register"); });
    $(".forgot-link")?.addEventListener("click", event => { event.preventDefault(); show("For this local prototype, create a new account if you no longer have your password."); });
  }

  const register = $("#registerForm");
  if (register) {
    document.addEventListener("submit", async (event) => {
      if (event.target !== register) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if ($("#password").value !== $("#confirmPassword").value) return show("Passwords do not match.");
      try {
        const data = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ fullName: $("#fullName").value, email: $("#email").value, password: $("#password").value, role: roleFromTabs("#tabParent", "#tabChild") }) });
        localStorage.setItem(tokenKey, data.token); gotoDashboard();
      } catch (error) { show(error.message); }
    }, true);
    $(".signup a")?.addEventListener("click", event => { event.preventDefault(); window.location.assign("/login"); });
  }

  if (["/dashboard", "/dashboard.html"].includes(location.pathname)) {
    request("/api/dashboard").then((data) => {
      const { user, balances, pendingApproval, goal } = data;
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
    document.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", event => { event.preventDefault(); show(`${link.textContent.trim()} is available from the live account data on this overview.`); }));
    $(".allocation-label a")?.addEventListener("click", event => { event.preventDefault(); show("The default plan is 50% everyday spending, 20% emergency fund, and 30% smart savings."); });
  }
})();
